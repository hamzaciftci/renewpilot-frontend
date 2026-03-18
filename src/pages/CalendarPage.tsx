import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const renewalDays: Record<number, { name: string; severity: "red" | "amber" | "blue" | "green" }[]> = {
  10: [{ name: "staging-server.io", severity: "red" }],
  18: [{ name: "clientsite.com", severity: "red" }],
  22: [{ name: "*.example.com SSL", severity: "amber" }],
  28: [{ name: "VPS Production #1", severity: "amber" }],
  5: [{ name: "Adobe CC License", severity: "blue" }],
  12: [{ name: "CloudFront CDN", severity: "blue" }],
};

const dotColors = {
  red: "bg-destructive",
  amber: "bg-warning",
  blue: "bg-primary",
  green: "bg-success",
};

const legendItems = [
  { label: "Overdue", color: "bg-destructive" },
  { label: "Expiring", color: "bg-warning" },
  { label: "Upcoming", color: "bg-primary" },
  { label: "Renewed", color: "bg-success" },
];

const daysInMonth = 31;
const startDay = 6;

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const blanks = Array(startDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const cells = [...blanks, ...days];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">March 2026</h2>
          <div className="flex items-center gap-0.5">
            <button className="p-1 rounded hover:bg-secondary transition-colors duration-150">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </button>
            <button className="p-1 rounded hover:bg-secondary transition-colors duration-150">
              <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        {/* Legend */}
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
        {/* Calendar grid */}
        <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7">
            {dayNames.map((d) => (
              <div key={d} className="px-1 md:px-2 py-2.5 text-center text-[10px] uppercase font-medium text-muted-foreground tracking-wider border-b border-border">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const events = day ? renewalDays[day] : undefined;
              const isSelected = day === selectedDay;
              const isToday = day === 18;
              return (
                <div
                  key={i}
                  onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                  className={`min-h-[60px] md:min-h-[90px] p-1 md:p-2 border-b border-r border-border cursor-pointer transition-colors duration-150 ${
                    !day ? "bg-secondary/30" :
                    isSelected ? "bg-primary/10" :
                    "hover:bg-secondary/50"
                  }`}
                >
                  {day && (
                    <>
                      <span className={`text-xs font-medium flex items-center justify-center w-5 h-5 md:w-6 md:h-6 ${
                        isToday ? "bg-primary text-primary-foreground rounded-full" : "text-muted-foreground"
                      }`}>
                        {day}
                      </span>
                      {events && (
                        <div className="mt-0.5 md:mt-1 space-y-0.5">
                          {events.map((e, j) => (
                            <div key={j} className="flex items-center gap-0.5 md:gap-1">
                              <div className={`w-1 h-1 rounded-full flex-shrink-0 ${dotColors[e.severity]}`} />
                              <span className="text-[8px] md:text-[9px] text-muted-foreground truncate hidden sm:block">{e.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay && (
          <div className="lg:w-64 bg-card border border-border rounded-xl p-4 self-start">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">March {selectedDay}, 2026</h3>
              <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {renewalDays[selectedDay] ? (
              <div className="space-y-2">
                {renewalDays[selectedDay].map((e, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary">
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColors[e.severity]} flex-shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{e.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {e.severity === "red" ? "Overdue" : e.severity === "amber" ? "Expiring Soon" : "Upcoming"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No renewals on this day.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
