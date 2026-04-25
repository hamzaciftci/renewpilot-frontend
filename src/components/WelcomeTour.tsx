import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Bell,
  PiggyBank,
  Globe,
  ShieldCheck,
  Server,
  Key,
  CreditCard,
  Sparkles,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { AssetType } from "@/types";

const STORAGE_PREFIX = "rp_welcome_tour_done_";

type PurposeKey = "domain" | "ssl" | "server" | "license" | "card" | "other";

interface PurposeDef {
  key: PurposeKey;
  icon: typeof Globe;
  iconColor: string;
  assetType: AssetType | null; // null = let user pick (CUSTOM starting point)
}

const PURPOSES: PurposeDef[] = [
  { key: "domain", icon: Globe, iconColor: "text-primary", assetType: "DOMAIN" },
  { key: "ssl", icon: ShieldCheck, iconColor: "text-success", assetType: "SSL_CERTIFICATE" },
  { key: "server", icon: Server, iconColor: "text-info", assetType: "SERVER" },
  { key: "license", icon: Key, iconColor: "text-warning", assetType: "LICENSE" },
  { key: "card", icon: CreditCard, iconColor: "text-warning", assetType: "CREDIT_CARD" },
  { key: "other", icon: Plus, iconColor: "text-muted-foreground", assetType: null },
];

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/** Public helper so other entry points (e.g. logout) could clear the flag if ever needed. */
export function hasSeenWelcomeTour(userId: string): boolean {
  try {
    return localStorage.getItem(getStorageKey(userId)) === "1";
  } catch {
    return true;
  }
}

export function markWelcomeTourSeen(userId: string) {
  try {
    localStorage.setItem(getStorageKey(userId), "1");
  } catch {
    /* ignore (e.g. private mode) */
  }
}

export function WelcomeTour() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, needsOnboarding } = useAuth();
  const [step, setStep] = useState<0 | 1>(0);
  const [open, setOpen] = useState(false);

  // Decide whether to show the tour: authenticated + has org + never seen before.
  useEffect(() => {
    if (!isAuthenticated || !user || needsOnboarding) {
      setOpen(false);
      return;
    }
    if (hasSeenWelcomeTour(user.id)) {
      setOpen(false);
      return;
    }
    // Small delay so the dashboard renders first — feels less jarring.
    const t = setTimeout(() => setOpen(true), 350);
    return () => clearTimeout(t);
  }, [isAuthenticated, user, needsOnboarding]);

  // Allow other parts of the app (e.g. onboarding checklist) to re-open the
  // tour by firing a window event. We reset to step 0 each time.
  useEffect(() => {
    if (!user) return;
    const handler = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("rp:reopen-welcome-tour", handler);
    return () => window.removeEventListener("rp:reopen-welcome-tour", handler);
  }, [user]);

  // Lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => {
    if (user) markWelcomeTourSeen(user.id);
    setOpen(false);
  };

  const pickPurpose = (p: PurposeDef) => {
    if (user) markWelcomeTourSeen(user.id);
    setOpen(false);
    if (p.assetType) {
      navigate(`/assets/new?type=${p.assetType}`);
    } else {
      navigate(`/assets/new`);
    }
  };

  if (!open || !user) return null;

  const totalSteps = 2;
  const firstName = user.fullName?.trim().split(/\s+/)[0] ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-tour-title"
    >
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button (top-right) */}
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={t("welcomeTour.close")}
          aria-label={t("welcomeTour.close")}
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Progress bar */}
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-10">
          {/* Step indicator */}
          <p className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t("welcomeTour.stepIndicator", { current: step + 1, total: totalSteps })}
          </p>

          {step === 0 && (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 id="welcome-tour-title" className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
                    {t("welcomeTour.welcomeTitle", { name: firstName })}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {t("welcomeTour.welcomeSubtitle")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                {[
                  { icon: CheckCircle2, color: "text-success", titleKey: "feature1Title", descKey: "feature1Desc" },
                  { icon: Bell, color: "text-warning", titleKey: "feature2Title", descKey: "feature2Desc" },
                  { icon: PiggyBank, color: "text-primary", titleKey: "feature3Title", descKey: "feature3Desc" },
                ].map((f) => (
                  <div
                    key={f.titleKey}
                    className="bg-secondary/40 border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                  >
                    <f.icon className={`w-5 h-5 ${f.color} mb-2`} strokeWidth={1.8} />
                    <p className="text-sm font-semibold text-foreground">
                      {t(`welcomeTour.${f.titleKey}`)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {t(`welcomeTour.${f.descKey}`)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={close}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("welcomeTour.skip")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                >
                  {t("welcomeTour.next")}
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
                  {t("welcomeTour.purposeTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {t("welcomeTour.purposeSubtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PURPOSES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => pickPurpose(p)}
                    className="group text-left bg-secondary/30 hover:bg-secondary/60 border border-border hover:border-primary/50 rounded-xl p-4 transition-all flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0 group-hover:border-primary/40 transition-colors">
                      <p.icon className={`w-4 h-4 ${p.iconColor}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {t(`welcomeTour.purposes.${p.key}.title`)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {t(`welcomeTour.purposes.${p.key}.desc`)}
                      </p>
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5"
                      strokeWidth={1.8}
                    />
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                  {t("welcomeTour.back")}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                >
                  {t("welcomeTour.exploreSelf")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
