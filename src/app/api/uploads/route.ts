import { NextRequest, NextResponse } from "next/server";
import { apiUser } from "@/lib/access";
import { signedDocument, streamRequest } from "@/lib/integrations";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomUUID } from "node:crypto";
export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("origin") !== req.nextUrl.origin)
      throw new Error("FORBIDDEN");
    const user = await apiUser(true);
    const { type, title } = z
      .object({
        type: z.enum(["video", "document"]),
        title: z.string().min(2).max(200),
      })
      .parse(await req.json());
    if (type === "document") {
      const key = `documents/${randomUUID()}.pdf`;
      return NextResponse.json({ url: await signedDocument(key, true), key });
    }
    const result = await streamRequest("/direct_upload", {
      maxDurationSeconds: 14400,
      requireSignedURLs: true,
      meta: { name: title },
    });
    const video = await db.video.create({
      data: { streamId: result.uid, title },
    });
    await db.auditLog.create({
      data: { actorId: user.id, action: "video.upload", targetId: video.id },
    });
    return NextResponse.json({ url: result.uploadURL, video });
  } catch {
    return NextResponse.json(
      {
        error:
          "Upload unavailable. Configure Cloudflare credentials and bucket CORS.",
      },
      { status: 400 },
    );
  }
}
export async function PATCH(req: NextRequest) {
  try {
    if (req.headers.get("origin") !== req.nextUrl.origin)
      throw new Error("FORBIDDEN");
    await apiUser(true);
    const { id } = z.object({ id: z.string() }).parse(await req.json());
    const video = await db.video.findUniqueOrThrow({ where: { id } });
    const result = await streamRequest(`/${video.streamId}`, undefined, "GET");
    const status = result.readyToStream
      ? "ready"
      : result.status?.state === "error"
        ? "failed"
        : "processing";
    await db.video.update({ where: { id }, data: { status } });
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json(
      { error: "Unable to refresh processing status" },
      { status: 400 },
    );
  }
}
