import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  RefreshCcw,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateAsset } from "@/hooks/useAssets";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useOrganization";
import {
  SAMPLE_CSV,
  autoDetectColumns,
  parseCSV,
  validateRow,
  type AssetField,
  type ColumnMapping,
  type RowValidation,
} from "@/lib/csv";
import type { AssetType } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "upload" | "map" | "import" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ASSET_FIELDS: AssetField[] = [
  "name",
  "assetType",
  "renewalDate",
  "vendorName",
  "priceAmount",
  "priceCurrency",
  "notes",
  "projectName",
];

const REQUIRED_FIELDS: AssetField[] = ["name", "assetType", "renewalDate"];

const DEFAULT_TYPE_OPTIONS: AssetType[] = [
  "DOMAIN",
  "SERVER",
  "SSL_CERTIFICATE",
  "LICENSE",
  "HOSTING_SERVICE",
  "CDN_SERVICE",
  "CREDIT_CARD",
  "CUSTOM",
];

// ─── Component ───────────────────────────────────────────────────────────────

export function CSVImportDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const { membership } = useAuth();
  const { data: projects = [] } = useProjects();
  const createAsset = useCreateAsset();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [defaultType, setDefaultType] = useState<AssetType>("DOMAIN");
  const [parseError, setParseError] = useState<string | null>(null);

  // Import progress
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [failures, setFailures] = useState<{ row: number; name: string; error: string }[]>([]);

  const orgCurrency = membership?.organization.currency ?? "USD";

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setParseError(null);
    setImporting(false);
    setProgress({ done: 0, total: 0 });
    setImportedCount(0);
    setSkippedCount(0);
    setFailures([]);
  }, []);

  const handleClose = () => {
    if (importing) return; // don't allow closing mid-import
    reset();
    onClose();
  };

  const ingestText = (text: string, sourceName: string) => {
    try {
      const matrix = parseCSV(text);
      if (matrix.length < 2) {
        setParseError(t("csvImport.errors.notEnoughRows"));
        return;
      }
      const headerRow = matrix[0].map((h) => h.trim());
      const dataRows = matrix.slice(1).filter((r) => r.some((c) => c && c.trim() !== ""));
      if (dataRows.length === 0) {
        setParseError(t("csvImport.errors.noDataRows"));
        return;
      }
      setHeaders(headerRow);
      setRows(dataRows);
      setMapping(autoDetectColumns(headerRow));
      setFileName(sourceName);
      setParseError(null);
      setStep("map");
    } catch {
      setParseError(t("csvImport.errors.parseFail"));
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setParseError(t("csvImport.errors.tooLarge"));
      return;
    }
    try {
      const text = await file.text();
      ingestText(text, file.name);
    } catch {
      setParseError(t("csvImport.errors.readFail"));
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "renewpilot-sample.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMappingChange = (field: AssetField, value: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (value === "") delete next[field];
      else next[field] = Number(value);
      return next;
    });
  };

  // ─── Validation (live, computed from current mapping) ──────────────────────

  const validations = useMemo<RowValidation[]>(
    () =>
      rows.map((row, idx) =>
        validateRow(row, idx + 2, {
          mapping,
          projects,
          defaultAssetType: defaultType,
          defaultCurrency: orgCurrency,
        }),
      ),
    [rows, mapping, projects, defaultType, orgCurrency],
  );

  const validRows = validations.filter((v) => v.ok);
  const invalidRows = validations.filter((v) => !v.ok);

  const missingRequired = REQUIRED_FIELDS.filter((f) => {
    if (f === "assetType" && defaultType) return false;
    return mapping[f] === undefined;
  });

  const canImport = validRows.length > 0 && missingRequired.length === 0;

  // ─── Import ────────────────────────────────────────────────────────────────

  const runImport = async () => {
    if (!canImport) return;
    setStep("import");
    setImporting(true);
    setProgress({ done: 0, total: validRows.length });
    setImportedCount(0);
    setSkippedCount(invalidRows.length);
    setFailures([]);

    let ok = 0;
    const localFailures: { row: number; name: string; error: string }[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const v = validRows[i];
      if (!v.dto) continue;
      try {
        await createAsset.mutateAsync(v.dto);
        ok += 1;
        setImportedCount(ok);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : t("csvImport.errors.createFailed");
        localFailures.push({ row: v.sourceRow, name: v.dto?.name ?? "—", error: msg });
        setFailures([...localFailures]);
      }
      setProgress({ done: i + 1, total: validRows.length });
    }

    setImporting(false);
    setStep("done");
    if (ok > 0) {
      toast.success(t("csvImport.toastDone", { count: ok }));
    } else {
      toast.error(t("csvImport.toastNone"));
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="w-5 h-5 text-primary" strokeWidth={1.8} />
            {t("csvImport.title")}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && t("csvImport.uploadDesc")}
            {step === "map" && t("csvImport.mapDesc")}
            {step === "import" && t("csvImport.importDesc")}
            {step === "done" && t("csvImport.doneDesc")}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1 — UPLOAD */}
        {step === "upload" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border hover:border-primary/60 bg-secondary/30 hover:bg-secondary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" strokeWidth={1.8} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {t("csvImport.clickToUpload")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("csvImport.acceptHint")}
                </p>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />

            {parseError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-xs text-destructive">{parseError}</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {t("csvImport.sampleHint")}
              </p>
              <button
                type="button"
                onClick={downloadSample}
                className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={2} />
                {t("csvImport.downloadSample")}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — MAP */}
        {step === "map" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
              <FileSpreadsheet className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span className="truncate font-mono">{fileName}</span>
              <span className="ml-auto tabular-nums">
                {t("csvImport.rowsDetected", { count: rows.length })}
              </span>
            </div>

            {/* Column mapping grid */}
            <div>
              <h3 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("csvImport.columnMapping")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ASSET_FIELDS.map((field) => {
                  const isRequired = REQUIRED_FIELDS.includes(field);
                  const current = mapping[field];
                  return (
                    <div
                      key={field}
                      className="flex items-center gap-2 bg-secondary/30 border border-border rounded-lg px-3 py-2"
                    >
                      <label className="text-xs font-medium text-foreground flex-shrink-0 w-28">
                        {t(`csvImport.fields.${field}`)}
                        {isRequired && <span className="text-destructive ml-0.5">*</span>}
                      </label>
                      <select
                        value={current ?? ""}
                        onChange={(e) => handleMappingChange(field, e.target.value)}
                        className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="">{t("csvImport.notMapped")}</option>
                        {headers.map((h, idx) => (
                          <option key={idx} value={idx}>
                            {h || `${t("csvImport.column")} ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Default type when assetType column missing */}
            {mapping.assetType === undefined && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                <p className="text-xs font-medium text-foreground mb-2">
                  {t("csvImport.defaultTypeTitle")}
                </p>
                <select
                  value={defaultType}
                  onChange={(e) => setDefaultType(e.target.value as AssetType)}
                  className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground w-full sm:w-auto"
                >
                  {DEFAULT_TYPE_OPTIONS.map((tp) => (
                    <option key={tp} value={tp}>
                      {t(`addAsset.typeLabels.${tp}`)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Validation summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={2} />
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {t("csvImport.validRows")}
                  </p>
                </div>
                <p className="text-xl font-semibold text-foreground mt-1 tabular-nums">
                  {validRows.length}
                </p>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-destructive" strokeWidth={2} />
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {t("csvImport.invalidRows")}
                  </p>
                </div>
                <p className="text-xl font-semibold text-foreground mt-1 tabular-nums">
                  {invalidRows.length}
                </p>
              </div>
            </div>

            {missingRequired.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-xs text-destructive">
                  {t("csvImport.missingRequired", {
                    fields: missingRequired
                      .map((f) => t(`csvImport.fields.${f}`))
                      .join(", "),
                  })}
                </p>
              </div>
            )}

            {/* Preview first 5 valid + first 5 invalid */}
            <div>
              <h3 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("csvImport.preview")}
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary/60 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground w-8">#</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          {t("csvImport.fields.name")}
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          {t("csvImport.fields.assetType")}
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          {t("csvImport.fields.renewalDate")}
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground w-20">
                          {t("csvImport.status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {validations.slice(0, 20).map((v, idx) => {
                        const row = rows[idx];
                        return (
                          <tr
                            key={idx}
                            className={`border-t border-border ${v.ok ? "" : "bg-destructive/5"}`}
                          >
                            <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{v.sourceRow}</td>
                            <td className="px-3 py-1.5 text-foreground truncate max-w-[180px]">
                              {mapping.name !== undefined ? row[mapping.name] : "—"}
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground">
                              {v.ok && v.dto ? v.dto.assetType : mapping.assetType !== undefined ? row[mapping.assetType] : defaultType}
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground">
                              {v.ok && v.dto ? v.dto.renewalDate : mapping.renewalDate !== undefined ? row[mapping.renewalDate] : "—"}
                            </td>
                            <td className="px-3 py-1.5">
                              {v.ok ? (
                                <span className="inline-flex items-center gap-1 text-success text-[10px] font-mono uppercase">
                                  <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                                  OK
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-destructive text-[10px] font-mono uppercase"
                                  title={v.errors.map((e) => t(`csvImport.rowErrors.${e}`)).join(", ")}
                                >
                                  <XCircle className="w-3 h-3" strokeWidth={2} />
                                  {t(`csvImport.rowErrors.${v.errors[0] ?? "invalid"}`)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {rows.length > 20 && (
                  <div className="text-[10px] text-muted-foreground bg-secondary/40 border-t border-border px-3 py-1.5 text-center">
                    {t("csvImport.andMoreRows", { count: rows.length - 20 })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                {t("csvImport.backToUpload")}
              </button>
              <button
                type="button"
                disabled={!canImport}
                onClick={runImport}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("csvImport.importCount", { count: validRows.length })}
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — IMPORTING */}
        {step === "import" && (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" strokeWidth={1.8} />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {t("csvImport.importing")}
              </p>
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                {progress.done} / {progress.total}
              </p>
            </div>
            <div className="w-full max-w-sm bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-150"
                style={{
                  width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 4 — DONE */}
        {step === "done" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-3 py-4">
              <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" strokeWidth={1.8} />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {t("csvImport.doneTitle")}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t("csvImport.doneSummary", {
                    imported: importedCount,
                    skipped: skippedCount,
                    failed: failures.length,
                  })}
                </p>
              </div>
            </div>

            {failures.length > 0 && (
              <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-3">
                <p className="text-xs font-semibold text-destructive mb-2">
                  {t("csvImport.failuresTitle")}
                </p>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {failures.slice(0, 20).map((f, idx) => (
                    <li key={idx} className="text-[11px] text-muted-foreground tabular-nums">
                      <span className="font-mono">#{f.row}</span> — {f.name} — {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" strokeWidth={2} />
                {t("csvImport.importAnother")}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
                {t("csvImport.close")}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
