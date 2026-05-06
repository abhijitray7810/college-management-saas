import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Calendar, BookOpen, Loader2 } from "lucide-react";
import { useRoutineStore } from "@/store/routineStore";
import { useAuthStore } from "@/store/authStore";
import { DAYS, TIME_SLOTS } from "@/services/mockData";
import { dashboardService } from "@/services/dashboard.service";
import { toast } from "sonner";

export default function StudentDashboard() {
  const { routine } = useRoutineStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const today = DAYS[new Date().getDay() === 0 || new Date().getDay() === 6 ? 0 : new Date().getDay() - 1];
  const classes = routine ? TIME_SLOTS.filter((t) => routine[today]?.[t]).length : 0;

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await dashboardService.getStudentDashboard();
      setDashboardData(response.data);
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

  const attendance = dashboardData?.attendance;
  const subjects = dashboardData?.subjects || [];
  const todaySchedule = dashboardData?.schedule?.today || [];
  const lowAttendanceSubjects = subjects.filter((s: any) => s.isLowAttendance);
  const overallPercentage = attendance?.overallPercentage || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back {dashboardData?.summary?.name?.split(' ')[0] || "👋"}
        </h1>
        <p className="text-sm text-muted-foreground">Stay on top of your classes and attendance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Overall Attendance" 
          value={`${overallPercentage}%`} 
          icon={TrendingUp} 
          accent={overallPercentage >= 75 ? "success" : "warning"} 
        />
        <StatCard 
          label="Subjects" 
          value={subjects.length} 
          icon={BookOpen} 
          accent="primary" 
        />
        <StatCard 
          label="Low Attendance" 
          value={lowAttendanceSubjects.length} 
          icon={AlertTriangle} 
          accent={lowAttendanceSubjects.length > 0 ? "warning" : "success"} 
        />
        <StatCard 
          label="Today's Classes" 
          value={todaySchedule.length || classes} 
          icon={Calendar} 
          accent="info" 
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Today — {today}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {todaySchedule.length === 0 && classes === 0 ? (
              <p className="text-sm text-muted-foreground">No classes scheduled today.</p>
            ) : todaySchedule.length > 0 ? (
              todaySchedule.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-semibold">{item.subject.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.teacher.name} · Room {item.room.code}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">{item.timeSlot.startTime}</div>
                </div>
              ))
            ) : (
              TIME_SLOTS.map((t) => {
                const c = routine?.[today]?.[t];
                if (!c) return null;
                return (
                  <div key={t} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-semibold">{c.subject}</div>
                      <div className="text-xs text-muted-foreground">{c.teacher} · Room {c.room}</div>
                    </div>
                    <div className="text-sm font-medium text-primary">{t}</div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={lowAttendanceSubjects.length > 0 ? "text-warning" : ""}>
              Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowAttendanceSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">All subjects above threshold. 🎉</p>
            ) : (
              lowAttendanceSubjects.map((s: any) => (
                <div key={s.subjectId} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">{s.subjectName}</span>
                    <span className="text-destructive">{s.percentage}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Below 75% threshold</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
