import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ClipboardCheck, AlertTriangle, Users, Loader2 } from "lucide-react";
import { useRoutineStore } from "@/store/routineStore";
import { useAttendanceStore } from "@/store/attendanceStore";
import { useAuthStore } from "@/store/authStore";
import { DAYS, TIME_SLOTS } from "@/services/mockData";
import { dashboardService } from "@/services/dashboard.service";
import { toast } from "sonner";

export default function TeacherDashboard() {
  const { routine } = useRoutineStore();
  const { sessions, fetchSessions } = useAttendanceStore();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    todayClasses: 0,
    pendingAttendance: 0,
    totalStudents: 0,
    lowAttendanceAlerts: 0,
    weeklyLoad: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const today = DAYS[new Date().getDay() === 0 || new Date().getDay() === 6 ? 0 : new Date().getDay() - 1];
  const classes = routine ? TIME_SLOTS.map((t) => routine[today]?.[t]).filter(Boolean) : [];

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch teacher dashboard stats
      const dashboardResponse = await dashboardService.getTeacherDashboard();
      const dashboardData = dashboardResponse.data;

      // Fetch open attendance sessions for this teacher
      await fetchSessions({ 
        teacherId: user.id,
        status: "OPEN"
      });

      setStats({
        todayClasses: dashboardData.schedule?.today?.length || classes.length,
        pendingAttendance: sessions.filter(s => s.status === "OPEN").length,
        totalStudents: 0, // Not provided by teacher dashboard API
        lowAttendanceAlerts: 0, // Not provided by teacher dashboard API
        weeklyLoad: dashboardData.workload?.weeklySessions || 0,
      });
    } catch (error: any) {
      toast.error("Failed to load dashboard", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Teacher Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your day at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Today's Classes" 
          value={stats.todayClasses} 
          icon={Calendar} 
          accent="primary" 
        />
        <StatCard 
          label="Pending Attendance" 
          value={stats.pendingAttendance} 
          icon={ClipboardCheck} 
          accent={stats.pendingAttendance > 0 ? "warning" : "success"}
        />
        <StatCard 
          label="Total Students" 
          value={stats.totalStudents} 
          icon={Users} 
          accent="info" 
        />
        <StatCard 
          label="Low Attendance Alerts" 
          value={stats.lowAttendanceAlerts} 
          icon={AlertTriangle} 
          accent={stats.lowAttendanceAlerts > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today — {today}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {stats.weeklyLoad} classes this week
            </span>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes scheduled today.</p>
            ) : (
              <div className="space-y-2">
                {TIME_SLOTS.map((t) => {
                  const c = routine?.[today]?.[t];
                  if (!c) return null;
                  return (
                    <div key={t} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-semibold">{c.subject}</div>
                        <div className="text-xs text-muted-foreground">Room {c.room}</div>
                      </div>
                      <div className="text-sm font-medium text-primary">{t}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Attendance</CardTitle>
            {stats.pendingAttendance > 0 && (
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/teacher/attendance"}>
                Take Attendance
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {stats.pendingAttendance === 0 ? (
              <p className="text-sm text-muted-foreground">All attendance marked! 🎉</p>
            ) : (
              <div className="space-y-2">
                {sessions
                  .filter(s => s.status === "OPEN")
                  .slice(0, 3)
                  .map(session => (
                    <div key={session.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-semibold">{session.subject?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.semester?.name} • {session.date}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => window.location.href = `/teacher/attendance?session=${session.id}`}
                      >
                        Mark
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
