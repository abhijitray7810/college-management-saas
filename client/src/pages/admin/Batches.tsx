import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { batchService } from "@/services/batch.service";
import { departmentService } from "@/services/department.service";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Search,
  Users,
  Layers,
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
import type { Batch, Department } from "@/types";

export default function Batches() {
  const { user, isSuperAdmin } = useAuthStore();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    year: 1,
    academicYear: "2024-2025",
    departmentId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [batchesRes, departmentsRes] = await Promise.all([
        batchService.getAll(),
        departmentService.getAll(),
      ]);

      setBatches(batchesRes.data || []);
      setDepartments(departmentsRes.data || []);

      // Pre-select department for HOD
      if (!isSuperAdmin() && user?.role === "ADMIN" && departmentsRes.data?.length > 0) {
        const myDept = departmentsRes.data.find((d) => d.hodId === user.id);
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
      await batchService.create(formData);
      toast.success("Batch created successfully");
      setIsCreateOpen(false);
      setFormData({
        name: "",
        year: 1,
        academicYear: "2024-2025",
        departmentId: "",
        startDate: "",
        endDate: "",
      });
      loadData();
    } catch (error: any) {
      toast.error("Failed to create batch", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingBatch) return;
    try {
      await batchService.update(editingBatch.id, formData);
      toast.success("Batch updated successfully");
      setEditingBatch(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to update batch", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingBatch) return;
    try {
      await batchService.delete(deletingBatch.id);
      toast.success("Batch deleted successfully");
      setDeletingBatch(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete batch", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const startEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      year: batch.year,
      academicYear: batch.academicYear,
      departmentId: batch.departmentId,
      startDate: batch.startDate || "",
      endDate: batch.endDate || "",
    });
  };

  const filteredBatches = batches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.academicYear.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
          <p className="text-muted-foreground mt-1">
            Manage academic batches (years) for your department
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>
                Add a new academic batch for a department
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 2024-2028 Batch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select
                  value={String(formData.year)}
                  onValueChange={(v) => setFormData({ ...formData, year: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="e.g., 2024-2025"
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
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Batch</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredBatches.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? "No batches match your search" : "No batches created yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{batch.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {batch.year}{batch.year === 1 ? "st" : batch.year === 2 ? "nd" : batch.year === 3 ? "rd" : "th"} Year • {batch.academicYear}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {batch.department?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Layers className="h-4 w-4" />
                      {batch.sectionCount || 0} sections
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {batch.studentCount || 0} students
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(batch)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingBatch(batch)}
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
      <Dialog open={!!editingBatch} onOpenChange={() => setEditingBatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>Update batch information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Batch Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-year">Year</Label>
              <Select
                value={String(formData.year)}
                onValueChange={(v) => setFormData({ ...formData, year: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-academicYear">Academic Year</Label>
              <Input
                id="edit-academicYear"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBatch(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Batch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBatch} onOpenChange={() => setDeletingBatch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBatch?.name}"? This will also delete all associated sections.
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
