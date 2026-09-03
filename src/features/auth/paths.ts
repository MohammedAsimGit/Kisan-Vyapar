import type { UserRole } from "@/constants/roles";

export function roleHomePath(role: UserRole): string {
  return `/${role}`;
}
