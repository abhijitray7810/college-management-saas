import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { floorService } from "@/services/floor.service";
import { roomService } from "@/services/room.service";
import { toast } from "sonner";
import {
  DoorOpen,
  Plus,
  Pencil,
  Trash2,
  Home,
  Users,
  Search,
  Monitor,
  Beaker,
  Presentation,
  Briefcase,
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
import type { Room, Floor, RoomType } from "@/types";

const ROOM_TYPES: { value: RoomType; label: string; icon: any }[] = [
  { value: "CLASSROOM", label: "Classroom", icon: Monitor },
  { value: "LAB", label: "Laboratory", icon: Beaker },
  { value: "SEMINAR_HALL", label: "Seminar Hall", icon: Presentation },
  { value: "OFFICE", label: "Office", icon: Briefcase },
];

const ROOM_FEATURES = [
  "Projector",
  "Smart Board",
  "AC",
  "Audio System",
  "Lab Equipment",
  "Computers",
];

export default function Rooms() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    floorId: "",
    code: "",
    name: "",
    type: "CLASSROOM" as RoomType,
    capacity: 30,
    features: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [floorsRes, roomsRes] = await Promise.all([
        floorService.getAll(),
        roomService.getAll(),
      ]);
      setFloors(floorsRes.data || []);
      setRooms(roomsRes.data || []);
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
      await roomService.create(formData);
      toast.success("Room created successfully");
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to create room", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingRoom) return;
    try {
      await roomService.update(editingRoom.id, formData);
      toast.success("Room updated successfully");
      setEditingRoom(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Failed to update room", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingRoom) return;
    try {
      await roomService.delete(deletingRoom.id);
      toast.success("Room deleted successfully");
      setDeletingRoom(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete room", {
        description: error.response?.data?.error?.message || error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      floorId: "",
      code: "",
      name: "",
      type: "CLASSROOM",
      capacity: 30,
      features: [],
    });
  };

  const startEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      floorId: room.floorId,
      code: room.code,
      name: room.name || "",
      type: room.type,
      capacity: room.capacity,
      features: room.features || [],
    });
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const getRoomIcon = (type: RoomType) => {
    const roomType = ROOM_TYPES.find((t) => t.value === type);
    return roomType?.icon || Monitor;
  };

  const filteredRooms = rooms.filter(
    (r) =>
      (r.name || r.code).toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground mt-1">
            Manage classrooms, labs, and seminar halls
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
              <DialogDescription>
                Add a new room to a floor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor *</Label>
                <Select
                  value={formData.floorId}
                  onValueChange={(v) => setFormData({ ...formData, floorId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name || `Floor ${f.floorNumber}`} ({f.building?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Room Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., 101, LAB-A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Computer Lab 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Room Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as RoomType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={500}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROOM_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={formData.features.includes(feature)}
                        onCheckedChange={() => toggleFeature(feature)}
                      />
                      <Label htmlFor={feature} className="text-sm cursor-pointer">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.floorId || !formData.code}>
                Create Room
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
                placeholder="Search rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRooms.length === 0 ? (
            <div className="text-center py-12">
              <DoorOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? "No rooms match your search" : "No rooms created yet"}
              </p>
              {!search && (
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first room
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredRooms.map((room) => {
                const RoomIcon = getRoomIcon(room.type);
                return (
                  <div
                    key={room.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <RoomIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {room.name || room.code}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {room.floor?.building?.name}, {room.floor?.name || `Floor ${room.floor?.floorNumber}`}
                          </span>
                          <span>•</span>
                          <span>{ROOM_TYPES.find(t => t.value === room.type)?.label}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {room.capacity} seats
                          </span>
                        </div>
                        {room.features && room.features.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {room.features.map((feature) => (
                              <span
                                key={feature}
                                className="text-xs px-2 py-1 bg-secondary rounded-full"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(room)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingRoom(room)}
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
      <Dialog open={!!editingRoom} onOpenChange={() => { setEditingRoom(null); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>Update room information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-floor">Floor</Label>
              <Select
                value={formData.floorId}
                onValueChange={(v) => setFormData({ ...formData, floorId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name || `Floor ${f.floorNumber}`} ({f.building?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Room Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Room Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Room Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as RoomType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button variant="outline" onClick={() => { setEditingRoom(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRoom} onOpenChange={() => setDeletingRoom(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingRoom?.name || deletingRoom?.code}"? 
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
