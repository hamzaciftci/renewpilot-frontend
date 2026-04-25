import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Globe,
  Server,
  ShieldCheck,
  Database,
  Key,
  Zap,
  Plus,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCreateAsset } from "@/hooks/useAssets";
import { useProjects } from "@/hooks/useOrganization";
import type { AssetType } from "@/types";
import { QUICK_ADD_TEMPLATES, filterTemplates, type QuickAddTemplate } from "@/lib/quickAddTemplates";
import { lookupsApi } from "@/lib/api";

const ASSET_TYPE_DEFS: { type: AssetType; icon: typeof Globe; color: string }[] = [
  { type: "DOMAIN", icon: Globe, color: "text-primary" },
  { type: "SERVER", icon: Server, color: "text-info" },
  { type: "SSL_CERTIFICATE", icon: ShieldCheck, color: "text-success" },
  { type: "HOSTING_SERVICE", icon: Database, color: "text-info" },
  { type: "LICENSE", icon: Key, color: "text-warning" },
  { type: "CDN_SERVICE", icon: Zap, color: "text-success" },
  { type: "CREDIT_CARD", icon: CreditCard, color: "text-warning" },
  { type: "CUSTOM", icon: Plus, color: "text-muted-foreground" },
];

/**
 * Given a day-of-month (1-31), return the next occurrence as an ISO date (YYYY-MM-DD).
 * If today's date equals or exceeds the target day, advance to next month.
 * Clamps to last valid day of the month (e.g. 31st in February → 28th/29th).
 */
function nextOccurrenceOfDay(day: number, from = new Date()): string {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  let year = d.getFullYear();
  let month = d.getMonth();
  if (d.getDate() >= day) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfMonth);
  const target = new Date(year, month, clampedDay);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(target.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddAssetPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createAsset = useCreateAsset();
  const { data: projects = [] } = useProjects();

  // Support deep-linking via ?type=DOMAIN or ?template=figma. Either shortcut
  // skips the type-picker step. Templates additionally pre-fill the vendor.
  const initial = useMemo<{ type: AssetType | ""; vendor: string }>(() => {
    const tplId = searchParams.get("template");
    if (tplId) {
      const tpl = QUICK_ADD_TEMPLATES.find((x) => x.id === tplId);
      if (tpl) return { type: tpl.assetType, vendor: tpl.vendorName };
    }
    const raw = searchParams.get("type");
    if (raw && ASSET_TYPE_DEFS.some((d) => d.type === raw)) {
      return { type: raw as AssetType, vendor: "" };
    }
    return { type: "", vendor: "" };
  }, [searchParams]);

  const [step, setStep] = useState(initial.type ? 1 : 0);
  const [selectedType, setSelectedType] = useState<AssetType | "">(initial.type);
  const [templateSearch, setTemplateSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    vendor: initial.vendor,
    projectId: "",
    notes: "",
    renewalDate: "",
    price: "",
    currency: "USD",
    autoRenew: false,
    // Credit-card specific
    last4: "",
    statementDay: "",
    dueDay: "",
  });

  const pickTemplate = (tpl: QuickAddTemplate) => {
    setSelectedType(tpl.assetType);
    setForm((p) => ({ ...p, vendor: tpl.vendorName }));
    setStep(1);
  };

  const filteredTemplates = useMemo(
    () => filterTemplates(templateSearch),
    [templateSearch],
  );

  const isCC = selectedType === "CREDIT_CARD";
  const totalSteps = 4;

  const update = (key: string, value: string | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));
  const progress = ((step + 1) / totalSteps) * 100;

  // ── WHOIS auto-detect (DOMAIN type only) ──
  const [detectState, setDetectState] = useState<{
    status: "idle" | "loading" | "success" | "info" | "error";
    message?: string;
  }>({ status: "idle" });

  const detectExpiry = async () => {
    if (!form.name.trim()) {
      setDetectState({ status: "error", message: t("addAsset.detectNeedsName") });
      return;
    }
    setDetectState({ status: "loading" });
    try {
      const result = await lookupsApi.whois(form.name.trim());
      if (!result.expiresAt) {
        setDetectState({ status: "info", message: t("addAsset.detectNoExpiry") });
        return;
      }
      setForm((p) => ({
        ...p,
        renewalDate: result.expiresAt!,
        // Pre-fill vendor only if user hasn't provided one
        vendor: p.vendor || result.registrar || p.vendor,
      }));
      setDetectState({
        status: "success",
        message: result.registrar
          ? t("addAsset.detectFilledFromRegistrar", { registrar: result.registrar })
          : undefined,
      });
    } catch (err: unknown) {
      const code = (err as { statusCode?: number })?.statusCode;
      const msg =
        code === 404
          ? t("addAsset.detectNotFound")
          : t("addAsset.detectFailed");
      setDetectState({ status: "error", message: msg });
    }
  };

  const handleCreate = async () => {
    if (!selectedType || !form.name) return;

    let renewalDate = form.renewalDate;
    let metadata: Record<string, unknown> | undefined;

    if (isCC) {
      const dueDay = parseInt(form.dueDay, 10);
      const statementDay = parseInt(form.statementDay, 10);
      if (!dueDay || dueDay < 1 || dueDay > 31) return;
      renewalDate = nextOccurrenceOfDay(dueDay);
      metadata = {
        statementDay: statementDay || undefined,
        dueDay,
        last4: form.last4 || undefined,
        bankName: form.vendor || undefined,
      };
    }

    if (!renewalDate) return;

    try {
      await createAsset.mutateAsync({
        assetType: selectedType,
        name: form.name,
        vendorName: form.vendor || undefined,
        projectId: form.projectId || undefined,
        notes: form.notes || undefined,
        renewalDate,
        priceAmount: form.price || undefined,
        priceCurrency: form.currency,
        metadata,
      });
      navigate("/assets");
    } catch (err: unknown) {
      console.error("Failed to create asset:", err);
    }
  };

  // Validation per step (enables/disables Next button)
  const canAdvance = (() => {
    if (step === 0) return !!selectedType;
    if (step === 1) {
      if (!form.name.trim()) return false;
      return true;
    }
    if (step === 2) {
      if (isCC) {
        const dd = parseInt(form.dueDay, 10);
        return dd >= 1 && dd <= 31;
      }
      return !!form.renewalDate;
    }
    return true;
  })();

  const typeLabelForSelected = selectedType
    ? t(`addAsset.typeLabels.${selectedType}`, { defaultValue: selectedType })
    : "—";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress */}
      <div>
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("addAsset.stepProgress", {
            current: step + 1,
            total: totalSteps,
            label: t(`addAsset.steps.${step}`),
          })}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8">
        {/* Step 1 */}
        {step === 0 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">{t("addAsset.selectType")}</h2>
              <p className="text-xs text-muted-foreground mb-4">{t("addAsset.selectTypeDesc")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ASSET_TYPE_DEFS.map((at) => (
                  <button
                    key={at.type}
                    onClick={() => setSelectedType(at.type)}
                    className={`p-5 rounded-[10px] border transition-all duration-150 flex flex-col items-center gap-3 ${
                      selectedType === at.type
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/50 hover:border-muted-foreground"
                    }`}
                  >
                    <at.icon
                      className={`w-6 h-6 ${selectedType === at.type ? "text-primary" : at.color}`}
                      strokeWidth={1.5}
                    />
                    <span className="text-sm font-medium text-foreground">{t(`addAsset.typeLabels.${at.type}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Quick-add templates ── */}
            <div className="pt-6 border-t border-border">
              <div className="flex items-start sm:items-center gap-3 mb-3 flex-col sm:flex-row sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("addAsset.templatesTitle")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("addAsset.templatesDesc")}
                  </p>
                </div>
                <div className="relative w-full sm:w-56">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder={t("addAsset.templatesSearch")}
                    className="w-full text-xs bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {filteredTemplates.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  {t("addAsset.templatesEmpty")}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
                  {filteredTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => pickTemplate(tpl)}
                      className="group text-left bg-secondary/30 hover:bg-secondary/60 border border-border hover:border-primary/50 rounded-lg p-3 transition-all flex items-center gap-2.5"
                    >
                      <span
                        className={`w-8 h-8 flex-shrink-0 rounded-md bg-background border border-border flex items-center justify-center text-[10px] font-mono font-bold ${tpl.accent}`}
                      >
                        {tpl.initial}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{tpl.label}</p>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5 truncate">
                          {tpl.category}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-foreground mb-6">{t("addAsset.basicInfo")}</h2>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                {isCC ? t("addAsset.cardName") : t("addAsset.assetName")}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder={isCC ? t("addAsset.cardNamePlaceholder") : t("addAsset.assetNamePlaceholder")}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                {isCC ? t("addAsset.bank") : t("addAsset.vendor")}
              </label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => update("vendor", e.target.value)}
                placeholder={isCC ? t("addAsset.bankPlaceholder") : t("addAsset.vendorPlaceholder")}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>

            {isCC && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  {t("addAsset.last4")} <span className="text-muted-foreground font-normal">{t("addAsset.optional")}</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.last4}
                  onChange={(e) => update("last4", e.target.value.replace(/\D/g, ""))}
                  placeholder={t("addAsset.last4Placeholder")}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150 tracking-widest"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("addAsset.last4Help")}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">{t("addAsset.project")}</label>
              <select
                value={form.projectId}
                onChange={(e) => update("projectId", e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground"
              >
                <option value="">{t("addAsset.noProject")}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">{t("addAsset.notes")}</label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              {isCC ? t("addAsset.paymentDates") : t("addAsset.renewalSettings")}
            </h2>

            {isCC ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      {t("addAsset.billingCycleDay")} <span className="text-muted-foreground font-normal">{t("addAsset.optional")}</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={form.statementDay}
                      onChange={(e) => update("statementDay", e.target.value)}
                      placeholder={t("addAsset.billingCycleDayPlaceholder")}
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">{t("addAsset.billingCycleDayHelp")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      {t("addAsset.dueDay")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={form.dueDay}
                      onChange={(e) => update("dueDay", e.target.value)}
                      placeholder={t("addAsset.dueDayPlaceholder")}
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">{t("addAsset.dueDayHelp")}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    {t("addAsset.avgMonthly")} <span className="text-muted-foreground font-normal">{t("addAsset.optional")}</span>
                  </label>
                  <div className="grid grid-cols-[1fr,100px] gap-3">
                    <input
                      type="text"
                      value={form.price}
                      onChange={(e) => update("price", e.target.value)}
                      placeholder={t("addAsset.pricePlaceholder")}
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                    />
                    <select
                      value={form.currency}
                      onChange={(e) => update("currency", e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-secondary text-foreground"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>
                </div>
                {form.dueDay && parseInt(form.dueDay, 10) >= 1 && parseInt(form.dueDay, 10) <= 31 && (
                  <div className="text-xs text-muted-foreground bg-secondary/60 border border-border rounded-lg px-3 py-2">
                    {t("addAsset.nextDueDate")}{" "}
                    <span className="text-foreground font-medium">
                      {nextOccurrenceOfDay(parseInt(form.dueDay, 10))}
                    </span>
                    . {t("addAsset.autoAdvanceHelp")}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      {t("addAsset.renewalDate")}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={form.renewalDate}
                        onChange={(e) => update("renewalDate", e.target.value)}
                        className="flex-1 min-w-0 border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                      />
                      {selectedType === "DOMAIN" && (
                        <button
                          type="button"
                          onClick={detectExpiry}
                          disabled={detectState.status === "loading" || !form.name.trim()}
                          title={t("addAsset.detectHint")}
                          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border border-border rounded-lg bg-secondary text-foreground hover:border-primary hover:text-primary transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {detectState.status === "loading" ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                              {t("addAsset.detecting")}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                              {t("addAsset.detectExpiry")}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {selectedType === "DOMAIN" && detectState.status !== "idle" && detectState.status !== "loading" && (
                      <p
                        className={`mt-1.5 text-[11px] flex items-start gap-1 ${
                          detectState.status === "success"
                            ? "text-success"
                            : detectState.status === "error"
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }`}
                      >
                        {detectState.status === "success" ? (
                          <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        ) : (
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" strokeWidth={2} />
                        )}
                        <span>{detectState.message ?? t("addAsset.detectHint")}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">{t("addAsset.currency")}</label>
                    <select
                      value={form.currency}
                      onChange={(e) => update("currency", e.target.value)}
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">{t("addAsset.price")}</label>
                  <input
                    type="text"
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                    placeholder={t("addAsset.pricePlaceholder")}
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                  />
                </div>
                <div className="flex items-center justify-between py-3 px-4 bg-secondary rounded-lg">
                  <span className="text-sm font-medium text-foreground">{t("addAsset.autoRenew")}</span>
                  <button
                    onClick={() => update("autoRenew", !form.autoRenew)}
                    className={`w-10 h-6 rounded-full transition-colors duration-150 ${form.autoRenew ? "bg-primary" : "bg-border"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-foreground shadow transition-transform mx-1 ${form.autoRenew ? "translate-x-4" : ""}`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4 */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">{t("addAsset.confirmCreate")}</h2>
            {createAsset.error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {(createAsset.error as { message?: string })?.message ?? t("addAsset.createFailed")}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 bg-secondary rounded-xl p-6">
              {(isCC
                ? [
                    [t("addAsset.summary.type"), typeLabelForSelected],
                    [t("addAsset.summary.cardName"), form.name || "—"],
                    [t("addAsset.summary.bank"), form.vendor || "—"],
                    [t("addAsset.summary.last4"), form.last4 ? `**** ${form.last4}` : "—"],
                    [t("addAsset.summary.billingCycleDay"), form.statementDay || "—"],
                    [t("addAsset.summary.dueDay"), form.dueDay || "—"],
                    [
                      t("addAsset.summary.nextPayment"),
                      form.dueDay
                        ? nextOccurrenceOfDay(parseInt(form.dueDay, 10))
                        : "—",
                    ],
                    [t("addAsset.summary.monthlyAmount"), form.price ? `${form.price} ${form.currency}` : "—"],
                  ]
                : [
                    [t("addAsset.summary.type"), typeLabelForSelected],
                    [t("addAsset.summary.name"), form.name || "—"],
                    [t("addAsset.summary.vendor"), form.vendor || "—"],
                    [t("addAsset.summary.project"), projects.find((p) => p.id === form.projectId)?.name ?? "—"],
                    [t("addAsset.summary.renewalDate"), form.renewalDate || "—"],
                    [t("addAsset.summary.price"), form.price ? `${form.price} ${form.currency}` : "—"],
                    [t("addAsset.summary.autoRenew"), form.autoRenew ? t("addAsset.enabled") : t("addAsset.disabled")],
                  ]
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
                  <p className="text-sm text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={() => (step === 0 ? navigate("/assets") : setStep(step - 1))}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            {step === 0 ? t("addAsset.cancel") : t("addAsset.back")}
          </button>
          <button
            onClick={() => (step < 3 ? setStep(step + 1) : handleCreate())}
            disabled={!canAdvance || createAsset.isPending}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-40 flex items-center gap-2"
          >
            {step < 3 ? (
              <>
                {t("addAsset.next")} <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </>
            ) : createAsset.isPending ? (
              t("addAsset.creating")
            ) : (
              t("addAsset.createAsset")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
