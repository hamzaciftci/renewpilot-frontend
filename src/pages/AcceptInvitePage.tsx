import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Mail, CheckCircle2, XCircle, Clock, LogIn, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { invitationsApi, tokenStorage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Sahip",
  ADMIN: "Yönetici",
  MEMBER: "Üye",
  VIEWER: "Görüntüleyici",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => invitationsApi.getByToken(token!),
    enabled: !!token,
    retry: false,
  });

  const [accepted, setAccepted] = useState(false);

  const accept = useMutation({
    mutationFn: () => invitationsApi.accept(token!),
    onSuccess: (res) => {
      setAccepted(true);
      tokenStorage.setOrgId(res.organizationId);
      toast.success("Davet kabul edildi. Organizasyona yönlendiriliyorsunuz...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    },
    onError: (e: any) => toast.error(e.message ?? "Davet kabul edilemedi"),
  });

  // Auto-accept if email matches logged-in user
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      invitation &&
      invitation.status === "PENDING" &&
      user.email.toLowerCase() === invitation.email.toLowerCase() &&
      !accept.isPending &&
      !accepted
    ) {
      // Small delay for UX so the user sees the invite details before accept happens
      const t = setTimeout(() => accept.mutate(), 500);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, user, invitation, accepted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-destructive/30 rounded-xl p-6 md:p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Davet bulunamadı</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Bu davet bağlantısı geçersiz veya süresi dolmuş olabilir. Davet gönderen kişiden yeni bir davet isteyebilirsiniz.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Giriş sayfasına dön
          </button>
        </div>
      </div>
    );
  }

  const { status, email, role, expiresAt, organization, inviter } = invitation;

  // Non-pending states (expired/revoked/accepted)
  if (status !== "PENDING") {
    const isAccepted = status === "ACCEPTED";
    const Icon = isAccepted ? CheckCircle2 : status === "EXPIRED" ? Clock : XCircle;
    const color = isAccepted ? "text-success" : status === "EXPIRED" ? "text-warning" : "text-destructive";
    const bg = isAccepted ? "bg-success/10" : status === "EXPIRED" ? "bg-warning/10" : "bg-destructive/10";
    const label =
      status === "ACCEPTED"
        ? "Bu davet zaten kabul edilmiş"
        : status === "EXPIRED"
          ? "Davetin süresi dolmuş"
          : "Davet iptal edilmiş";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 max-w-md w-full text-center">
          <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">{label}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {organization?.name ? `"${organization.name}" davetiniz için ` : ""}
            {status === "EXPIRED" && "davet gönderen kişiden yeni bir davet isteyin."}
            {status === "REVOKED" && "davet yönetici tarafından iptal edilmiş."}
            {status === "ACCEPTED" && "giriş yapıp organizasyonu seçebilirsiniz."}
          </p>
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {isAuthenticated ? "Panele dön" : "Giriş yap"}
          </button>
        </div>
      </div>
    );
  }

  // PENDING: show invitation details + accept action
  const roleLabel = ROLE_LABEL[role] ?? role;
  const emailMismatch = isAuthenticated && user && user.email.toLowerCase() !== email.toLowerCase();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-1">Takım Daveti</h1>
          <p className="text-xs text-muted-foreground">RenewPilot</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-secondary/40 rounded-lg p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Organizasyon</span>
              <span className="font-medium text-foreground">{organization.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rol</span>
              <span className="font-mono font-semibold text-primary text-xs">{roleLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Davet edilen</span>
              <span className="font-mono text-foreground text-xs truncate max-w-[180px]" title={email}>{email}</span>
            </div>
            {inviter && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Davet eden</span>
                <span className="text-foreground text-xs">{inviter.fullName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-1 border-t border-border">
              <span className="text-muted-foreground">Son geçerlilik</span>
              <span className="text-foreground text-xs">{formatDate(expiresAt)}</span>
            </div>
          </div>
        </div>

        {/* Email mismatch warning */}
        {emailMismatch && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4 flex gap-2.5">
            <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-xs text-foreground leading-relaxed">
              Bu davet <strong>{email}</strong> adresine gönderilmiş ama şu anda <strong>{user?.email}</strong> olarak giriş yapmışsınız. Lütfen önce çıkış yapıp doğru hesapla giriş yapın.
            </div>
          </div>
        )}

        {/* Actions */}
        {!isAuthenticated && (
          <>
            <button
              onClick={() => {
                sessionStorage.setItem("postLoginRedirect", `/invite/${token}`);
                navigate("/login");
              }}
              className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Giriş yap ve daveti kabul et
            </button>
            <p className="text-xs text-center text-muted-foreground mt-3 leading-relaxed">
              Hesabınız yoksa önce <strong>{email}</strong> adresiyle kayıt olun, ardından bu bağlantıya geri dönün.
            </p>
          </>
        )}

        {isAuthenticated && !emailMismatch && (
          <>
            {accept.isPending ? (
              <div className="text-center py-3 text-sm text-muted-foreground flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Davet kabul ediliyor...
              </div>
            ) : accepted ? (
              <div className="text-center py-3 text-sm text-success flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Kabul edildi, yönlendiriliyor...
              </div>
            ) : (
              <button
                onClick={() => accept.mutate()}
                disabled={accept.isPending}
                className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Daveti Kabul Et
              </button>
            )}
          </>
        )}

        {isAuthenticated && emailMismatch && (
          <button
            onClick={() => navigate("/login")}
            className="w-full border border-border text-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            Çıkış yap ve tekrar giriş yap
          </button>
        )}
      </div>
    </div>
  );
}
