import { useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";

const members = [
  { name: "Hamza Yılmaz", email: "hamza@agency.com", role: "OWNER", assets: 58, status: "Active", initials: "HY" },
  { name: "Ayşe Kaya", email: "ayse@agency.com", role: "ADMIN", assets: 43, status: "Active", initials: "AK" },
  { name: "Can Demir", email: "can@agency.com", role: "MEMBER", assets: 22, status: "Active", initials: "CD" },
];

const roleColors: Record<string, string> = {
  OWNER: "text-primary",
  ADMIN: "text-warning",
  MEMBER: "text-muted-foreground",
};

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
        <button className="bg-primary text-primary-foreground px-3 md:px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Invite Member</span>
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Member</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Email</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Role</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Assets</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors duration-150 h-[52px]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold text-foreground">{m.initials}</div>
                      <span className="text-sm font-medium text-foreground">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground font-mono">{m.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-mono font-semibold ${roleColors[m.role]}`}>{m.role}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-foreground tabular-nums">{m.assets} assets</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span className="text-xs text-success">{m.status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                      <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {members.map((m) => (
            <div key={m.email} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground flex-shrink-0">
                  {m.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-mono font-semibold ${roleColors[m.role]}`}>{m.role}</span>
                    <span className="text-[10px] text-muted-foreground">· {m.assets} assets</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="text-xs text-success">{m.status}</span>
                </span>
                <button className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                  <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Banner */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Invite your team members to collaborate on renewals.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Agency plan supports up to 20 members.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="email"
            placeholder="colleague@agency.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="border border-border rounded-lg px-4 py-2 text-sm flex-1 sm:w-52 bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
          />
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150 whitespace-nowrap flex-shrink-0">
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}
