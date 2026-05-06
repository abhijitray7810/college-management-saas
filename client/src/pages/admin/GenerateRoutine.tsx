import { useState, useEffect } from "react";
import { useRoutineStore } from "@/store/routineStore";
import { useAuthStore } from "@/store/authStore";
import { departmentService } from "@/services/department.service";
import { batchService } from "@/services/batch.service";
import { sectionService } from "@/services/section.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TimetableGrid } from "@/components/TimetableGrid";
import { Sparkles, Trash2, Loader2, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Department, Batch, Section } from "@/types";

export default function GenerateRoutine() {
  const { user, isAdmin, isSuperAdmin } = useAuthStore();
  const { 
    routine, 
    entries,
    generateForSection, 
    loadBySection,
    clear, 
    isGenerating,
    isLoading,
    generationProgress,
    status 
  } = useRoutineStore();

  // Selection state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  
  // Config state
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [preferSpread, setPreferSpread] = useState(true);
  const [prioritizeLabs, setPrioritizeLabs] = useState(true);
  const [saveToDatabase, setSaveToDatabase] = useState(true);

  // Data loading state
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  // Load batches when department changes
  useEffect(() => {
    if (selectedDepartmentId) {
      loadBatches(selectedDepartmentId);
      setSelectedBatchId("");
      setSelectedSectionId("");
      setBatches([]);
      setSections([]);
    }
  }, [selectedDepartmentId]);

  // Load sections when batch changes
  useEffect(() => {
    if (selectedBatchId) {
      loadSections(selectedBatchId);
      setSelectedSectionId("");
    }
  }, [selectedBatchId]);

  // Load existing routine when section is selected
  useEffect(() => {
    if (selectedSectionId) {
      loadExistingRoutine(selectedSectionId);
    }
  }, [selectedSectionId]);

  const loadDepartments = async () => {
    try {
      setIsLoadingData(true);
      if (isSuperAdmin()) {
        const response = await departmentService.getAll();
        if (response.success) {
          setDepartments(response.data || []);
        }
      } else if (isAdmin()) {
        // HOD only sees their department
        const response = await departmentService.getMyDepartment();
        if (response.success && response.data) {
          setDepartments([response.data]);
          setSelectedDepartmentId(response.data.id);
        }
      }
    } catch (error: any) {
      toast.error("Failed to load departments", { description: error.message });
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadBatches = async (departmentId: string) => {
    try {
      const response = await batchService.getByDepartment(departmentId);
      if (response.success) {
        setBatches(response.data || []);
      }
    } catch (error: any) {
      toast.error("Failed to load batches", { description: error.message });
    }
  };

  const loadSections = async (batchId: string) => {
    try {
      const response = await sectionService.getByBatch(batchId);
      if (response.success) {
        setSections(response.data || []);
      }
    } catch (error: any) {
      toast.error("Failed to load sections", { description: error.message });
    }
  };

  const loadExistingRoutine = async (sectionId: string) => {
    try {
      await loadBySection(sectionId);
    } catch (error: any) {
      // No existing routine is OK
      console.log("No existing routine found for section", sectionId);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSectionId) {
      toast.error("Please select a section");
      return;
    }

    try {
      await generateForSection({
        sectionId: selectedSectionId,
        academicYear,
        preferSpreadAcrossDays: preferSpread,
        prioritizeLabs,
        saveToDatabase,
      });
      toast.success("Routine generated successfully!", {
        description: `Created ${generationProgress?.assignedSessions || 0} sessions`,
      });
    } catch (error: any) {
      toast.error("Failed to generate routine", { description: error.message });
    }
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const selectedDepartment = departments.find(d => d.id === selectedDepartmentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Generate Routine</h1>
          <p className="text-sm text-muted-foreground">
            Select department → batch → section to generate or view routine
          </p>
        </div>
        {status && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Selection Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Select Section</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Department Select */}
          <div className="space-y-2">
            <Label>Department</Label>
            <Select 
              value={selectedDepartmentId} 
              onValueChange={setSelectedDepartmentId}
              disabled={isLoadingData || (!isSuperAdmin() && departments.length === 1)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Batch Select */}
          <div className="space-y-2">
            <Label>Batch</Label>
            <Select 
              value={selectedBatchId} 
              onValueChange={setSelectedBatchId}
              disabled={!selectedDepartmentId || batches.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={batches.length === 0 ? "No batches" : "Select batch"} />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    Year {batch.year} ({batch.academicYear})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section Select */}
          <div className="space-y-2">
            <Label>Section</Label>
            <Select 
              value={selectedSectionId} 
              onValueChange={setSelectedSectionId}
              disabled={!selectedBatchId || sections.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={sections.length === 0 ? "No sections" : "Select section"} />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name} ({section.studentCount || 0} students)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Info */}
          <div className="space-y-2">
            <Label>Selection Summary</Label>
            <div className="text-sm text-muted-foreground">
              {selectedSection ? (
                <div className="space-y-1">
                  <p><span className="font-medium">Dept:</span> {selectedDepartment?.code}</p>
                  <p><span className="font-medium">Batch:</span> Year {selectedBatch?.year}</p>
                  <p><span className="font-medium">Section:</span> {selectedSection.name}</p>
                </div>
              ) : (
                <p>Complete all selections to generate routine</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Config */}
      {selectedSectionId && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Options</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2026-2027">2026-2027</SelectItem>
                  <SelectItem value="2027-2028">2027-2028</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="spread" 
                  checked={preferSpread} 
                  onCheckedChange={setPreferSpread} 
                />
                <Label htmlFor="spread">Spread across days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="labs" 
                  checked={prioritizeLabs} 
                  onCheckedChange={setPrioritizeLabs} 
                />
                <Label htmlFor="labs">Prioritize lab sessions</Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="save" 
                  checked={saveToDatabase} 
                  onCheckedChange={setSaveToDatabase} 
                />
                <Label htmlFor="save">Save to database</Label>
              </div>
            </div>

            <div className="space-y-2 flex items-end">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !selectedSectionId} 
                className="w-full"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                {isGenerating ? "Generating..." : "Generate Routine"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      {isGenerating && generationProgress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Generating routine...</span>
              <span className="text-sm text-blue-700">
                {generationProgress.assignedSessions} / {generationProgress.totalSessions} sessions
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${generationProgress.totalSessions > 0 
                    ? (generationProgress.assignedSessions / generationProgress.totalSessions) * 100 
                    : 0}%` 
                }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Iteration {generationProgress.iterations} - Optimizing schedule...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Routine Preview */}
      {routine && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Routine Preview</h2>
              {status === 'ACTIVE' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="size-3" />
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 size-4" /> Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear routine preview?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear the current routine from the view. The saved routine will remain in the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { clear(); toast.success("Routine cleared from view"); }}>
                      Clear
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <TimetableGrid routine={routine} />
          
          {/* Stats Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Routine Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Theory Sessions</p>
                <p className="text-2xl font-bold">
                  {entries.filter(e => e.subject?.type !== 'LAB').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lab Sessions</p>
                <p className="text-2xl font-bold">
                  {entries.filter(e => e.subject?.type === 'LAB').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-medium">{status?.replace('_', ' ')}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
