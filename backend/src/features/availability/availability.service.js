import { availabilityRepository } from './availability.repository.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const availabilityService = {
  async isTeacherAvailable(teacherId, timeSlotId) {
    const availability = await availabilityRepository.getTeacherAvailabilityBySlot(
      teacherId,
      timeSlotId
    );

    if (availability?.status === 'BUSY') {
      return { available: false, reason: 'BUSY', availability };
    }

    const routineConflict = await availabilityRepository.checkTeacherRoutineConflict(
      teacherId,
      timeSlotId
    );

    if (routineConflict) {
      return {
        available: false,
        reason: 'BOOKED',
        routine: routineConflict,
      };
    }

    return { available: true, reason: 'AVAILABLE' };
  },

  async isRoomAvailable(roomId, timeSlotId) {
    const availability = await availabilityRepository.getRoomAvailabilityBySlot(
      roomId,
      timeSlotId
    );

    if (availability?.status === 'BUSY') {
      return { available: false, reason: 'BUSY', availability };
    }

    const routineConflict = await availabilityRepository.checkRoomRoutineConflict(
      roomId,
      timeSlotId
    );

    if (routineConflict) {
      return {
        available: false,
        reason: 'BOOKED',
        routine: routineConflict,
      };
    }

    return { available: true, reason: 'AVAILABLE' };
  },

  async getAvailableTeachers(timeSlotId) {
    const timeSlot = await availabilityRepository.getTimeSlotById(timeSlotId);
    if (!timeSlot) {
      throw new AppError('Time slot not found', 404);
    }

    const allTeachers = await availabilityRepository.fetchAllTeachers();

    const busyTeacherIds = await availabilityRepository.getBusyTeacherIds(timeSlotId);
    const bookedTeacherIds = await availabilityRepository.getBookedTeacherIds(timeSlotId);
    const unavailableTeacherIds = new Set([...busyTeacherIds, ...bookedTeacherIds]);

    const availableTeachers = allTeachers
      .filter((teacher) => !unavailableTeacherIds.has(teacher.id))
      .map((teacher) => ({
        ...teacher,
        status: 'AVAILABLE',
      }));

    return {
      timeSlot,
      totalTeachers: allTeachers.length,
      availableCount: availableTeachers.length,
      busyCount: busyTeacherIds.length,
      bookedCount: bookedTeacherIds.length,
      teachers: availableTeachers,
    };
  },

  async getAvailableRooms(timeSlotId, filters = {}) {
    const timeSlot = await availabilityRepository.getTimeSlotById(timeSlotId);
    if (!timeSlot) {
      throw new AppError('Time slot not found', 404);
    }

    const allRooms = await availabilityRepository.fetchAllRooms({
      type: filters.type,
      isActive: true,
    });

    const busyRoomIds = await availabilityRepository.getBusyRoomIds(timeSlotId);
    const bookedRoomIds = await availabilityRepository.getBookedRoomIds(timeSlotId);
    const unavailableRoomIds = new Set([...busyRoomIds, ...bookedRoomIds]);

    const availableRooms = allRooms
      .filter((room) => !unavailableRoomIds.has(room.id))
      .map((room) => ({
        ...room,
        status: 'AVAILABLE',
      }));

    return {
      timeSlot,
      filters,
      totalRooms: allRooms.length,
      availableCount: availableRooms.length,
      busyCount: busyRoomIds.length,
      bookedCount: bookedRoomIds.length,
      rooms: availableRooms,
    };
  },

  async createTeacherAvailability(data) {
    const timeSlot = await availabilityRepository.getTimeSlotById(data.timeSlotId);
    if (!timeSlot) {
      throw new AppError('Time slot not found', 404);
    }

    const existing = await availabilityRepository.getTeacherAvailabilityBySlot(
      data.teacherId,
      data.timeSlotId
    );

    if (existing) {
      throw new AppError(
        'Availability record already exists for this teacher and time slot. Use update instead.',
        409
      );
    }

    const result = await availabilityRepository.createTeacherAvailability(data);
    return result;
  },

  async createRoomAvailability(data) {
    const timeSlot = await availabilityRepository.getTimeSlotById(data.timeSlotId);
    if (!timeSlot) {
      throw new AppError('Time slot not found', 404);
    }

    const existing = await availabilityRepository.getRoomAvailabilityBySlot(
      data.roomId,
      data.timeSlotId
    );

    if (existing) {
      throw new AppError(
        'Availability record already exists for this room and time slot. Use update instead.',
        409
      );
    }

    const result = await availabilityRepository.createRoomAvailability(data);
    return result;
  },

  async getTeacherAvailabilityList(teacherId) {
    const availabilityList = await availabilityRepository.getTeacherAvailabilityList(teacherId);

    const availabilityWithStatus = await Promise.all(
      availabilityList.map(async (avail) => {
        const routineCheck = await availabilityRepository.checkTeacherRoutineConflict(
          teacherId,
          avail.timeSlotId
        );
        return {
          ...avail,
          effectiveStatus: routineCheck ? 'BOOKED' : avail.status,
          routine: routineCheck || null,
        };
      })
    );

    return availabilityWithStatus;
  },

  async getRoomAvailabilityList(roomId) {
    const availabilityList = await availabilityRepository.getRoomAvailabilityList(roomId);

    const availabilityWithStatus = await Promise.all(
      availabilityList.map(async (avail) => {
        const routineCheck = await availabilityRepository.checkRoomRoutineConflict(
          roomId,
          avail.timeSlotId
        );
        return {
          ...avail,
          effectiveStatus: routineCheck ? 'BOOKED' : avail.status,
          routine: routineCheck || null,
        };
      })
    );

    return availabilityWithStatus;
  },

  async deleteTeacherAvailability(id) {
    const result = await availabilityRepository.deleteTeacherAvailability(id);
    if (!result) {
      throw new AppError('Teacher availability record not found', 404);
    }
    return result;
  },

  async deleteRoomAvailability(id) {
    const result = await availabilityRepository.deleteRoomAvailability(id);
    if (!result) {
      throw new AppError('Room availability record not found', 404);
    }
    return result;
  },

  async checkAvailabilityConflicts(teacherId, roomId, timeSlotId) {
    const [teacherCheck, roomCheck] = await Promise.all([
      this.isTeacherAvailable(teacherId, timeSlotId),
      this.isRoomAvailable(roomId, timeSlotId),
    ]);

    const conflicts = [];
    if (!teacherCheck.available) {
      conflicts.push({
        type: 'TEACHER',
        id: teacherId,
        reason: teacherCheck.reason,
        details: teacherCheck.availability || teacherCheck.routine,
      });
    }

    if (!roomCheck.available) {
      conflicts.push({
        type: 'ROOM',
        id: roomId,
        reason: roomCheck.reason,
        details: roomCheck.availability || roomCheck.routine,
      });
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      canSchedule: conflicts.length === 0,
    };
  },
};
