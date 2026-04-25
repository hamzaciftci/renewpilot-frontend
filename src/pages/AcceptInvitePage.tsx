import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Mail, CheckCircle2, XCircle, Clock, LogIn, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { invitationsApi, tokenStorage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getIntlLocale } from "@/i18n";

const ROLE_KEYS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString(getIntlLocale(), {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AcceptInvitePage() {
  const { t } = useTranslation();
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
      toast.success(t("auth.acceptInvite.acceptedToast"));
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    },
    onError: (e: any) => toast.error(e.message ?? t("auth.acceptInvite.acceptFailed")),
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
      const tm = setTimeout(() => accept.mutate(), 500);
      return () => clearTimeout(tm);
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
          <h1 className="text-lg font-semibold text-foreground mb-2">{t("auth.acceptInvite.notFound")}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t("auth.acceptInvite.notFoundDesc")}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t("auth.acceptInvite.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  const { status, email, role, expiresAt, organization, inviter } = invitation;

  if (status !== "PENDING") {
    const isAccepted = status === "ACCEPTED";
    const Icon = isAccepted ? CheckCircle2 : status === "EXPIRED" ? Clock : XCircle;
    const color = isAccepted ? "text-success" : status === "EXPIRED" ? "text-warning" : "text-destructive";
    const bg = isAccepted ? "bg-success/10" : status === "EXPIRED" ? "bg-warning/10" : "bg-destructive/10";
    const label =
      status === "ACCEPTED"
        ? t("auth.acceptInvite.alreadyAccepted")
        : status === "EXPIRED"
          ? t("auth.acceptInvite.expired")
          : t("auth.acceptInvite.cancelled");

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 max-w-md w-full text-center">
          <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">{label}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {organization?.name ? `"${organization.name}" — ` : ""}
            {status === "EXPIRED" && t("auth.acceptInvite.requestNew")}
            {status === "REVOKED" && t("auth.acceptInvite.adminCancelled")}
            {status === "ACCEPTED" && t("auth.acceptInvite.canSignIn")}
          </p>
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {isAuthenticated ? t("auth.acceptInvite.backToDashboard") : t("auth.acceptInvite.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  const roleLabel = ROLE_KEYS[role] ?? role;
  const emailMismatch = isAuthenticated && user && user.email.toLowerCase() !== email.toLowerCase();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-1">{t("auth.acceptInvite.teamInvite")}</h1>
          <p className="text-xs text-muted-foreground">{t("auth.acceptInvite.app")}</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-secondary/40 rounded-lg p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("auth.acceptInvite.org")}</span>
              <span className="font-medium text-foreground">{organization.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("auth.acceptInvite.role")}</span>
              <span className="font-mono font-semibold text-primary text-xs">{roleLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("auth.acceptInvite.invitee")}</span>
              <span className="font-mono text-foreground text-xs truncate max-w-[180px]" title={email}>{email}</span>
            </div>
            {inviter && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("auth.acceptInvite.invitedBy")}</span>
                <span className="text-foreground text-xs">{inviter.fullName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-1 border-t border-border">
              <span className="text-muted-foreground">{t("auth.acceptInvite.expiresLabel")}</span>
              <span className="text-foreground text-xs">{formatDateTime(expiresAt)}</span>
            </div>
          </div>
        </div>

        {emailMismatch && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4 flex gap-2.5">
            <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-xs text-foreground leading-relaxed">
              {t("auth.acceptInvite.wrongAccountWarning", { email, currentEmail: user?.email ?? "" })}
            </div>
          </div>
        )}

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
              {t("auth.acceptInvite.loginAndAccept")}
            </button>
            <p className="text-xs text-center text-muted-foreground mt-3 leading-relaxed">
              {t("auth.acceptInvite.noAccountNote", { email })}
            </p>
          </>
        )}

        {isAuthenticated && !emailMismatch && (
          <>
            {accept.isPending ? (
              <div className="text-center py-3 text-sm text-muted-foreground flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                {t("auth.acceptInvite.accepting")}
              </div>
            ) : accepted ? (
              <div className="text-center py-3 text-sm text-success flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {t("auth.acceptInvite.accepted")}
              </div>
            ) : (
              <button
                onClick={() => accept.mutate()}
                disabled={accept.isPending}
                className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {t("auth.acceptInvite.acceptInvite")}
              </button>
            )}
          </>
        )}

        {isAuthenticated && emailMismatch && (
          <button
            onClick={() => navigate("/login")}
            className="w-full border border-border text-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            {t("auth.acceptInvite.signOutAndBack")}
          </button>
        )}
      </div>
    </div>
  );
}
