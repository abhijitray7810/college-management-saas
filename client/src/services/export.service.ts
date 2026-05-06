import { api } from "./api";
import { toast } from "sonner";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportService = {
  // Export routine PDF
  async exportRoutinePDF(semesterId: string): Promise<void> {
    try {
      const response = await api.get(`/export/routine/${semesterId}`, {
        responseType: "blob",
      });
      downloadBlob(response.data, `routine-${semesterId}.pdf`);
      toast.success("Routine PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export routine PDF");
      throw error;
    }
  },

  // Export routine PDF by section
  async exportRoutinePDFBySection(sectionId: string): Promise<void> {
    try {
      const response = await api.get(`/export/routine/section/${sectionId}`, {
        responseType: "blob",
      });
      downloadBlob(response.data, `routine-section-${sectionId}.pdf`);
      toast.success("Routine PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export routine PDF");
      throw error;
    }
  },

  // Export student attendance PDF
  async exportStudentAttendancePDF(studentId: string): Promise<void> {
    try {
      const response = await api.get(`/export/attendance/student/${studentId}`, {
        responseType: "blob",
      });
      downloadBlob(response.data, `attendance-student-${studentId}.pdf`);
      toast.success("Attendance report exported successfully");
    } catch (error) {
      toast.error("Failed to export attendance report");
      throw error;
    }
  },

  // Export subject attendance PDF
  async exportSubjectAttendancePDF(subjectId: string): Promise<void> {
    try {
      const response = await api.get(`/export/attendance/subject/${subjectId}`, {
        responseType: "blob",
      });
      downloadBlob(response.data, `attendance-subject-${subjectId}.pdf`);
      toast.success("Attendance report exported successfully");
    } catch (error) {
      toast.error("Failed to export attendance report");
      throw error;
    }
  },
};
