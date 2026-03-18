import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const details = {
  name: "clientsite.com",
  type: "DOMAIN",
  status: "EXPIRING SOON",
  vendor: "GoDaddy",
  project: "Acme Corp Website",
  renewalDate: "March 18, 2026",
  daysRemaining: 2,
  price: "$14.99",
  interval: "year",
  autoRenew: false,
  assignedTo: "Hamza Yılmaz",
  notes: "Primary domain for client. Renew before campaign launch.",
  created: "Jan 12, 2025",
};

const timeline = [
  { date: "Mar 16, 2026", text: "Reminder sent (email + push)", type: "reminder" },
  { date: "Jan 12, 2025", text: "Created in RenewPilot", type: "created" },
  { date: "Mar 18, 2025", text: "Renewed by Hamza Yılmaz — $14.99", type: "renewed" },
  { date: "Mar 18, 2024", text: "First tracked renewal", type: "renewed" },
];

const typeColors: Record<string, string> = {
  DOMAIN: "text-primary",
  SSL: "text-info",
  SERVER: "text-info",
  LICENSE: "text-warning",
};

export default function AssetDetailPage() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/assets" className="hover:text-foreground transition-colors duration-150">Assets</Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <span className="text-foreground font-medium truncate">{details.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <h1 className="text-xl font-semibold text-foreground">{details.name}</h1>
          <span className={`text-[10px] font-mono font-semibold uppercase ${typeColors[details.type] || "text-muted-foreground"}`}>
            {details.type}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span className="text-xs text-warning font-medium">{details.status}</span>
          </span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="text-sm font-medium text-success hover:bg-success/10 px-3 md:px-4 py-2 rounded-lg border border-border transition-colors duration-150 flex-1 sm:flex-none">
            Mark Renewed
          </button>
          <button className="text-sm font-medium text-foreground hover:bg-secondary px-3 md:px-4 py-2 rounded-lg border border-border transition-colors duration-150 flex-1 sm:flex-none">
            Edit Asset
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 border-b border-border">
              <div className="p-4 md:p-6 border-r border-border">
                <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">Days Remaining</label>
                <p className="text-4xl md:text-5xl font-bold text-destructive mt-1 tabular-nums">
                  {String(details.daysRemaining).padStart(2, "0")}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Due {details.renewalDate}</p>
              </div>
              <div className="p-4 md:p-6">
                <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">Annual Price</label>
                <p className="text-3xl md:text-4xl font-bold text-foreground mt-1 tabular-nums">{details.price}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">USD per {details.interval}</p>
              </div>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-2 gap-y-4 md:gap-y-5">
              {[["Vendor", details.vendor], ["Project", details.project]].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
                  <p className="text-sm text-foreground mt-0.5">{value}</p>
                </div>
              ))}
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Assigned To</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-secondary text-[9px] flex items-center justify-center font-semibold text-foreground">HY</div>
                  <p className="text-sm text-foreground">{details.assignedTo}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Auto-Renew</p>
                <span className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-xs text-destructive font-medium">Disabled</span>
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] text-muted-foreground font-medium">Notes</p>
                <p className="text-sm text-foreground/80 mt-0.5">{details.notes}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Created</p>
                <p className="text-sm text-foreground font-mono">{details.created}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Renewal History</h3>
            <div className="space-y-0">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                      event.type === "renewed" ? "bg-success" :
                      event.type === "reminder" ? "bg-warning" :
                      "bg-primary"
                    }`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-border min-h-[28px]" />}
                  </div>
                  <div className="pb-5">
                    <p className="text-xs text-foreground/80">{event.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-3 md:space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-medium text-foreground mb-2">Reminder Policy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Default Policy — Notifications at 30, 14, 7, and 1 days before expiration.
            </p>
            <button className="mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors duration-150">
              Change Policy →
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-medium text-foreground mb-3">Quick Actions</h3>
            <div className="space-y-1">
              {["Send Reminder Now", "Mark Renewed", "View in GoDaddy"].map((action) => (
                <button key={action} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150">
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
