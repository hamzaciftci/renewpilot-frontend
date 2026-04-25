import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * One-click theme toggle. Renders a sun in dark mode (click → light)
 * and a moon in light mode (click → dark). Lives in the top bar.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const label = isDark ? t("topbar.switchToLight") : t("topbar.switchToDark");

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      data-no-theme-transition
      className={`relative p-1.5 rounded-md hover:bg-secondary transition-colors duration-150 ${className}`}
    >
      {isDark ? (
        <Sun className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
      ) : (
        <Moon className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
      )}
    </button>
  );
}
