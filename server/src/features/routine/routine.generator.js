import { db } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Routine Generator V2 - Section-Based Constraint Satisfaction Problem Solver
 * 
 * Uses backtracking algorithm to generate valid timetables for a specific section
 * while respecting hard constraints:
 * 1. No teacher double-booked
 * 2. No room double-booked
 * 3. No section double-booked (NEW)
 * 4. Teacher availability respected
 * 5. Room availability respected
 * 6. Lab subjects must use LAB rooms
 * 
 * NEW: Section-based scheduling with hierarchical data structure
 * - section_id → batch_id → department_id hierarchy
 * - Batch-based subject mapping via batch_subjects
 * - Department-filtered rooms from floors
 */

class RoutineGenerator {
  constructor() {
    // Data caches (loaded once at start)
    this.data = {
      section: null,
      batch: null,
      department: null,
      subjects: [],
      teachers: new Map(), // subjectId → teachers[]
      rooms: [],
      timeSlots: [],
      teacherAvailability: new Map(), // teacherId → availability[]
      roomAvailability: new Map(), // roomId → availability[]
    };
    
    // Schedule tracking (for current generation)
    this.schedule = {
      teacher: new Map(), // "teacherId-timeSlotId" → true
      room: new Map(),    // "roomId-timeSlotId" → true
      section: new Map(), // "sectionId-timeSlotId" → true
    };
    
    this.assignments = [];
    this.maxIterations = 10000;
    this.iterationCount = 0;
    this.preferSpreadAcrossDays = true;
    this.prioritizeLabs = true;
    this.academicYear = null;
  }

  /**
   * Initialize generator with section-based data loading
   * NEW: Takes sectionId instead of semesterId
   */
  async initialize(sectionId, options = {}) {
    console.log(`🎯 Initializing routine generator for section ${sectionId}...`);
    
    this.sectionId = sectionId;
    this.academicYear = options.academicYear || new Date().getFullYear().toString();
    this.preferSpreadAcrossDays = options.preferSpreadAcrossDays ?? true;
    this.prioritizeLabs = options.prioritizeLabs ?? true;
    this.maxIterations = options.maxIterations || 10000;

    // STEP 1: Load section → batch → department hierarchy
    await this.loadHierarchy(sectionId);
    
    // STEP 2: Load subjects from batch_subjects
    await this.loadSubjects();
    
    // STEP 3: Load teachers from teacher_subjects
    await this.loadTeachers();
    
    // STEP 4: Load rooms from department floors
    await this.loadRooms();
    
    // STEP 5: Load time slots
    await this.loadTimeSlots();
    
    // STEP 6: Preload all availability data
    await this.loadAvailability();

    // Build constraint maps for fast lookup
    this.buildConstraintMaps();

    console.log(`✅ Generator initialized:`);
    console.log(`   Section: ${this.data.section.name} (${this.data.batch.name})`);
    console.log(`   Department: ${this.data.department.code}`);
    console.log(`   Subjects: ${this.data.subjects.length}`);
    console.log(`   Teachers: ${this.data.teachers.size} mappings`);
    console.log(`   Rooms: ${this.data.rooms.length}`);
    console.log(`   Time Slots: ${this.data.timeSlots.length}`);

    return {
      section: this.data.section,
      batch: this.data.batch,
      department: this.data.department,
      subjectCount: this.data.subjects.length,
      roomCount: this.data.rooms.length,
      timeSlotCount: this.data.timeSlots.length,
    };
  }

  /**
   * STEP 1: Load section → batch → department hierarchy
   */
  async loadHierarchy(sectionId) {
    const section = await db.query.sections.findFirst({
      where: eq(schema.sections.id, sectionId),
      with: {
        batch: {
          with: {
            department: true,
          },
        },
      },
    });

    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    this.data.section = section;
    this.data.batch = section.batch;
    this.data.department = section.batch.department;
    this.batchId = section.batchId;
    this.departmentId = section.batch.departmentId;
  }

  /**
   * STEP 2: Load subjects from batch_subjects
   */
  async loadSubjects() {
    const batchSubjects = await db.query.batchSubjects.findMany({
      where: and(
        eq(schema.batchSubjects.batchId, this.batchId),
        eq(schema.batchSubjects.isActive, 'true')
      ),
      with: {
        subject: true,
      },
    });

    if (batchSubjects.length === 0) {
      throw new Error(`No subjects assigned to batch ${this.batchId}`);
    }

    this.data.subjects = batchSubjects.map(bs => ({
      ...bs.subject,
      hoursPerWeek: bs.hoursPerWeek,
    }));
  }

  /**
   * STEP 3: Load teachers from teacher_subjects
   */
  async loadTeachers() {
    for (const subject of this.data.subjects) {
      const teacherSubjects = await db.query.teacherSubjects.findMany({
        where: eq(schema.teacherSubjects.subjectId, subject.id),
        with: {
          teacher: {
            with: {
              user: true,
            },
          },
        },
      });

      // Filter teachers by department (prefer teachers from same department)
      const eligibleTeachers = teacherSubjects
        .map(ts => ts.teacher)
        .filter(t => t.departmentId === this.departmentId || t.departmentId === null);

      if (eligibleTeachers.length === 0) {
        console.warn(`⚠️ No eligible teachers for subject: ${subject.code}`);
      }

      this.data.teachers.set(subject.id, eligibleTeachers);
    }
  }

  /**
   * STEP 4: Load rooms from department floors
   */
  async loadRooms() {
    // Get floors assigned to this department
    const deptFloors = await db.query.floors.findMany({
      where: eq(schema.floors.departmentId, this.departmentId),
    });

    // Also get floors without department assignment (common/shared floors)
    const sharedFloors = await db.query.floors.findMany({
      where: eq(schema.floors.departmentId, null),
    });

    const allFloors = [...deptFloors, ...sharedFloors];
    const floorIds = allFloors.map(f => f.id);

    if (floorIds.length === 0) {
      throw new Error(`No floors available for department ${this.departmentId}`);
    }

    // Get rooms from these floors
    const rooms = await db.query.rooms.findMany({
      where: and(
        inArray(schema.rooms.floorId, floorIds),
        eq(schema.rooms.isActive, true)
      ),
    });

    if (rooms.length === 0) {
      throw new Error(`No rooms available in department floors`);
    }

    this.data.rooms = rooms;
  }

  /**
   * STEP 5: Load time slots
   */
  async loadTimeSlots() {
    const slots = await db.query.timeSlots.findMany({
      where: eq(schema.timeSlots.isActive, true),
      orderBy: (timeSlots, { asc }) => [
        asc(timeSlots.day),
        asc(timeSlots.slotNumber),
      ],
    });

    if (slots.length === 0) {
      throw new Error('No time slots configured');
    }

    this.data.timeSlots = slots;
  }

  /**
   * STEP 6: Preload all availability data for performance
   */
  async loadAvailability() {
    // Load teacher availability
    const teacherIds = Array.from(this.data.teachers.values())
      .flat()
      .map(t => t.id);

    if (teacherIds.length > 0) {
      const teacherAvails = await db.query.teacherAvailabilities.findMany({
        where: and(
          inArray(schema.teacherAvailabilities.teacherId, teacherIds),
          eq(schema.teacherAvailabilities.status, 'BUSY')
        ),
      });

      for (const avail of teacherAvails) {
        const key = `${avail.teacherId}-${avail.day}-${avail.startTime}`;
        this.data.teacherAvailability.set(key, avail);
      }
    }

    // Load room availability
    const roomIds = this.data.rooms.map(r => r.id);
    const roomAvails = await db.query.roomAvailabilities.findMany({
      where: and(
        inArray(schema.roomAvailabilities.roomId, roomIds),
        eq(schema.roomAvailabilities.status, 'BUSY')
      ),
    });

    for (const avail of roomAvails) {
      const key = `${avail.roomId}-${avail.day}-${avail.startTime}`;
      this.data.roomAvailability.set(key, avail);
    }
  }

  /**
   * Build constraint lookup maps for fast checking
   */
  buildConstraintMaps() {
    // Group time slots by day
    this.timeSlotsByDay = new Map();
    for (const slot of this.data.timeSlots) {
      if (!this.timeSlotsByDay.has(slot.day)) {
        this.timeSlotsByDay.set(slot.day, []);
      }
      this.timeSlotsByDay.get(slot.day).push(slot);
    }

    // Group rooms by type
    this.roomsByType = new Map();
    for (const room of this.data.rooms) {
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

    for (const subject of this.data.subjects) {
      const hours = subject.hoursPerWeek || 3;
      const subjectTeachers = this.data.teachers.get(subject.id) || [];

      if (subjectTeachers.length === 0) {
        console.warn(`⚠️ No teachers assigned to subject: ${subject.name} (${subject.code})`);
        continue;
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

    // Sort: prioritize labs, then by total hours (descending)
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
   * MAIN GENERATION: Generate routine for this section
   */
  async generate() {
    const sessions = this.expandSubjectsToSessions();
    
    if (sessions.length === 0) {
      return {
        success: false,
        message: 'No sessions to schedule (check teacher assignments)',
        sectionId: this.sectionId,
        totalSessions: 0,
        assignedSessions: 0,
      };
    }

    // Reset schedule tracking
    this.assignments = [];
    this.iterationCount = 0;
    this.schedule.teacher.clear();
    this.schedule.room.clear();
    this.schedule.section.clear();

    console.log(`\n🚀 Starting routine generation for ${sessions.length} sessions...`);

    const success = await this.backtrack(0, sessions);

    if (!success) {
      return {
        success: false,
        sectionId: this.sectionId,
        message: 'Unable to generate valid routine with current constraints',
        totalSessions: sessions.length,
        assignedSessions: this.assignments.length,
        iterations: this.iterationCount,
      };
    }

    return {
      success: true,
      sectionId: this.sectionId,
      totalSessions: sessions.length,
      assignedSessions: this.assignments.length,
      iterations: this.iterationCount,
      assignments: this.assignments,
    };
  }

  /**
   * Backtracking algorithm with section constraint
   */
  async backtrack(sessionIndex, sessions) {
    this.iterationCount++;
    
    if (this.iterationCount > this.maxIterations) {
      console.warn('⚠️ Max iterations reached');
      return false;
    }

    // Base case: all sessions assigned
    if (sessionIndex >= sessions.length) {
      return true;
    }

    const session = sessions[sessionIndex];
    const { subject, requiredRoomType } = session;
    const subjectTeachers = this.data.teachers.get(subject.id);

    if (!subjectTeachers || subjectTeachers.length === 0) {
      return false; // Cannot schedule without teachers
    }

    // Get shuffled time slots
    const shuffledTimeSlots = this.getShuffledTimeSlots(session);

    // Try each time slot
    for (const timeSlot of shuffledTimeSlots) {
      // NEW: Check section availability first
      if (!this.isSectionAvailable(this.sectionId, timeSlot.id)) {
        continue;
      }

      // Try each teacher
      for (const teacher of subjectTeachers) {
        // Check teacher availability
        if (!this.isTeacherAvailable(teacher.id, timeSlot)) {
          continue;
        }

        // Try each suitable room
        const suitableRooms = this.getSuitableRooms(requiredRoomType);
        for (const room of suitableRooms) {
          // Check room availability
          if (!this.isRoomAvailable(room.id, timeSlot)) {
            continue;
          }

          // ALL CONSTRAINTS SATISFIED - Make assignment
          const assignment = {
            // NEW: Store hierarchy IDs
            sectionId: this.sectionId,
            batchId: this.batchId,
            departmentId: this.departmentId,
            
            // Assignment
            subjectId: subject.id,
            teacherId: teacher.id,
            roomId: room.id,
            timeSlotId: timeSlot.id,
            
            // Metadata
            academicYear: this.academicYear,
            isRecurring: true,
            isActive: true,
            status: 'DRAFT',
            
            // Display data
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

          // Make the assignment
          this.assignments.push(assignment);
          this.markTeacherBooked(teacher.id, timeSlot.id);
          this.markRoomBooked(room.id, timeSlot.id);
          this.markSectionBooked(this.sectionId, timeSlot.id);

          // Recurse
          if (await this.backtrack(sessionIndex + 1, sessions)) {
            return true;
          }

          // Backtrack
          this.assignments.pop();
          this.unmarkTeacherBooked(teacher.id, timeSlot.id);
          this.unmarkRoomBooked(room.id, timeSlot.id);
          this.unmarkSectionBooked(this.sectionId, timeSlot.id);
        }
      }
    }

    return false;
  }

  /**
   * NEW: Check if section is available (not already booked)
   */
  isSectionAvailable(sectionId, timeSlotId) {
    return !this.schedule.section.has(`${sectionId}-${timeSlotId}`);
  }

  /**
   * Check teacher availability (uses preloaded data + current schedule)
   */
  isTeacherAvailable(teacherId, timeSlot) {
    // Check current schedule
    if (this.schedule.teacher.has(`${teacherId}-${timeSlot.id}`)) {
      return false;
    }

    // Check preloaded availability
    const key = `${teacherId}-${timeSlot.day}-${timeSlot.startTime}`;
    return !this.data.teacherAvailability.has(key);
  }

  /**
   * Check room availability (uses preloaded data + current schedule)
   */
  isRoomAvailable(roomId, timeSlot) {
    // Check current schedule
    if (this.schedule.room.has(`${roomId}-${timeSlot.id}`)) {
      return false;
    }

    // Check preloaded availability
    const key = `${roomId}-${timeSlot.day}-${timeSlot.startTime}`;
    return !this.data.roomAvailability.has(key);
  }

  /**
   * Get rooms suitable for subject type
   */
  getSuitableRooms(requiredType) {
    if (requiredType === 'LAB') {
      return this.roomsByType.get('LAB') || [];
    }
    // Non-lab subjects can use CLASSROOM, SEMINAR_HALL, AUDITORIUM
    const classrooms = this.roomsByType.get('CLASSROOM') || [];
    const seminarHalls = this.roomsByType.get('SEMINAR_HALL') || [];
    const auditoriums = this.roomsByType.get('AUDITORIUM') || [];
    return [...classrooms, ...seminarHalls, ...auditoriums];
  }

  /**
   * Get shuffled time slots with spread preference
   */
  getShuffledTimeSlots(session) {
    let slots = [...this.data.timeSlots];

    if (this.preferSpreadAcrossDays) {
      const subjectId = session.subject.id;
      const sessionsPerDay = new Map();

      for (const assignment of this.assignments) {
        if (assignment.subjectId === subjectId) {
          const day = assignment.timeSlot.day;
          sessionsPerDay.set(day, (sessionsPerDay.get(day) || 0) + 1);
        }
      }

      slots.sort((a, b) => {
        const countA = sessionsPerDay.get(a.day) || 0;
        const countB = sessionsPerDay.get(b.day) || 0;
        if (countA !== countB) return countA - countB;
        return a.slotNumber - b.slotNumber;
      });
    } else {
      slots = this.shuffleArray(slots);
    }

    return slots;
  }

  // Schedule marking helpers
  markTeacherBooked(teacherId, timeSlotId) {
    this.schedule.teacher.set(`${teacherId}-${timeSlotId}`, true);
  }

  unmarkTeacherBooked(teacherId, timeSlotId) {
    this.schedule.teacher.delete(`${teacherId}-${timeSlotId}`);
  }

  markRoomBooked(roomId, timeSlotId) {
    this.schedule.room.set(`${roomId}-${timeSlotId}`, true);
  }

  unmarkRoomBooked(roomId, timeSlotId) {
    this.schedule.room.delete(`${roomId}-${timeSlotId}`);
  }

  markSectionBooked(sectionId, timeSlotId) {
    this.schedule.section.set(`${sectionId}-${timeSlotId}`, true);
  }

  unmarkSectionBooked(sectionId, timeSlotId) {
    this.schedule.section.delete(`${sectionId}-${timeSlotId}`);
  }

  /**
   * Save generated routine to database
   */
  async saveToDatabase(userId) {
    if (this.assignments.length === 0) {
      throw new Error('No assignments to save');
    }

    console.log(`💾 Saving ${this.assignments.length} routine entries...`);

    const savedRoutines = await db.transaction(async (tx) => {
      const results = [];
      
      for (const assignment of this.assignments) {
        const [routine] = await tx.insert(schema.routines).values({
          departmentId: assignment.departmentId,
          batchId: assignment.batchId,
          sectionId: assignment.sectionId,
          subjectId: assignment.subjectId,
          teacherId: assignment.teacherId,
          roomId: assignment.roomId,
          timeSlotId: assignment.timeSlotId,
          academicYear: assignment.academicYear,
          isRecurring: assignment.isRecurring,
          isActive: assignment.isActive,
          isLocked: false,
          isManual: false,
          status: 'DRAFT',
          updatedBy: userId,
        }).returning();
        
        results.push(routine);
      }
      
      return results;
    });

    return savedRoutines;
  }

  /**
   * Fisher-Yates shuffle
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

