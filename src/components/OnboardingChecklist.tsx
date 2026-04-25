import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Plus,
  User as UserIcon,
  Bell,
  UserPlus,
  PlayCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAssets } from "@/hooks/useAssets";
import { useTeamMembers } from "@/hooks/useOrganization";

// ─── Storage ─────────────────────────────────────────────────────────────────

const DISMISS_PREFIX = "rp_checklist_dismissed_";
const COLLAPSE_PREFIX = "rp_checklist_collapsed_";

function storageGet(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function storageSet(key: string, value: boolean) {
  try {
    if (value) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function isChecklistDismissed(userId: string): boolean {
  return storageGet(`${DISMISS_PREFIX}${userId}`);
}
export function dismissChecklist(userId: string) {
  storageSet(`${DISMISS_PREFIX}${userId}`, true);
}
export function resetChecklist(userId: string) {
  storageSet(`${DISMISS_PREFIX}${userId}`, false);
  storageSet(`${COLLAPSE_PREFIX}${userId}`, false);
}

// ─── Component ───────────────────────────────────────────────────────────────

type StepKey = "asset" | "profile" | "team" | "reminders" | "tour";

interface Step {
  key: StepKey;
  icon: typeof Plus;
  done: boolean;
  href?: string;
  action?: () => void;
}

export function OnboardingChecklist() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: assets = [] } = useAssets();
  const { data: team = [] } = useTeamMembers();

  const userId = user?.id;
  const [dismissed, setDismissed] = useState<boolean>(() =>
    userId ? isChecklistDismissed(userId) : false,
  );
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    userId ? storageGet(`${COLLAPSE_PREFIX}${userId}`) : false,
  );
  // Force-bump key to re-trigger the welcome tour without a full reload.
  const [, setTourBump] = useState(0);

  const steps: Step[] = useMemo(() => {
    const profileComplete =
      Boolean(user?.avatarUrl) || Boolean(user?.phoneNumber);
    return [
      {
        key: "asset",
        icon: Plus,
        done: assets.length > 0,
        href: "/assets/new",
      },
      {
        key: "profile",
        icon: UserIcon,
        done: profileComplete,
        href: "/settings",
      },
      {
        key: "reminders",
        icon: Bell,
        done: assets.length > 0, // once they have an asset the default policy applies
        href: "/settings",
      },
      {
        key: "team",
        icon: UserPlus,
        done: team.length > 1,
        href: "/team",
      },
      {
        key: "tour",
        icon: PlayCircle,
        done: false,
        action: () => {
          if (userId) {
            // Clear the "seen" flag so WelcomeTour renders again.
            try {
              localStorage.removeItem(`rp_welcome_tour_done_${userId}`);
            } catch {
              /* ignore */
            }
            setTourBump((n) => n + 1);
            // Force WelcomeTour to re-check by dispatching a small event.
            window.dispatchEvent(new Event("rp:reopen-welcome-tour"));
          }
        },
      },
    ];
  }, [assets.length, team.length, user, userId]);

  if (!user) return null;
  if (dismissed) return null;

  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  // Auto-hide when everything is completed
  if (doneCount === total) return null;

  const pct = Math.round((doneCount / total) * 100);

  const handleDismiss = () => {
    if (userId) dismissChecklist(userId);
    setDismissed(true);
  };

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (userId) storageSet(`${COLLAPSE_PREFIX}${userId}`, next);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-5 py-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {t("onboardingChecklist.title")}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("onboardingChecklist.progress", { done: doneCount, total })} · {pct}%
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={collapsed ? t("onboardingChecklist.expand") : t("onboardingChecklist.collapse")}
            aria-label={collapsed ? t("onboardingChecklist.expand") : t("onboardingChecklist.collapse")}
          >
            {collapsed ? (
              <ChevronDown className="w-4 h-4" strokeWidth={2} />
            ) : (
              <ChevronUp className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={t("onboardingChecklist.dismiss")}
            aria-label={t("onboardingChecklist.dismiss")}
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      {!collapsed && (
        <ul className="divide-y divide-border">
          {steps.map((step) => {
            const commonInner = (
              <>
                <span className="flex-shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={2} />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium leading-tight ${
                      step.done ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {t(`onboardingChecklist.steps.${step.key}.title`)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t(`onboardingChecklist.steps.${step.key}.desc`)}
                  </p>
                </div>
                {!step.done && (
                  <span className="flex-shrink-0 text-xs font-medium text-primary">
                    {t(`onboardingChecklist.steps.${step.key}.cta`)} →
                  </span>
                )}
              </>
            );

            const className =
              "w-full text-left flex items-center gap-3 px-4 md:px-5 py-3 hover:bg-secondary/40 transition-colors";

            if (step.action) {
              return (
                <li key={step.key}>
                  <button type="button" onClick={step.action} className={className}>
                    {commonInner}
                  </button>
                </li>
              );
            }
            return (
              <li key={step.key}>
                <Link to={step.href ?? "#"} className={className}>
                  {commonInner}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
