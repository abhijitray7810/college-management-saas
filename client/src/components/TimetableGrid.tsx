import { useState } from "react";
import { DAYS, TIME_SLOTS, type Routine, type RoutineCell } from "@/services/mockData";
import { Lock, Unlock, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  routine: Routine;
  editable?: boolean;
  onCellClick?: (day: string, slot: string, cell: RoutineCell | null) => void;
  onToggleLock?: (day: string, slot: string) => void;
  selectedCells?: { day: string; slot: string }[];
}

const subjectColor = (s: string) => {
  const colors = ["bg-primary-soft text-primary", "bg-info/10 text-info", "bg-success/10 text-success", "bg-warning/10 text-warning", "bg-accent text-accent-foreground"];
  return colors[s.length % colors.length];
};

export function TimetableGrid({ routine, editable, onCellClick, onToggleLock, selectedCells = [] }: Props) {
  const isSelected = (d: string, s: string) => selectedCells.some((c) => c.day === d && c.slot === s);
  return (
    <TooltipProvider delayDuration={150}>
      <div className="overflow-auto rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[900px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-28 border-b bg-muted/50 p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Day / Time
              </th>
              {TIME_SLOTS.map((t) => (
                <th key={t} className="border-b bg-muted/50 p-3 text-xs font-semibold text-muted-foreground">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d) => (
              <tr key={d}>
                <td className="sticky left-0 z-10 border-b bg-card p-3 text-sm font-semibold">{d}</td>
                {TIME_SLOTS.map((t) => {
                  const cell = routine[d]?.[t];
                  const sel = isSelected(d, t);
                  return (
                    <td key={t} className="border-b border-l p-1.5 align-top">
                      {cell ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => onCellClick?.(d, t, cell)}
                              className={cn(
                                "group relative cursor-pointer rounded-lg p-2.5 text-left transition-all",
                                subjectColor(cell.subject),
                                sel && "ring-2 ring-primary ring-offset-2",
                                editable && "hover:scale-[1.02] hover:shadow-md"
                              )}
                            >
                              <div className="text-xs font-semibold leading-tight">{cell.subject}</div>
                              <div className="mt-1 text-[11px] opacity-80">{cell.teacher}</div>
                              <div className="text-[11px] opacity-70">Room {cell.room}</div>
                              {editable && (
                                <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onToggleLock?.(d, t); }}
                                    className="rounded bg-white/80 p-0.5 text-foreground hover:bg-white"
                                  >
                                    {cell.locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
                                  </button>
                                  <button className="rounded bg-white/80 p-0.5 text-foreground hover:bg-white">
                                    <Pencil className="size-3" />
                                  </button>
                                </div>
                              )}
                              {cell.locked && (
                                <Lock className="absolute right-1 top-1 size-3 opacity-60" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div className="font-semibold">{cell.subject}</div>
                              <div>Teacher: {cell.teacher}</div>
                              <div>Room: {cell.room}</div>
                              {cell.locked && <div className="text-warning">🔒 Locked</div>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div
                          onClick={() => editable && onCellClick?.(d, t, null)}
                          className={cn(
                            "h-[68px] rounded-lg border border-dashed",
                            editable && "cursor-pointer hover:border-primary hover:bg-primary-soft/40",
                            sel && "ring-2 ring-primary"
                          )}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
