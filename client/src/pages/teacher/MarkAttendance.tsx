import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAttendanceStore } from "@/store/attendanceStore";
import { toast } from "sonner";
import { Save, Loader2, Users, CheckCircle, AlertCircle } from "lucide-react";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "PRESENT", label: "Present", color: "bg-green-100 text-green-800" },
  { value: "ABSENT", label: "Absent", color: "bg-red-100 text-red-800" },
  { value: "LATE", label: "Late", color: "bg-yellow-100 text-yellow-800" },
  { value: "EXCUSED", label: "Excused", color: "bg-blue-100 text-blue-800" },
];

export default function MarkAttendance() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session") || "";
  
  const { 
    currentSession, 
    records, 
    fetchSessionAttendance, 
    markAttendance, 
    closeSession,
    isLoading 
  } = useAttendanceStore();
  
  const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [markAllPresent, setMarkAllPresent] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  useEffect(() => {
    // Initialize attendance state from records
    if (records.length > 0) {
      const initial: Record<string, { status: AttendanceStatus; remarks: string }> = {};
      records.forEach(record => {
        initial[record.studentId] = {
          status: record.status,
          remarks: record.remarks || "",
        };
      });
      setAttendance(initial);
    }
  }, [records]);

  const loadSessionData = async () => {
    try {
      await fetchSessionAttendance(sessionId);
    } catch (error: any) {
      toast.error("Failed to load session", { description: error.message });
    }
  };

  const handleMarkAllPresent = () => {
    const newAttendance: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    records.forEach(record => {
      newAttendance[record.studentId] = { status: "PRESENT", remarks: "" };
    });
    setAttendance(newAttendance);
    setMarkAllPresent(true);
  };

  const handleSaveAttendance = async () => {
    const recordsToSave = Object.entries(attendance).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      remarks: data.remarks || undefined,
    }));

    if (recordsToSave.length === 0) {
      toast.error("No attendance records to save");
      return;
    }

    try {
      await markAttendance(sessionId, recordsToSave);
      toast.success(`Attendance saved for ${recordsToSave.length} students`);
    } catch (error: any) {
      toast.error("Failed to save attendance", { description: error.message });
    }
  };

  const handleCloseSession = async () => {
    try {
      await closeSession(sessionId);
      toast.success("Session closed");
    } catch (error: any) {
      toast.error("Failed to close session", { description: error.message });
    }
  };

  const getMarkedCount = () => {
    return Object.keys(attendance).length;
  };

  const getStats = () => {
    const stats = { present: 0, absent: 0, late: 0, excused: 0 };
    Object.values(attendance).forEach(a => {
      stats[a.status.toLowerCase() as keyof typeof stats]++;
    });
    return stats;
  };

  if (!sessionId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mark Attendance</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No session selected.</p>
            <p className="text-sm text-muted-foreground">Please select a session from the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">
            {currentSession?.subject?.name} • {currentSession?.semester?.name} • {currentSession?.date}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCloseSession}>
            Close Session
          </Button>
          <Button onClick={handleSaveAttendance}>
            <Save className="mr-2 size-4" />
            Save ({getMarkedCount()})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Excused</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
          </CardContent>
        </Card>
      </div>

      {/* Mark All Present */}
      <div className="flex items-center gap-4">
        <Checkbox 
          id="markAll" 
          checked={markAllPresent}
          onCheckedChange={(checked) => {
            if (checked) handleMarkAllPresent();
            else setMarkAllPresent(false);
          }}
        />
        <Label htmlFor="markAll" className="cursor-pointer">
          Mark all students as present
        </Label>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Enrollment No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No students found in this session
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record, index) => {
                  const student = record.student;
                  const currentStatus = attendance[record.studentId]?.status || "PRESENT";
                  const currentRemarks = attendance[record.studentId]?.remarks || "";
                  
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {student?.enrollmentNumber || "N/A"}
                      </TableCell>
                      <TableCell>{student?.user?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <Select 
                          value={currentStatus}
                          onValueChange={(value: AttendanceStatus) => {
                            setAttendance(prev => ({
                              ...prev,
                              [record.studentId]: { ...prev[record.studentId], status: value }
                            }));
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={STATUS_OPTIONS.find(s => s.value === currentStatus)?.color}>
                              {currentStatus}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${status.color}`}>
                                  {status.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Optional remarks"
                          value={currentRemarks}
                          onChange={(e) => {
                            setAttendance(prev => ({
                              ...prev,
                              [record.studentId]: { ...prev[record.studentId], remarks: e.target.value }
                            }));
                          }}
                          className="w-48"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
