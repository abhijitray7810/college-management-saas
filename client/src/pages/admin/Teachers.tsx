import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { teacherService } from "@/services/teacher.service";
import { departmentService } from "@/services/department.service";
import { availabilityService } from "@/services/availability.service";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Mail,
  Building2,
  Award,
  Calendar,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Teacher, Department } from "@/types";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const TIME_SLOTS = [
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
];

export default function Teachers() {
  const { user, isSuperAdmin } = useAuthStore();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [availabilityTeacher, setAvailabilityTeacher] = useState<Teacher | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    designation: "Assistant Professor",
    specialization: "",
    departmentId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [teachersRes, departmentsRes] = await Promise.all([
        teacherService.getAll(),
        departmentService.getAll(),
      ]);
      setTeachers(teachersRes.data || []);
      setDepartments(departmentsRes.data || []);

      // Pre-select department for HOD
      if (!isSuperAdmin() && user?.role === "ADMIN") {
        const myDept = departmentsRes.data?.find((d) => d.hodId === user.id);
        if (myDept) {
          setFormData((prev) => ({ ...prev, departmentId: myDept.id }));
        }
      }
    } catch (error: any) {
      toast.error("Failed to load data", {
        description: error.response?.data?.error?.message || error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await teacherService.create(formData);
      toast.success("Teacher created successfully");
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to create teacher", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingTeacher) return;
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        employeeId: formData.employeeId,
        designation: formData.designation,
        specialization: formData.specialization,
        departmentId: formData.departmentId,
      };
      await teacherService.update(editingTeacher.id, updateData);
      toast.success("Teacher updated successfully");
      setEditingTeacher(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to update teacher", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingTeacher) return;
    try {
      await teacherService.delete(deletingTeacher.id);
      toast.success("Teacher deleted successfully");
      setDeletingTeacher(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete teacher", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const openAvailability = async (teacher: Teacher) => {
    setAvailabilityTeacher(teacher);
    // Load availability (simplified - in real app, fetch from API)
    setAvailabilitySlots({});
  };

  const toggleSlot = (day: string, slot: string) => {
    const key = `${day}-${slot}`;
    setAvailabilitySlots((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      employeeId: "",
      designation: "Assistant Professor",
      specialization: "",
      departmentId: isSuperAdmin() ? "" : formData.departmentId,
    });
  };

  const startEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.user?.name || "",
      email: teacher.user?.email || "",
      password: "",
      employeeId: teacher.employeeId,
      designation: teacher.designation,
      specialization: teacher.specialization || "",
      departmentId: teacher.departmentId || "",
    });
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">
            Manage teachers, departments, and availability
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Teacher</DialogTitle>
              <DialogDescription>
                Add a new teacher to the faculty
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Dr. Rajesh Kumar"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., rajesh.kumar@college.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 8 characters"
                />
              </div>
              {isSuperAdmin() && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Department</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="e.g., EMP001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Select
                  value={formData.designation}
                  onValueChange={(v) => setFormData({ ...formData, designation: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professor">Professor</SelectItem>
                    <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                    <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                    <SelectItem value="Lecturer">Lecturer</SelectItem>
                    <SelectItem value="Visiting Faculty">Visiting Faculty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g., Machine Learning, Database Systems"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name || !formData.email || !formData.password || !formData.employeeId}>
                Create Teacher
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? "No teachers match your search" : "No teachers created yet"}
              </p>
              {!search && (
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first teacher
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{teacher.user?.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {teacher.employeeId}
                        </span>
                        <span>•</span>
                        <span>{teacher.designation}</span>
                        {teacher.department && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {teacher.department.name}
                            </span>
                          </>
                        )}
                      </div>
                      {teacher.specialization && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Specialization: {teacher.specialization}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAvailability(teacher)}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Availability
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(teacher)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingTeacher(teacher)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTeacher} onOpenChange={() => { setEditingTeacher(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update teacher information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            {isSuperAdmin() && (
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Department</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-employeeId">Employee ID</Label>
              <Input
                id="edit-employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-designation">Designation</Label>
              <Select
                value={formData.designation}
                onValueChange={(v) => setFormData({ ...formData, designation: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professor">Professor</SelectItem>
                  <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                  <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                  <SelectItem value="Lecturer">Lecturer</SelectItem>
                  <SelectItem value="Visiting Faculty">Visiting Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingTeacher(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTeacher} onOpenChange={() => setDeletingTeacher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTeacher?.user?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Availability Sheet */}
      <Sheet open={!!availabilityTeacher} onOpenChange={() => setAvailabilityTeacher(null)}>
        <SheetContent className="w-[600px] sm:w-[800px]">
          <SheetHeader>
            <SheetTitle>Teacher Availability</SheetTitle>
            <SheetDescription>
              Set available time slots for {availabilityTeacher?.user?.name}
              <br />
              <span className="text-xs">Green = Available, Red = Busy/Unavailable</span>
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <div className="grid grid-cols-7 gap-2">
              <div className="text-xs font-medium text-muted-foreground">Time / Day</div>
              {DAYS.map((day) => (
                <div key={day} className="text-xs font-medium text-center">
                  {day.slice(0, 3)}
                </div>
              ))}
              {TIME_SLOTS.map((slot) => (
                <>
                  <div key={`time-${slot}`} className="text-xs text-muted-foreground py-2">
                    {slot}
                  </div>
                  {DAYS.map((day) => {
                    const key = `${day}-${slot}`;
                    const isAvailable = availabilitySlots[key];
                    return (
                      <button
                        key={key}
                        className={`h-10 rounded text-xs transition-colors ${
                          isAvailable
                            ? "bg-green-100 hover:bg-green-200 text-green-800"
                            : "bg-red-100 hover:bg-red-200 text-red-800"
                        }`}
                        onClick={() => toggleSlot(day, slot)}
                      >
                        {isAvailable ? "Free" : "Busy"}
                      </button>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
