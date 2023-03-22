import type { Student } from "./Student.type";

/**
 * Data manipulation functions that operate on Students
 */

export const getAbsentRooms = (student: Student) => {
  return student.rooms?.filter((room) => room.is_absent === true) ?? [];
};

/**
 * @param {Student} student
 * @returns {Array<Room>} The rooms that the student is checked in to
 */
export const getCheckedInRooms = (student: Student) => {
  return student.rooms?.filter((room) => room.is_checked_in === true) ?? [];
};

export const fullName = (student: Student) => {
  return student.first_name + student.last_name;
};
