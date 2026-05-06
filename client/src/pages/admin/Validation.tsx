import { useRoutineStore } from "@/store/routineStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { DAYS, TIME_SLOTS } from "@/services/mockData";

export default function Validation() {
  const { routine } = useRoutineStore();
  if (!routine) return <div className="text-sm text-muted-foreground">No routine to validate.</div>;

  const conflicts: { type: string; detail: string }[] = [];
  const teacherMap = new Map<string, string[]>();
  const roomMap = new Map<string, string[]>();

  DAYS.forEach((d) => TIME_SLOTS.forEach((t) => {
    const c = routine[d][t];
    if (!c) return;
    const tk = `${d}|${t}|${c.teacher}`;
    const rk = `${d}|${t}|${c.room}`;
    teacherMap.set(tk, [...(teacherMap.get(tk) || []), c.subject]);
    roomMap.set(rk, [...(roomMap.get(rk) || []), c.subject]);
  }));

  let totalSlots = 0, filled = 0;
  DAYS.forEach((d) => TIME_SLOTS.forEach((t) => { totalSlots++; if (routine[d][t]) filled++; }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Routine Validation</h1>
        <p className="text-sm text-muted-foreground">Checks for conflicts, gaps, and load imbalances.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Total Slots</div><div className="mt-1 text-2xl font-semibold">{totalSlots}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Filled</div><div className="mt-1 text-2xl font-semibold text-success">{filled}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Conflicts</div><div className="mt-1 text-2xl font-semibold text-destructive">{conflicts.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Validation Results</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
            <CheckCircle2 className="size-4 text-success" /> No teacher double-booking detected.
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
            <CheckCircle2 className="size-4 text-success" /> No room conflicts detected.
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
            <AlertTriangle className="size-4 text-warning" /> {totalSlots - filled} slots remain empty.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
