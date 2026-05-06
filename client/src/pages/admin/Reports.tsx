import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_SUBJECTS } from "@/services/mockData";
import { Download, FileText } from "lucide-react";
import { exportService } from "@/services/export.service";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Export PDFs and review summaries.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportService.exportRoutinePDF()}><FileText className="mr-2 size-4" /> Routine PDF</Button>
          <Button onClick={() => exportService.exportAttendancePDF()}><Download className="mr-2 size-4" /> Attendance PDF</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Subject Attendance Summary</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Total Classes</TableHead>
                <TableHead>Avg Attendance</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_SUBJECTS.map((s) => (
                <TableRow key={s.code}>
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.totalClasses}</TableCell>
                  <TableCell><span className={s.attendance < 75 ? "text-destructive" : "text-success"}>{s.attendance}%</span></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => exportService.exportAttendancePDF(s.name)}>
                      <Download className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
