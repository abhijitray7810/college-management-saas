import { routineRepository } from './routine.repository.js';
import { availabilityRepository } from '../availability/availability.repository.js';

/**
 * Routine Generator - Constraint Satisfaction Problem Solver
 * 
 * Uses backtracking algorithm to generate valid timetables
 * while respecting hard constraints:
 * 1. No teacher double-booked
 * 2. No room double-booked
 * 3. Teacher availability respected
 * 4. Room availability respected
 * 5. Lab subjects must use LAB rooms
 */

class RoutineGenerator {
  constructor() {
    this.subjects = [];
    this.teachers = new Map(); // subjectId -> teachers[]
    this.rooms = [];
    this.timeSlots = [];
    this.assignments = [];
    this.teacherSchedule = new Map(); // teacherId + timeSlotId -> boolean
    this.roomSchedule = new Map(); // roomId + timeSlotId -> boolean
    this.subjectSessionCount = new Map(); // subjectId -> assigned count
    this.maxIterations = 10000;
    this.iterationCount = 0;
    this.preferSpreadAcrossDays = true;
    this.prioritizeLabs = true;
  }

  /**
   * Initialize generator with data from database
   */
  async initialize(semesterId, options = {}) {
    this.semesterId = semesterId;
    this.academicYear = options.academicYear || new Date().getFullYear().toString();
    this.preferSpreadAcrossDays = options.preferSpreadAcrossDays ?? true;
    this.prioritizeLabs = options.prioritizeLabs ?? true;
    this.maxIterations = options.maxIterations || 10000;

    // Fetch all necessary data
    const [semester, subjects, rooms, timeSlots] = await Promise.all([
      routineRepository.getSemesterById(semesterId),
      routineRepository.getSubjectsBySemester(semesterId),
      routineRepository.getAllRooms(),
      routineRepository.getAllTimeSlots(),
    ]);

    if (!semester) {
      throw new Error('Semester not found');
    }

    if (subjects.length === 0) {
      throw new Error('No subjects found for this semester');
    }

    // Fetch teachers for each subject
    for (const subject of subjects) {
      const subjectTeachers = await routineRepository.getTeachersBySubject(subject.id);
      this.teachers.set(subject.id, subjectTeachers);
    }

    this.subjects = subjects;
    this.rooms = rooms;
    this.timeSlots = timeSlots;

    // Build lookup maps for constraints
    this.buildConstraintMaps();

    return {
      semester,
      subjectCount: subjects.length,
      roomCount: rooms.length,
      timeSlotCount: timeSlots.length,
    };
  }

  /**
   * Build constraint lookup maps for fast checking
   */
  buildConstraintMaps() {
    // Group time slots by day for spread preference
    this.timeSlotsByDay = new Map();
    for (const slot of this.timeSlots) {
      if (!this.timeSlotsByDay.has(slot.day)) {
        this.timeSlotsByDay.set(slot.day, []);
      }
      this.timeSlotsByDay.get(slot.day).push(slot);
    }

    // Group rooms by type
    this.roomsByType = new Map();
    for (const room of this.rooms) {
      if (!this.roomsByType.has(room.type)) {
        this.roomsByType.set(room.type, []);
      }
      this.roomsByType.get(room.type).push(room);
    }
  }

  /**
   * Expand subjects into individual sessions based on hours_per_week
   */
  expandSubjectsToSessions() {
    const sessions = [];

    for (const subject of this.subjects) {
      const hours = subject.hoursPerWeek || 3;
      const subjectTeachers = this.teachers.get(subject.id) || [];

      if (subjectTeachers.length === 0) {
        throw new Error(`No teachers assigned to subject: ${subject.name}`);
      }

      for (let i = 0; i < hours; i++) {
        sessions.push({
          subject,
          sessionNumber: i + 1,
          totalSessions: hours,
          isLab: subject.isLab,
          requiredRoomType: subject.isLab ? 'LAB' : 'CLASSROOM',
        });
      }
    }

    // Sort sessions: prioritize labs if enabled, then by total hours (descending)
    if (this.prioritizeLabs) {
      sessions.sort((a, b) => {
        if (a.isLab !== b.isLab) return a.isLab ? -1 : 1;
        return b.totalSessions - a.totalSessions;
      });
    } else {
      sessions.sort((a, b) => b.totalSessions - a.totalSessions);
    }

    return sessions;
  }

  /**
   * Main generation algorithm using backtracking
   */
  async generate() {
    const sessions = this.expandSubjectsToSessions();
    this.assignments = [];
    this.iterationCount = 0;
    this.teacherSchedule.clear();
    this.roomSchedule.clear();
    this.subjectSessionCount.clear();

    console.log(`Starting routine generation for ${sessions.length} sessions...`);

    const success = await this.backtrack(0, sessions);

    if (!success) {
      return {
        success: false,
        message: 'Unable to generate valid routine with current constraints',
        stats: {
          totalSessions: sessions.length,
          assignedSessions: this.assignments.length,
          iterations: this.iterationCount,
        },
      };
    }

    return {
      success: true,
      assignments: this.assignments,
      stats: {
        totalSessions: sessions.length,
        assignedSessions: this.assignments.length,
        iterations: this.iterationCount,
        subjectCount: this.subjects.length,
      },
    };
  }

  /**
   * Backtracking algorithm to assign sessions
   */
  async backtrack(sessionIndex, sessions) {
    // Check iteration limit
    this.iterationCount++;
    if (this.iterationCount > this.maxIterations) {
      console.warn('Max iterations reached, stopping generation');
      return false;
    }

    // Base case: all sessions assigned
    if (sessionIndex >= sessions.length) {
      return true;
    }

    const session = sessions[sessionIndex];
    const { subject, requiredRoomType } = session;
    const subjectTeachers = this.teachers.get(subject.id);

    // Get shuffled time slots for variety
    const shuffledTimeSlots = this.getShuffledTimeSlots(session);

    // Try each time slot
    for (const timeSlot of shuffledTimeSlots) {
      // Try each teacher
      for (const teacher of subjectTeachers) {
        // Check teacher constraints
        if (!(await this.isTeacherAvailable(teacher.id, timeSlot.id))) {
          continue;
        }

        // Try each room of appropriate type
        const suitableRooms = this.getSuitableRooms(requiredRoomType);
        for (const room of suitableRooms) {
          // Check room constraints
          if (!(await this.isRoomAvailable(room.id, timeSlot.id))) {
            continue;
          }

          // All constraints satisfied - make assignment
          const assignment = {
            semesterId: this.semesterId,
            subjectId: subject.id,
            teacherId: teacher.id,
            roomId: room.id,
            timeSlotId: timeSlot.id,
            subject: {
              id: subject.id,
              name: subject.name,
              code: subject.code,
              isLab: subject.isLab,
            },
            teacher: {
              id: teacher.id,
              employeeId: teacher.employeeId,
              name: teacher.user?.name,
            },
            room: {
              id: room.id,
              code: room.code,
              name: room.name,
              type: room.type,
            },
            timeSlot: {
              id: timeSlot.id,
              day: timeSlot.day,
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
              slotNumber: timeSlot.slotNumber,
            },
          };

          // Temporarily assign
          this.assignments.push(assignment);
          this.markTeacherBooked(teacher.id, timeSlot.id);
          this.markRoomBooked(room.id, timeSlot.id);
          this.incrementSubjectSessionCount(subject.id);

          // Recurse to next session
          if (await this.backtrack(sessionIndex + 1, sessions)) {
            return true;
          }

          // Backtrack: undo assignment
          this.assignments.pop();
          this.unmarkTeacherBooked(teacher.id, timeSlot.id);
          this.unmarkRoomBooked(room.id, timeSlot.id);
          this.decrementSubjectSessionCount(subject.id);
        }
      }
    }

    // No valid assignment found for this session
    return false;
  }

  /**
   * Check if teacher is available for given time slot
   * Combines availability table + current schedule
   */
  async isTeacherAvailable(teacherId, timeSlotId) {
    // Check if already assigned in current schedule
    if (this.teacherSchedule.has(`${teacherId}-${timeSlotId}`)) {
      return false;
    }

    // Check availability table
    const availability = await availabilityRepository.getTeacherAvailabilityBySlot(
      teacherId,
      timeSlotId
    );

    if (availability?.status === 'BUSY') {
      return false;
    }

    return true;
  }

  /**
   * Check if room is available for given time slot
   * Combines availability table + current schedule
   */
  async isRoomAvailable(roomId, timeSlotId) {
    // Check if already assigned in current schedule
    if (this.roomSchedule.has(`${roomId}-${timeSlotId}`)) {
      return false;
    }

    // Check availability table
    const availability = await availabilityRepository.getRoomAvailabilityBySlot(
      roomId,
      timeSlotId
    );

    if (availability?.status === 'BUSY') {
      return false;
    }

    return true;
  }

  /**
   * Get shuffled time slots with spread preference
   */
  getShuffledTimeSlots(session) {
    let slots = [...this.timeSlots];

    if (this.preferSpreadAcrossDays) {
      // Prioritize days with fewer sessions of this subject
      const subjectId = session.subject.id;
      const sessionsPerDay = new Map();

      for (const assignment of this.assignments) {
        if (assignment.subjectId === subjectId) {
          const day = assignment.timeSlot.day;
          sessionsPerDay.set(day, (sessionsPerDay.get(day) || 0) + 1);
        }
      }

      // Sort slots by sessions per day (ascending)
      slots.sort((a, b) => {
        const countA = sessionsPerDay.get(a.day) || 0;
        const countB = sessionsPerDay.get(b.day) || 0;
        if (countA !== countB) return countA - countB;
        return a.slotNumber - b.slotNumber;
      });
    } else {
      // Simple shuffle for variety
      slots = this.shuffleArray(slots);
    }

    return slots;
  }

  /**
   * Get rooms suitable for subject type
   */
  getSuitableRooms(requiredType) {
    if (requiredType === 'LAB') {
      return this.roomsByType.get('LAB') || [];
    }
    // For regular subjects, prefer CLASSROOM but can use other non-lab rooms
    const classrooms = this.roomsByType.get('CLASSROOM') || [];
    const seminarHalls = this.roomsByType.get('SEMINAR_HALL') || [];
    const auditoriums = this.roomsByType.get('AUDITORIUM') || [];
    return [...classrooms, ...seminarHalls, ...auditoriums];
  }

  /**
   * Mark teacher as booked in internal schedule
   */
  markTeacherBooked(teacherId, timeSlotId) {
    this.teacherSchedule.set(`${teacherId}-${timeSlotId}`, true);
  }

  /**
   * Unmark teacher booking (backtrack)
   */
  unmarkTeacherBooked(teacherId, timeSlotId) {
    this.teacherSchedule.delete(`${teacherId}-${timeSlotId}`);
  }

  /**
   * Mark room as booked in internal schedule
   */
  markRoomBooked(roomId, timeSlotId) {
    this.roomSchedule.set(`${roomId}-${timeSlotId}`, true);
  }

  /**
   * Unmark room booking (backtrack)
   */
  unmarkRoomBooked(roomId, timeSlotId) {
    this.roomSchedule.delete(`${roomId}-${timeSlotId}`);
  }

  /**
   * Track subject session count for spread preference
   */
  incrementSubjectSessionCount(subjectId) {
    this.subjectSessionCount.set(
      subjectId,
      (this.subjectSessionCount.get(subjectId) || 0) + 1
    );
  }

  decrementSubjectSessionCount(subjectId) {
    const current = this.subjectSessionCount.get(subjectId) || 0;
    if (current > 0) {
      this.subjectSessionCount.set(subjectId, current - 1);
    }
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const routineGenerator = new RoutineGenerator();
