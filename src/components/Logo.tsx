import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The RenewPilot brand mark. A primary-tinted rounded square with the
 * `RefreshCw` icon, optionally followed by the wordmark.
 *
 * Mirrors the logo used in AppSidebar so the landing page, public share
 * page and authed app all feel like the same product.
 */
export function Logo({
  size = "md",
  showWordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}) {
  const dim = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-9 h-9" : "w-7 h-7";
  const icon = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const text =
    size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-[15px]";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          dim,
          "bg-primary rounded-lg flex items-center justify-center flex-shrink-0",
        )}
      >
        <RefreshCw className={cn(icon, "text-primary-foreground")} strokeWidth={2.25} />
      </span>
      {showWordmark && (
        <span className={cn(text, "font-semibold text-foreground tracking-tight")}>
          RenewPilot
        </span>
      )}
    </span>
  );
}
