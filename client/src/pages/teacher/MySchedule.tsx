import { TimetableGrid } from "@/components/TimetableGrid";
import { useRoutineStore } from "@/store/routineStore";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportService } from "@/services/export.service";

export default function MySchedule() {
  const { routine } = useRoutineStore();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Schedule</h1>
          <p className="text-sm text-muted-foreground">Your weekly timetable.</p>
        </div>
        <Button variant="outline" onClick={() => exportService.exportRoutinePDF()}>
          <Download className="mr-2 size-4" /> Export PDF
        </Button>
      </div>
      {routine && <TimetableGrid routine={routine} />}
    </div>
  );
}
