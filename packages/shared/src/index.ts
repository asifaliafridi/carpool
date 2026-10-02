export type UserRole = "driver" | "passenger" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
