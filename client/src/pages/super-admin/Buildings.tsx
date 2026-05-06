import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildingService } from "@/services/building.service";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
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
import type { Building } from "@/types";

export default function Buildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    description: "",
  });

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    setIsLoading(true);
    try {
      const response = await buildingService.getAll();
      setBuildings(response.data || []);
    } catch (error: any) {
      toast.error("Failed to load buildings", {
        description: error.response?.data?.error?.message || error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await buildingService.create(formData);
      toast.success("Building created successfully");
      setIsCreateOpen(false);
      setFormData({ name: "", code: "", address: "", description: "" });
      loadBuildings();
    } catch (error: any) {
      toast.error("Failed to create building", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingBuilding) return;
    try {
      await buildingService.update(editingBuilding.id, formData);
      toast.success("Building updated successfully");
      setEditingBuilding(null);
      setFormData({ name: "", code: "", address: "", description: "" });
      loadBuildings();
    } catch (error: any) {
      toast.error("Failed to update building", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingBuilding) return;
    try {
      await buildingService.delete(deletingBuilding.id);
      toast.success("Building deleted successfully");
      setDeletingBuilding(null);
      loadBuildings();
    } catch (error: any) {
      toast.error("Failed to delete building", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const startEdit = (building: Building) => {
    setEditingBuilding(building);
    setFormData({
      name: building.name,
      code: building.code,
      address: building.address || "",
      description: building.description || "",
    });
  };

  const filteredBuildings = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading buildings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buildings</h1>
          <p className="text-muted-foreground mt-1">
            Manage campus buildings and infrastructure
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Building
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Building</DialogTitle>
              <DialogDescription>
                Add a new building to the campus infrastructure
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Building Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Academic Block A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Building Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., BA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g., Main Campus, North Wing"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the building"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Building</Button>
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
                placeholder="Search buildings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBuildings.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? "No buildings match your search" : "No buildings created yet"}
              </p>
              {!search && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first building
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredBuildings.map((building) => (
                <div
                  key={building.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{building.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {building.code} • {building.floorCount || 0} floors
                      </p>
                      {building.address && (
                        <p className="text-sm text-muted-foreground">
                          {building.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(building)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingBuilding(building)}
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
      <Dialog open={!!editingBuilding} onOpenChange={() => setEditingBuilding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Building</DialogTitle>
            <DialogDescription>Update building information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Building Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Building Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
            <Button variant="outline" onClick={() => setEditingBuilding(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Building</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBuilding} onOpenChange={() => setDeletingBuilding(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Building</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBuilding?.name}"? This action cannot be undone.
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
