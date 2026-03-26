import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRenewalCalendar } from "@/hooks/useRenewals";
import { ASSET_TYPE_LABEL } from "@/types";
import { daysUntil } from "@/lib/date";

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getSeverity(renewalDate: string): "red" | "amber" | "blue" | "green" {
  const days = daysUntil(renewalDate);
  if (days < 0) return "red";
  if (days <= 7) return "red";
  if (days <= 30) return "amber";
  return "blue";
}

const dotColors = {
  red: "bg-destructive",
  amber: "bg-warning",
  blue: "bg-primary",
  green: "bg-success",
};

const legendItems = [
  { label: "Süresi Geçmiş", color: "bg-destructive" },
  { label: "Yaklaşan (30g)", color: "bg-warning" },
  { label: "Planlanan", color: "bg-primary" },
];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: assets = [], isLoading } = useRenewalCalendar(year, month);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const renewalDays: Record<number, typeof assets> = {};
  for (const asset of assets) {
    const d = new Date(asset.renewalDate).getDate();
    if (!renewalDays[d]) renewalDays[d] = [];
    renewalDays[d].push(asset);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayRaw = new Date(year, month - 1, 1).getDay();
  const startDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const cells = [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <div className="flex items-center gap-0.5">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-secondary transition-colors duration-150">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </button>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-secondary transition-colors duration-150">
              <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </button>
          </div>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); setSelectedDay(null); }}
            className="text-xs text-primary font-medium hover:text-primary/80 transition-colors"
          >
            Bugün
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {legendItems.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${l.color}`} />
              <span className="text-[11px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
        <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : (
            <>
              <div className="grid grid-cols-7">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="px-1 md:px-2 py-2.5 text-center text-[10px] uppercase font-medium text-muted-foreground tracking-wider border-b border-border">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  const events = day ? renewalDays[day] : undefined;
                  const isSelected = day === selectedDay;
                  return (
                    <div
                      key={i}
                      onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                      className={`min-h-[60px] md:min-h-[90px] p-1 md:p-2 border-b border-r border-border transition-colors duration-150 ${
                        !day ? "bg-secondary/30" :
                        isSelected ? "bg-primary/10 cursor-pointer" :
                        "hover:bg-secondary/50 cursor-pointer"
                      }`}
                    >
                      {day && (
                        <>
                          <span className={`text-xs font-medium flex items-center justify-center w-5 h-5 md:w-6 md:h-6 ${
                            isToday(day) ? "bg-primary text-primary-foreground rounded-full" : "text-muted-foreground"
                          }`}>
                            {day}
                          </span>
                          {events && (
                            <div className="mt-0.5 md:mt-1 space-y-0.5">
                              {events.slice(0, 3).map((asset, j) => (
                                <div key={j} className="flex items-center gap-0.5 md:gap-1">
                                  <div className={`w-1 h-1 rounded-full flex-shrink-0 ${dotColors[getSeverity(asset.renewalDate)]}`} />
                                  <span className="text-[8px] md:text-[9px] text-muted-foreground truncate hidden sm:block">{asset.name}</span>
                                </div>
                              ))}
                              {events.length > 3 && (
                                <span className="text-[8px] text-muted-foreground">+{events.length - 3}</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {selectedDay && (
          <div className="lg:w-64 bg-card border border-border rounded-xl p-4 self-start">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">
                {selectedDay} {MONTH_NAMES[month - 1]} {year}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {renewalDays[selectedDay]?.length > 0 ? (
              <div className="space-y-2">
                {renewalDays[selectedDay].map((asset) => {
                  const sev = getSeverity(asset.renewalDate);
                  const days = daysUntil(asset.renewalDate);
                  return (
                    <div key={asset.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary">
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColors[sev]} flex-shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{asset.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {ASSET_TYPE_LABEL[asset.assetType] ?? asset.assetType}
                          {asset.project && <span> · {asset.project.name}</span>}
                        </p>
                        <p className={`text-[10px] font-medium ${sev === "red" ? "text-destructive" : sev === "amber" ? "text-warning" : "text-primary"}`}>
                          {days < 0 ? `${Math.abs(days)} gün geçti` : days === 0 ? "Bugün!" : `${days} gün kaldı`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Bu günde yenileme yok.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
