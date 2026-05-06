import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { MOCK_SUBJECTS } from "@/services/mockData";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportService } from "@/services/export.service";

export default function MyAttendance() {
  const overall = Math.round(MOCK_SUBJECTS.reduce((a, s) => a + s.attendance, 0) / MOCK_SUBJECTS.length);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Attendance</h1>
          <p className="text-sm text-muted-foreground">Subject-wise breakdown.</p>
        </div>
        <Button variant="outline" onClick={() => exportService.exportAttendancePDF()}><Download className="mr-2 size-4" /> Download Report</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">Overall Attendance</div>
          <div className="mt-2 flex items-end gap-3">
            <div className={`text-4xl font-semibold ${overall < 75 ? "text-destructive" : "text-success"}`}>{overall}%</div>
            <div className="pb-1 text-xs text-muted-foreground">{overall >= 75 ? "Above threshold" : "Below 75% threshold"}</div>
          </div>
          <Progress value={overall} className="mt-4" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Subjects</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-1/3">Attendance</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_SUBJECTS.map((s) => (
                <TableRow key={s.code}>
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.totalClasses}</TableCell>
                  <TableCell><Progress value={s.attendance} /></TableCell>
                  <TableCell className="text-right"><span className={s.attendance < 75 ? "text-destructive" : "text-success"}>{s.attendance}%</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
