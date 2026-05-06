import { DAYS, TIME_SLOTS } from "@/services/mockData";
import { cn } from "@/lib/utils";

interface Props {
  busy: Record<string, Record<string, boolean>>;
  onToggle?: (day: string, slot: string) => void;
  readOnly?: boolean;
}

export function AvailabilityGrid({ busy, onToggle, readOnly }: Props) {
  return (
    <div className="overflow-auto rounded-xl border bg-card shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[800px] border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b bg-muted/50 p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Day</th>
            {TIME_SLOTS.map((t) => (
              <th key={t} className="border-b bg-muted/50 p-3 text-[10px] font-semibold text-muted-foreground">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((d) => (
            <tr key={d}>
              <td className="sticky left-0 z-10 border-b bg-card p-3 text-sm font-semibold">{d}</td>
              {TIME_SLOTS.map((t) => {
                const isBusy = busy[d]?.[t];
                return (
                  <td key={t} className="border-b border-l p-1">
                    <button
                      disabled={readOnly}
                      onClick={() => onToggle?.(d, t)}
                      className={cn(
                        "h-12 w-full rounded-md border text-xs font-medium transition-all",
                        isBusy ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success",
                        !readOnly && "hover:scale-105"
                      )}
                    >
                      {isBusy ? "BUSY" : "FREE"}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
