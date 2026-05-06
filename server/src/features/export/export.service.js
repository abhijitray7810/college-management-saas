import { chromium } from 'playwright';
import { routineRepository } from '../routine/routine.repository.js';
import { attendanceRepository } from '../attendance/attendance.repository.js';
import { dashboardRepository } from '../dashboard/dashboard.repository.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const exportService = {
  async generateRoutinePDF(semesterId) {
    const routines = await routineRepository.getExistingRoutinesBySemester(semesterId);
    if (routines.length === 0) {
      throw new AppError('No routines found for this semester', 404);
    }

    const semester = await routineRepository.getSemesterById(semesterId);
    
    // Group routines by day
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const timeSlots = [...new Set(routines.map(r => `${r.timeSlot.startTime}-${r.timeSlot.endTime}`))].sort();
    
    const schedule = {};
    days.forEach(day => {
      schedule[day] = {};
      timeSlots.forEach(slot => {
        schedule[day][slot] = routines.find(r => 
          r.timeSlot.day === day && 
          `${r.timeSlot.startTime}-${r.timeSlot.endTime}` === slot
        );
      });
    });

    // Generate HTML
    const html = this.generateRoutineHTML(schedule, days, timeSlots, semester);
    
    // Generate PDF using Playwright
    const pdfBuffer = await this.htmlToPDF(html, `Routine - ${semester?.name || 'Semester'}`);
    
    return {
      success: true,
      data: {
        filename: `routine-${semesterId}.pdf`,
        buffer: pdfBuffer,
        contentType: 'application/pdf',
      },
    };
  },

  async generateRoutinePDFBySection(sectionId) {
    const routines = await routineRepository.getExistingRoutinesBySection(sectionId);
    if (routines.length === 0) {
      throw new AppError('No routines found for this section', 404);
    }

    // Group routines by day
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const timeSlots = [...new Set(routines.map(r => `${r.timeSlot.startTime}-${r.timeSlot.endTime}`))].sort();

    const schedule = {};
    days.forEach(day => {
      schedule[day] = {};
      timeSlots.forEach(slot => {
        schedule[day][slot] = routines.find(r =>
          r.timeSlot.day === day &&
          `${r.timeSlot.startTime}-${r.timeSlot.endTime}` === slot
        );
      });
    });

    const header = routines[0];
    const html = this.generateRoutineHTML(schedule, days, timeSlots, {
      name: header.section?.name,
      academicYear: header.academicYear,
      course: { name: header.batch?.name || '' },
    });

    const pdfBuffer = await this.htmlToPDF(html, `Routine - ${header.section?.name || 'Section'}`);

    return {
      success: true,
      data: {
        filename: `routine-section-${sectionId}.pdf`,
        buffer: pdfBuffer,
        contentType: 'application/pdf',
      },
    };
  },

  generateRoutineHTML(schedule, days, timeSlots, semester) {
    const rows = timeSlots.map(slot => {
      const cells = days.map(day => {
        const routine = schedule[day][slot];
        if (!routine) return '<td class="empty">-</td>';
        return `
          <td class="session">
            <div class="subject">${routine.subject.name}</div>
            <div class="code">${routine.subject.code}</div>
            <div class="teacher">${routine.teacher?.user?.name || 'N/A'}</div>
            <div class="room">${routine.room?.code || 'N/A'}</div>
          </td>
        `;
      }).join('');
      return `<tr><td class="time">${slot}</td>${cells}</tr>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; }
          h2 { text-align: center; color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .time { background-color: #f9f9f9; font-weight: bold; }
          .session { background-color: #e8f4f8; }
          .empty { background-color: #f5f5f5; color: #999; }
          .subject { font-weight: bold; color: #333; }
          .code { font-size: 12px; color: #666; }
          .teacher { font-size: 11px; color: #555; margin-top: 5px; }
          .room { font-size: 11px; color: #777; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <h1>College Management System</h1>
        <h2>Class Routine - ${semester?.course?.name || ''} ${semester?.name || ''}</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Monday</th>
              <th>Tuesday</th>
              <th>Wednesday</th>
              <th>Thursday</th>
              <th>Friday</th>
              <th>Saturday</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="footer">
          Generated on ${new Date().toLocaleDateString()} | Academic Year: ${semester?.academicYear || 'N/A'}
        </div>
      </body>
      </html>
    `;
  },

  async generateStudentAttendancePDF(studentId) {
    const student = await dashboardRepository.getStudentInfo(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const attendanceSummary = await dashboardRepository.getStudentAttendanceSummary(studentId);
    const subjectWise = await dashboardRepository.getStudentSubjectWiseAttendance(studentId);

    const html = this.generateStudentAttendanceHTML(student, attendanceSummary, subjectWise);
    const pdfBuffer = await this.htmlToPDF(html, `Attendance Report - ${student.user?.name}`);

    return {
      success: true,
      data: {
        filename: `attendance-student-${studentId}.pdf`,
        buffer: pdfBuffer,
        contentType: 'application/pdf',
      },
    };
  },

  generateStudentAttendanceHTML(student, summary, subjectWise) {
    const totalSessions = parseInt(summary?.totalSessions) || 0;
    const presentCount = parseInt(summary?.presentCount) || 0;
    const lateCount = parseInt(summary?.lateCount) || 0;
    const overallPercentage = totalSessions > 0
      ? Math.round(((presentCount + lateCount) / totalSessions) * 100)
      : 0;

    const rows = subjectWise.map(subject => {
      const subjectTotal = parseInt(subject.totalSessions) || 0;
      const subjectPresent = parseInt(subject.presentCount) || 0;
      const subjectLate = parseInt(subject.lateCount) || 0;
      const percentage = subjectTotal > 0
        ? Math.round(((subjectPresent + subjectLate) / subjectTotal) * 100)
        : 0;
      const status = percentage >= 75 ? 'Good' : percentage >= 60 ? 'Average' : 'Poor';
      const statusColor = percentage >= 75 ? '#4CAF50' : percentage >= 60 ? '#FF9800' : '#f44336';

      return `
        <tr>
          <td>${subject.subjectCode}</td>
          <td>${subject.subjectName}</td>
          <td>${subjectTotal}</td>
          <td>${subjectPresent}</td>
          <td>${parseInt(subject.absentCount) || 0}</td>
          <td>${subjectLate}</td>
          <td style="color: ${statusColor}; font-weight: bold;">${percentage}%</td>
          <td style="color: ${statusColor};">${status}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; }
          .student-info { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
          .info-row { display: flex; margin: 5px 0; }
          .info-label { font-weight: bold; width: 150px; }
          .overall { margin: 20px 0; padding: 20px; background: #e8f4f8; border-radius: 5px; text-align: center; }
          .overall-percentage { font-size: 48px; font-weight: bold; color: ${overallPercentage >= 75 ? '#4CAF50' : overallPercentage >= 60 ? '#FF9800' : '#f44336'}; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <h1>Student Attendance Report</h1>
        
        <div class="student-info">
          <div class="info-row"><span class="info-label">Name:</span> ${student.user?.name}</div>
          <div class="info-row"><span class="info-label">Email:</span> ${student.user?.email}</div>
          <div class="info-row"><span class="info-label">Enrollment No:</span> ${student.enrollmentNumber}</div>
          <div class="info-row"><span class="info-label">Course:</span> ${student.semester?.course?.name}</div>
          <div class="info-row"><span class="info-label">Semester:</span> ${student.semester?.name}</div>
        </div>

        <div class="overall">
          <div>Overall Attendance</div>
          <div class="overall-percentage">${overallPercentage}%</div>
          <div>${presentCount + lateCount} / ${totalSessions} sessions attended</div>
        </div>

        <h3>Subject-wise Attendance</h3>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Subject</th>
              <th>Total</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          Generated on ${new Date().toLocaleDateString()} | College Management System
        </div>
      </body>
      </html>
    `;
  },

  async generateSubjectAttendancePDF(subjectId) {
    const subjectAttendance = await dashboardRepository.getSubjectAttendanceSummary(subjectId);
    
    // Get subject details
    const subject = subjectAttendance.length > 0 ? {
      name: subjectAttendance[0].subjectName,
      code: subjectAttendance[0].subjectCode,
    } : { name: 'Unknown', code: 'N/A' };

    const html = this.generateSubjectAttendanceHTML(subject, subjectAttendance);
    const pdfBuffer = await this.htmlToPDF(html, `Class Attendance - ${subject.name}`);

    return {
      success: true,
      data: {
        filename: `attendance-subject-${subjectId}.pdf`,
        buffer: pdfBuffer,
        contentType: 'application/pdf',
      },
    };
  },

  generateSubjectAttendanceHTML(subject, students) {
    const totalStudents = students.length;
    const classAverage = totalStudents > 0
      ? Math.round(students.reduce((acc, s) => {
          const total = parseInt(s.totalSessions) || 0;
          const present = parseInt(s.presentCount) || 0;
          const late = parseInt(s.lateCount) || 0;
          return acc + (total > 0 ? ((present + late) / total) * 100 : 0);
        }, 0) / totalStudents)
      : 0;

    const rows = students.map((student, index) => {
      const total = parseInt(student.totalSessions) || 0;
      const present = parseInt(student.presentCount) || 0;
      const late = parseInt(student.lateCount) || 0;
      const percentage = total > 0
        ? Math.round(((present + late) / total) * 100)
        : 0;
      const status = percentage >= 75 ? 'Good' : percentage >= 60 ? 'Average' : 'Poor';
      const statusColor = percentage >= 75 ? '#4CAF50' : percentage >= 60 ? '#FF9800' : '#f44336';

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${student.enrollmentNumber}</td>
          <td>${student.studentName}</td>
          <td>${total}</td>
          <td>${present}</td>
          <td>${parseInt(student.absentCount) || 0}</td>
          <td>${late}</td>
          <td style="color: ${statusColor}; font-weight: bold;">${percentage}%</td>
          <td style="color: ${statusColor};">${status}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; }
          h2 { text-align: center; color: #666; margin-bottom: 30px; }
          .class-info { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; text-align: center; }
          .class-average { font-size: 36px; font-weight: bold; color: ${classAverage >= 75 ? '#4CAF50' : classAverage >= 60 ? '#FF9800' : '#f44336'}; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <h1>Class Attendance Report</h1>
        <h2>${subject.code} - ${subject.name}</h2>
        
        <div class="class-info">
          <div>Class Average Attendance</div>
          <div class="class-average">${classAverage}%</div>
          <div>Total Students: ${totalStudents}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Enrollment No</th>
              <th>Student Name</th>
              <th>Total</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          Generated on ${new Date().toLocaleDateString()} | College Management System
        </div>
      </body>
      </html>
    `;
  },

  async htmlToPDF(html, title) {
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.setContent(html, { waitUntil: 'networkidle' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        title,
      });
      
      return pdfBuffer;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
};
