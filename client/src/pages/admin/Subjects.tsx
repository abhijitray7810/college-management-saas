import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subjectService } from "@/services/subject.service";
import { teacherService } from "@/services/teacher.service";
import { batchService } from "@/services/batch.service";
import { departmentService } from "@/services/department.service";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Users,
  GraduationCap,
  Search,
  Clock,
  Beaker,
  BookText,
  Projector,
  UserPlus,
  Check,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Subject, Teacher, Batch, Department } from "@/types";

const SUBJECT_TYPES = [
  { value: "THEORY", label: "Theory", icon: BookText },
  { value: "LAB", label: "Laboratory", icon: Beaker },
  { value: "PROJECT", label: "Project", icon: Projector },
];

export default function Subjects() {
  const { user, isSuperAdmin } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [assigningSubject, setAssigningSubject] = useState<Subject | null>(null);
  const [assigningBatch, setAssigningBatch] = useState<Batch | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [hoursPerWeek, setHoursPerWeek] = useState(3);

  // Form state
  const [formData, setFormData] = useState({
    departmentId: "",
    code: "",
    name: "",
    credits: 3,
    type: "THEORY" as "THEORY" | "LAB" | "PROJECT",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subjectsRes, teachersRes, batchesRes, departmentsRes] = await Promise.all([
        subjectService.getAll(),
        teacherService.getAll(),
        batchService.getAll(),
        departmentService.getAll(),
      ]);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);
      setBatches(batchesRes.data || []);
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
      await subjectService.create(formData);
      toast.success("Subject created successfully");
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to create subject", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingSubject) return;
    try {
      await subjectService.update(editingSubject.id, formData);
      toast.success("Subject updated successfully");
      setEditingSubject(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to update subject", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingSubject) return;
    try {
      await subjectService.delete(deletingSubject.id);
      toast.success("Subject deleted successfully");
      setDeletingSubject(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete subject", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleAssignTeachers = async () => {
    if (!assigningSubject) return;
    try {
      await subjectService.assignTeachers(assigningSubject.id, {
        teachers: selectedTeachers.map((id) => ({ teacherId: id, isPrimary: selectedTeachers[0] === id })),
      });
      toast.success(`${selectedTeachers.length} teachers assigned successfully`);
      setAssigningSubject(null);
      setSelectedTeachers([]);
      loadData();
    } catch (error: any) {
      toast.error("Failed to assign teachers", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleAssignToBatch = async () => {
    if (!assigningSubject || !assigningBatch) return;
    try {
      await batchService.assignSubjects(assigningBatch.id, {
        subjects: [{ subjectId: assigningSubject.id, hoursPerWeek }],
      });
      toast.success(`Subject assigned to ${assigningBatch.name} with ${hoursPerWeek} hours/week`);
      setAssigningBatch(null);
      setAssigningSubject(null);
      setHoursPerWeek(3);
    } catch (error: any) {
      toast.error("Failed to assign to batch", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      departmentId: formData.departmentId,
      code: "",
      name: "",
      credits: 3,
      type: "THEORY",
      description: "",
    });
  };

  const startEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      departmentId: subject.departmentId || "",
      code: subject.code,
      name: subject.name,
      credits: subject.credits,
      type: subject.type,
      description: subject.description || "",
    });
  };

  const openAssignTeachers = (subject: Subject) => {
    setAssigningSubject(subject);
    setSelectedTeachers([]);
  };

  const openAssignToBatch = (subject: Subject) => {
    setAssigningSubject(subject);
    setAssigningBatch(null);
    setHoursPerWeek(subject.type === "LAB" ? 4 : 3);
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const getSubjectIcon = (type: string) => {
    const t = SUBJECT_TYPES.find((st) => st.value === type);
    return t?.icon || BookOpen;
  };

  const getSubjectBadgeColor = (type: string) => {
    switch (type) {
      case "THEORY":
        return "bg-blue-100 text-blue-800";
      case "LAB":
        return "bg-purple-100 text-purple-800";
      case "PROJECT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1">
            Manage subjects, assign teachers, and assign to batches
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
              <DialogDescription>
                Add a new subject to the curriculum
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {isSuperAdmin() && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
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
                <Label htmlFor="code">Subject Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., CS101, PHY301"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Data Structures"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as "THEORY" | "LAB" | "PROJECT" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the subject"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={(!isSuperAdmin() && !formData.departmentId) || !formData.code || !formData.name}>
                Create Subject
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
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? "No subjects match your search" : "No subjects created yet"}
              </p>
              {!search && (
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first subject
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredSubjects.map((subject) => {
                const SubjectIcon = getSubjectIcon(subject.type);
                return (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <SubjectIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{subject.name}</p>
                          <Badge className={getSubjectBadgeColor(subject.type)}>
                            {subject.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>Code: {subject.code}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {subject.credits} credits
                          </span>
                          {subject.department && (
                            <>
                              <span>•</span>
                              <span>{subject.department.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignTeachers(subject)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Teachers
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignToBatch(subject)}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Add to Batch
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(subject)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSubject(subject)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSubject} onOpenChange={() => { setEditingSubject(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update subject information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isSuperAdmin() && (
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              <Label htmlFor="edit-code">Subject Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Subject Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-credits">Credits</Label>
                <Input
                  id="edit-credits"
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as "THEORY" | "LAB" | "PROJECT" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingSubject(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSubject} onOpenChange={() => setDeletingSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSubject?.name}"? 
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

      {/* Assign Teachers Sheet */}
      <Sheet open={!!assigningSubject && !assigningBatch} onOpenChange={() => { setAssigningSubject(null); setSelectedTeachers([]); }}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Assign Teachers</SheetTitle>
            <SheetDescription>
              Assign teachers to {assigningSubject?.name}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Selected: {selectedTeachers.length} teachers
            </p>
            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              {teachers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>No teachers available</p>
                </div>
              ) : (
                <div className="divide-y">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
                      onClick={() => toggleTeacher(teacher.id)}
                    >
                      <Checkbox
                        checked={selectedTeachers.includes(teacher.id)}
                        onCheckedChange={() => toggleTeacher(teacher.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{teacher.user?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {teacher.designation} • {teacher.department?.name || "No department"}
                        </p>
                      </div>
                      {selectedTeachers[0] === teacher.id && (
                        <Badge variant="secondary">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="w-full"
              disabled={selectedTeachers.length === 0}
              onClick={handleAssignTeachers}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign {selectedTeachers.length} Teachers
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Assign to Batch Sheet */}
      <Sheet open={!!assigningSubject && !!assigningBatch || !!assigningSubject && assigningBatch === null} onOpenChange={() => { setAssigningSubject(null); setAssigningBatch(null); }}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Assign to Batch</SheetTitle>
            <SheetDescription>
              Assign {assigningSubject?.name} to a batch with hours per week
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {!assigningBatch ? (
              <>
                <Label>Select Batch</Label>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  {batches.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <GraduationCap className="h-8 w-8 mx-auto mb-2" />
                      <p>No batches available</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {batches.map((batch) => (
                        <div
                          key={batch.id}
                          className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer"
                          onClick={() => setAssigningBatch(batch)}
                        >
                          <div>
                            <p className="font-medium">{batch.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {batch.year} Year • {batch.department?.name}
                            </p>
                          </div>
                          <Check className="h-4 w-4 text-muted-foreground opacity-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Button variant="ghost" size="sm" onClick={() => setAssigningBatch(null)}>
                    ← Back
                  </Button>
                  <span>Selected: {assigningBatch.name}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours per Week</Label>
                  <Input
                    id="hours"
                    type="number"
                    min={1}
                    max={10}
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Recommended: {assigningSubject?.type === "LAB" ? "3-4 hours" : "2-3 hours"}
                  </p>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={handleAssignToBatch}
                >
                  Assign Subject
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
