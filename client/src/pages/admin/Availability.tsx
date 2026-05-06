import { useState, useEffect } from "react";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { teacherService } from "@/services/teacher.service";
import { roomService } from "@/services/room.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Users, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { useAvailabilityStore } from "@/store/availabilityStore";
import type { Teacher, Room } from "@/types";

// Constants for availability grid
const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
const TIME_SLOTS = [
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
];

// Map availability data to grid format
type GridData = Record<string, Record<string, boolean>>;

function AvailabilityPage({ kind }: { kind: "teachers" | "rooms" }) {
  const [list, setList] = useState<(Teacher | Room)[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [gridData, setGridData] = useState<GridData>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  
  const { 
    teacherAvailability, 
    roomAvailability, 
    isLoading, 
    fetchTeacherAvailability, 
    fetchRoomAvailability,
    toggleTeacherSlot,
    toggleRoomSlot 
  } = useAvailabilityStore();

  // Load teachers/rooms list on mount
  useEffect(() => {
    loadList();
  }, [kind]);

  // Load availability when selection changes
  useEffect(() => {
    if (!selectedId) return;
    
    if (kind === "teachers") {
      fetchTeacherAvailability(selectedId);
    } else {
      fetchRoomAvailability(selectedId);
    }
  }, [selectedId, kind]);

  const loadList = async () => {
    try {
      setIsLoadingList(true);
      if (kind === "teachers") {
        const response = await teacherService.getAll();
        if (response.success) {
          setList(response.data || []);
          if (response.data?.[0]) {
            setSelectedId(response.data[0].id);
          }
        }
      } else {
        const response = await roomService.getAll();
        if (response.success) {
          setList(response.data || []);
          if (response.data?.[0]) {
            setSelectedId(response.data[0].id);
          }
        }
      }
    } catch (error: any) {
      toast.error(`Failed to load ${kind}`, { description: error.message });
    } finally {
      setIsLoadingList(false);
    }
  };

  // Convert API data to grid format
  useEffect(() => {
    const availability = kind === "teachers" 
      ? teacherAvailability[selectedId] 
      : roomAvailability[selectedId];
    
    if (!availability) {
      // Initialize empty grid
      const empty: GridData = {};
      DAYS.forEach(day => {
        empty[day] = {};
        TIME_SLOTS.forEach(slot => {
          empty[day][slot] = false;
        });
      });
      setGridData(empty);
      return;
    }

    // Convert availability slots to grid
    const grid: GridData = {};
    DAYS.forEach(day => {
      grid[day] = {};
      TIME_SLOTS.forEach(slot => {
        grid[day][slot] = false;
      });
    });

    availability.forEach(slot => {
      const timeKey = `${slot.timeSlot.startTime}-${slot.timeSlot.endTime}`;
      if (grid[slot.timeSlot.day]) {
        grid[slot.timeSlot.day][timeKey] = slot.status === "BUSY";
      }
    });

    setGridData(grid);
    setHasChanges(false);
  }, [teacherAvailability, roomAvailability, selectedId, kind]);

  const handleToggle = async (day: string, slot: string) => {
    // Optimistic update
    setGridData(prev => ({
      ...prev,
      [day]: { ...prev[day], [slot]: !prev[day]?.[slot] }
    }));
    setHasChanges(true);

    // Find the timeSlotId for this day/slot
    const availability = kind === "teachers" 
      ? teacherAvailability[selectedId] 
      : roomAvailability[selectedId];
    
    const timeSlot = availability?.find(
      a => a.timeSlot.day === day && 
           `${a.timeSlot.startTime}-${a.timeSlot.endTime}` === slot
    );

    if (timeSlot) {
      try {
        if (kind === "teachers") {
          await toggleTeacherSlot(selectedId, timeSlot.timeSlotId, timeSlot.status);
        } else {
          await toggleRoomSlot(selectedId, timeSlot.timeSlotId, timeSlot.status);
        }
        toast.success("Availability updated");
        setHasChanges(false);
      } catch (error: any) {
        toast.error("Failed to update", { description: error.message });
        // Revert on error
        setGridData(prev => ({
          ...prev,
          [day]: { ...prev[day], [slot]: !prev[day]?.[slot] }
        }));
      }
    }
  };

  const selectedItem = list.find(x => x.id === selectedId);
  
  // Get display name based on type
  const getItemDisplayName = (item: Teacher | Room | undefined) => {
    if (!item) return "";
    if (kind === "teachers") {
      const teacher = item as Teacher;
      return teacher.user?.name || teacher.employeeId || "Unknown";
    }
    const room = item as Room;
    return `${room.code} - ${room.name}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {kind === "teachers" ? "Teacher" : "Room"} Availability
          </h1>
          <p className="text-sm text-muted-foreground">
            Mark BUSY slots to prevent assignment conflicts during routine generation.
          </p>
        </div>
        {hasChanges && (
          <Button variant="outline" size="sm">
            <Save className="mr-2 size-4" />
            Unsaved Changes
          </Button>
        )}
      </div>

      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {kind === "teachers" ? <Users className="size-5" /> : <DoorOpen className="size-5" />}
            Select {kind === "teachers" ? "Teacher" : "Room"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingList ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading {kind}...
            </div>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No {kind} found. Please add {kind} first.
            </p>
          ) : (
            <>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder={`Select ${kind === "teachers" ? "a teacher" : "a room"}`} />
                </SelectTrigger>
                <SelectContent>
                  {list.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {getItemDisplayName(x)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedItem && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Currently viewing: <span className="font-medium">{getItemDisplayName(selectedItem)}</span>
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Availability Grid */}
      {isLoading || isLoadingList ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : list.length > 0 ? (
        <AvailabilityGrid 
          busy={gridData} 
          onToggle={handleToggle} 
        />
      ) : null}
    </div>
  );
}

export const TeacherAvailability = () => <AvailabilityPage kind="teachers" />;
export const RoomAvailability = () => <AvailabilityPage kind="rooms" />;
