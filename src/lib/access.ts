import { auth } from "@/auth";
import { db, databaseConfigured } from "./db";
import { redirect } from "next/navigation";
export async function currentUser() {
  if (!databaseConfigured()) return null;
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({
    where: { id: session.user.id },
    include: { profile: { include: { speciality: true } }, preferences: true },
  });
}
export async function requireUser(allowPasswordChange = false) {
  const user = await currentUser();
  if (!user || user.status !== "ACTIVE") redirect("/login");
  if (user.mustChangePassword && !allowPasswordChange)
    redirect("/change-password");
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
export async function apiUser(admin = false, allowPasswordChange = false) {
  const user = await currentUser();
  if (!user || user.status !== "ACTIVE") throw new Error("UNAUTHORIZED");
  if (user.mustChangePassword && !allowPasswordChange)
    throw new Error("PASSWORD_CHANGE_REQUIRED");
  if (admin && user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
export function safeUser<
  T extends { passwordHash: string; sessionVersion: number },
>(user: T) {
  const { passwordHash, sessionVersion, ...safe } = user;
  void passwordHash;
  void sessionVersion;
  return safe;
}
