import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { streamRequest, zoomRequest } from "@/lib/integrations";
export async function POST(req: NextRequest) {
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  const actual = req.headers.get("authorization") ?? "";
  if (
    !process.env.CRON_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jobs = await db.webhookEvent.findMany({
    where: {
      OR: [
        { status: { in: ["pending", "failed", "processing"] } },
        { status: "working", updatedAt: { lt: new Date(Date.now() - 300000) } },
      ],
      attempts: { lt: 8 },
    },
    take: 5,
  });
  for (const job of jobs) {
    const claim = await db.webhookEvent.updateMany({
      where: { id: job.id, updatedAt: job.updatedAt },
      data: { status: "working", attempts: { increment: 1 } },
    });
    if (!claim.count) continue;
    try {
      const payload = job.payload as {
        payload: { object: { id: number; uuid: string } };
      };
      const meeting = payload.payload.object;
      const session = await db.liveSession.findUnique({
        where: { meetingId: String(meeting.id) },
        include: { specialities: true },
      });
      if (!session) throw new Error("No matching session");
      const existingVideo = await db.video.findFirst({
        where: { title: `zoom:${meeting.uuid}` },
      });
      if (existingVideo) {
        const status = await streamRequest(
          `/${existingVideo.streamId}`,
          undefined,
          "GET",
        );
        if (!status.readyToStream) {
          await db.webhookEvent.update({
            where: { id: job.id },
            data: { status: "processing", attempts: { decrement: 1 } },
          });
          continue;
        }
        await db.$transaction(async (tx) => {
          await tx.video.update({
            where: { id: existingVideo.id },
            data: { status: "ready" },
          });
          const chapter =
            (await tx.chapter.findFirst({
              where: { title: "تسجيلات الحصص المباشرة" },
            })) ??
            (await tx.chapter.create({
              data: {
                title: "تسجيلات الحصص المباشرة",
                specialities: {
                  create: session.specialities.map((s) => ({
                    specialityId: s.specialityId,
                  })),
                },
              },
            }));
          for (const { specialityId } of session.specialities) {
            await tx.chapterSpeciality.upsert({
              where: {
                chapterId_specialityId: { chapterId: chapter.id, specialityId },
              },
              create: { chapterId: chapter.id, specialityId },
              update: {},
            });
            await tx.curriculumItem.upsert({
              where: {
                specialityId_chapterId: { specialityId, chapterId: chapter.id },
              },
              create: { specialityId, chapterId: chapter.id },
              update: {},
            });
          }
          await tx.lesson.upsert({
            where: { videoId: existingVideo.id },
            create: {
              title: session.title,
              chapterId: chapter.id,
              videoId: existingVideo.id,
              specialities: {
                create: session.specialities.map((s) => ({
                  specialityId: s.specialityId,
                })),
              },
            },
            update: {},
          });
          await tx.webhookEvent.update({
            where: { id: job.id },
            data: { status: "completed", error: null },
          });
        });
        continue;
      }
      const recording = await zoomRequest(
        `/meetings/${encodeURIComponent(encodeURIComponent(meeting.uuid))}/recordings`,
        "GET",
      );
      const file = recording.recording_files?.find(
        (f: { file_type: string; status: string }) =>
          f.file_type === "MP4" && f.status === "completed",
      );
      if (!file) throw new Error("No completed MP4");
      const token = await zoomRequest(
        `/meetings/${meeting.id}/recordings?include_fields=download_access_token`,
        "GET",
      );
      const download = new URL(file.download_url);
      if (
        download.protocol !== "https:" ||
        !(
          download.hostname === "zoom.us" ||
          download.hostname.endsWith(".zoom.us")
        )
      )
        throw new Error("Unexpected recording host");
      download.searchParams.set("access_token", token.download_access_token);
      const imported = await streamRequest("/copy", {
        url: download.toString(),
        requireSignedURLs: true,
        meta: { name: session.title },
      });
      await db.video.create({
        data: { streamId: imported.uid, title: `zoom:${meeting.uuid}` },
      });
      await db.webhookEvent.update({
        where: { id: job.id },
        data: { status: "processing", error: null },
      });
    } catch {
      await db.webhookEvent.update({
        where: { id: job.id },
        data: {
          status: "failed",
          error:
            "Import failed; verify provider configuration and recording availability.",
        },
      });
    }
  }
  return NextResponse.json({ processed: jobs.length });
}
