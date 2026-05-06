import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sectionService } from "@/services/section.service";
import { batchService } from "@/services/batch.service";
import { studentService } from "@/services/student.service";
import { toast } from "sonner";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  Search,
  UserPlus,
  GraduationCap,
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import type { Section, Batch, Student } from "@/types";

export default function Sections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);
  const [assigningSection, setAssigningSection] = useState<Section | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    batchId: "",
    name: "",
    capacity: 60,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sectionsRes, batchesRes, studentsRes] = await Promise.all([
        sectionService.getAll(),
        batchService.getAll(),
        studentService.getAll(),
      ]);
      setSections(sectionsRes.data || []);
      setBatches(batchesRes.data || []);
      setStudents(studentsRes.data || []);
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
      await sectionService.create(formData);
      toast.success("Section created successfully");
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to create section", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingSection) return;
    try {
      await sectionService.update(editingSection.id, formData);
      toast.success("Section updated successfully");
      setEditingSection(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to update section", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingSection) return;
    try {
      await sectionService.delete(deletingSection.id);
      toast.success("Section deleted successfully");
      setDeletingSection(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete section", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleAssignStudents = async () => {
    if (!assigningSection) return;
    try {
      await sectionService.assignStudents(assigningSection.id, selectedStudents);
      toast.success(`${selectedStudents.length} students assigned successfully`);
      setAssigningSection(null);
      setSelectedStudents([]);
      loadData();
    } catch (error: any) {
      toast.error("Failed to assign students", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      batchId: "",
      name: "",
      capacity: 60,
    });
  };

  const startEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({
      batchId: section.batchId,
      name: section.name,
      capacity: section.capacity,
    });
  };

  const openAssignStudents = (section: Section) => {
    setAssigningSection(section);
    setSelectedStudents([]);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredSections = sections.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.batch?.name.toLowerCase().includes(search.toLowerCase())
  );

  const unassignedStudents = students.filter(
    (s) => !s.batchId || s.batchId === assigningSection?.batchId
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sections</h1>
          <p className="text-muted-foreground mt-1">
            Manage class sections and assign students
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
              <DialogDescription>
                Add a new section to a batch
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="batch">Batch *</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(v) => setFormData({ ...formData, batchId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.year} Year)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Section Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., A, B, C"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={200}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.batchId || !formData.name}>
                Create Section
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
                placeholder="Search sections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSections.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? "No sections match your search" : "No sections created yet"}
              </p>
              {!search && (
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first section
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredSections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{section.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {section.batch?.name}
                        </span>
                        <span>•</span>
                        <span>{section.batch?.department?.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {section.studentCount || 0} / {section.capacity} students
                        </span>
                        <span>•</span>
                        <span>
                          {((section.studentCount || 0) / section.capacity * 100).toFixed(0)}% full
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAssignStudents(section)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign Students
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(section)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingSection(section)}
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
      <Dialog open={!!editingSection} onOpenChange={() => { setEditingSection(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>Update section information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-batch">Batch</Label>
              <Select
                value={formData.batchId}
                onValueChange={(v) => setFormData({ ...formData, batchId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.year} Year)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Section Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingSection(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSection} onOpenChange={() => setDeletingSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete section "{deletingSection?.name}"? 
              This will also remove all student assignments. This action cannot be undone.
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

      {/* Assign Students Sheet */}
      <Sheet open={!!assigningSection} onOpenChange={() => { setAssigningSection(null); setSelectedStudents([]); }}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Assign Students</SheetTitle>
            <SheetDescription>
              Assign students to {assigningSection?.name} ({assigningSection?.batch?.name})
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Selected: {selectedStudents.length} students
            </p>
            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              {unassignedStudents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2" />
                  <p>No unassigned students available</p>
                </div>
              ) : (
                <div className="divide-y">
                  {unassignedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
                      onClick={() => toggleStudent(student.id)}
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <div>
                        <p className="font-medium">{student.user?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Roll: {student.rollNumber}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="w-full"
              disabled={selectedStudents.length === 0}
              onClick={handleAssignStudents}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign {selectedStudents.length} Students
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
