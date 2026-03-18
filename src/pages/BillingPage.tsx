import { Check, Lock, Download } from "lucide-react";

const plans = [
  { name: "Ücretsiz", price: "$0", features: ["10 varlık", "1 üye", "Yalnızca e-posta"], current: false, cta: null },
  { name: "Pro", price: "$19", features: ["100 varlık", "3 üye", "E-posta + Push + SMS"], current: true, cta: null },
  { name: "Agency", price: "$49", features: ["1.000 varlık", "20 üye", "Tüm kanallar + WhatsApp"], current: false, cta: "Yükselt" },
];

const invoices = [
  { date: "1 Mar 2026", amount: "$19.00", status: "Ödendi" },
  { date: "1 Şub 2026", amount: "$19.00", status: "Ödendi" },
  { date: "1 Oca 2026", amount: "$19.00", status: "Ödendi" },
];

const usageItems = [
  { label: "Varlıklar", current: 87, max: 100, percent: 87 },
  { label: "Ekip üyeleri", current: 3, max: 3, percent: 100 },
];

export default function BillingPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Current Plan */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Pro Plan</h2>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-xs text-success font-medium">Aktif</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">1 Nisan 2026'da yenilenir · $19.00/ay</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150">
          Agency'e Yükselt
        </button>
      </div>

      {/* Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {usageItems.map((u) => (
          <div key={u.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{u.label}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">{u.current} / {u.max}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${u.percent >= 100 ? "bg-destructive" : u.percent >= 80 ? "bg-warning" : "bg-primary"}`}
                style={{ width: `${Math.min(u.percent, 100)}%` }}
              />
            </div>
            {u.percent >= 100 && <p className="text-[10px] text-destructive font-medium mt-1.5">Limite ulaşıldı — daha fazlası için yükseltin</p>}
          </div>
        ))}
        <div className="bg-card border border-border rounded-xl p-5">
          <span className="text-sm font-medium text-foreground">Bildirim kanalları</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-mono font-semibold text-success">EMAIL</span>
            <span className="text-[10px] font-mono font-semibold text-success">PUSH</span>
            <span className="text-[10px] font-mono font-semibold text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" /> SMS
            </span>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.name} className={`bg-card rounded-xl p-6 border ${plan.current ? "border-primary" : "border-border"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              {plan.current && <span className="text-[10px] font-mono font-semibold text-primary">MEVCUT</span>}
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-success" strokeWidth={2} /> {f}
                </li>
              ))}
            </ul>
            {plan.cta && (
              <button className="mt-6 w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-150">
                {plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invoices */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Ödeme Geçmişi</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Tarih</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Tutar</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Durum</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-right">Fatura</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors duration-150 h-[52px]">
                <td className="px-5 py-3 text-sm text-foreground tabular-nums font-mono">{inv.date}</td>
                <td className="px-5 py-3 text-sm font-medium text-foreground tabular-nums">{inv.amount}</td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span className="text-xs text-success">{inv.status}</span>
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-xs text-primary font-medium hover:text-primary/80 flex items-center gap-1 ml-auto transition-colors duration-150">
                    <Download className="w-3 h-3" /> İndir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
