import { useState } from "react";
import { Plus, Trash2, Shield, Mail, RefreshCw, Copy, Check, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { invitationsApi, orgsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers } from "@/hooks/useOrganization";
import { initials } from "@/lib/date";
import { getIntlLocale } from "@/i18n";
import type { MemberRole } from "@/types";

const roleColors: Record<MemberRole, string> = {
  OWNER: "text-primary",
  ADMIN: "text-warning",
  MEMBER: "text-muted-foreground",
  VIEWER: "text-muted-foreground",
};

const ROLES: MemberRole[] = ["ADMIN", "MEMBER", "VIEWER"];

export default function TeamPage() {
  const { t } = useTranslation();
  const { orgId, membership } = useAuth();
  const qc = useQueryClient();
  const { data: members = [], isLoading: membersLoading } = useTeamMembers();

  const canManage = membership?.role === "OWNER" || membership?.role === "ADMIN";

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ["invitations", orgId],
    queryFn: () => invitationsApi.list(orgId!),
    enabled: !!orgId && canManage,
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [showInvite, setShowInvite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString(getIntlLocale(), { year: "numeric", month: "short", day: "numeric" });

  const statusBadge = (status: string): { bg: string; text: string; label: string } => {
    switch (status) {
      case "PENDING":
        return { bg: "bg-warning/10", text: "text-warning", label: t("team.statusBadges.PENDING") };
      case "ACCEPTED":
        return { bg: "bg-success/10", text: "text-success", label: t("team.statusBadges.ACCEPTED") };
      case "REVOKED":
        return { bg: "bg-muted/40", text: "text-muted-foreground", label: t("team.statusBadges.REVOKED") };
      case "EXPIRED":
        return { bg: "bg-destructive/10", text: "text-destructive", label: t("team.statusBadges.EXPIRED") };
      default:
        return { bg: "bg-muted/40", text: "text-muted-foreground", label: status };
    }
  };

  const createInvite = useMutation({
    mutationFn: () => invitationsApi.create(orgId!, { email: inviteEmail.trim(), role: inviteRole }),
    onSuccess: (inv) => {
      toast.success(t("team.inviteSent", { email: inv.email }));
      setInviteEmail("");
      setShowInvite(false);
      qc.invalidateQueries({ queryKey: ["invitations", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? t("team.inviteFailed")),
  });

  const revokeInvite = useMutation({
    mutationFn: (invitationId: string) => invitationsApi.revoke(orgId!, invitationId),
    onSuccess: () => {
      toast.success(t("team.inviteCancelled"));
      qc.invalidateQueries({ queryKey: ["invitations", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? t("team.cancelFailed")),
  });

  const resendInvite = useMutation({
    mutationFn: (invitationId: string) => invitationsApi.resend(orgId!, invitationId),
    onSuccess: () => {
      toast.success(t("team.inviteResent"));
      qc.invalidateQueries({ queryKey: ["invitations", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? t("team.resendFailed")),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => orgsApi.removeMember(orgId!, userId),
    onSuccess: () => {
      toast.success(t("team.memberRemoved"));
      qc.invalidateQueries({ queryKey: ["team", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? t("team.memberRemoveFailed")),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      orgsApi.updateMemberRole(orgId!, userId, role),
    onSuccess: () => {
      toast.success(t("team.roleUpdated"));
      qc.invalidateQueries({ queryKey: ["team", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? t("team.roleUpdateFailed")),
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error(t("team.emailRequired"));
      return;
    }
    createInvite.mutate();
  };

  const copyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success(t("team.inviteCopied"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error(t("team.copyFailed"));
    }
  };

  const pendingInvites = invitations.filter((inv) => inv.status === "PENDING");
  const pastInvites = invitations.filter((inv) => inv.status !== "PENDING");

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t("team.title")}</h2>
        {canManage && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="bg-primary text-primary-foreground px-3 md:px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("team.invite")}</span>
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInvite && canManage && (
        <div className="bg-card border border-primary/30 rounded-xl p-4 md:p-5 space-y-4">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            {t("team.newInviteTitle")}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder={t("team.emailPlaceholder2")}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              className="border border-border rounded-lg px-4 py-2 text-sm flex-1 bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as MemberRole)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-secondary text-foreground focus:outline-none focus:border-primary"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              onClick={handleInvite}
              disabled={createInvite.isPending}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 whitespace-nowrap disabled:opacity-50"
            >
              {createInvite.isPending ? t("team.sending") : t("team.invite")}
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border transition-colors duration-150"
            >
              {t("team.cancel")}
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("team.inviteHelp")}
          </p>
        </div>
      )}

      {/* Pending Invitations */}
      {canManage && pendingInvites.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-medium text-foreground">{t("team.pendingInvites", { count: pendingInvites.length })}</h3>
          </div>
          <div className="divide-y divide-border">
            {pendingInvites.map((inv) => {
              const badge = statusBadge(inv.status);
              return (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-primary">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span className={`font-mono font-semibold ${roleColors[inv.role]}`}>{inv.role}</span>
                        <span>·</span>
                        <span>{t("team.expiresLabel", { date: formatDate(inv.expiresAt) })}</span>
                        <span className={`${badge.bg} ${badge.text} px-1.5 py-0.5 rounded font-medium`}>{badge.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {inv.acceptUrl && (
                      <button
                        onClick={() => copyLink(inv.acceptUrl!, inv.id)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-secondary"
                        title={t("team.copyLinkTitle")}
                      >
                        {copiedId === inv.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" strokeWidth={1.5} />}
                      </button>
                    )}
                    <button
                      onClick={() => resendInvite.mutate(inv.id)}
                      disabled={resendInvite.isPending}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded hover:bg-secondary"
                      title={t("team.resendTitle")}
                    >
                      <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => revokeInvite.mutate(inv.id)}
                      disabled={revokeInvite.isPending}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-secondary"
                      title={t("team.revokeTitle")}
                    >
                      <XCircle className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">{t("team.activeMembers", { count: members.length })}</h3>
        </div>
        {membersLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-secondary rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("team.table.member")}</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("team.table.email")}</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("team.table.role")}</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("team.table.status")}</th>
                    {canManage && (
                      <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-right">{t("team.table.actions")}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors duration-150 h-[52px]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold text-foreground">
                            {initials(m.user.fullName)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{m.user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground font-mono">{m.user.email}</td>
                      <td className="px-5 py-3">
                        {canManage && m.role !== "OWNER" ? (
                          <select
                            value={m.role}
                            onChange={(e) => updateRole.mutate({ userId: m.user.id, role: e.target.value })}
                            className={`text-[10px] font-mono font-semibold bg-transparent border-0 focus:outline-none cursor-pointer ${roleColors[m.role]}`}
                          >
                            <option value="OWNER" disabled>OWNER</option>
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span className={`text-[10px] font-mono font-semibold ${roleColors[m.role]}`}>{m.role}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${m.user.status === "ACTIVE" ? "bg-success" : "bg-muted-foreground"}`} />
                          <span className={`text-xs ${m.user.status === "ACTIVE" ? "text-success" : "text-muted-foreground"}`}>
                            {m.user.status === "ACTIVE" ? t("team.active") : m.user.status}
                          </span>
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-5 py-3 text-right">
                          {m.role !== "OWNER" && (
                            <button
                              onClick={() => removeMember.mutate(m.user.id)}
                              disabled={removeMember.isPending}
                              className="text-muted-foreground hover:text-destructive transition-colors duration-150"
                              title={t("team.removeMemberTitle")}
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground flex-shrink-0">
                      {initials(m.user.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.user.fullName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{m.user.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-mono font-semibold ${roleColors[m.role]}`}>{m.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${m.user.status === "ACTIVE" ? "bg-success" : "bg-muted-foreground"}`} />
                      <span className={`text-xs ${m.user.status === "ACTIVE" ? "text-success" : "text-muted-foreground"}`}>
                        {m.user.status === "ACTIVE" ? t("team.active") : m.user.status}
                      </span>
                    </span>
                    {canManage && m.role !== "OWNER" && (
                      <button
                        onClick={() => removeMember.mutate(m.user.id)}
                        disabled={removeMember.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors duration-150"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Past Invitations */}
      {canManage && !invitationsLoading && pastInvites.length > 0 && (
        <details className="bg-card border border-border rounded-xl overflow-hidden">
          <summary className="px-5 py-3 cursor-pointer text-sm text-muted-foreground hover:bg-secondary/30 transition-colors">
            {t("team.pastInvites", { count: pastInvites.length })}
          </summary>
          <div className="divide-y divide-border border-t border-border">
            {pastInvites.slice(0, 20).map((inv) => {
              const badge = statusBadge(inv.status);
              return (
                <div key={inv.id} className="px-5 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-muted-foreground font-mono truncate">{inv.email}</span>
                    <span className={`text-[10px] font-mono font-semibold ${roleColors[inv.role]}`}>{inv.role}</span>
                  </div>
                  <span className={`${badge.bg} ${badge.text} text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap`}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Info Banner */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">{t("team.roleDescriptions")}</p>
          <p
            className="text-xs text-muted-foreground mt-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t("team.roleDescriptionsText") }}
          />
        </div>
      </div>
    </div>
  );
}
