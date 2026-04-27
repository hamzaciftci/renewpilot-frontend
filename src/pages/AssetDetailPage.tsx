import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Pencil, Check, Trash2, X, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAsset, useAssetHistory, useUpdateAsset, useDeleteAsset } from "@/hooks/useAssets";
import { useRenewAsset } from "@/hooks/useRenewals";
import { ASSET_STATUS_DISPLAY } from "@/types";
import { formatDate, daysUntil, daysColor, initials } from "@/lib/date";
import { ShareLinkDialog } from "@/components/ShareLinkDialog";

export default function AssetDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: asset, isLoading } = useAsset(id!);
  const { data: history = [] } = useAssetHistory(id!);
  const renewAsset = useRenewAsset();
  const updateAsset = useUpdateAsset(id!);
  const deleteAsset = useDeleteAsset();

  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ notes: "", vendorName: "" });
  const [shareOpen, setShareOpen] = useState(false);

  const handleEdit = () => {
    if (!asset) return;
    setEditFields({ notes: asset.notes ?? "", vendorName: asset.vendorName ?? "" });
    setEditMode(true);
  };

  const handleSave = async () => {
    await updateAsset.mutateAsync(editFields);
    toast.success(t("assetDetail.assetUpdated"));
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (!confirm(t("assetDetail.confirmDelete"))) return;
    await deleteAsset.mutateAsync(id!);
    toast.success(t("assetDetail.assetDeleted"));
    navigate("/assets");
  };

  const handleRenew = async () => {
    await renewAsset.mutateAsync({ assetId: id! });
    toast.success(t("assetDetail.assetRenewed"));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-6xl animate-pulse">
        <div className="h-4 bg-secondary rounded w-48" />
        <div className="h-8 bg-secondary rounded w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-secondary rounded-xl" />
          <div className="h-48 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-6xl">
        <p className="text-muted-foreground">{t("assetDetail.notFound")}</p>
        <Link to="/assets" className="text-primary text-sm mt-2 inline-block">{t("assetDetail.backToAssets")}</Link>
      </div>
    );
  }

  const days = daysUntil(asset.renewalDate);
  const colors = daysColor(days);
  const statusDisplay = ASSET_STATUS_DISPLAY[asset.status];
  const typeLabel = t(`assets.typeShort.${asset.assetType}`, { defaultValue: asset.assetType });

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/assets" className="hover:text-foreground transition-colors duration-150">{t("assetDetail.breadcrumb")}</Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <span className="text-foreground font-medium truncate">{asset.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <h1 className="text-xl font-semibold text-foreground">{asset.name}</h1>
          <span className="text-[10px] font-mono font-semibold uppercase text-primary">{typeLabel}</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDisplay.dot}`} />
            <span className={`text-xs font-medium ${statusDisplay.text}`}>{t(`assets.statuses.${asset.status}`, { defaultValue: asset.status })}</span>
          </span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleRenew}
            disabled={renewAsset.isPending}
            className="text-sm font-medium text-success hover:bg-success/10 px-3 md:px-4 py-2 rounded-lg border border-border transition-colors duration-150 flex items-center gap-1.5 flex-1 sm:flex-none disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            {renewAsset.isPending ? t("assetDetail.renewing") : t("assetDetail.markRenewed")}
          </button>
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateAsset.isPending}
                className="text-sm font-medium text-success hover:bg-success/10 px-3 py-2 rounded-lg border border-border transition-colors duration-150 flex-1 sm:flex-none"
              >
                {updateAsset.isPending ? t("assetDetail.saving") : t("assetDetail.save")}
              </button>
              <button onClick={() => setEditMode(false)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border transition-colors duration-150">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="text-sm font-medium text-foreground hover:bg-secondary px-3 md:px-4 py-2 rounded-lg border border-border transition-colors duration-150 flex items-center gap-1.5 flex-1 sm:flex-none"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("assetDetail.edit")}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-sm font-medium text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg border border-border transition-colors duration-150"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 border-b border-border">
              <div className="p-4 md:p-6 border-r border-border">
                <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">{t("assetDetail.daysRemaining")}</label>
                <p className={`text-4xl md:text-5xl font-bold mt-1 tabular-nums ${days < 0 ? "text-destructive" : colors.text}`}>
                  {days < 0 ? Math.abs(days) : String(days).padStart(2, "0")}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {days < 0
                    ? t("assetDetail.daysOverdue", { count: Math.abs(days) })
                    : t("assetDetail.due", { date: formatDate(asset.renewalDate) })}
                </p>
              </div>
              <div className="p-4 md:p-6">
                <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">{t("assetDetail.price")}</label>
                <p className="text-3xl md:text-4xl font-bold text-foreground mt-1 tabular-nums">
                  {asset.priceAmount ? `${asset.priceCurrency} ${parseFloat(asset.priceAmount).toFixed(2)}` : "—"}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {asset.renewalIntervalValue && asset.renewalIntervalUnit
                    ? t("assetDetail.perInterval", { value: asset.renewalIntervalValue, unit: asset.renewalIntervalUnit.toLowerCase() })
                    : t("assetDetail.noInterval")}
                </p>
              </div>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-2 gap-y-4 md:gap-y-5">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.vendor")}</p>
                {editMode ? (
                  <input
                    type="text"
                    value={editFields.vendorName}
                    onChange={(e) => setEditFields((f) => ({ ...f, vendorName: e.target.value }))}
                    className="text-sm bg-secondary border border-border rounded px-2 py-1 mt-0.5 w-full focus:outline-none focus:border-primary"
                  />
                ) : (
                  <p className="text-sm text-foreground mt-0.5">{asset.vendorName || "—"}</p>
                )}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.project")}</p>
                <p className="text-sm text-foreground mt-0.5">{asset.project?.name || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.assignedTo")}</p>
                {asset.assignedUser ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-secondary text-[9px] flex items-center justify-center font-semibold text-foreground">
                      {initials(asset.assignedUser.fullName)}
                    </div>
                    <p className="text-sm text-foreground">{asset.assignedUser.fullName}</p>
                  </div>
                ) : (
                  <p className="text-sm text-foreground mt-0.5">—</p>
                )}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.autoRenew")}</p>
                <span className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${asset.autoRenewEnabled ? "bg-success" : "bg-destructive"}`} />
                  <span className={`text-xs font-medium ${asset.autoRenewEnabled ? "text-success" : "text-destructive"}`}>
                    {asset.autoRenewEnabled ? t("assetDetail.enabled") : t("assetDetail.disabled")}
                  </span>
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.notes")}</p>
                {editMode ? (
                  <textarea
                    value={editFields.notes}
                    onChange={(e) => setEditFields((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="text-sm bg-secondary border border-border rounded px-2 py-1 mt-0.5 w-full focus:outline-none focus:border-primary resize-none"
                  />
                ) : (
                  <p className="text-sm text-foreground/80 mt-0.5">{asset.notes || "—"}</p>
                )}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.created")}</p>
                <p className="text-sm text-foreground font-mono">{formatDate(asset.createdAt)}</p>
              </div>
              {asset.lastRenewedAt && (
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.lastRenewed")}</p>
                  <p className="text-sm text-foreground font-mono">{formatDate(asset.lastRenewedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {asset.assetType === "CREDIT_CARD" && (
            <div className="bg-card border border-border rounded-xl p-4 md:p-5">
              <h3 className="text-sm font-medium text-foreground mb-3">{t("assetDetail.creditCardInfo")}</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.bank")}</p>
                  <p className="text-sm text-foreground mt-0.5">{asset.vendorName || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.last4")}</p>
                  <p className="text-sm text-foreground mt-0.5 tracking-widest">
                    {typeof asset.metadata?.last4 === "string" && asset.metadata.last4
                      ? `**** ${asset.metadata.last4}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.billingCycleDay")}</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {typeof asset.metadata?.statementDay === "number"
                      ? t("assetDetail.dayOfMonth", { day: asset.metadata.statementDay })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">{t("assetDetail.dueDay")}</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {typeof asset.metadata?.dueDay === "number"
                      ? t("assetDetail.dayOfMonth", { day: asset.metadata.dueDay })
                      : "—"}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border">
                {t("assetDetail.creditCardAutoHelp")}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">{t("assetDetail.renewalHistory")}</h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("assetDetail.noHistory")}</p>
            ) : (
              <div className="space-y-0">
                {history.map((event, i) => (
                  <div key={event.id} className="flex gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                        event.eventType === "RENEWED" ? "bg-success" :
                        event.eventType === "REMINDER_SENT" ? "bg-warning" :
                        "bg-primary"
                      }`} />
                      {i < history.length - 1 && <div className="w-px flex-1 bg-border min-h-[28px]" />}
                    </div>
                    <div className="pb-5">
                      <p className="text-xs text-foreground/80">
                        {event.eventType.replace("_", " ")}
                        {event.notes ? ` — ${event.notes}` : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{formatDate(event.eventDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-3 md:space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-medium text-foreground mb-2">{t("assetDetail.reminderPolicy")}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("assetDetail.defaultPolicyDesc")}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-medium text-foreground mb-3">{t("assetDetail.quickActions")}</h3>
            <div className="space-y-1">
              <button
                onClick={handleRenew}
                disabled={renewAsset.isPending}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
              >
                {renewAsset.isPending ? t("assetDetail.renewing") : t("assetDetail.markRenewed")}
              </button>
              <button
                onClick={handleEdit}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
              >
                {t("assetDetail.editAsset")}
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                {t("assetDetail.shareLink")}
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors duration-150"
              >
                {t("assetDetail.deleteAsset")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ShareLinkDialog assetId={id!} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
