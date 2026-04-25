import { Check, Lock, ExternalLink, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { billingApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/date";
import type { Plan } from "@/types";

const SALES_EMAIL = "sales@renewpilot.app";

export default function BillingPage() {
  const { t } = useTranslation();
  const { orgId, membership } = useAuth();
  const orgName = membership?.organization.name;

  const makeContactMailto = (planName: string) => {
    const subject = t("billing.contactSubject", { plan: planName });
    const greeting = t("billing.contactGreeting");
    const body = t("billing.contactBody", { plan: planName, org: orgName ?? "" });
    const thanks = t("billing.contactThanks");
    const fullBody = `${greeting}\n\n${body}\n\n${thanks}`;
    return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
  };

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["billing-plans", orgId],
    queryFn: () => billingApi.getPlans(orgId!),
    enabled: !!orgId,
  });

  const { data: subscription } = useQuery({
    queryKey: ["billing-subscription", orgId],
    queryFn: () => billingApi.getSubscription(orgId!),
    enabled: !!orgId,
  });

  const currentPlanCode = subscription?.plan?.code ?? "FREE";
  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";

  const displayPlans: Plan[] = plans.length > 0 ? plans : [
    { id: "free", code: "FREE", name: "Free", monthlyPrice: "0", yearlyPrice: "0", currency: "USD", maxAssets: 10, maxTeamMembers: 1, channels: ["EMAIL"], features: [], isActive: true },
    { id: "pro", code: "PRO", name: "Pro", monthlyPrice: "19", yearlyPrice: "190", currency: "USD", maxAssets: 100, maxTeamMembers: 3, channels: ["EMAIL", "PUSH"], features: [], isActive: true },
    { id: "agency", code: "AGENCY", name: "Agency", monthlyPrice: "49", yearlyPrice: "490", currency: "USD", maxAssets: 1000, maxTeamMembers: 20, channels: ["EMAIL", "PUSH", "SMS", "WHATSAPP"], features: [], isActive: true },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Current Plan */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {subscription?.plan?.name ?? t("billing.freePlan")}
            </h2>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-success" : "bg-warning"}`} />
              <span className={`text-xs font-medium ${isActive ? "text-success" : "text-warning"}`}>
                {isActive ? t("billing.active") : subscription?.status ?? "—"}
              </span>
            </span>
          </div>
          {subscription ? (
            <p className="text-sm text-muted-foreground mt-0.5">
              {subscription.cancelAtPeriodEnd
                ? t("billing.expiresAt", { date: formatDate(subscription.currentPeriodEnd) })
                : t("billing.renewsAt", { date: formatDate(subscription.currentPeriodEnd) })}
              {" · "}
              {t("billing.priceMonthly", { price: parseFloat(subscription.plan.monthlyPrice).toFixed(2) })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">{t("billing.noActiveSubscription")}</p>
          )}
        </div>
        {currentPlanCode !== "ENTERPRISE" && (
          <a
            href={makeContactMailto(t("billing.upperPlanLabel"))}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 inline-flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            {t("billing.upgradePlan")}
          </a>
        )}
      </div>

      {/* Plans */}
      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayPlans.map((plan) => {
            const isCurrent = plan.code === currentPlanCode;
            const localFeatures = t(`billing.planFeatures.${plan.code}`, { returnObjects: true, defaultValue: [] as string[] }) as string[];
            const features = Array.isArray(localFeatures) && localFeatures.length > 0 ? localFeatures : plan.features;
            return (
              <div key={plan.id} className={`bg-card rounded-xl p-6 border ${isCurrent ? "border-primary" : "border-border"}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  {isCurrent && <span className="text-[10px] font-mono font-semibold text-primary">{t("billing.current")}</span>}
                </div>
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  ${parseFloat(plan.monthlyPrice).toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground">{t("billing.monthSuffix")}</span>
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-success flex-shrink-0" strokeWidth={2} />
                    {plan.maxAssets >= 999999 ? t("billing.unlimited") : plan.maxAssets} {t("billing.assets")}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-success flex-shrink-0" strokeWidth={2} />
                    {plan.maxTeamMembers >= 999999 ? t("billing.unlimited") : plan.maxTeamMembers} {t("billing.members")}
                  </li>
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-success flex-shrink-0" strokeWidth={2} /> {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && (
                  <a
                    href={makeContactMailto(plan.name)}
                    className="mt-6 w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {parseFloat(plan.monthlyPrice) > parseFloat(subscription?.plan?.monthlyPrice ?? "0") ? t("billing.upgrade") : t("billing.downgrade")}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Channels available in plan */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">{t("billing.notificationChannels")}</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {(["EMAIL", "PUSH", "SMS", "WHATSAPP"] as const).map((ch) => {
            const planChannels = subscription?.plan?.channels ?? ["EMAIL"];
            const available = planChannels.includes(ch);
            return (
              <span key={ch} className={`flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2 py-1 rounded ${available ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                {!available && <Lock className="w-3 h-3" />}
                {ch}
              </span>
            );
          })}
        </div>
        {currentPlanCode === "FREE" && (
          <p className="text-xs text-muted-foreground mt-2">{t("billing.smsProOnly")}</p>
        )}
      </div>

      {/* Invoices placeholder */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{t("billing.paymentHistory")}</h3>
          <a
            href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(t("billing.invoiceSubject"))}`}
            className="text-xs text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors duration-150"
          >
            <ExternalLink className="w-3 h-3" /> {t("billing.requestInvoice")}
          </a>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("billing.invoiceEmailContact")}{" "}
            <a href={`mailto:${SALES_EMAIL}`} className="text-primary hover:underline">{SALES_EMAIL}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
