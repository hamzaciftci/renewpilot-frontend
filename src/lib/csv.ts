// ─── CSV utilities ───────────────────────────────────────────────────────────
// RFC-4180-ish parser + asset-row normalization used by the bulk import dialog.
// We deliberately keep this self-contained (no papaparse) to avoid bundle bloat.
//
// Supported:
//   • Quoted fields (including quoted newlines)
//   • Escaped quotes ("")
//   • CRLF / LF / CR line terminators
//   • Auto-detect of `,`, `;`, `\t` as delimiter
//
// Not supported (YAGNI):
//   • Field-type coercion beyond strings
//   • Nested JSON inside cells

import type { AssetType, CreateAssetDto, Project } from "@/types";

// ─── Parser ──────────────────────────────────────────────────────────────────

/** Detect the most likely delimiter by counting occurrences in the header line. */
function detectDelimiter(firstLine: string): string {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = -1;
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

/**
 * Parse CSV text into a matrix of strings.
 * Returns [] when text is empty. Blank trailing lines are trimmed.
 */
export function parseCSV(text: string, delimiter?: string): string[][] {
  if (!text) return [];
  // Normalize BOM
  let src = text.replace(/^\uFEFF/, "");
  // Detect delimiter from first line if caller didn't pick one
  const firstLineEnd = src.search(/\r?\n/);
  const firstLine = firstLineEnd === -1 ? src : src.slice(0, firstLineEnd);
  const delim = delimiter ?? detectDelimiter(firstLine);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          // Escaped quote
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === delim) {
      row.push(field);
      field = "";
      i++;
      continue;
    }

    if (ch === "\r") {
      // CRLF or lone CR → end row
      if (src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }

    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Flush last field / row (if any content)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-empty trailing rows
  while (rows.length && rows[rows.length - 1].every((c) => c.trim() === "")) {
    rows.pop();
  }

  return rows;
}

// ─── Column mapping ──────────────────────────────────────────────────────────

export type AssetField =
  | "name"
  | "assetType"
  | "renewalDate"
  | "vendorName"
  | "priceAmount"
  | "priceCurrency"
  | "notes"
  | "projectName";

export type ColumnMapping = Partial<Record<AssetField, number>>;

const HEADER_ALIASES: Record<AssetField, string[]> = {
  name: [
    "name", "asset", "asset name", "asset_name", "assetname",
    "domain", "item", "title", "label",
    "varlık", "varlik", "ad", "isim",
    "nom", "nombre", "elemento", "artikel",
  ],
  assetType: [
    "type", "asset type", "asset_type", "assettype", "category", "kind",
    "tip", "kategori", "tür", "tur",
    "typ", "tipo",
  ],
  renewalDate: [
    "renewal", "renewal date", "renewal_date", "renewaldate",
    "expiry", "expires", "expires at", "expiration", "expiration date",
    "due", "due date", "next renewal",
    "yenileme", "bitiş", "bitis", "son", "son tarih", "vade",
    "échéance", "echeance", "vencimiento",
    "ablauf", "ablaufdatum",
  ],
  vendorName: [
    "vendor", "provider", "registrar", "supplier", "company", "issuer",
    "sağlayıcı", "saglayici", "firma", "marka",
    "fournisseur", "proveedor", "anbieter",
  ],
  priceAmount: [
    "price", "amount", "cost", "fee", "value",
    "fiyat", "tutar", "ücret", "ucret",
    "prix", "precio", "preis", "betrag",
  ],
  priceCurrency: [
    "currency", "curr", "ccy",
    "para birimi", "döviz", "doviz",
    "devise", "moneda", "währung", "wahrung",
  ],
  notes: [
    "notes", "note", "description", "comment", "comments", "remark", "remarks",
    "not", "notlar", "açıklama", "aciklama", "yorum",
    "commentaire", "descripción", "descripcion",
  ],
  projectName: [
    "project", "project name", "projectname",
    "proje", "proje adı",
    "projet", "proyecto", "projekt",
  ],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ");
}

/**
 * Given a list of header cells, pick the best column index for each AssetField.
 * Exact-match wins over contains-match. Returns only fields that matched.
 */
export function autoDetectColumns(headers: string[]): ColumnMapping {
  const normalized = headers.map(normalizeHeader);
  const mapping: ColumnMapping = {};

  for (const field of Object.keys(HEADER_ALIASES) as AssetField[]) {
    const aliases = HEADER_ALIASES[field];
    // 1) exact match
    let idx = normalized.findIndex((h) => aliases.includes(h));
    // 2) contains match
    if (idx === -1) {
      idx = normalized.findIndex((h) =>
        aliases.some((a) => h.includes(a) || a.includes(h)),
      );
    }
    if (idx !== -1) mapping[field] = idx;
  }

  return mapping;
}

// ─── Type normalization ──────────────────────────────────────────────────────

const TYPE_ALIASES: Record<AssetType, string[]> = {
  DOMAIN: ["domain", "domains", "dns", "alan adı", "alan adi", "dominio"],
  SERVER: ["server", "servers", "vps", "dedicated", "sunucu", "serveur", "servidor"],
  SSL_CERTIFICATE: ["ssl", "ssl certificate", "certificate", "cert", "tls", "sertifika", "certificat", "certificado", "zertifikat"],
  LICENSE: ["license", "licence", "software", "saas", "lisans", "licencia", "lizenz"],
  HOSTING_SERVICE: ["hosting", "hosting service", "web hosting", "host", "barındırma", "barindirma", "alojamiento", "hébergement"],
  CDN_SERVICE: ["cdn", "cdn service", "content delivery"],
  CREDIT_CARD: ["credit card", "card", "creditcard", "kart", "kredi kartı", "kredi karti", "tarjeta", "karte"],
  CUSTOM: ["custom", "other", "diğer", "diger", "otro", "autre", "sonstiges"],
};

/** Return canonical AssetType or null if we can't figure it out. */
export function normalizeAssetType(raw: string): AssetType | null {
  if (!raw) return null;
  const n = raw.trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
  // direct canonical match (uppercase backend value)
  const canon = raw.trim().toUpperCase().replace(/[\s\-]+/g, "_");
  const TYPES: AssetType[] = [
    "DOMAIN", "SERVER", "SSL_CERTIFICATE", "LICENSE",
    "HOSTING_SERVICE", "CDN_SERVICE", "CREDIT_CARD", "CUSTOM",
  ];
  if (TYPES.includes(canon as AssetType)) return canon as AssetType;
  for (const type of TYPES) {
    const aliases = TYPE_ALIASES[type];
    if (aliases.includes(n)) return type;
    if (aliases.some((a) => n.includes(a))) return type;
  }
  return null;
}

// ─── Date parsing ────────────────────────────────────────────────────────────

/**
 * Parse a loose date string into ISO (YYYY-MM-DD) format.
 * Accepts: ISO (2026-12-01), 01.12.2026, 01/12/2026, 12/01/2026, Dec 1 2026, etc.
 * Returns null if we cannot confidently parse.
 *
 * Heuristic for ambiguous MM/DD vs DD/MM: if the first component is > 12 we
 * assume DD first; otherwise we prefer DD/MM (European) because most of our
 * target users are non-US.
 */
export function parseFlexibleDate(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  // 1) ISO yyyy-mm-dd or yyyy/mm/dd
  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return toIso(+y, +m, +d);
  }

  // 2) dd.mm.yyyy or dd/mm/yyyy or dd-mm-yyyy (or mm/dd/yyyy — heuristic below)
  const dmy = s.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})/);
  if (dmy) {
    let [, a, b, y] = dmy;
    let day = +a;
    let month = +b;
    if (day > 12 && month <= 12) {
      // definitely DD first
    } else if (month > 12 && day <= 12) {
      // swap — was actually MM/DD
      [day, month] = [month, day];
    }
    // else ambiguous → prefer DD first (European bias)
    let year = +y;
    if (year < 100) year += year < 70 ? 2000 : 1900;
    return toIso(year, month, day);
  }

  // 3) Fallback to Date parser (covers "Dec 1, 2026" etc.)
  const fallback = new Date(s);
  if (!isNaN(fallback.getTime())) {
    return toIso(fallback.getFullYear(), fallback.getMonth() + 1, fallback.getDate());
  }

  return null;
}

function toIso(year: number, month: number, day: number): string | null {
  if (
    year < 1900 || year > 2100 ||
    month < 1 || month > 12 ||
    day < 1 || day > 31
  ) {
    return null;
  }
  // Validate the date exists (e.g. catch Feb 30)
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// ─── Price parsing ───────────────────────────────────────────────────────────

/**
 * Parse a price string like "1.234,56 €" or "$1,234.56" into a numeric string.
 * Returns null if no number can be found.
 * Also tries to extract a currency code / symbol if present.
 */
export function parsePrice(raw: string): { amount: string | null; currency: string | null } {
  if (!raw) return { amount: null, currency: null };
  const s = raw.trim();

  // Currency
  let currency: string | null = null;
  const codeMatch = s.match(/\b(USD|EUR|GBP|TRY|JPY|CAD|AUD|CHF|CNY|INR|BRL|MXN|SEK|NOK|DKK|PLN|RUB|ZAR|SGD|HKD|KRW|NZD)\b/i);
  if (codeMatch) currency = codeMatch[1].toUpperCase();
  else if (s.includes("€")) currency = "EUR";
  else if (s.includes("£")) currency = "GBP";
  else if (s.includes("¥")) currency = "JPY";
  else if (s.includes("₺")) currency = "TRY";
  else if (s.includes("$")) currency = "USD";

  // Extract digits + separators
  const num = s.replace(/[^0-9.,\-]/g, "");
  if (!num) return { amount: null, currency };

  // Decide decimal separator: whichever appears LAST is the decimal
  const lastDot = num.lastIndexOf(".");
  const lastComma = num.lastIndexOf(",");
  let normalized: string;
  if (lastDot === -1 && lastComma === -1) {
    normalized = num;
  } else if (lastDot > lastComma) {
    // '.' is decimal → drop ','
    normalized = num.replace(/,/g, "");
  } else {
    // ',' is decimal → drop '.', then convert ',' to '.'
    normalized = num.replace(/\./g, "").replace(",", ".");
  }

  const parsed = Number(normalized);
  if (!isFinite(parsed)) return { amount: null, currency };
  return { amount: parsed.toFixed(2).replace(/\.00$/, ""), currency };
}

// ─── Row validation ──────────────────────────────────────────────────────────

export interface RowValidation {
  ok: boolean;
  errors: string[];   // i18n keys inside csvImport.errors
  warnings: string[]; // i18n keys inside csvImport.warnings
  dto?: CreateAssetDto;
  /** Source row index (1-based, excluding header) for UX. */
  sourceRow: number;
}

export interface ValidateOptions {
  mapping: ColumnMapping;
  projects: Project[];
  /** Fallback asset type if the row doesn't provide one. */
  defaultAssetType?: AssetType;
  /** Fallback currency if the row doesn't provide one (org currency). */
  defaultCurrency?: string;
}

function cell(row: string[], idx: number | undefined): string {
  if (idx === undefined) return "";
  const v = row[idx];
  return typeof v === "string" ? v.trim() : "";
}

export function validateRow(row: string[], sourceRow: number, opts: ValidateOptions): RowValidation {
  const { mapping, projects, defaultAssetType, defaultCurrency } = opts;
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = cell(row, mapping.name);
  if (!name) errors.push("missingName");

  const rawType = cell(row, mapping.assetType);
  let assetType: AssetType | null = rawType ? normalizeAssetType(rawType) : null;
  if (!assetType) {
    if (defaultAssetType) {
      assetType = defaultAssetType;
      if (rawType) warnings.push("unknownTypeFallback");
    } else {
      errors.push("missingType");
    }
  }

  const rawDate = cell(row, mapping.renewalDate);
  const renewalDate = parseFlexibleDate(rawDate);
  if (!renewalDate) errors.push(rawDate ? "invalidDate" : "missingDate");

  const vendorName = cell(row, mapping.vendorName) || undefined;

  const rawPrice = cell(row, mapping.priceAmount);
  const { amount, currency: currencyFromPrice } = parsePrice(rawPrice);
  const rawCurrency = cell(row, mapping.priceCurrency);
  let priceCurrency = rawCurrency || currencyFromPrice || defaultCurrency;
  if (priceCurrency) priceCurrency = priceCurrency.toUpperCase().slice(0, 3);

  const notes = cell(row, mapping.notes) || undefined;

  // Project lookup (case-insensitive name match)
  const rawProject = cell(row, mapping.projectName);
  let projectId: string | undefined;
  if (rawProject) {
    const match = projects.find(
      (p) => p.name.trim().toLowerCase() === rawProject.toLowerCase(),
    );
    if (match) projectId = match.id;
    else warnings.push("unknownProject");
  }

  if (errors.length || !assetType || !renewalDate) {
    return { ok: false, errors, warnings, sourceRow };
  }

  const dto: CreateAssetDto = {
    assetType,
    name,
    renewalDate,
  };
  if (vendorName) dto.vendorName = vendorName;
  if (amount) dto.priceAmount = amount;
  if (priceCurrency) dto.priceCurrency = priceCurrency;
  if (projectId) dto.projectId = projectId;
  if (notes) dto.notes = notes;

  return { ok: true, errors, warnings, dto, sourceRow };
}

// ─── Sample CSV ──────────────────────────────────────────────────────────────

export const SAMPLE_CSV = [
  "name,type,renewal_date,vendor,price,currency,notes",
  "example.com,DOMAIN,2026-12-01,GoDaddy,12.99,USD,Primary domain",
  "wildcard.example.com,SSL_CERTIFICATE,2026-09-15,Let's Encrypt,0,USD,Auto-renewed",
  "prod-web-1,SERVER,2026-07-01,Hetzner,9.90,EUR,Main app server",
  "Figma Org,LICENSE,2027-01-10,Figma,180,USD,5 seats",
].join("\n");
