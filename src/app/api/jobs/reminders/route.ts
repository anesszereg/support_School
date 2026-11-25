import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
export async function POST(req: NextRequest) {
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  const actual = req.headers.get("authorization") ?? "";
  if (
    !process.env.CRON_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await db.liveSession.findMany({
    where: {
      status: "SCHEDULED",
      startsAt: { gte: new Date(), lte: new Date(Date.now() + 1800000) },
    },
    include: { specialities: true },
    take: 50,
  });
  for (const session of sessions) {
    const id = `reminder:${session.id}:${session.startsAt.getTime()}`;
    const recipients = await db.user.findMany({
      where: {
        role: "STUDENT",
        status: "ACTIVE",
        profile: {
          specialityId: { in: session.specialities.map((s) => s.specialityId) },
        },
      },
      select: { id: true },
    });
    await db.notification.upsert({
      where: { id },
      create: {
        id,
        title: session.title,
        body: "تبدأ حصتك المباشرة خلال نصف ساعة. حضّر أسئلتك ودفترك.",
        href: `/dashboard/live/${session.id}`,
      },
      update: {},
    });
    await db.notificationRecipient.createMany({
      data: recipients.map((user) => ({ userId: user.id, notificationId: id })),
      skipDuplicates: true,
    });
  }
  return NextResponse.json({ reminded: sessions.length });
}
