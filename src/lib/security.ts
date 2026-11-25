import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
export type Principal = {
  id: string;
  role: string;
  status: string;
  mustChangePassword: boolean;
  profile?: { specialityId: string } | null;
};
export function canAccess(
  user: Principal | null,
  published: boolean,
  specialityIds: string[],
) {
  if (!user || user.status !== "ACTIVE" || user.mustChangePassword)
    return false;
  return (
    user.role === "ADMIN" ||
    (published &&
      !!user.profile &&
      specialityIds.includes(user.profile.specialityId))
  );
}
export function temporaryPassword() {
  return randomBytes(18).toString("base64url");
}
export function verifyZoom(
  body: string,
  timestamp: string,
  signature: string,
  secret: string,
  now = Date.now(),
) {
  if (!secret || !timestamp || Math.abs(now / 1000 - Number(timestamp)) > 300)
    return false;
  const expected = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex")}`;
  return (
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
}
export function grade(
  questions: { id: string; correctIndex: number; points: number }[],
  answers: Record<string, number>,
) {
  const total = questions.reduce((s, q) => s + q.points, 0);
  const earned = questions.reduce(
    (s, q) => s + (answers[q.id] === q.correctIndex ? q.points : 0),
    0,
  );
  return total ? Math.round((earned / total) * 200) / 10 : 0;
}
