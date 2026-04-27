import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link2, ShieldAlert, Building2, Calendar, Tag, AlertCircle } from "lucide-react";
import { shareLinksApi } from "@/lib/api";
import { formatDate, daysUntil } from "@/lib/date";

/**
 * Public, unauthenticated page rendered when someone opens a /share/:token URL.
 *
 * The backend resolver returns a sanitized payload — no license keys, no IP
 * addresses, no project membership. Anything sensitive that lives on the asset
 * model is intentionally absent from the type, so we can render every field
 * we receive without paranoia. The token itself is the secret; if it leaks,
 * the user revokes the link from Settings.
 *
 * UX rules:
 *  - No nav, no auth gate, no chrome that would imply the viewer is logged in.
 *  - Single 404-style error for any failure (revoked / expired / never-existed).
 *    The backend already collapses these into one ambiguous response so nothing
 *    here needs to disambiguate them.
 */
export default function SharedAssetPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-share", token],
    queryFn: () => shareLinksApi.resolve(token!),
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">
            {t("publicShare.unavailableTitle")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("publicShare.unavailableDesc")}
          </p>
        </div>
      </div>
    );
  }

  const { asset, organizationName, label } = data;
  const days = daysUntil(asset.renewalDate);
  const overdue = days < 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal top bar — no nav, just attribution */}
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">RenewPilot</span>
          </div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            {t("publicShare.readOnlyBadge")}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Org attribution */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="w-3.5 h-3.5" />
          <span>{t("publicShare.sharedBy", { org: organizationName })}</span>
        </div>

        {/* Asset header */}
        <div className="space-y-1.5">
          {label && (
            <p className="text-[11px] uppercase font-medium text-primary tracking-wider">
              {label}
            </p>
          )}
          <h1 className="text-2xl font-semibold text-foreground">{asset.name}</h1>
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {t(`assets.typeShort.${asset.assetType}`, { defaultValue: asset.assetType })}
            </span>
            <span>·</span>
            <span>{t(`assets.statuses.${asset.status}`, { defaultValue: asset.status })}</span>
            {asset.vendorName && (
              <>
                <span>·</span>
                <span>{asset.vendorName}</span>
              </>
            )}
          </div>
        </div>

        {/* Renewal callout */}
        <div
          className={`rounded-xl border p-5 ${
            overdue
              ? "border-destructive/30 bg-destructive/5"
              : days <= 14
                ? "border-warning/30 bg-warning/5"
                : "border-border bg-card"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase font-medium text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {t("publicShare.renewalDate")}
              </p>
              <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">
                {formatDate(asset.renewalDate)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {overdue
                  ? t("assetDetail.daysOverdue", { count: Math.abs(days) })
                  : t("publicShare.daysRemaining", { count: days })}
              </p>
            </div>
            {asset.priceAmount && (
              <div className="text-right">
                <p className="text-[11px] uppercase font-medium text-muted-foreground tracking-wider">
                  {t("publicShare.cost")}
                </p>
                <p className="text-xl font-semibold text-foreground mt-1 tabular-nums">
                  {asset.priceCurrency} {parseFloat(asset.priceAmount).toFixed(2)}
                </p>
                {asset.renewalIntervalValue && asset.renewalIntervalUnit && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("assetDetail.perInterval", {
                      value: asset.renewalIntervalValue,
                      unit: asset.renewalIntervalUnit.toLowerCase(),
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Type-specific subtype info — only public-safe fields */}
        {asset.domain && (
          <DetailCard title={t("publicShare.domainDetails")}>
            <Detail label={t("publicShare.domainName")} value={asset.domain.domainName} />
            <Detail label={t("publicShare.registrar")} value={asset.domain.registrar} />
            <Detail
              label={t("publicShare.autoRenew")}
              value={asset.domain.autoRenew ? t("common.yes") : t("common.no")}
            />
          </DetailCard>
        )}

        {asset.sslCertificate && (
          <DetailCard title={t("publicShare.sslDetails")}>
            <Detail label={t("publicShare.commonName")} value={asset.sslCertificate.commonName} />
            <Detail label={t("publicShare.issuer")} value={asset.sslCertificate.issuer} />
            <Detail
              label={t("publicShare.validTo")}
              value={asset.sslCertificate.validTo ? formatDate(asset.sslCertificate.validTo) : null}
            />
          </DetailCard>
        )}

        {asset.license && (
          <DetailCard title={t("publicShare.licenseDetails")}>
            <Detail label={t("publicShare.software")} value={asset.license.softwareName} />
            <Detail label={t("publicShare.licenseType")} value={asset.license.licenseType} />
            <Detail
              label={t("publicShare.seats")}
              value={asset.license.seatCount?.toString() ?? null}
            />
          </DetailCard>
        )}

        {asset.hostingService && (
          <DetailCard title={t("publicShare.hostingDetails")}>
            <Detail label={t("publicShare.provider")} value={asset.hostingService.provider} />
            <Detail label={t("publicShare.plan")} value={asset.hostingService.planName} />
          </DetailCard>
        )}

        {asset.cdnService && (
          <DetailCard title={t("publicShare.cdnDetails")}>
            <Detail label={t("publicShare.provider")} value={asset.cdnService.provider} />
            <Detail label={t("publicShare.plan")} value={asset.cdnService.planName} />
          </DetailCard>
        )}

        {asset.server && (
          <DetailCard title={t("publicShare.serverDetails")}>
            <Detail label={t("publicShare.provider")} value={asset.server.provider} />
            <Detail label={t("publicShare.hostname")} value={asset.server.hostname} />
            <Detail label={t("publicShare.region")} value={asset.server.region} />
          </DetailCard>
        )}

        {asset.notes && (
          <DetailCard title={t("publicShare.notes")}>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {asset.notes}
            </p>
          </DetailCard>
        )}

        {/* Footer disclaimer */}
        <div className="border border-border bg-muted/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("publicShare.disclaimer")}
          </p>
        </div>
      </main>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-[11px] uppercase font-medium text-muted-foreground tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="text-muted-foreground text-xs w-32 flex-shrink-0">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
