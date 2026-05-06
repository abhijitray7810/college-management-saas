import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Users, GraduationCap, DoorOpen, ClipboardCheck, AlertTriangle, Loader2 } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { toast } from "sonner";

// Mock attendance trend for chart (until backend provides it)
const ATTENDANCE_TREND = [
  { week: "Week 1", attendance: 92 },
  { week: "Week 2", attendance: 88 },
  { week: "Week 3", attendance: 85 },
  { week: "Week 4", attendance: 87 },
  { week: "Week 5", attendance: 90 },
  { week: "Week 6", attendance: 84 },
];

interface DashboardData {
  counts: {
    students: number;
    teachers: number;
    subjects: number;
    rooms: number;
    activeSemesters: number;
  };
  attendance: {
    overallPercentage: number;
  };
  alerts: {
    lowAttendanceStudents: number;
    overloadedTeachers: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardService.getAdminDashboard();
      setData(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { counts, attendance, alerts } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of college operations and live metrics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={counts.students} icon={Users} accent="primary" />
        <StatCard label="Teachers" value={counts.teachers} icon={GraduationCap} accent="info" />
        <StatCard label="Rooms" value={counts.rooms} icon={DoorOpen} accent="success" />
        <StatCard label="Avg Attendance" value={`${attendance.overallPercentage}%`} icon={ClipboardCheck} accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Attendance Trend</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ATTENDANCE_TREND}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-warning"><AlertTriangle className="size-4" /> Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {alerts.lowAttendanceStudents > 0 ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="font-semibold text-destructive">{alerts.lowAttendanceStudents} students below 75%</div>
                <div className="text-xs text-muted-foreground">Send notifications to guardians</div>
              </div>
            ) : null}
            {alerts.overloadedTeachers > 0 ? (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                <div className="font-semibold text-warning">{alerts.overloadedTeachers} teachers overloaded</div>
                <div className="text-xs text-muted-foreground">Review teacher assignments</div>
              </div>
            ) : null}
            {alerts.lowAttendanceStudents === 0 && alerts.overloadedTeachers === 0 && (
              <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-xs">
                All systems operational. No alerts.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Active Semesters</div>
            <div className="text-2xl font-bold">{counts.activeSemesters}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Total Subjects</div>
            <div className="text-2xl font-bold">{counts.subjects}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
