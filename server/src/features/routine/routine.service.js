import { routineGenerator } from './routine.generator.js';
import { routineRepository } from './routine.repository.js';
import { availabilityService } from '../availability/availability.service.js';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { routines } from '../../db/schema/index.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const routineService = {
  async generateRoutine(data) {
    const { semesterId, academicYear, preferSpreadAcrossDays, prioritizeLabs, maxIterations } = data;

    // Validate semester exists
    const semester = await routineRepository.getSemesterById(semesterId);
    if (!semester) {
      throw new AppError('Semester not found', 404);
    }

    // Check if routine already exists
    const existingRoutines = await routineRepository.getExistingRoutinesBySemester(semesterId);
    if (existingRoutines.length > 0) {
      throw new AppError(
        'Routine already exists for this semester. Delete existing routine first or use regenerate option.',
        409
      );
    }

    // Initialize generator
    await routineGenerator.initialize(semesterId, {
      academicYear: academicYear || semester.academicYear || new Date().getFullYear().toString(),
      preferSpreadAcrossDays,
      prioritizeLabs,
      maxIterations,
    });

    // Generate routine
    const generationResult = await routineGenerator.generate();

    if (!generationResult.success) {
      return {
        success: false,
        message: generationResult.message,
        stats: generationResult.stats,
      };
    }

    // Save to database within transaction
    let savedRoutines = [];
    try {
      savedRoutines = await db.transaction(async (tx) => {
        const assignments = generationResult.assignments;
        const year = academicYear || semester.academicYear || new Date().getFullYear().toString();
        
        const routines = await tx.insert(routineRepository.routines || 'routines').values(
          assignments.map((a) => ({
            semesterId: a.semesterId,
            subjectId: a.subjectId,
            teacherId: a.teacherId,
            roomId: a.roomId,
            timeSlotId: a.timeSlotId,
            academicYear: year,
            isRecurring: true,
            isActive: true,
          }))
        ).returning();

        return routines;
      });
    } catch (error) {
      console.error('Failed to save routine:', error);
      throw new AppError('Failed to save generated routine to database', 500);
    }

    return {
      success: true,
      message: 'Routine generated successfully',
      data: {
        semesterId,
        academicYear: academicYear || semester.academicYear,
        routines: savedRoutines,
        stats: generationResult.stats,
      },
    };
  },

  async getRoutineBySection(sectionId) {
    const routines = await routineRepository.getExistingRoutinesBySection(sectionId);

    if (!routines || routines.length === 0) {
      return {
        success: true,
        data: {
          sectionId,
          totalSessions: 0,
          routines: [],
          groupedByDay: this.groupRoutinesByDay([]),
        },
      };
    }

    const groupedByDay = this.groupRoutinesByDay(routines);
    const subjectIds = new Set(routines.map((r) => r.subjectId));
    const teacherIds = new Set(routines.map((r) => r.teacherId));
    const roomIds = new Set(routines.map((r) => r.roomId));

    return {
      success: true,
      data: {
        section: routines[0].section,
        batch: routines[0].batch,
        department: routines[0].department,
        status: routines[0].status,
        totalSessions: routines.length,
        uniqueSubjects: subjectIds.size,
        uniqueTeachers: teacherIds.size,
        uniqueRooms: roomIds.size,
        routines,
        groupedByDay,
      },
    };
  },

  async submitForApprovalSection(sectionId, updatedBy) {
    const existingRoutines = await routineRepository.getExistingRoutinesBySection(sectionId);
    if (!existingRoutines || existingRoutines.length === 0) {
      throw new AppError('No routines found for this section', 404);
    }

    await db
      .update(routines)
      .set({ status: 'PENDING', updatedBy, updatedAt: new Date() })
      .where(and(eq(routines.sectionId, sectionId), eq(routines.isActive, true)));

    return {
      success: true,
      message: 'Submitted for approval',
      data: { sectionId, status: 'PENDING' },
    };
  },
  async getRoutineBySemester(semesterId) {
    const semester = await routineRepository.getSemesterById(semesterId);
    if (!semester) {
      throw new AppError('Semester not found', 404);
    }

    const routines = await routineRepository.getExistingRoutinesBySemester(semesterId);

    // Group by day for better visualization
    const groupedByDay = this.groupRoutinesByDay(routines);

    // Calculate stats
    const subjectIds = new Set(routines.map((r) => r.subjectId));
    const teacherIds = new Set(routines.map((r) => r.teacherId));
    const roomIds = new Set(routines.map((r) => r.roomId));

    return {
      success: true,
      data: {
        semester,
        totalSessions: routines.length,
        uniqueSubjects: subjectIds.size,
        uniqueTeachers: teacherIds.size,
        uniqueRooms: roomIds.size,
        routines,
        groupedByDay,
      },
    };
  },

  async deleteRoutineBySemester(semesterId) {
    const semester = await routineRepository.getSemesterById(semesterId);
    if (!semester) {
      throw new AppError('Semester not found', 404);
    }

    const deleted = await routineRepository.deleteRoutinesBySemester(semesterId);

    return {
      success: true,
      message: `Deleted ${deleted.length} routine entries`,
      data: {
        deletedCount: deleted.length,
        semesterId,
      },
    };
  },

  async deactivateRoutineBySemester(semesterId) {
    const semester = await routineRepository.getSemesterById(semesterId);
    if (!semester) {
      throw new AppError('Semester not found', 404);
    }

    const deactivated = await routineRepository.deactivateRoutinesBySemester(semesterId);

    return {
      success: true,
      message: `Deactivated ${deactivated.length} routine entries`,
      data: {
        deactivatedCount: deactivated.length,
        semesterId,
      },
    };
  },

  async validateConstraints(semesterId) {
    const routines = await routineRepository.getExistingRoutinesBySemester(semesterId);
    const conflicts = [];

    // Check for teacher double-booking
    const teacherSlotMap = new Map();
    for (const routine of routines) {
      const key = `${routine.teacherId}-${routine.timeSlotId}`;
      if (teacherSlotMap.has(key)) {
        conflicts.push({
          type: 'TEACHER_DOUBLE_BOOKED',
          teacherId: routine.teacherId,
          teacherName: routine.teacher?.user?.name,
          timeSlot: routine.timeSlot,
          subjects: [teacherSlotMap.get(key).subject.name, routine.subject.name],
        });
      } else {
        teacherSlotMap.set(key, routine);
      }
    }

    // Check for room double-booking
    const roomSlotMap = new Map();
    for (const routine of routines) {
      const key = `${routine.roomId}-${routine.timeSlotId}`;
      if (roomSlotMap.has(key)) {
        conflicts.push({
          type: 'ROOM_DOUBLE_BOOKED',
          roomId: routine.roomId,
          roomName: routine.room.name,
          timeSlot: routine.timeSlot,
          subjects: [roomSlotMap.get(key).subject.name, routine.subject.name],
        });
      } else {
        roomSlotMap.set(key, routine);
      }
    }

    // Check lab subjects in non-lab rooms
    for (const routine of routines) {
      if (routine.subject.isLab && routine.room.type !== 'LAB') {
        conflicts.push({
          type: 'LAB_SUBJECT_IN_NON_LAB',
          subject: routine.subject.name,
          room: routine.room.name,
          roomType: routine.room.type,
        });
      }
    }

    return {
      success: true,
      data: {
        isValid: conflicts.length === 0,
        totalRoutines: routines.length,
        conflictCount: conflicts.length,
        conflicts,
      },
    };
  },

  groupRoutinesByDay(routines) {
    const grouped = {};
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    
    // Initialize all days
    for (const day of days) {
      grouped[day] = [];
    }

    // Group routines
    for (const routine of routines) {
      const day = routine.timeSlot?.day;
      if (day && grouped[day]) {
        grouped[day].push(routine);
      }
    }

    // Sort each day by slot number
    for (const day of days) {
      grouped[day].sort((a, b) => a.timeSlot.slotNumber - b.timeSlot.slotNumber);
    }

    return grouped;
  },

  async getGenerationPreview(semesterId) {
    const [semester, subjects, rooms, timeSlots] = await Promise.all([
      routineRepository.getSemesterById(semesterId),
      routineRepository.getSubjectsBySemester(semesterId),
      routineRepository.getAllRooms(),
      routineRepository.getAllTimeSlots(),
    ]);

    if (!semester) {
      throw new AppError('Semester not found', 404);
    }

    // Calculate expected sessions
    let totalSessions = 0;
    const subjectsWithoutTeachers = [];

    for (const subject of subjects) {
      const teachers = await routineRepository.getTeachersBySubject(subject.id);
      totalSessions += subject.hoursPerWeek || 3;
      
      if (teachers.length === 0) {
        subjectsWithoutTeachers.push(subject.name);
      }
    }

    // Calculate theoretical maximum capacity
    const totalRoomSlots = rooms.length * timeSlots.length;
    const totalTeacherCapacity = subjects.length * 10; // Rough estimate

    return {
      success: true,
      data: {
        semester,
        preview: {
          subjectCount: subjects.length,
          totalSessionsNeeded: totalSessions,
          availableRooms: rooms.length,
          availableTimeSlots: timeSlots.length,
          totalRoomSlots: totalRoomSlots,
          subjectsWithoutTeachers: subjectsWithoutTeachers,
          canGenerate: subjectsWithoutTeachers.length === 0 && totalSessions <= totalRoomSlots,
          warnings: subjectsWithoutTeachers.length > 0 
            ? [`${subjectsWithoutTeachers.length} subjects have no assigned teachers`]
            : [],
        },
      },
    };
  },

  // ============== MANUAL OVERRIDE METHODS ==============

  async updateRoutine(routineId, data, updatedBy) {
    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) {
      throw new AppError('Routine not found', 404);
    }

    if (routine.isLocked) {
      throw new AppError('Cannot update locked routine', 403);
    }

    const { teacherId, roomId, timeSlotId } = data;
    const newTeacherId = teacherId || routine.teacherId;
    const newRoomId = roomId || routine.roomId;
    const newTimeSlotId = timeSlotId || routine.timeSlotId;

    // Check if anything is actually changing
    if (
      newTeacherId === routine.teacherId &&
      newRoomId === routine.roomId &&
      newTimeSlotId === routine.timeSlotId
    ) {
      throw new AppError('No changes detected', 400);
    }

    // Check for conflicts if teacher or time slot is changing
    if (newTeacherId !== routine.teacherId || newTimeSlotId !== routine.timeSlotId) {
      const teacherConflict = await routineRepository.getTeacherRoutinesByTimeSlot(
        newTeacherId,
        newTimeSlotId
      );
      if (teacherConflict && teacherConflict.id !== routineId) {
        throw new AppError(
          `Teacher is already assigned to another routine at this time slot`,
          409
        );
      }
    }

    // Check for room conflicts if room or time slot is changing
    if (newRoomId !== routine.roomId || newTimeSlotId !== routine.timeSlotId) {
      const roomConflict = await routineRepository.getRoomRoutinesByTimeSlot(
        newRoomId,
        newTimeSlotId
      );
      if (roomConflict && roomConflict.id !== routineId) {
        throw new AppError(
          `Room is already booked at this time slot`,
          409
        );
      }
    }

    // Check availability using availability service
    const availabilityCheck = await availabilityService.checkAvailabilityConflicts(
      newTeacherId,
      newRoomId,
      newTimeSlotId
    );

    // Allow if current routine is the one causing the conflict (we're moving it)
    // Or if no conflicts exist
    if (availabilityCheck.hasConflicts) {
      const relevantConflicts = availabilityCheck.conflicts.filter(
        (c) =>
          (c.type === 'TEACHER' && c.details?.id !== routineId) ||
          (c.type === 'ROOM' && c.details?.id !== routineId)
      );

      if (relevantConflicts.length > 0) {
        throw new AppError(
          `Availability conflict: ${relevantConflicts.map((c) => `${c.type} is ${c.reason}`).join(', ')}`,
          409
        );
      }
    }

    const updatedRoutine = await routineRepository.updateRoutine(routineId, {
      ...data,
      updatedBy,
    });

    return {
      success: true,
      message: 'Routine updated successfully',
      data: updatedRoutine,
    };
  },

  async swapRoutines(routineId1, routineId2, updatedBy) {
    const [routine1, routine2] = await Promise.all([
      routineRepository.getRoutineById(routineId1),
      routineRepository.getRoutineById(routineId2),
    ]);

    if (!routine1 || !routine2) {
      throw new AppError('One or both routines not found', 404);
    }

    if (routine1.isLocked || routine2.isLocked) {
      throw new AppError('Cannot swap locked routines', 403);
    }

    // Check for conflicts in the swap
    // Routine 1 would get routine 2's slot
    const teacher1Conflict = await routineRepository.getTeacherRoutinesByTimeSlot(
      routine1.teacherId,
      routine2.timeSlotId
    );
    if (teacher1Conflict && teacher1Conflict.id !== routineId1) {
      throw new AppError(
        `Routine 1 teacher already has another class at routine 2's time slot`,
        409
      );
    }

    const room1Conflict = await routineRepository.getRoomRoutinesByTimeSlot(
      routine1.roomId,
      routine2.timeSlotId
    );
    if (room1Conflict && room1Conflict.id !== routineId1) {
      throw new AppError(
        `Routine 1 room is already booked at routine 2's time slot`,
        409
      );
    }

    // Routine 2 would get routine 1's slot
    const teacher2Conflict = await routineRepository.getTeacherRoutinesByTimeSlot(
      routine2.teacherId,
      routine1.timeSlotId
    );
    if (teacher2Conflict && teacher2Conflict.id !== routineId2) {
      throw new AppError(
        `Routine 2 teacher already has another class at routine 1's time slot`,
        409
      );
    }

    const room2Conflict = await routineRepository.getRoomRoutinesByTimeSlot(
      routine2.roomId,
      routine1.timeSlotId
    );
    if (room2Conflict && room2Conflict.id !== routineId2) {
      throw new AppError(
        `Routine 2 room is already booked at routine 1's time slot`,
        409
      );
    }

    const result = await routineRepository.swapRoutines(routineId1, routineId2);

    // Update both routines with updatedBy
    await routineRepository.updateRoutine(routineId1, { updatedBy });
    await routineRepository.updateRoutine(routineId2, { updatedBy });

    return {
      success: true,
      message: 'Routines swapped successfully',
      data: {
        routineId1,
        routineId2,
        swapped: true,
      },
    };
  },

  async lockRoutine(routineId, isLocked, updatedBy) {
    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) {
      throw new AppError('Routine not found', 404);
    }

    const result = await routineRepository.lockRoutine(routineId, isLocked, updatedBy);

    return {
      success: true,
      message: isLocked ? 'Routine locked successfully' : 'Routine unlocked successfully',
      data: result,
    };
  },

  async bulkLockRoutines(semesterId, isLocked, updatedBy) {
    const semester = await routineRepository.getSemesterById(semesterId);
    if (!semester) {
      throw new AppError('Semester not found', 404);
    }

    const result = await routineRepository.bulkLockRoutines(semesterId, isLocked, updatedBy);

    return {
      success: true,
      message: `${result.length} routines ${isLocked ? 'locked' : 'unlocked'} successfully`,
      data: {
        affectedCount: result.length,
        semesterId,
        isLocked,
      },
    };
  },

  async getRoutineById(routineId) {
    const routine = await routineRepository.getRoutineById(routineId);
    if (!routine) {
      throw new AppError('Routine not found', 404);
    }

    return {
      success: true,
      data: routine,
    };
  },

  // ============== APPROVAL WORKFLOW METHODS ==============

  async submitForApproval(semesterId, updatedBy) {
    const semester = await routineRepository.getSemesterById(semesterId);
    if (!semester) {
      throw new AppError('Semester not found', 404);
    }

    const routines = await routineRepository.getExistingRoutinesBySemester(semesterId);
    if (routines.length === 0) {
      throw new AppError('No routines found for this semester', 404);
    }

    // Validate no conflicts before submitting
    const validation = await this.validateConstraints(semesterId);
    if (!validation.data.isValid) {
      throw new AppError(
        `Cannot submit with conflicts: ${validation.data.conflictCount} issues found`,
        400
      );
    }

    const result = await routineRepository.updateRoutineStatus(semesterId, 'PENDING', updatedBy);

    return {
      success: true,
      message: `${result.length} routines submitted for approval`,
      data: {
        affectedCount: result.length,
        semesterId,
        status: 'PENDING',
      },
    };
  },

  async approveRoutine(semesterId, updatedBy) {
    const semester = await routineRepository.getSemesterById(semesterId);
    if (!semester) {
      throw new AppError('Semester not found', 404);
    }

    // Validate no conflicts before approving
    const validation = await this.validateConstraints(semesterId);
    if (!validation.data.isValid) {
      throw new AppError(
        `Cannot approve with conflicts: ${validation.data.conflictCount} issues found`,
        400
      );
    }

    const result = await routineRepository.updateRoutineStatus(semesterId, 'APPROVED', updatedBy);

    return {
      success: true,
      message: `${result.length} routines approved`,
      data: {
        affectedCount: result.length,
        semesterId,
        status: 'APPROVED',
      },
    };
  },

  async activateRoutine(semesterId, updatedBy) {
    const semester = await routineRepository.getSemesterById(semesterId);
    if (!semester) {
      throw new AppError('Semester not found', 404);
    }

    const result = await routineRepository.updateRoutineStatus(semesterId, 'ACTIVE', updatedBy);

    return {
      success: true,
      message: `${result.length} routines activated`,
      data: {
        affectedCount: result.length,
        semesterId,
        status: 'ACTIVE',
      },
    };
  },

  async rejectRoutine(semesterId, reason, updatedBy) {
    const semester = await routineRepository.getSemesterById(semesterId);
    if (!semester) {
      throw new AppError('Semester not found', 404);
    }

    const result = await routineRepository.updateRoutineStatus(semesterId, 'REJECTED', updatedBy);

    return {
      success: true,
      message: `${result.length} routines rejected`,
      data: {
        affectedCount: result.length,
        semesterId,
        status: 'REJECTED',
        reason,
      },
    };
  },

  async getPendingRoutines() {
    const routines = await routineRepository.getPendingRoutines();

    return {
      success: true,
      data: {
        totalPending: routines.length,
        routines: routines.map((r) => ({
          id: r.id,
          subject: r.subject,
          teacher: r.teacher,
          room: r.room,
          timeSlot: r.timeSlot,
          semester: r.semester,
          status: r.status,
        })),
      },
    };
  },
};
