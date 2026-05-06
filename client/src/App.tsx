import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import { ProtectedRoute } from "./layouts/ProtectedRoute";

// SUPER_ADMIN Pages
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import SuperAdminBuildings from "./pages/super-admin/Buildings";
import SuperAdminFloors from "./pages/super-admin/Floors";
import SuperAdminRooms from "./pages/super-admin/Rooms";
import SuperAdminDepartments from "./pages/super-admin/Departments";

// HOD (ADMIN) Pages
import AdminDashboard from "./pages/admin/Dashboard";
import GenerateRoutine from "./pages/admin/GenerateRoutine";
import RoutineView from "./pages/admin/RoutineView";
import Validation from "./pages/admin/Validation";
import Workflow from "./pages/admin/Workflow";
import { TeacherAvailability, RoomAvailability } from "./pages/admin/Availability";
import AdminAttendance from "./pages/admin/Attendance";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import AdminBatches from "./pages/admin/Batches";
import AdminSections from "./pages/admin/Sections";
import AdminSubjects from "./pages/admin/Subjects";
import AdminTeachers from "./pages/admin/Teachers";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/Dashboard";
import MySchedule from "./pages/teacher/MySchedule";
import TeacherAttendance from "./pages/teacher/Attendance";
import MarkAttendance from "./pages/teacher/MarkAttendance";
import TeacherReports from "./pages/teacher/Reports";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import MyRoutine from "./pages/student/MyRoutine";
import MyAttendance from "./pages/student/MyAttendance";
import StudentReports from "./pages/student/Reports";

const queryClient = new QueryClient();

// Combined roles for shared access
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const TEACHER_ROLES = ["SUPER_ADMIN", "ADMIN", "TEACHER"];
const ALL_ROLES = ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* SUPER_ADMIN Routes - Infrastructure Management */}
          <Route path="/super-admin/dashboard" element={<ProtectedRoute roles={["SUPER_ADMIN"]}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/super-admin/buildings" element={<ProtectedRoute roles={["SUPER_ADMIN"]}><SuperAdminBuildings /></ProtectedRoute>} />
          <Route path="/super-admin/floors" element={<ProtectedRoute roles={["SUPER_ADMIN"]}><SuperAdminFloors /></ProtectedRoute>} />
          <Route path="/super-admin/rooms" element={<ProtectedRoute roles={["SUPER_ADMIN"]}><SuperAdminRooms /></ProtectedRoute>} />
          <Route path="/super-admin/departments" element={<ProtectedRoute roles={["SUPER_ADMIN"]}><SuperAdminDepartments /></ProtectedRoute>} />

          {/* HOD (ADMIN) Routes - Academic Management */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>} />
          {/* Academic Structure */}
          <Route path="/admin/batches" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminBatches /></ProtectedRoute>} />
          <Route path="/admin/sections" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminSections /></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminSubjects /></ProtectedRoute>} />
          <Route path="/admin/teachers" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminTeachers /></ProtectedRoute>} />
          {/* Routine Management */}
          <Route path="/admin/routine/generate" element={<ProtectedRoute roles={ADMIN_ROLES}><GenerateRoutine /></ProtectedRoute>} />
          <Route path="/admin/routine" element={<ProtectedRoute roles={ADMIN_ROLES}><RoutineView /></ProtectedRoute>} />
          <Route path="/admin/routine/validation" element={<ProtectedRoute roles={ADMIN_ROLES}><Validation /></ProtectedRoute>} />
          <Route path="/admin/workflow" element={<ProtectedRoute roles={ADMIN_ROLES}><Workflow /></ProtectedRoute>} />
          <Route path="/admin/availability/teachers" element={<ProtectedRoute roles={ADMIN_ROLES}><TeacherAvailability /></ProtectedRoute>} />
          <Route path="/admin/availability/rooms" element={<ProtectedRoute roles={ADMIN_ROLES}><RoomAvailability /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminAttendance /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminSettings /></ProtectedRoute>} />

          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={<ProtectedRoute roles={TEACHER_ROLES}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/schedule" element={<ProtectedRoute roles={TEACHER_ROLES}><MySchedule /></ProtectedRoute>} />
          <Route path="/teacher/attendance" element={<ProtectedRoute roles={TEACHER_ROLES}><TeacherAttendance /></ProtectedRoute>} />
          <Route path="/teacher/attendance/mark" element={<ProtectedRoute roles={TEACHER_ROLES}><MarkAttendance /></ProtectedRoute>} />
          <Route path="/teacher/reports" element={<ProtectedRoute roles={TEACHER_ROLES}><TeacherReports /></ProtectedRoute>} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute roles={["STUDENT"]}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/routine" element={<ProtectedRoute roles={["STUDENT"]}><MyRoutine /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute roles={["STUDENT"]}><MyAttendance /></ProtectedRoute>} />
          <Route path="/student/reports" element={<ProtectedRoute roles={["STUDENT"]}><StudentReports /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
