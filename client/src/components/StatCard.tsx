import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: "primary" | "success" | "warning" | "info";
}

const accents = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export function StatCard({ label, value, icon: Icon, trend, trendUp, accent = "primary" }: Props) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs", trendUp ? "text-success" : "text-destructive")}>{trend}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", accents[accent])}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
