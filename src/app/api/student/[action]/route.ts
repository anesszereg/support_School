import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/access";
import { canAccess, grade } from "@/lib/security";
import {
  meetingSignature,
  signedDocument,
  signedVideo,
  env,
  zoomRequest,
} from "@/lib/integrations";
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ action: string }> },
) {
  try {
    if (req.headers.get("origin") !== req.nextUrl.origin)
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const { action } = await ctx.params;
    const user = await apiUser(false, action === "password");
    const body = await req.json();
    if (action === "password") {
      const data = z
        .object({
          currentPassword: z.string().max(128),
          password: z.string().min(12).max(128),
        })
        .parse(body);
      if (!(await compare(data.currentPassword, user.passwordHash)))
        throw new Error("INVALID_PASSWORD");
      await db.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hash(data.password, 12),
          mustChangePassword: false,
          sessionVersion: { increment: 1 },
        },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "theme") {
      const { theme } = z
        .object({ theme: z.enum(["light", "dark", "sage"]) })
        .parse(body);
      await db.userPreference.upsert({
        where: { userId: user.id },
        create: { userId: user.id, theme },
        update: { theme },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "read") {
      const { id } = z.object({ id: z.string() }).parse(body);
      await db.notificationRecipient.update({
        where: {
          notificationId_userId: { notificationId: id, userId: user.id },
        },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }
    const { id } = z.object({ id: z.string().min(1) }).parse(body);
    if (action === "progress" || action === "video") {
      const lesson = await db.lesson.findUniqueOrThrow({
        where: { id },
        include: { specialities: true, chapter: true, video: true },
      });
      if (
        !canAccess(
          user,
          lesson.published && lesson.chapter.published,
          lesson.specialities.map((s) => s.specialityId),
        )
      )
        throw new Error("FORBIDDEN");
      if (action === "video") {
        if (!lesson.video || lesson.video.status !== "ready")
          throw new Error("VIDEO_NOT_READY");
        return NextResponse.json({
          url: await signedVideo(lesson.video.streamId),
        });
      }
      const data = z
        .object({
          seconds: z.number().int().min(0).max(86400),
          completed: z.boolean().default(false),
        })
        .parse(body);
      await db.lessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: id } },
        create: { userId: user.id, lessonId: id, ...data },
        update: {
          seconds: data.seconds,
          ...(data.completed ? { completed: true } : {}),
        },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "document") {
      const resource = await db.resource.findUniqueOrThrow({
        where: { id },
        include: { specialities: true, lesson: { include: { chapter: true } } },
      });
      if (
        !canAccess(
          user,
          resource.published &&
            (!resource.lesson ||
              (resource.lesson.published && resource.lesson.chapter.published)),
          resource.specialities.map((s) => s.specialityId),
        )
      )
        throw new Error("FORBIDDEN");
      return NextResponse.json({
        url: await signedDocument(resource.objectKey),
      });
    }
    if (action === "join" || action === "attend") {
      const session = await db.liveSession.findUniqueOrThrow({
        where: { id },
        include: { specialities: true },
      });
      const windowOpen =
        Date.now() >= session.startsAt.getTime() - 15 * 60000 &&
        Date.now() <=
          session.startsAt.getTime() + (session.duration + 60) * 60000;
      if (
        !canAccess(
          user,
          true,
          session.specialities.map((s) => s.specialityId),
        ) ||
        !["LIVE", "SCHEDULED"].includes(session.status) ||
        !session.meetingId ||
        (!windowOpen && user.role !== "ADMIN")
      )
        throw new Error("FORBIDDEN");
      if (action === "attend") {
        await db.attendance.upsert({
          where: {
            userId_liveSessionId: { userId: user.id, liveSessionId: id },
          },
          create: { userId: user.id, liveSessionId: id },
          update: { leftAt: null },
        });
        return NextResponse.json({ ok: true });
      }
      const role = user.role === "ADMIN" ? 1 : 0;
      const zak =
        role === 1
          ? (
              await zoomRequest(
                `/users/${encodeURIComponent(env("ZOOM_HOST_USER_ID"))}/token?type=zak`,
                "GET",
              )
            ).token
          : undefined;
      return NextResponse.json({
        customerKey: user.id,
        signature: await meetingSignature(session.meetingId, role),
        sdkKey: env("ZOOM_SDK_KEY"),
        meetingNumber: session.meetingId,
        password: session.passcode ?? "",
        userName: `${user.firstName} ${user.lastName}`,
        zak,
      });
    }
    if (action === "leave") {
      await db.attendance.updateMany({
        where: { userId: user.id, liveSessionId: id },
        data: { leftAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "exam-start" || action === "exam-submit") {
      const exam = await db.exam.findUniqueOrThrow({
        where: { id },
        include: { questions: true },
      });
      if (!canAccess(user, exam.published, exam.specialityIds))
        throw new Error("FORBIDDEN");
      if (action === "exam-start") {
        const active = await db.examAttempt.findFirst({
          where: { userId: user.id, examId: id, submittedAt: null },
          orderBy: { startedAt: "desc" },
        });
        return NextResponse.json({
          attempt:
            active ??
            (await db.examAttempt.create({
              data: { userId: user.id, examId: id },
            })),
        });
      }
      const { attemptId, answers } = z
        .object({
          attemptId: z.string(),
          answers: z.record(z.string(), z.number().int().min(0).max(5)),
        })
        .parse(body);
      const attempt = await db.examAttempt.findUniqueOrThrow({
        where: { id: attemptId },
      });
      if (
        attempt.userId !== user.id ||
        attempt.examId !== id ||
        attempt.submittedAt
      )
        throw new Error("FORBIDDEN");
      const expired =
        Date.now() >
        attempt.startedAt.getTime() + (exam.duration * 60 + 30) * 1000;
      const score = expired ? 0 : grade(exam.questions, answers);
      const updated = await db.examAttempt.updateMany({
        where: { id: attemptId, submittedAt: null },
        data: { answers, score, submittedAt: new Date() },
      });
      if (!updated.count) throw new Error("FORBIDDEN");
      return NextResponse.json({ score, expired });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        error: message.startsWith("Integration not configured")
          ? message
          : "تعذر تنفيذ الطلب. تحقق من صلاحياتك أو موعد الحصة.",
      },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : message === "FORBIDDEN"
              ? 403
              : 400,
      },
    );
  }
}
