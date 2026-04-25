import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("auth.register.passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      await register({ email, password, fullName, timezone });
      navigate("/onboarding", { replace: true });
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errors?: string[] };
      const msg =
        errorObj?.errors?.join(" ") ??
        errorObj?.message ??
        t("auth.register.createFailed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-primary-foreground" strokeWidth={2} />
          </div>
          <span className="font-semibold text-[17px] text-foreground tracking-tight">
            RenewPilot
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          <h1 className="text-lg font-semibold text-foreground mb-1">{t("auth.register.title")}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t("auth.register.subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                {t("auth.register.fullName")}
              </label>
              <input
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("auth.register.fullNamePlaceholder")}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                {t("auth.register.email")}
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.register.emailPlaceholder")}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                {t("auth.register.password")}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.register.passwordPlaceholder")}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? t("auth.register.creating") : t("auth.register.createAccount")}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {t("auth.register.hasAccount")}{" "}
          <Link to="/login" className="text-primary hover:underline">
            {t("auth.register.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
