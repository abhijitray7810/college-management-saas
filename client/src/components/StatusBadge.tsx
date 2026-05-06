import { cn } from "@/lib/utils";

type Variant = "draft" | "pending" | "approved" | "active" | "success" | "warning" | "danger" | "info" | "muted";

const styles: Record<Variant, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
  approved: "bg-info/10 text-info",
  active: "bg-success/10 text-success",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase() as Variant;
  const variant = (styles[key] ? key : "muted") as Variant;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", styles[variant], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {status.toUpperCase()}
    </span>
  );
}
