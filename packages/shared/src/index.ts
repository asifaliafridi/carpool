export type UserRole = "driver" | "passenger" | "admin";
export type UserType = "DRIVER" | "RIDER" | "BOTH";

export interface User {
  id: string;
  name: string;
  email?: string | null;
  role: UserRole;
  userType: UserType;
}
