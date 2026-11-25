import { SignJWT } from "jose";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Integration not configured: ${name}`);
  return value;
}
export async function zoomToken() {
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(env("ZOOM_ACCOUNT_ID"))}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env("ZOOM_CLIENT_ID")}:${env("ZOOM_CLIENT_SECRET")}`).toString("base64")}`,
      },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Zoom authorization failed");
  return (await response.json()).access_token as string;
}
export async function zoomRequest(
  path: string,
  method: string,
  body?: unknown,
) {
  const response = await fetch(`https://api.zoom.us/v2${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await zoomToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error("Zoom request failed");
  return response.status === 204 ? null : response.json();
}
export async function meetingSignature(meetingId: string, role: number) {
  const iat = Math.floor(Date.now() / 1000) - 30;
  return new SignJWT({
    appKey: env("ZOOM_SDK_KEY"),
    sdkKey: env("ZOOM_SDK_KEY"),
    mn: meetingId,
    role,
    tokenExp: iat + 7200,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime(iat + 7200)
    .sign(new TextEncoder().encode(env("ZOOM_SDK_SECRET")));
}
export async function streamRequest(
  path: string,
  body?: unknown,
  method = "POST",
) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env("CLOUDFLARE_ACCOUNT_ID")}/stream${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${env("CLOUDFLARE_API_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Cloudflare Stream request failed");
  const data = await response.json();
  if (!data.success) throw new Error("Cloudflare Stream operation failed");
  return data.result;
}
export async function signedVideo(streamId: string) {
  const data = await streamRequest(`/${encodeURIComponent(streamId)}/token`, {
    exp: Math.floor(Date.now() / 1000) + 3600,
    downloadable: false,
  });
  return `https://iframe.videodelivery.net/${data.token}`;
}
export async function signedDocument(key: string, upload = false) {
  const client = new S3Client({
    region: "auto",
    endpoint: env("R2_ENDPOINT"),
    credentials: {
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    },
  });
  const input = { Bucket: env("R2_BUCKET"), Key: key };
  return getSignedUrl(
    client,
    upload
      ? new PutObjectCommand({ ...input, ContentType: "application/pdf" })
      : new GetObjectCommand({
          ...input,
          ResponseContentType: "application/pdf",
          ResponseContentDisposition: "inline",
        }),
    { expiresIn: 300 },
  );
}
