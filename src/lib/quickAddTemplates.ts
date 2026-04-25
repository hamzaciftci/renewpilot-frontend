// ─── Quick-add templates ─────────────────────────────────────────────────────
// Popular provider shortcuts shown on step 0 of the AddAsset flow. Clicking one
// pre-fills the asset type + vendor and jumps straight to the "Basic info"
// step, saving the user 2 clicks and some typing.

import type { AssetType } from "@/types";

export interface QuickAddTemplate {
  id: string;
  assetType: AssetType;
  vendorName: string;
  /** Short label shown on the card (usually the provider name). */
  label: string;
  /** Optional subtitle / category hint. */
  category: string;
  /** 1-character or 2-letter glyph used when we don't have a logo. */
  initial: string;
  /** Tailwind color class for the initial circle. */
  accent: string;
}

export const QUICK_ADD_TEMPLATES: QuickAddTemplate[] = [
  // ── Domain registrars ──
  { id: "godaddy",    assetType: "DOMAIN", vendorName: "GoDaddy",    label: "GoDaddy",     category: "Domain",  initial: "Go", accent: "text-warning" },
  { id: "namecheap",  assetType: "DOMAIN", vendorName: "Namecheap",  label: "Namecheap",   category: "Domain",  initial: "Nc", accent: "text-primary" },
  { id: "cloudflare-domain", assetType: "DOMAIN", vendorName: "Cloudflare", label: "Cloudflare", category: "Domain", initial: "Cf", accent: "text-warning" },
  { id: "google-domains",    assetType: "DOMAIN", vendorName: "Squarespace", label: "Squarespace", category: "Domain", initial: "Sq", accent: "text-foreground" },
  { id: "porkbun",    assetType: "DOMAIN", vendorName: "Porkbun",    label: "Porkbun",     category: "Domain",  initial: "Pk", accent: "text-destructive" },
  { id: "ovh",        assetType: "DOMAIN", vendorName: "OVHcloud",   label: "OVHcloud",    category: "Domain",  initial: "Ov", accent: "text-info" },
  { id: "gandi",      assetType: "DOMAIN", vendorName: "Gandi",      label: "Gandi",       category: "Domain",  initial: "Ga", accent: "text-warning" },
  { id: "natro",      assetType: "DOMAIN", vendorName: "Natro",      label: "Natro",       category: "Domain",  initial: "Na", accent: "text-primary" },

  // ── SSL ──
  { id: "letsencrypt", assetType: "SSL_CERTIFICATE", vendorName: "Let's Encrypt", label: "Let's Encrypt", category: "SSL", initial: "LE", accent: "text-success" },
  { id: "digicert",    assetType: "SSL_CERTIFICATE", vendorName: "DigiCert",      label: "DigiCert",      category: "SSL", initial: "DC", accent: "text-primary" },
  { id: "sectigo",     assetType: "SSL_CERTIFICATE", vendorName: "Sectigo",       label: "Sectigo",       category: "SSL", initial: "Sc", accent: "text-primary" },
  { id: "zerossl",     assetType: "SSL_CERTIFICATE", vendorName: "ZeroSSL",       label: "ZeroSSL",       category: "SSL", initial: "Z0", accent: "text-info" },
  { id: "ssl-com",     assetType: "SSL_CERTIFICATE", vendorName: "SSL.com",       label: "SSL.com",       category: "SSL", initial: "SL", accent: "text-info" },

  // ── Servers / Cloud ──
  { id: "aws-ec2",     assetType: "SERVER", vendorName: "AWS",          label: "AWS EC2",       category: "Cloud",  initial: "AW", accent: "text-warning" },
  { id: "gcp",         assetType: "SERVER", vendorName: "Google Cloud", label: "Google Cloud",  category: "Cloud",  initial: "GC", accent: "text-primary" },
  { id: "azure",       assetType: "SERVER", vendorName: "Azure",        label: "Microsoft Azure", category: "Cloud", initial: "Az", accent: "text-info" },
  { id: "digitalocean",assetType: "SERVER", vendorName: "DigitalOcean", label: "DigitalOcean",  category: "Cloud",  initial: "DO", accent: "text-primary" },
  { id: "hetzner",     assetType: "SERVER", vendorName: "Hetzner",      label: "Hetzner",       category: "Cloud",  initial: "He", accent: "text-destructive" },
  { id: "linode",      assetType: "SERVER", vendorName: "Linode",       label: "Linode / Akamai", category: "Cloud",initial: "Ln", accent: "text-success" },
  { id: "vultr",       assetType: "SERVER", vendorName: "Vultr",        label: "Vultr",         category: "Cloud",  initial: "Vu", accent: "text-primary" },
  { id: "ovh-vps",     assetType: "SERVER", vendorName: "OVHcloud",     label: "OVH VPS",       category: "Cloud",  initial: "Ov", accent: "text-info" },

  // ── Hosting ──
  { id: "siteground",  assetType: "HOSTING_SERVICE", vendorName: "SiteGround", label: "SiteGround",  category: "Hosting", initial: "SG", accent: "text-primary" },
  { id: "bluehost",    assetType: "HOSTING_SERVICE", vendorName: "Bluehost",   label: "Bluehost",    category: "Hosting", initial: "Bh", accent: "text-info" },
  { id: "hostinger",   assetType: "HOSTING_SERVICE", vendorName: "Hostinger",  label: "Hostinger",   category: "Hosting", initial: "Hs", accent: "text-primary" },
  { id: "wpengine",    assetType: "HOSTING_SERVICE", vendorName: "WP Engine",  label: "WP Engine",   category: "Hosting", initial: "WP", accent: "text-success" },
  { id: "kinsta",      assetType: "HOSTING_SERVICE", vendorName: "Kinsta",     label: "Kinsta",      category: "Hosting", initial: "Ki", accent: "text-primary" },

  // ── CDN ──
  { id: "cloudflare-cdn", assetType: "CDN_SERVICE", vendorName: "Cloudflare", label: "Cloudflare", category: "CDN", initial: "Cf", accent: "text-warning" },
  { id: "fastly",      assetType: "CDN_SERVICE", vendorName: "Fastly",     label: "Fastly",      category: "CDN", initial: "Fa", accent: "text-destructive" },
  { id: "bunny",       assetType: "CDN_SERVICE", vendorName: "Bunny.net",  label: "Bunny.net",   category: "CDN", initial: "Bn", accent: "text-warning" },
  { id: "akamai",      assetType: "CDN_SERVICE", vendorName: "Akamai",     label: "Akamai",      category: "CDN", initial: "Ak", accent: "text-info" },

  // ── SaaS / Licenses ──
  { id: "figma",       assetType: "LICENSE", vendorName: "Figma",       label: "Figma",         category: "SaaS", initial: "Fi", accent: "text-destructive" },
  { id: "github",      assetType: "LICENSE", vendorName: "GitHub",      label: "GitHub",        category: "SaaS", initial: "GH", accent: "text-foreground" },
  { id: "notion",      assetType: "LICENSE", vendorName: "Notion",      label: "Notion",        category: "SaaS", initial: "No", accent: "text-foreground" },
  { id: "slack",       assetType: "LICENSE", vendorName: "Slack",       label: "Slack",         category: "SaaS", initial: "Sl", accent: "text-primary" },
  { id: "linear",      assetType: "LICENSE", vendorName: "Linear",      label: "Linear",        category: "SaaS", initial: "Li", accent: "text-primary" },
  { id: "jira",        assetType: "LICENSE", vendorName: "Atlassian",   label: "Jira / Atlassian", category: "SaaS", initial: "At", accent: "text-info" },
  { id: "openai",      assetType: "LICENSE", vendorName: "OpenAI",      label: "OpenAI",        category: "SaaS", initial: "AI", accent: "text-success" },
  { id: "anthropic",   assetType: "LICENSE", vendorName: "Anthropic",   label: "Anthropic Claude", category: "SaaS", initial: "Cl", accent: "text-warning" },
  { id: "vercel",      assetType: "LICENSE", vendorName: "Vercel",      label: "Vercel",        category: "SaaS", initial: "Ve", accent: "text-foreground" },
  { id: "netlify",     assetType: "LICENSE", vendorName: "Netlify",     label: "Netlify",       category: "SaaS", initial: "Nf", accent: "text-info" },
  { id: "stripe",      assetType: "LICENSE", vendorName: "Stripe",      label: "Stripe",        category: "SaaS", initial: "St", accent: "text-primary" },
  { id: "office365",   assetType: "LICENSE", vendorName: "Microsoft",   label: "Microsoft 365", category: "SaaS", initial: "M3", accent: "text-warning" },
  { id: "gsuite",      assetType: "LICENSE", vendorName: "Google",      label: "Google Workspace", category: "SaaS", initial: "GW", accent: "text-primary" },
  { id: "zoom",        assetType: "LICENSE", vendorName: "Zoom",        label: "Zoom",          category: "SaaS", initial: "Zm", accent: "text-primary" },

  // ── Payment / Cards ──
  { id: "visa",        assetType: "CREDIT_CARD", vendorName: "",         label: "Visa",          category: "Card", initial: "Vi", accent: "text-primary" },
  { id: "mastercard",  assetType: "CREDIT_CARD", vendorName: "",         label: "Mastercard",    category: "Card", initial: "Mc", accent: "text-warning" },
  { id: "amex",        assetType: "CREDIT_CARD", vendorName: "",         label: "American Express", category: "Card", initial: "Ax", accent: "text-info" },
];

/** Filter templates to those matching a search query (vendor/label). */
export function filterTemplates(query: string): QuickAddTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return QUICK_ADD_TEMPLATES;
  return QUICK_ADD_TEMPLATES.filter((tpl) => {
    return (
      tpl.label.toLowerCase().includes(q) ||
      tpl.vendorName.toLowerCase().includes(q) ||
      tpl.category.toLowerCase().includes(q)
    );
  });
}
