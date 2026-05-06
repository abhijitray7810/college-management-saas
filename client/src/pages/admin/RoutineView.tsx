import { useState, useEffect } from "react";
import { useRoutineStore } from "@/store/routineStore";
import { TimetableGrid } from "@/components/TimetableGrid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeftRight, Download, Send, Lock, Unlock, Loader2, CheckCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { exportService } from "@/services/export.service";
import { routineService } from "@/services/routine.service";
import { availabilityService } from "@/services/availability.service";
import { teacherService } from "@/services/teacher.service";
import { roomService } from "@/services/room.service";
import { timeSlotService } from "@/services/timeSlot.service";
import type { RoutineCell } from "@/types";
import type { Teacher, Room, TimeSlot } from "@/types";

// Constants
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

export default function RoutineView() {
  const { routine, status, sectionId, entries, updateCell, toggleLock, swap, setStatus, loadBySection } = useRoutineStore();
  const [editing, setEditing] = useState<{ day: string; slot: string; cell: RoutineCell | null } | null>(null);
  const [swapMode, setSwapMode] = useState(false);
  const [sel, setSel] = useState<{ day: string; slot: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Real data from APIs
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [availableRooms, setAvailableRooms] = useState<Array<{ id: string; name: string }>>([]);

  // Load base data on mount
  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    try {
      const [teachersRes, roomsRes, timeSlotsRes] = await Promise.all([
        teacherService.getAll(),
        roomService.getAll(),
        timeSlotService.getAll(),
      ]);
      
      if (teachersRes.success) setAllTeachers(teachersRes.data || []);
      if (roomsRes.success) setAllRooms(roomsRes.data || []);
      if (timeSlotsRes.success) setAllTimeSlots(timeSlotsRes.data || []);
    } catch (error) {
      console.error("Failed to load base data:", error);
    }
  };

  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Routine Available</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Generate a routine first using the Generate Routine page.
        </p>
      </div>
    );
  }

  const onCellClick = async (day: string, slot: string, cell: RoutineCell | null) => {
    if (swapMode) {
      const next = [...sel, { day, slot }];
      if (next.length === 2) {
        await handleSwap(next[0], next[1]);
        setSel([]); setSwapMode(false);
      } else setSel(next);
      return;
    }
    
    // Load available teachers/rooms for this time slot
    if (cell?.routineId) {
      await loadAvailableResources(day, slot);
    }
    
    setEditing({ day, slot, cell });
  };

  const loadAvailableResources = async (day: string, slot: string) => {
    // Find time slot ID based on day and slot
    const timeSlotId = findTimeSlotId(day, slot);
    if (!timeSlotId) return;

    try {
      const [teachersRes, roomsRes] = await Promise.all([
        availabilityService.getAvailableTeachers(timeSlotId),
        availabilityService.getAvailableRooms(timeSlotId),
      ]);
      
      // Map to dropdown format
      const teachers = teachersRes.data.map(t => ({
        id: t.id,
        name: t.user.name,
      }));
      const rooms = roomsRes.data.map(r => ({
        id: r.id,
        name: `${r.code} - ${r.name}`,
      }));
      
      setAvailableTeachers(
        teachers.length > 0
          ? teachers
          : allTeachers.map((t) => ({ id: t.id, name: t.user?.name || t.employeeId }))
      );
      setAvailableRooms(
        rooms.length > 0
          ? rooms
          : allRooms.map((r) => ({ id: r.id, name: `${r.code} - ${r.name}` }))
      );
    } catch (error) {
      // Fallback to all data
      setAvailableTeachers(allTeachers.map(t => ({ 
        id: t.id, 
        name: t.user?.name || t.employeeId 
      })));
      setAvailableRooms(allRooms.map(r => ({ 
        id: r.id, 
        name: `${r.code} - ${r.name}` 
      })));
    }
  };

  const findTimeSlotId = (day: string, slot: string) => {
    // Map day+slot to real timeSlotId from backend
    const [startTime] = slot.split("-");
    const timeSlot = allTimeSlots.find(
      ts => ts.day === day && ts.startTime === startTime
    );
    return timeSlot?.id || null;
  };

  const handleSave = async () => {
    if (!editing) return;
    
    const routineId = editing.cell?.routineId;
    if (!routineId) {
      // New slot assignment
      updateCell(editing.day, editing.slot, editing.cell);
      toast.success("Slot updated");
      setEditing(null);
      return;
    }

    setIsLoading(true);
    try {
      // Find IDs from selected names
      const teacherId = availableTeachers.find(t => t.name === editing.cell?.teacher)?.id;
      const roomId = availableRooms.find(r => r.name.includes(editing.cell?.room || ""))?.id;
      const timeSlotId = findTimeSlotId(editing.day, editing.slot);

      await routineService.update(routineId, {
        teacherId,
        roomId,
        timeSlotId,
        notes: `Manual update on ${new Date().toISOString()}`,
      });

      updateCell(editing.day, editing.slot, editing.cell);
      toast.success("Slot updated successfully");
      setEditing(null);
    } catch (error: any) {
      toast.error("Failed to update slot", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = async (a: { day: string; slot: string }, b: { day: string; slot: string }) => {
    const routineA = routine[a.day]?.[a.slot]?.routineId;
    const routineB = routine[b.day]?.[b.slot]?.routineId;

    if (!routineA || !routineB) {
      toast.error("Both slots must have routines to swap");
      return;
    }

    setIsLoading(true);
    try {
      await routineService.swap(routineA, routineB);
      swap(a, b);
      toast.success("Slots swapped successfully");
    } catch (error: any) {
      toast.error("Failed to swap slots", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLock = async (day: string, slot: string) => {
    const cell = routine[day]?.[slot];
    if (!cell?.routineId) {
      toast.error("No routine to lock/unlock");
      return;
    }

    setIsLoading(true);
    try {
      await routineService.lock(cell.routineId, !cell.locked);
      toggleLock(day, slot);
      toast.success(cell.locked ? "Slot unlocked" : "Slot locked");
    } catch (error: any) {
      toast.error("Failed to toggle lock", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!sectionId) {
      toast.error("No section selected");
      return;
    }
    setIsLoading(true);
    try {
      await routineService.submitForApproval(sectionId);
      setStatus("PENDING");
      toast.success("Submitted for approval");
    } catch (error: any) {
      toast.error("Failed to submit", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTeacherList = availableTeachers.length > 0 ? availableTeachers : allTeachers.map(t => ({ 
    id: t.id, 
    name: t.user?.name || t.employeeId 
  }));
  const selectedRoomList = availableRooms.length > 0 ? availableRooms : allRooms.map(r => ({ 
    id: r.id, 
    name: `${r.code} - ${r.name}` 
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Routine</h1>
          <div className="mt-1 flex items-center gap-2"><StatusBadge status={status} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={swapMode ? "default" : "outline"} 
            size="sm" 
            onClick={() => { setSwapMode(!swapMode); setSel([]); }}
            disabled={isLoading}
          >
            <ArrowLeftRight className="mr-2 size-4" /> {swapMode ? `Pick ${2 - sel.length} more` : "Swap Mode"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => sectionId && exportService.exportRoutinePDFBySection(sectionId)}
            disabled={isLoading}
          >
            <Download className="mr-2 size-4" /> Export PDF
          </Button>
          {status === "DRAFT" && (
            <Button size="sm" onClick={handleSubmitForApproval} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              Submit for Approval
            </Button>
          )}
        </div>
      </div>

      {swapMode && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm">
          <p className="font-medium">Swap Mode Active</p>
          <p className="text-muted-foreground">Click on two routine slots to swap them. {sel.length > 0 && `Selected: ${sel.length}/2`}</p>
        </div>
      )}

      <TimetableGrid 
        routine={routine} 
        editable 
        onCellClick={onCellClick} 
        onToggleLock={handleToggleLock}
        selectedCells={sel} 
      />

      {/* Edit Modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Slot — {editing?.day} {editing?.slot}
              {editing?.cell?.locked && (
                <Lock className="size-4 text-warning" />
              )}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input 
                  value={editing.cell?.subject || ""} 
                  onChange={(e) => setEditing({ 
                    ...editing, 
                    cell: { 
                      ...(editing.cell || { teacher: "", room: "", routineId: "" }), 
                      subject: e.target.value 
                    } as RoutineCell 
                  })} 
                  disabled={editing.cell?.locked}
                />
                {editing.cell?.locked && (
                  <p className="text-xs text-warning">This slot is locked and cannot be edited</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select 
                  value={editing.cell?.teacher || ""} 
                  onValueChange={(v) => setEditing({ 
                    ...editing, 
                    cell: { 
                      ...(editing.cell || { subject: "", room: "", routineId: "" }), 
                      teacher: v 
                    } as RoutineCell 
                  })}
                  disabled={editing.cell?.locked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTeacherList.map((t) => (
                      <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Select 
                  value={editing.cell?.room || ""} 
                  onValueChange={(v) => setEditing({ 
                    ...editing, 
                    cell: { 
                      ...(editing.cell || { subject: "", teacher: "", routineId: "" }), 
                      room: v 
                    } as RoutineCell 
                  })}
                  disabled={editing.cell?.locked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRoomList.map((r) => (
                      <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {editing?.cell?.routineId && (
              <Button 
                variant="outline" 
                onClick={() => handleToggleLock(editing.day, editing.slot)}
                disabled={isLoading}
              >
                {editing.cell?.locked ? <Unlock className="mr-2 size-4" /> : <Lock className="mr-2 size-4" />}
                {editing.cell?.locked ? "Unlock" : "Lock"}
              </Button>
            )}
            <Button variant="ghost" onClick={() => { 
              if (editing && !editing.cell?.locked) { 
                updateCell(editing.day, editing.slot, null); 
                toast.success("Slot cleared"); 
                setEditing(null); 
              } 
            }}>
              Clear
            </Button>
            <Button onClick={handleSave} disabled={isLoading || editing?.cell?.locked}>
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle className="mr-2 size-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
