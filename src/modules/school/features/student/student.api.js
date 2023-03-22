import { bwFetch } from "~/features/api/bwFetch";

export function fetchStudents() {
  return bwFetch("/fetch-students");
}

export function addStudents() {
  return bwFetch("/add-students");
}
