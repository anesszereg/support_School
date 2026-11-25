import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  canAccess,
  temporaryPassword,
  verifyZoom,
  grade,
  type Principal,
} from "../src/lib/security";
import { studentSchema, examSchema } from "../src/lib/validation";
const student: Principal = {
  id: "student",
  role: "STUDENT",
  status: "ACTIVE",
  mustChangePassword: false,
  profile: { specialityId: "science" },
};
test("active students can only access published speciality content", () => {
  assert.equal(canAccess(student, true, ["science"]), true);
  assert.equal(canAccess(student, true, ["math"]), false);
  assert.equal(canAccess(student, false, ["science"]), false);
  assert.equal(canAccess(null, true, ["science"]), false);
});
test("suspended, archived, first-login and unassigned accounts are denied", () => {
  for (const status of ["SUSPENDED", "ARCHIVED"])
    assert.equal(canAccess({ ...student, status }, true, ["science"]), false);
  assert.equal(
    canAccess({ ...student, mustChangePassword: true }, true, ["science"]),
    false,
  );
  assert.equal(
    canAccess({ ...student, profile: null }, true, ["science"]),
    false,
  );
});
test("administrator content access does not bypass account state", () => {
  assert.equal(canAccess({ ...student, role: "ADMIN" }, false, []), true);
  assert.equal(
    canAccess({ ...student, role: "ADMIN", status: "SUSPENDED" }, true, []),
    false,
  );
});
test("generated temporary passwords have 144 bits of entropy and are unique", () => {
  const passwords = new Set(Array.from({ length: 100 }, temporaryPassword));
  assert.equal(passwords.size, 100);
  for (const p of passwords) assert.ok(p.length >= 24);
});
test("Zoom webhook rejects forgery, tampering, stale and missing signatures", () => {
  const secret = "test-secret";
  const now = 1800000000000;
  const timestamp = String(now / 1000);
  const body = JSON.stringify({ event: "recording.completed" });
  const signature =
    "v0=" +
    createHmac("sha256", secret)
      .update(`v0:${timestamp}:${body}`)
      .digest("hex");
  assert.equal(verifyZoom(body, timestamp, signature, secret, now), true);
  assert.equal(
    verifyZoom(body + " ", timestamp, signature, secret, now),
    false,
  );
  assert.equal(
    verifyZoom(body, timestamp, signature, secret, now + 301000),
    false,
  );
  assert.equal(verifyZoom(body, timestamp, "", secret, now), false);
  assert.equal(verifyZoom(body, timestamp, signature, "", now), false);
});
test("server grading uses correct answers and weights, not client scores", () => {
  assert.equal(
    grade(
      [
        { id: "a", correctIndex: 1, points: 3 },
        { id: "b", correctIndex: 0, points: 1 },
      ],
      { a: 1, b: 1 },
    ),
    15,
  );
  assert.equal(grade([{ id: "a", correctIndex: 1, points: 1 }], {}), 0);
  assert.equal(grade([], {}), 0);
});
test("student creation validates speciality, password, username, optional email", () => {
  const value = {
    firstName: "أحمد",
    lastName: "عمر",
    username: "ahmed.one",
    specialityId: "science",
    password: temporaryPassword(),
    email: "",
  };
  assert.equal(studentSchema.safeParse(value).success, true);
  for (const patch of [
    { specialityId: "other" },
    { password: "short" },
    { username: "<script>" },
  ])
    assert.equal(
      studentSchema.safeParse({ ...value, ...patch }).success,
      false,
    );
});
test("exam validation rejects invalid correct answer indexes", () => {
  assert.equal(
    examSchema.safeParse({
      title: "اختبار",
      duration: 30,
      specialityIds: ["math"],
      questions: [
        { text: "x?", options: ["a", "b"], correctIndex: 3, points: 1 },
      ],
    }).success,
    false,
  );
});
