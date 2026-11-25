import { test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
const enabled = Boolean(
  process.env.TEST_DATABASE_URL && process.env.APP_TEST_URL,
);
const url = process.env.APP_TEST_URL ?? "http://localhost:3000";
class Browser {
  cookies = new Map<string, string>();
  async fetch(path: string, init: RequestInit = {}) {
    const response = await fetch(url + path, {
      ...init,
      redirect: "manual",
      headers: {
        ...Object.fromEntries(new Headers(init.headers).entries()),
        cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
      },
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(";");
      const index = pair.indexOf("=");
      this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return response;
  }
  async login(username: string, password: string) {
    const csrf = await (await this.fetch("/api/auth/csrf")).json();
    return this.fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: url,
        "X-Auth-Return-Redirect": "1",
      },
      body: new URLSearchParams({
        csrfToken: csrf.csrfToken,
        username,
        password,
        callbackUrl: url + "/dashboard",
      }),
    });
  }
  post(path: string, body: unknown) {
    return this.fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: url },
      body: JSON.stringify(body),
    });
  }
}
test(
  "real database and HTTP authentication/authorization workflows",
  { skip: !enabled },
  async (t) => {
    const connection = new URL(process.env.TEST_DATABASE_URL!);
    assert.match(
      connection.pathname,
      /test/,
      "Use a disposable database whose name includes test",
    );
    const db = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    });
    const suffix = randomUUID().slice(0, 8);
    const password = randomUUID() + randomUUID();
    const passwordHash = await hash(password, 12);
    const makeUser = (name: string, extra: Record<string, unknown> = {}) =>
      db.user.create({
        data: {
          username: `test.${name}.${suffix}`,
          firstName: "تلميذ",
          lastName: "اختبار",
          passwordHash,
          mustChangePassword: false,
          profile: { create: { specialityId: "science" } },
          ...extra,
        },
      });
    try {
      const student = await makeUser("active");
      const first = await makeUser("first", { mustChangePassword: true });
      const suspended = await makeUser("suspended", { status: "SUSPENDED" });
      const admin = await db.user.create({
        data: {
          username: `test.admin.${suffix}`,
          firstName: "مدير",
          lastName: "اختبار",
          passwordHash,
          role: "ADMIN",
          mustChangePassword: false,
        },
      });
      const chapter = await db.chapter.create({
        data: {
          title: `اختبار ${suffix}`,
          published: true,
          specialities: { create: { specialityId: "science" } },
        },
      });
      const own = await db.lesson.create({
        data: {
          title: `درس ${suffix}`,
          chapterId: chapter.id,
          published: true,
          specialities: { create: { specialityId: "science" } },
        },
      });
      const other = await db.lesson.create({
        data: {
          title: `غير مصرح ${suffix}`,
          chapterId: chapter.id,
          published: true,
          specialities: { create: { specialityId: "math" } },
        },
      });
      const draft = await db.lesson.create({
        data: {
          title: `مسودة ${suffix}`,
          chapterId: chapter.id,
          specialities: { create: { specialityId: "science" } },
        },
      });
      const client = new Browser();
      const firstClient = new Browser();
      const adminClient = new Browser();
      await t.test(
        "anonymous API access and admin pages are denied",
        async () => {
          assert.equal(
            (await new Browser().post("/api/manage/chapters", {})).status,
            401,
          );
          const res = await new Browser().fetch("/admin");
          assert.ok([303, 307].includes(res.status));
          assert.match(res.headers.get("location") ?? "", /login/);
        },
      );
      await t.test(
        "credentials log in and active students reach their dashboard",
        async () => {
          await client.login(student.username, password);
          const res = await client.fetch("/dashboard");
          assert.equal(res.status, 200);
          const text = await res.text();
          assert.ok(text.includes(own.title));
          assert.ok(!text.includes(other.title));
          assert.ok(!text.includes(draft.title));
        },
      );
      await t.test(
        "student cannot create accounts or access admin pages",
        async () => {
          assert.equal(
            (await client.post("/api/manage/students", {})).status,
            403,
          );
          const res = await client.fetch("/admin");
          assert.match(res.headers.get("location") ?? "", /dashboard/);
        },
      );
      await t.test(
        "unpublished and other-speciality lesson routes return 404",
        async () => {
          assert.equal(
            (await client.fetch(`/dashboard/lessons/${other.id}`)).status,
            404,
          );
          assert.equal(
            (await client.fetch(`/dashboard/lessons/${draft.id}`)).status,
            404,
          );
          assert.equal(
            (
              await client.post("/api/student/progress", {
                id: other.id,
                seconds: 10,
              })
            ).status,
            403,
          );
        },
      );
      await t.test(
        "progress is persisted only for authorized lessons",
        async () => {
          assert.equal(
            (
              await client.post("/api/student/progress", {
                id: own.id,
                seconds: 45,
                completed: true,
              })
            ).status,
            200,
          );
          const progress = await db.lessonProgress.findUniqueOrThrow({
            where: {
              userId_lessonId: { userId: student.id, lessonId: own.id },
            },
          });
          assert.equal(progress.seconds, 45);
          assert.equal(progress.completed, true);
        },
      );
      await t.test(
        "first-login users must change password before accessing content",
        async () => {
          await firstClient.login(first.username, password);
          const res = await firstClient.fetch("/dashboard");
          assert.match(res.headers.get("location") ?? "", /change-password/);
          assert.equal(
            (
              await firstClient.post("/api/student/progress", {
                id: own.id,
                seconds: 1,
              })
            ).status,
            400,
          );
          const changed = await firstClient.post("/api/student/password", {
            currentPassword: password,
            password: randomUUID() + randomUUID(),
          });
          assert.equal(changed.status, 200);
          assert.equal(
            (await db.user.findUniqueOrThrow({ where: { id: first.id } }))
              .mustChangePassword,
            false,
          );
        },
      );
      await t.test(
        "suspended accounts cannot establish authorized sessions",
        async () => {
          const blocked = new Browser();
          await blocked.login(suspended.username, password);
          const res = await blocked.fetch("/dashboard");
          assert.match(res.headers.get("location") ?? "", /login/);
        },
      );
      await t.test(
        "admin can create student and receives no password hash",
        async () => {
          await adminClient.login(admin.username, password);
          const res = await adminClient.post("/api/manage/students", {
            firstName: "أحمد",
            lastName: "اختبار",
            username: `test.created.${suffix}`,
            specialityId: "math",
            password: randomUUID(),
            status: "ACTIVE",
            notes: "private",
          });
          assert.equal(res.status, 200);
          const data = await res.json();
          assert.equal(data.data.passwordHash, undefined);
          const saved = await db.user.findUniqueOrThrow({
            where: { username: `test.created.${suffix}` },
          });
          assert.equal(saved.mustChangePassword, true);
        },
      );
      await t.test(
        "admin creates shared content without duplicate lesson records",
        async () => {
          const res = await adminClient.post("/api/manage/lessons", {
            title: `مشترك ${suffix}`,
            chapterId: chapter.id,
            duration: 30,
            position: 1,
            published: true,
            specialityIds: ["science", "math"],
          });
          assert.equal(res.status, 200);
          const data = await res.json();
          assert.equal(
            await db.lessonSpeciality.count({
              where: { lessonId: data.data.id },
            }),
            2,
          );
          const update = await adminClient.post("/api/manage/lessons", {
            id: data.data.id,
            title: `مشترك ${suffix}`,
            chapterId: chapter.id,
            duration: 30,
            position: 2,
            published: false,
            specialityIds: ["science"],
          });
          assert.equal(update.status, 200);
          assert.equal(
            await db.lessonSpeciality.count({
              where: { lessonId: data.data.id },
            }),
            1,
          );
          assert.equal(
            (await client.fetch(`/dashboard/lessons/${data.data.id}`)).status,
            404,
          );
        },
      );
      await t.test(
        "exams are graded on the server and cannot be resubmitted",
        async () => {
          const created = await adminClient.post("/api/manage/exams", {
            title: `اختبار ${suffix}`,
            duration: 30,
            kind: "QUIZ",
            specialityIds: ["science"],
            published: true,
            questions: [
              {
                text: "$1+1=?$",
                options: ["1", "2"],
                correctIndex: 1,
                points: 1,
              },
            ],
          });
          assert.equal(created.status, 200);
          const exam = (await created.json()).data;
          const question = await db.question.findFirstOrThrow({
            where: { examId: exam.id },
          });
          const html = await (
            await client.fetch(`/dashboard/exams/${exam.id}`)
          ).text();
          assert.ok(!html.includes("correctIndex"));
          const start = await client.post("/api/student/exam-start", {
            id: exam.id,
          });
          assert.equal(start.status, 200);
          const attempt = (await start.json()).attempt;
          const answer = {
            id: exam.id,
            attemptId: attempt.id,
            answers: { [question.id]: 1 },
            score: 0,
          };
          const submitted = await client.post(
            "/api/student/exam-submit",
            answer,
          );
          assert.equal(submitted.status, 200);
          assert.equal((await submitted.json()).score, 20);
          assert.equal(
            (await client.post("/api/student/exam-submit", answer)).status,
            403,
          );
        },
      );
      await t.test(
        "notification read state is private to the recipient",
        async () => {
          const otherNotice = await db.notification.create({
            data: {
              title: `خاص ${suffix}`,
              body: "private",
              recipients: { create: { userId: first.id } },
            },
          });
          assert.equal(
            (await client.post("/api/student/read", { id: otherNotice.id }))
              .status,
            400,
          );
          const created = await adminClient.post("/api/manage/notifications", {
            title: `إعلان ${suffix}`,
            body: "للتلميذ",
            specialityIds: [],
            userIds: [student.id],
          });
          assert.equal(created.status, 200);
          const notice = (await created.json()).data;
          assert.equal(
            (await client.post("/api/student/read", { id: notice.id })).status,
            200,
          );
          assert.ok(
            (
              await db.notificationRecipient.findUniqueOrThrow({
                where: {
                  notificationId_userId: {
                    notificationId: notice.id,
                    userId: student.id,
                  },
                },
              })
            ).readAt,
          );
        },
      );
      await t.test(
        "all administration and student navigation pages render",
        async () => {
          for (const page of [
            "",
            "students",
            "specialities",
            "chapters",
            "lessons",
            "live",
            "videos",
            "resources",
            "exercises",
            "exams",
            "notifications",
            "settings",
          ])
            assert.equal(
              (await adminClient.fetch(`/admin${page ? "/" + page : ""}`))
                .status,
              200,
              `admin ${page}`,
            );
          for (const page of [
            "lessons",
            "live",
            "curriculum",
            "exercises",
            "exams",
            "bac",
            "resources",
            "schedule",
            "notifications",
            "settings",
          ])
            assert.equal(
              (await client.fetch(`/dashboard/${page}`)).status,
              200,
              `student ${page}`,
            );
        },
      );
      await t.test("cross-origin mutations fail", async () => {
        assert.equal(
          (
            await client.fetch("/api/student/progress", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Origin: "https://invalid.example",
              },
              body: JSON.stringify({ id: own.id, seconds: 12 }),
            })
          ).status,
          403,
        );
      });
      await t.test("suspension revokes an already-issued session", async () => {
        await db.user.update({
          where: { id: student.id },
          data: { status: "SUSPENDED" },
        });
        assert.equal(
          (
            await client.post("/api/student/progress", {
              id: own.id,
              seconds: 20,
            })
          ).status,
          401,
        );
      });
      await t.test(
        "unknown username login is rate limited durably",
        async () => {
          const blocked = new Browser();
          for (let i = 0; i < 11; i++)
            await blocked.login(`test.missing.${suffix}`, "incorrect");
          assert.ok(
            (await db.rateLimit.findMany({ where: { count: { gt: 10 } } }))
              .length > 0,
          );
        },
      );
    } finally {
      await db.$disconnect();
    }
  },
);
