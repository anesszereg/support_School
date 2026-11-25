import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { verifyZoom } from "@/lib/security";
import { db } from "@/lib/db";
export async function POST(req: NextRequest) {
  const body = await req.text();
  const secret = process.env.ZOOM_WEBHOOK_SECRET ?? "";
  if (
    !verifyZoom(
      body,
      req.headers.get("x-zm-request-timestamp") ?? "",
      req.headers.get("x-zm-signature") ?? "",
      secret,
    )
  )
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (payload.event === "endpoint.url_validation") {
    const plainToken = payload.payload?.plainToken;
    if (typeof plainToken !== "string")
      return NextResponse.json({ error: "Invalid challenge" }, { status: 400 });
    return NextResponse.json({
      plainToken,
      encryptedToken: createHmac("sha256", secret)
        .update(plainToken)
        .digest("hex"),
    });
  }
  if (payload.event === "recording.completed") {
    const uuid = payload.payload?.object?.uuid;
    const meetingId = Number(payload.payload?.object?.id);
    if (
      typeof uuid !== "string" ||
      uuid.length > 200 ||
      !Number.isSafeInteger(meetingId) ||
      meetingId <= 0
    )
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    await db.webhookEvent.upsert({
      where: { id: `zoom:${uuid}` },
      create: {
        id: `zoom:${uuid}`,
        payload: { payload: { object: { id: meetingId, uuid } } },
      },
      update: {},
    });
  }
  return NextResponse.json({ received: true });
}
