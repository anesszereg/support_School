import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser, safeUser } from "@/lib/access";
import {
  studentSchema,
  chapterSchema,
  lessonSchema,
  liveSchema,
  resourceSchema,
  exerciseSchema,
  examSchema,
} from "@/lib/validation";
import { zoomRequest, env } from "@/lib/integrations";
import { temporaryPassword } from "@/lib/security";
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ entity: string }> },
) {
  try {
    if (req.headers.get("origin") !== req.nextUrl.origin)
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const actor = await apiUser(true);
    const { entity } = await ctx.params;
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : undefined;
    let result: unknown;
    if (entity === "password") {
      const input = z.object({ userId: z.string() }).parse(body);
      const password = temporaryPassword();
      const target = await db.user.findUniqueOrThrow({
        where: { id: input.userId },
      });
      if (target.role !== "STUDENT") throw new Error("FORBIDDEN");
      await db.user.update({
        where: { id: target.id },
        data: {
          passwordHash: await hash(password, 12),
          mustChangePassword: true,
          sessionVersion: { increment: 1 },
        },
      });
      result = { password };
    } else if (entity === "students") {
      const data = studentSchema.parse(
        id ? { ...body, password: temporaryPassword() } : body,
      );
      const { specialityId, notes, password, ...fields } = data;
      const target = id
        ? await db.user.findUniqueOrThrow({ where: { id } })
        : null;
      if (target && target.role !== "STUDENT") throw new Error("FORBIDDEN");
      const profile = { specialityId, notes };
      const user = id
        ? await db.user.update({
            where: { id },
            data: {
              ...fields,
              profile: { upsert: { create: profile, update: profile } },
              sessionVersion: { increment: 1 },
            },
          })
        : await db.user.create({
            data: {
              ...fields,
              passwordHash: await hash(password, 12),
              profile: { create: profile },
            },
          });
      result = safeUser(user);
    } else if (entity === "chapters") {
      const { specialityIds, ...data } = chapterSchema.parse(body);
      result = await db.$transaction(async (tx) => {
        if (id) {
          await tx.chapterSpeciality.deleteMany({ where: { chapterId: id } });
          await tx.curriculumItem.deleteMany({ where: { chapterId: id } });
        }
        const values = {
          ...data,
          specialities: {
            create: specialityIds.map((specialityId) => ({ specialityId })),
          },
          curriculum: {
            create: specialityIds.map((specialityId) => ({
              specialityId,
              position: data.position,
            })),
          },
        };
        return id
          ? tx.chapter.update({ where: { id }, data: values })
          : tx.chapter.create({ data: values });
      });
    } else if (entity === "lessons") {
      const { specialityIds, ...data } = lessonSchema.parse(body);
      result = await db.$transaction(async (tx) => {
        if (id)
          await tx.lessonSpeciality.deleteMany({ where: { lessonId: id } });
        const values = {
          ...data,
          specialities: {
            create: specialityIds.map((specialityId) => ({ specialityId })),
          },
        };
        return id
          ? tx.lesson.update({ where: { id }, data: values })
          : tx.lesson.create({ data: values });
      });
      if (data.published)
        await notify(
          specialityIds,
          data.title,
          "درس جديد متاح الآن",
          "/dashboard/lessons",
        );
    } else if (entity === "live") {
      const { specialityIds, ...data } = liveSchema.parse(body);
      const old = id
        ? await db.liveSession.findUniqueOrThrow({ where: { id } })
        : null;
      const meeting = {
        topic: data.title,
        agenda: data.description,
        type: 2,
        start_time: data.startsAt,
        duration: data.duration,
        timezone: "Africa/Algiers",
        settings: {
          waiting_room: true,
          join_before_host: false,
          auto_recording: data.recording ? "cloud" : "none",
        },
      };
      let meetingId = old?.meetingId;
      if (!id) {
        const created = await zoomRequest(
          `/users/${encodeURIComponent(env("ZOOM_HOST_USER_ID"))}/meetings`,
          "POST",
          meeting,
        );
        meetingId = String(created.id);
        result = created.password;
      } else if (meetingId)
        await zoomRequest(
          `/meetings/${meetingId}`,
          data.status === "CANCELLED" ? "DELETE" : "PATCH",
          data.status === "CANCELLED" ? undefined : meeting,
        );
      const passcode = typeof result === "string" ? result : old?.passcode;
      result = await db.$transaction(async (tx) => {
        if (id)
          await tx.liveSessionSpeciality.deleteMany({
            where: { liveSessionId: id },
          });
        const values = {
          ...data,
          startsAt: new Date(data.startsAt),
          meetingId,
          passcode,
          specialities: {
            create: specialityIds.map((specialityId) => ({ specialityId })),
          },
        };
        return id
          ? tx.liveSession.update({ where: { id }, data: values })
          : tx.liveSession.create({ data: values });
      });
      await notify(
        specialityIds,
        data.title,
        data.status === "CANCELLED"
          ? "تم إلغاء الحصة"
          : "تم تحديث موعد الحصة المباشرة",
        "/dashboard/live",
      );
    } else if (entity === "resources") {
      const { specialityIds, ...data } = resourceSchema.parse(body);
      result = await db.$transaction(async (tx) => {
        if (id)
          await tx.resourceSpeciality.deleteMany({ where: { resourceId: id } });
        const values = {
          ...data,
          specialities: {
            create: specialityIds.map((specialityId) => ({ specialityId })),
          },
        };
        return id
          ? tx.resource.update({ where: { id }, data: values })
          : tx.resource.create({ data: values });
      });
      if (data.published)
        await notify(
          specialityIds,
          data.title,
          "ملف تعليمي جديد",
          "/dashboard/resources",
        );
    } else if (entity === "exercises") {
      const data = exerciseSchema.parse(body);
      result = id
        ? await db.exercise.update({ where: { id }, data })
        : await db.exercise.create({ data });
      if (data.published)
        await notify(
          data.specialityIds,
          data.title,
          "تمرين جديد",
          "/dashboard/exercises",
        );
    } else if (entity === "exams") {
      const { questions, ...data } = examSchema.parse(body);
      result = await db.$transaction(async (tx) => {
        if (id) await tx.question.deleteMany({ where: { examId: id } });
        const values = {
          ...data,
          questions: {
            create: questions.map((q, position) => ({ ...q, position })),
          },
        };
        return id
          ? tx.exam.update({ where: { id }, data: values })
          : tx.exam.create({ data: values });
      });
    } else if (entity === "notifications") {
      const data = z
        .object({
          title: z.string().min(2).max(200),
          body: z.string().min(1).max(5000),
          specialityIds: z.array(z.string()).default([]),
          userIds: z.array(z.string()).default([]),
        })
        .parse(body);
      const users = await db.user.findMany({
        where: {
          role: "STUDENT",
          status: "ACTIVE",
          ...(data.userIds.length
            ? { id: { in: data.userIds } }
            : data.specialityIds.length
              ? { profile: { specialityId: { in: data.specialityIds } } }
              : {}),
        },
        select: { id: true },
      });
      result = await db.notification.create({
        data: {
          title: data.title,
          body: data.body,
          recipients: { create: users.map((u) => ({ userId: u.id })) },
        },
      });
    } else if (entity === "settings") {
      const data = z
        .object({
          teacherName: z.string().min(2).max(100),
          brandName: z.string().min(2).max(30),
          accentColor: z.enum(["#128c73", "#137f93", "#3865a8", "#7954a1"]),
          defaultTheme: z.enum(["light", "dark", "sage"]),
          academicYear: z.string().regex(/^20\d{2}$/),
          contactPhone: z.string().max(30),
          contactEmail: z.union([z.string().email(), z.literal("")]),
          examDate: z.string().nullable().optional(),
        })
        .parse(body);
      const values = {
        ...data,
        examDate: data.examDate ? new Date(data.examDate) : null,
      };
      result = await db.platformSettings.upsert({
        where: { id: "platform" },
        create: values,
        update: values,
      });
    } else return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.auditLog.create({
      data: {
        actorId: actor.id,
        action: `${entity}.${id ? "update" : "create"}`,
        targetId: id,
      },
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json(
      {
        error: message.startsWith("Integration not configured")
          ? message
          : "تعذر حفظ البيانات. تحقق من الحقول والصلاحيات وإعدادات الخدمة.",
      },
      { status },
    );
  }
}
async function notify(
  specialityIds: string[],
  title: string,
  body: string,
  href: string,
) {
  const users = await db.user.findMany({
    where: {
      role: "STUDENT",
      status: "ACTIVE",
      profile: { specialityId: { in: specialityIds } },
    },
    select: { id: true },
  });
  await db.notification.create({
    data: {
      title,
      body,
      href,
      recipients: { create: users.map((u) => ({ userId: u.id })) },
    },
  });
}
