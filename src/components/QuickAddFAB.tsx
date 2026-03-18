import { useState } from "react";
import { Plus, Globe, Server, ShieldCheck, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const quickItems = [
  { icon: Globe, label: "Alan Adı Ekle", type: "domain" },
  { icon: Server, label: "Sunucu Ekle", type: "server" },
  { icon: ShieldCheck, label: "SSL Ekle", type: "ssl" },
  { icon: Key, label: "Lisans Ekle", type: "license" },
];

export function QuickAddFAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-card border border-border rounded-xl p-1.5 space-y-0.5 animate-scale-in">
          {quickItems.map((item) => (
            <button
              key={item.type}
              onClick={() => { setOpen(false); navigate("/assets/new"); }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors duration-150 w-full text-left"
            >
              <item.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-all duration-150 hover:bg-primary/90",
          "shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_4px_24px_hsl(var(--primary)/0.2)]",
          open && "rotate-45"
        )}
      >
        <Plus className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
  );
}
