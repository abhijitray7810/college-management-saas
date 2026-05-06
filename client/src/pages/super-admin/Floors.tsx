import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildingService } from "@/services/building.service";
import { floorService } from "@/services/floor.service";
import { departmentService } from "@/services/department.service";
import { toast } from "sonner";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Building2,
  School,
  Search,
  Home,
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
import type { Building, Floor, Department } from "@/types";

export default function Floors() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    buildingId: "",
    floorNumber: 1,
    name: "",
    description: "",
    departmentId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [buildingsRes, floorsRes, departmentsRes] = await Promise.all([
        buildingService.getAll(),
        floorService.getAll(),
        departmentService.getAll(),
      ]);
      setBuildings(buildingsRes.data || []);
      setFloors(floorsRes.data || []);
      setDepartments(departmentsRes.data || []);
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
      const dataToSend = {
        ...formData,
        departmentId: formData.departmentId || undefined,
      };
      await floorService.create(dataToSend);
      toast.success("Floor created successfully");
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to create floor", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingFloor) return;
    try {
      const dataToSend = {
        ...formData,
        departmentId: formData.departmentId || undefined,
      };
      await floorService.update(editingFloor.id, dataToSend);
      toast.success("Floor updated successfully");
      setEditingFloor(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to update floor", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingFloor) return;
    try {
      await floorService.delete(deletingFloor.id);
      toast.success("Floor deleted successfully");
      setDeletingFloor(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete floor", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleAssignDepartment = async (floorId: string, departmentId: string | null) => {
    try {
      if (departmentId) {
        await floorService.assignToDepartment(floorId, departmentId);
        toast.success("Department assigned successfully");
      } else {
        await floorService.unassignFromDepartment(floorId);
        toast.success("Department unassigned");
      }
      loadData();
    } catch (error: any) {
      toast.error("Failed to assign department", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      buildingId: "",
      floorNumber: 1,
      name: "",
      description: "",
      departmentId: "",
    });
  };

  const startEdit = (floor: Floor) => {
    setEditingFloor(floor);
    setFormData({
      buildingId: floor.buildingId,
      floorNumber: floor.floorNumber,
      name: floor.name || "",
      description: floor.description || "",
      departmentId: floor.departmentId || "",
    });
  };

  const filteredFloors = floors.filter(
    (f) =>
      (f.name || `Floor ${f.floorNumber}`).toLowerCase().includes(search.toLowerCase()) ||
      f.building?.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading floors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Floors</h1>
          <p className="text-muted-foreground mt-1">
            Manage building floors and assign departments
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Floor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Floor</DialogTitle>
              <DialogDescription>
                Add a new floor to a building
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="building">Building *</Label>
                <Select
                  value={formData.buildingId}
                  onValueChange={(v) => setFormData({ ...formData, buildingId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="floorNumber">Floor Number *</Label>
                <Input
                  id="floorNumber"
                  type="number"
                  min={0}
                  max={20}
                  value={formData.floorNumber}
                  onChange={(e) => setFormData({ ...formData, floorNumber: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Floor Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ground Floor, First Floor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Assign to Department (Optional)</Label>
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
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.buildingId}>
                Create Floor
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
                placeholder="Search floors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFloors.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? "No floors match your search" : "No floors created yet"}
              </p>
              {!search && (
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first floor
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredFloors.map((floor) => (
                <div
                  key={floor.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {floor.name || `Floor ${floor.floorNumber}`}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {floor.building?.name}
                        </span>
                        {floor.department && (
                          <span className="flex items-center gap-1">
                            <School className="h-3 w-3" />
                            {floor.department.name}
                          </span>
                        )}
                      </div>
                      {floor.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {floor.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={floor.departmentId || ""}
                      onValueChange={(v) => handleAssignDepartment(floor.id, v || null)}
                    >
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Assign dept..." />
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(floor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingFloor(floor)}
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
      <Dialog open={!!editingFloor} onOpenChange={() => { setEditingFloor(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Floor</DialogTitle>
            <DialogDescription>Update floor information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-building">Building</Label>
              <Select
                value={formData.buildingId}
                onValueChange={(v) => setFormData({ ...formData, buildingId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-floorNumber">Floor Number</Label>
              <Input
                id="edit-floorNumber"
                type="number"
                value={formData.floorNumber}
                onChange={(e) => setFormData({ ...formData, floorNumber: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Floor Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingFloor(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Floor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingFloor} onOpenChange={() => setDeletingFloor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Floor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingFloor?.name || `Floor ${deletingFloor?.floorNumber}`}"? 
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
    </div>
  );
}
