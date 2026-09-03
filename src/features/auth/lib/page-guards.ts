import "server-only";
import { redirect } from "next/navigation";
import type { UserRole } from "@/constants/roles";
import { getCurrentSessionUser } from "./current-user";
import type { SessionUser } from "../types";
import { roleHomePath } from "../paths";

export async function requirePageUser(): Promise<SessionUser> {
  const user = await getCurrentSessionUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

export async function requirePageRole(role: UserRole): Promise<SessionUser> {
  const user = await requirePageUser();
  if (user.role !== role) {
    redirect(roleHomePath(user.role));
  }
  return user;
}
