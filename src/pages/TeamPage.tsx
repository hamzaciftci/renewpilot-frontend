import { useState } from "react";
import { Plus, MoreHorizontal, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orgsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers } from "@/hooks/useOrganization";
import { initials } from "@/lib/date";
import type { MemberRole } from "@/types";

const roleColors: Record<MemberRole, string> = {
  OWNER: "text-primary",
  ADMIN: "text-warning",
  MEMBER: "text-muted-foreground",
  VIEWER: "text-muted-foreground",
};

const ROLES: MemberRole[] = ["ADMIN", "MEMBER", "VIEWER"];

export default function TeamPage() {
  const { orgId, membership } = useAuth();
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useTeamMembers();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("MEMBER");
  const [showInvite, setShowInvite] = useState(false);

  const canManage = membership?.role === "OWNER" || membership?.role === "ADMIN";

  const inviteMember = useMutation({
    mutationFn: () => orgsApi.inviteMember(orgId!, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      toast.success(`${inviteEmail} takıma eklendi`);
      setInviteEmail("");
      setShowInvite(false);
      qc.invalidateQueries({ queryKey: ["team", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Davet gönderilemedi"),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => orgsApi.removeMember(orgId!, userId),
    onSuccess: () => {
      toast.success("Üye kaldırıldı");
      qc.invalidateQueries({ queryKey: ["team", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Üye kaldırılamadı"),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      orgsApi.updateMemberRole(orgId!, userId, role),
    onSuccess: () => {
      toast.success("Rol güncellendi");
      qc.invalidateQueries({ queryKey: ["team", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Rol güncellenemedi"),
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) { toast.error("E-posta adresi gerekli"); return; }
    inviteMember.mutate();
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Takım Üyeleri</h2>
        {canManage && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="bg-primary text-primary-foreground px-3 md:px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Üye Ekle</span>
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInvite && canManage && (
        <div className="bg-card border border-primary/30 rounded-xl p-4 md:p-5 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Yeni Üye Ekle</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="ortak@sirket.com"
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
              disabled={inviteMember.isPending}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 whitespace-nowrap disabled:opacity-50"
            >
              {inviteMember.isPending ? "Ekleniyor..." : "Ekle"}
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border transition-colors duration-150"
            >
              İptal
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Kullanıcının hesabı olması gerekiyor. Hesap yoksa önce kayıt olması gerekir.
          </p>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
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
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Üye</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">E-posta</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Rol</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Durum</th>
                    {canManage && (
                      <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-right">İşlemler</th>
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
                            {m.user.status === "ACTIVE" ? "Aktif" : m.user.status}
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
                              title="Üyeyi kaldır"
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
                        {m.user.status === "ACTIVE" ? "Aktif" : m.user.status}
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

      {/* Info Banner */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Rol Açıklamaları</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            <strong>OWNER</strong> — Tam yetki, silinemez · <strong>ADMIN</strong> — Üye yönetimi ve org ayarları · <strong>MEMBER</strong> — Varlık ekleyebilir/düzenleyebilir · <strong>VIEWER</strong> — Yalnızca görüntüleme
          </p>
        </div>
      </div>
    </div>
  );
}
