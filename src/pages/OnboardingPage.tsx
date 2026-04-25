import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const CURRENCIES = ["USD", "EUR", "GBP", "TRY"];

export default function OnboardingPage() {
  const { t } = useTranslation();
  const { user, needsOnboarding, createOrg, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [timezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !needsOnboarding) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, needsOnboarding, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createOrg({ name: name.trim(), timezone, currency });
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errors?: string[] };
      const msg =
        errorObj?.errors?.join(" ") ??
        errorObj?.message ??
        t("auth.onboarding.createFailed");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-primary-foreground" strokeWidth={2} />
          </div>
          <span className="font-semibold text-[17px] text-foreground tracking-tight">
            RenewPilot
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          <h1 className="text-lg font-semibold text-foreground mb-1">
            {t("auth.onboarding.title")}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t("auth.onboarding.subtitle", { name: user?.fullName?.split(" ")[0] ?? "👋" })}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                {t("auth.onboarding.orgName")}
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.onboarding.orgNamePlaceholder")}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  {t("auth.onboarding.currency")}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  {t("auth.onboarding.timezone")}
                </label>
                <input
                  type="text"
                  value={timezone}
                  readOnly
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-secondary text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50"
            >
              {submitting ? t("auth.onboarding.creating") : t("auth.onboarding.createOrg")}
            </button>
          </form>
        </div>

        <button
          onClick={() => logout().then(() => navigate("/login", { replace: true }))}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-3 h-3" strokeWidth={1.5} />
          {t("auth.onboarding.logout")}
        </button>
      </div>
    </div>
  );
}
