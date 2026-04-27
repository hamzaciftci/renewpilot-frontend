import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Copy, Link2, X, Trash2, Check, Eye } from "lucide-react";
import { shareLinksApi, type AssetShareLinkCreated } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/date";

interface Props {
  assetId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Read-only share link manager. Lives in a Settings-style modal that the
 * AssetDetailPage opens.
 *
 * UX rules:
 *  - Existing links are listed, but their plaintext tokens are NEVER shown
 *    again (we don't store them). The user has to revoke + recreate to get
 *    a new shareable URL if they lost the original.
 *  - Just-created links surface the plaintext token in a one-time banner so
 *    the user can copy it.
 *  - Expired and revoked links are visible (greyed) with their state, so the
 *    user can audit who tried sharing what.
 */
export function ShareLinkDialog({ assetId, open, onClose }: Props) {
  const { t } = useTranslation();
  const { orgId } = useAuth();
  const qc = useQueryClient();

  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<string>(""); // "" = no expiry
  const [justCreated, setJustCreated] = useState<AssetShareLinkCreated | null>(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["share-links", orgId, assetId],
    queryFn: () => shareLinksApi.list(orgId!, assetId),
    enabled: open && !!orgId,
  });

  const createLink = useMutation({
    mutationFn: () => {
      const expiresAt = expiresInDays
        ? new Date(Date.now() + Number(expiresInDays) * 86_400_000).toISOString()
        : undefined;
      return shareLinksApi.create(orgId!, assetId, {
        label: label.trim() || undefined,
        expiresAt,
      });
    },
    onSuccess: (created) => {
      setJustCreated(created);
      setLabel("");
      setExpiresInDays("");
      qc.invalidateQueries({ queryKey: ["share-links", orgId, assetId] });
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message ?? t("shareLink.createFailed")),
  });

  const revokeLink = useMutation({
    mutationFn: (linkId: string) => shareLinksApi.revoke(orgId!, assetId, linkId),
    onSuccess: () => {
      toast.success(t("shareLink.revoked"));
      qc.invalidateQueries({ queryKey: ["share-links", orgId, assetId] });
    },
    onError: (err: { message?: string }) =>
      toast.error(err.message ?? t("shareLink.revokeFailed")),
  });

  const handleClose = () => {
    setJustCreated(null);
    setLabel("");
    setExpiresInDays("");
    onClose();
  };

  const buildShareUrl = (token: string) => `${window.location.origin}/share/${token}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("shareLink.copied"));
    } catch {
      toast.error(t("shareLink.copyFailed"));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{t("shareLink.title")}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("shareLink.desc")}
          </p>

          {/* Just-created banner — only shown right after creation */}
          {justCreated && (
            <div className="border border-primary/30 bg-primary/5 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">
                {t("shareLink.copyOnceWarning")}
              </p>
              <div className="flex items-center gap-2 bg-background border border-border rounded px-2 py-1.5">
                <code className="text-xs text-foreground flex-1 truncate font-mono">
                  {buildShareUrl(justCreated.token)}
                </code>
                <button
                  onClick={() => copyToClipboard(buildShareUrl(justCreated.token))}
                  className="text-primary hover:text-primary/80 p-1"
                  title={t("shareLink.copy")}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Create new */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              {t("shareLink.labelField")}
              <span className="text-muted-foreground font-normal ml-1">{t("common.optional")}</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("shareLink.labelPlaceholder")}
              maxLength={120}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />

            <label className="text-xs font-medium text-foreground block mt-2">
              {t("shareLink.expiresIn")}
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">{t("shareLink.never")}</option>
              <option value="1">{t("shareLink.expiry1d")}</option>
              <option value="7">{t("shareLink.expiry7d")}</option>
              <option value="30">{t("shareLink.expiry30d")}</option>
              <option value="90">{t("shareLink.expiry90d")}</option>
            </select>

            <button
              onClick={() => createLink.mutate()}
              disabled={createLink.isPending}
              className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 mt-1"
            >
              {createLink.isPending ? t("shareLink.creating") : t("shareLink.createButton")}
            </button>
          </div>

          {/* Existing links */}
          <div className="space-y-2 pt-2 border-t border-border">
            <h3 className="text-xs font-medium text-foreground uppercase tracking-wider">
              {t("shareLink.existingLinks")}
            </h3>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">{t("shareLink.loading")}</p>
            ) : links.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("shareLink.noLinks")}</p>
            ) : (
              <div className="space-y-2">
                {links.map((link) => {
                  const isRevoked = !!link.revokedAt;
                  const isExpired =
                    link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now();
                  const isInactive = isRevoked || isExpired;
                  return (
                    <div
                      key={link.id}
                      className={`border rounded-lg p-3 text-xs ${
                        isInactive ? "border-border bg-muted/30 opacity-70" : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {link.label || t("shareLink.unlabeled")}
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            {t("shareLink.createdOn", { date: formatDate(link.createdAt) })}
                            {link.createdBy && ` · ${link.createdBy.fullName}`}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {t("shareLink.views", { count: link.viewCount })}
                            </span>
                            {link.expiresAt && (
                              <span className={isExpired ? "text-destructive" : "text-muted-foreground"}>
                                {isExpired
                                  ? t("shareLink.expired")
                                  : t("shareLink.expiresOn", { date: formatDate(link.expiresAt) })}
                              </span>
                            )}
                            {isRevoked && (
                              <span className="text-destructive">{t("shareLink.revokedBadge")}</span>
                            )}
                          </div>
                        </div>
                        {!isInactive && (
                          <button
                            onClick={() => {
                              if (window.confirm(t("shareLink.revokeConfirm"))) {
                                revokeLink.mutate(link.id);
                              }
                            }}
                            disabled={revokeLink.isPending}
                            className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors disabled:opacity-50"
                            title={t("shareLink.revoke")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
