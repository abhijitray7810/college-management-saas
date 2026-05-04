import { pgEnum } from 'drizzle-orm/pg-core';

export const dayEnum = pgEnum('day', [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]);

export const roomTypeEnum = pgEnum('room_type', [
  'CLASSROOM',
  'LAB',
  'SEMINAR_HALL',
  'AUDITORIUM',
]);

export const availabilityStatusEnum = pgEnum('availability_status', [
  'AVAILABLE',
  'BUSY',
  'BOOKED',
]);

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'PRESENT',
  'ABSENT',
  'LATE',
  'EXCUSED',
]);
