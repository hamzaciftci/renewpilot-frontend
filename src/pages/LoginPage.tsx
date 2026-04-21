import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const redirect = sessionStorage.getItem("postLoginRedirect");
      if (redirect) {
        sessionStorage.removeItem("postLoginRedirect");
        navigate(redirect, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Geçersiz e-posta veya şifre";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-primary-foreground" strokeWidth={2} />
          </div>
          <span className="font-semibold text-[17px] text-foreground tracking-tight">
            RenewPilot
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          <h1 className="text-lg font-semibold text-foreground mb-1">Giriş Yap</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Hoş geldiniz — varlıklarınızı yönetelim.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siz@ornek.com"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Hesabınız yok mu?{" "}
          <a href="#" className="text-primary hover:underline">
            Yöneticinizle iletişime geçin
          </a>
        </p>
      </div>
    </div>
  );
}
