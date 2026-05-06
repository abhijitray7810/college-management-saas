import { useState } from "react";
import { useRoutineStore } from "@/store/routineStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Check, X, Send, Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { routineService } from "@/services/routine.service";
import type { RoutineStatus } from "@/services/mockData";

const STAGES: RoutineStatus[] = ["DRAFT", "PENDING", "APPROVED", "ACTIVE"];

export default function Workflow() {
  const { status, setStatus, semesterId, routine } = useRoutineStore();
  const [isLoading, setIsLoading] = useState(false);
  const idx = STAGES.indexOf(status);

  const handleSubmit = async () => {
    if (!semesterId) {
      toast.error("No semester selected. Generate a routine first.");
      return;
    }
    setIsLoading(true);
    try {
      await routineService.submitForApproval(semesterId);
      setStatus("PENDING");
      toast.success("Submitted for approval");
    } catch (error: any) {
      toast.error("Failed to submit", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!semesterId) {
      toast.error("No semester selected");
      return;
    }
    setIsLoading(true);
    try {
      await routineService.approve(semesterId);
      setStatus("APPROVED");
      toast.success("Routine approved");
    } catch (error: any) {
      toast.error("Failed to approve", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!semesterId) {
      toast.error("No semester selected");
      return;
    }
    setIsLoading(true);
    try {
      await routineService.reject(semesterId);
      setStatus("DRAFT");
      toast.info("Returned to draft");
    } catch (error: any) {
      toast.error("Failed to reject", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!semesterId) {
      toast.error("No semester selected");
      return;
    }
    setIsLoading(true);
    try {
      await routineService.activate(semesterId);
      setStatus("ACTIVE");
      toast.success("Routine activated");
    } catch (error: any) {
      toast.error("Failed to activate", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!semesterId) {
      toast.error("No semester selected");
      return;
    }
    setIsLoading(true);
    try {
      await routineService.resetToDraft(semesterId);
      setStatus("DRAFT");
      toast.info("Reset to draft");
    } catch (error: any) {
      toast.error("Failed to reset", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workflow</h1>
        <p className="text-sm text-muted-foreground">Manage routine approval lifecycle.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Current Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {STAGES.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold ${i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                <StatusBadge status={s} />
                {i < STAGES.length - 1 && <div className={`h-0.5 w-8 ${i < idx ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {status === "DRAFT" && (
              <Button onClick={handleSubmit} disabled={isLoading || !semesterId}>
                {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                Submit for Approval
              </Button>
            )}
            {status === "PENDING" && (
              <>
                <Button onClick={handleApprove} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
                  Approve
                </Button>
                <Button variant="outline" onClick={handleReject} disabled={isLoading}>
                  <X className="mr-2 size-4" /> Reject
                </Button>
              </>
            )}
            {status === "APPROVED" && (
              <Button onClick={handleActivate} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Activity className="mr-2 size-4" />}
                Activate
              </Button>
            )}
            {status === "ACTIVE" && (
              <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                Reset to Draft
              </Button>
            )}
          </div>

          {!routine && (
            <p className="mt-4 text-sm text-muted-foreground">
              No routine loaded. Go to Generate Routine first.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
