import { LayoutDashboard, CalendarRange, Users, ClipboardCheck, BookOpen, FileText, Settings, GraduationCap, ListChecks, BarChart3, Clock } from "lucide-react";
import type { Role } from "@/services/mockData";

export interface NavItem {
  label: string;
  to: string;
  icon: any;
}

export const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Generate Routine", to: "/admin/routine/generate", icon: CalendarRange },
    { label: "Routine View", to: "/admin/routine", icon: BookOpen },
    { label: "Validation", to: "/admin/routine/validation", icon: ListChecks },
    { label: "Workflow", to: "/admin/workflow", icon: ClipboardCheck },
    { label: "Teacher Availability", to: "/admin/availability/teachers", icon: Users },
    { label: "Room Availability", to: "/admin/availability/rooms", icon: Clock },
    { label: "Attendance", to: "/admin/attendance", icon: BarChart3 },
    { label: "Reports", to: "/admin/reports", icon: FileText },
    { label: "Settings", to: "/admin/settings", icon: Settings },
  ],
  TEACHER: [
    { label: "Dashboard", to: "/teacher/dashboard", icon: LayoutDashboard },
    { label: "My Schedule", to: "/teacher/schedule", icon: CalendarRange },
    { label: "Attendance", to: "/teacher/attendance", icon: ClipboardCheck },
    { label: "Reports", to: "/teacher/reports", icon: FileText },
  ],
  STUDENT: [
    { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Routine", to: "/student/routine", icon: CalendarRange },
    { label: "My Attendance", to: "/student/attendance", icon: GraduationCap },
    { label: "Reports", to: "/student/reports", icon: FileText },
  ],
};
