/** Format an ISO date string to a short display like "Mar 18, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Number of days until (or since) the given ISO date. Negative = overdue. */
export function daysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Returns Tailwind color classes based on days remaining */
export function daysColor(days: number): { dot: string; text: string } {
  if (days < 0) return { dot: "bg-destructive", text: "text-destructive" };
  if (days <= 7) return { dot: "bg-destructive", text: "text-destructive" };
  if (days <= 30) return { dot: "bg-warning", text: "text-warning" };
  return { dot: "bg-muted-foreground", text: "text-muted-foreground" };
}

/** Human-readable relative time: "2 hours ago", "3 days ago" */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Dün";
  if (days < 30) return `${days} gün önce`;
  return formatDate(iso);
}

/** Returns initials from a full name: "Hamza Yılmaz" → "HY" */
export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
