import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildingService } from "@/services/building.service";
import { departmentService } from "@/services/department.service";
import { batchService } from "@/services/batch.service";
import { sectionService } from "@/services/section.service";
import { teacherService } from "@/services/teacher.service";
import { studentService } from "@/services/student.service";
import { toast } from "sonner";
import {
  Building2,
  Layers,
  DoorOpen,
  School,
  Users,
  GraduationCap,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import type { Building, Department, Batch, Section } from "@/types";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    buildings: 0,
    floors: 0,
    rooms: 0,
    departments: 0,
    batches: 0,
    sections: 0,
    teachers: 0,
    students: 0,
  });
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [buildingsRes, departmentsRes, batchesRes, sectionsRes, teachersRes, studentsRes] = await Promise.all([
        buildingService.getAll(),
        departmentService.getAll(),
        batchService.getAll(),
        sectionService.getAll(),
        teacherService.getAll(),
        studentService.getAll(),
      ]);

      setBuildings(buildingsRes.data || []);
      setDepartments(departmentsRes.data || []);

      setStats({
        buildings: buildingsRes.data?.length || 0,
        floors: buildingsRes.data?.reduce((acc, b) => acc + (b.floorCount || 0), 0) || 0,
        rooms: buildingsRes.data?.reduce((acc, b) => acc + (b.floorCount || 0) * 7, 0) || 0, // Approximate
        departments: departmentsRes.data?.length || 0,
        batches: batchesRes.data?.length || 0,
        sections: sectionsRes.data?.length || 0,
        teachers: teachersRes.data?.length || 0,
        students: studentsRes.data?.length || 0,
      });
    } catch (error: any) {
      toast.error("Failed to load dashboard data", {
        description: error.response?.data?.error?.message || error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { title: "Buildings", value: stats.buildings, icon: Building2, color: "bg-blue-100 text-blue-600" },
    { title: "Floors", value: stats.floors, icon: Layers, color: "bg-green-100 text-green-600" },
    { title: "Rooms", value: stats.rooms, icon: DoorOpen, color: "bg-purple-100 text-purple-600" },
    { title: "Departments", value: stats.departments, icon: School, color: "bg-orange-100 text-orange-600" },
    { title: "Batches", value: stats.batches, icon: BookOpen, color: "bg-pink-100 text-pink-600" },
    { title: "Sections", value: stats.sections, icon: Layers, color: "bg-cyan-100 text-cyan-600" },
    { title: "Teachers", value: stats.teachers, icon: Users, color: "bg-indigo-100 text-indigo-600" },
    { title: "Students", value: stats.students, icon: GraduationCap, color: "bg-teal-100 text-teal-600" },
  ];

  const quickLinks = [
    { title: "Manage Buildings", path: "/super-admin/buildings", icon: Building2 },
    { title: "Manage Floors", path: "/super-admin/floors", icon: Layers },
    { title: "Manage Rooms", path: "/super-admin/rooms", icon: DoorOpen },
    { title: "Manage Departments", path: "/super-admin/departments", icon: School },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage institutional infrastructure and system-wide settings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Button
                key={link.path}
                variant="outline"
                className="h-auto py-4 justify-between"
                onClick={() => (window.location.href = link.path)}
              >
                <div className="flex items-center gap-3">
                  <link.icon className="h-5 w-5" />
                  <span className="font-medium">{link.title}</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Buildings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Buildings</CardTitle>
          </CardHeader>
          <CardContent>
            {buildings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No buildings created yet</p>
            ) : (
              <div className="space-y-4">
                {buildings.slice(0, 5).map((building) => (
                  <div
                    key={building.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{building.name}</p>
                      <p className="text-sm text-muted-foreground">{building.code}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {building.floorCount || 0} floors
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
          </CardHeader>
          <CardContent>
            {departments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No departments created yet</p>
            ) : (
              <div className="space-y-4">
                {departments.slice(0, 5).map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">{dept.code}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {dept.hod ? `HOD: ${dept.hod.name}` : "No HOD assigned"}
                    </div>
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
