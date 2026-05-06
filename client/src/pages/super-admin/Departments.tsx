import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { departmentService } from "@/services/department.service";
import { teacherService } from "@/services/teacher.service";
import { toast } from "sonner";
import {
  School,
  Plus,
  Pencil,
  Trash2,
  UserCog,
  Users,
  BookOpen,
  Search,
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
import type { Department, Teacher } from "@/types";

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [departmentsRes, teachersRes] = await Promise.all([
        departmentService.getAll(),
        teacherService.getAll(),
      ]);
      setDepartments(departmentsRes.data || []);
      setTeachers(teachersRes.data || []);
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
      await departmentService.create(formData);
      toast.success("Department created successfully");
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to create department", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingDepartment) return;
    try {
      await departmentService.update(editingDepartment.id, formData);
      toast.success("Department updated successfully");
      setEditingDepartment(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to update department", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;
    try {
      await departmentService.delete(deletingDepartment.id);
      toast.success("Department deleted successfully");
      setDeletingDepartment(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete department", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleAssignHod = async (departmentId: string, hodId: string | null) => {
    try {
      if (hodId) {
        await departmentService.assignHod(departmentId, hodId);
        toast.success("HOD assigned successfully");
      } else {
        // For unassigning, we'd need a separate endpoint
        toast.info("To remove HOD, please select a new one or contact admin");
      }
      loadData();
    } catch (error: any) {
      toast.error("Failed to assign HOD", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
    });
  };

  const startEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
    });
  };

  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-1">
            Manage academic departments and assign HODs
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Add a new academic department
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Computer Science & Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Department Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., CSE"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the department"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name || !formData.code}>
                Create Department
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
                placeholder="Search departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDepartments.length === 0 ? (
            <div className="text-center py-12">
              <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? "No departments match your search" : "No departments created yet"}
              </p>
              {!search && (
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first department
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredDepartments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <School className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>Code: {dept.code}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {dept.teacherCount || 0} teachers
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {dept.batchCount || 0} batches
                        </span>
                      </div>
                      {dept.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={dept.hodId || ""}
                        onValueChange={(v) => handleAssignHod(dept.id, v || null)}
                      >
                        <SelectTrigger className="w-[180px] h-8">
                          <SelectValue placeholder="Assign HOD..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No HOD</SelectItem>
                          {teachers
                            .filter((t) => t.departmentId === dept.id || !t.departmentId)
                            .map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.user?.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(dept)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingDepartment(dept)}
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
      <Dialog open={!!editingDepartment} onOpenChange={() => { setEditingDepartment(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Department Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Department Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingDepartment(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingDepartment} onOpenChange={() => setDeletingDepartment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDepartment?.name}"? 
              This will also delete all associated batches, sections, and data. This action cannot be undone.
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
    </div>
  );
}
