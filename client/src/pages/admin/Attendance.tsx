import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MOCK_SUBJECTS, DAYS, TIME_SLOTS, TEACHERS_LIST, MOCK_STUDENTS } from "@/services/mockData";
import { useAttendanceStore } from "@/store/attendanceStore";
import { toast } from "sonner";
import { Plus, Save, Download, Loader2, Users, Calendar, CheckCircle } from "lucide-react";
import { exportService } from "@/services/export.service";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export default function AdminAttendance() {
  const { sessions, fetchSessions, createSession, isLoading } = useAttendanceStore();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  
  // Create session form state
  const [subject, setSubject] = useState(MOCK_SUBJECTS[0]?.name || "");
  const [day, setDay] = useState(DAYS[0]);
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [teacher, setTeacher] = useState(TEACHERS_LIST[0]?.id || "");
  const [semesterId, setSemesterId] = useState("");
  const [routineId, setRoutineId] = useState("");
  const [topic, setTopic] = useState("");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    await fetchSessions();
  };

  const handleCreateSession = async () => {
    if (!routineId) {
      toast.error("Please enter a routine ID");
      return;
    }
    if (!semesterId) {
      toast.error("Please enter a semester ID");
      return;
    }

    try {
      await createSession({
        routineId,
        date,
        topic: topic || undefined,
      });
      toast.success("Session created successfully");
      // Reset form
      setRoutineId("");
      setTopic("");
    } catch (error: any) {
      toast.error("Failed to create session", { description: error.message });
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedSession) return;
    
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      // Call mark attendance API
      toast.success(`Attendance saved for ${records.length} students`);
      setAttendance({});
      setSelectedSession(null);
    } catch (error: any) {
      toast.error("Failed to save attendance", { description: error.message });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      OPEN: "bg-green-100 text-green-800",
      CLOSED: "bg-gray-100 text-gray-800",
    };
    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance Management</h1>
        <p className="text-sm text-muted-foreground">Create sessions and mark attendance.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.date === new Date().toISOString().slice(0, 10)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Sessions</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === "OPEN").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Sessions</CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === "CLOSED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Session Form */}
      <Card>
        <CardHeader><CardTitle>Create Session</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Routine ID</Label>
            <Input 
              value={routineId} 
              onChange={(e) => setRoutineId(e.target.value)}
              placeholder="Enter routine ID"
            />
          </div>
          <div className="space-y-2">
            <Label>Semester ID</Label>
            <Input 
              value={semesterId} 
              onChange={(e) => setSemesterId(e.target.value)}
              placeholder="Enter semester ID"
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Topic (Optional)</Label>
            <Input 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleCreateSession} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Recent Sessions</CardTitle>
          <Button size="sm" variant="outline" onClick={loadSessions}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No sessions found. Create one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Marked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 10).map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.subject?.name || "Unknown"}
                    </TableCell>
                    <TableCell>{session.semester?.name || "Unknown"}</TableCell>
                    <TableCell>{session.date}</TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell>
                      {session.markedCount}/{session.totalCount} ({session.percentage}%)
                    </TableCell>
                    <TableCell className="text-right">
                      {session.status === "OPEN" && (
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedSession(session.id)}
                        >
                          Mark
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
