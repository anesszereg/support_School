"use client";
import { useRef, useState, useEffect } from "react";
import { Video } from "lucide-react";
import { request } from "./interactive";
export function Classroom({
  id,
  recording,
}: {
  id: string;
  recording: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Awaited<
    ReturnType<
      (typeof import("@zoom/meetingsdk/embedded"))["default"]["createClient"]
    >
  > | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  useEffect(
    () => () => {
      if (clientRef.current) void clientRef.current.leaveMeeting();
    },
    [],
  );
  async function join() {
    setBusy(true);
    setError("");
    try {
      const credentials = await request("/api/student/join", { id });
      const { default: ZoomMtgEmbedded } = await import(
        "@zoom/meetingsdk/embedded"
      );
      const client = ZoomMtgEmbedded.createClient();
      clientRef.current = client;
      if (!container.current) throw new Error("Classroom unavailable");
      await client.init({
        zoomAppRoot: container.current,
        language: "fr-FR",
        patchJsMedia: true,
        leaveOnPageUnload: true,
      });
      await client.join(credentials);
      setJoined(true);
      await request("/api/student/attend", { id });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {recording && (
        <div className="notice">
          تنبيه: هذه الحصة مسجّلة. قد يظهر صوتك وصورتك ومشاركاتك في تسجيل الحصة.
        </div>
      )}
      <div className="card pad">
        <div className="row between wrap" style={{ marginBottom: 20 }}>
          <span className="row">
            <Video size={20} color="var(--green)" />
            القاعة الافتراضية · Zoom
          </span>
          {!joined ? (
            <button className="btn" disabled={busy} onClick={join}>
              {busy ? "جاري تجهيز القاعة..." : "دخول القاعة"}
            </button>
          ) : (
            <button
              className="btn secondary"
              onClick={async () => {
                await clientRef.current?.leaveMeeting();
                await request("/api/student/leave", { id });
                setJoined(false);
              }}
            >
              مغادرة الحصة
            </button>
          )}
        </div>
        {error && <div className="error">{error}</div>}
        <div ref={container} style={{ minHeight: 500, position: "relative" }} />
        {!joined && (
          <p className="muted small">
            تُفتح القاعة قبل الموعد بـ 15 دقيقة. يتطلب الدخول موافقة الأستاذ
            ومتصفحاً متوافقاً، مع السماح بالكاميرا والميكروفون عند الحاجة.
          </p>
        )}
      </div>
    </div>
  );
}
