"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Play, Sun, Moon, Leaf } from "lucide-react";
import katex from "katex";
import { Stream, type StreamPlayerApi } from "@cloudflare/stream-react";
export async function request(path: string, body: unknown, method = "POST") {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "تعذر تنفيذ الطلب");
  return data;
}
export function Countdown({ date }: { date: string | null }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!date) return;
    const update = () =>
      setLeft(Math.max(0, new Date(date).getTime() - Date.now()));
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [date]);
  return (
    <div className="count-numbers">
      {[
        ["يوم", left === null ? "—" : Math.floor(left / 86400000)],
        ["ساعة", left === null ? "—" : Math.floor(left / 3600000) % 24],
        ["دقيقة", left === null ? "—" : Math.floor(left / 60000) % 60],
      ].map(([label, value]) => (
        <div className="count-num" key={label}>
          <strong>{value}</strong>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}
export function MathText({ text }: { text: string }) {
  return (
    <div style={{ lineHeight: 2 }}>
      {text.split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g).map((part, i) =>
        part.startsWith("$") ? (
          <span
            dir="ltr"
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part.replace(/^\$\$?|\$\$?$/g, ""), {
                throwOnError: false,
                trust: false,
                strict: "warn",
                displayMode: part.startsWith("$$"),
              }),
            }}
          />
        ) : (
          <span style={{ whiteSpace: "pre-wrap" }} key={i}>
            {part}
          </span>
        ),
      )}
    </div>
  );
}
export function ReadNotification({ id, read }: { id: string; read: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return read ? (
    <span className="muted small">مقروء</span>
  ) : (
    <>
      <button
        className="btn soft sm"
        onClick={async () => {
          try {
            await request("/api/student/read", { id });
            router.refresh();
          } catch {
            setError("تعذر التحديث");
          }
        }}
      >
        <Check size={13} />
        تحديد كمقروء
      </button>
      {error && <span className="error">{error}</span>}
    </>
  );
}
export function DocumentButton({ id }: { id: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <button
        className="btn soft sm"
        onClick={async () => {
          try {
            const data = await request("/api/student/document", { id });
            setUrl(data.url);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <FileText size={14} />
        قراءة الملف
      </button>
      {error && <p className="error">{error}</p>}
      {url && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: 1000 }}>
            <div className="row between" style={{ marginBottom: 15 }}>
              <h3>العارض التعليمي</h3>
              <button className="btn secondary sm" onClick={() => setUrl("")}>
                إغلاق
              </button>
            </div>
            <iframe className="pdf-viewer" src={url} title="ملف تعليمي PDF" />
          </div>
        </div>
      )}
    </>
  );
}
export function VideoPlayer({
  id,
  resume = 0,
}: {
  id: string;
  resume?: number;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const stream = useRef<StreamPlayerApi | undefined>(undefined);
  const lastSaved = useRef(0);
  const completed = useRef(false);
  function save(ended = false, force = false) {
    const seconds = stream.current?.currentTime ?? resume;
    if (
      !Number.isFinite(seconds) ||
      (!force && !ended && Date.now() - lastSaved.current < 15000)
    )
      return;
    lastSaved.current = Date.now();
    if (ended) completed.current = true;
    void request("/api/student/progress", {
      id,
      seconds: Math.floor(seconds),
      completed: completed.current,
    }).catch(() => setError("تعذر حفظ التقدم. تحقق من الاتصال."));
  }
  return (
    <div>
      {url ? (
        <Stream
          streamRef={stream}
          src={url.split("/").at(-1)!}
          startTime={resume}
          controls
          title="مشغل الدرس"
          primaryColor="#128c73"
          onTimeUpdate={() => save()}
          onEnded={() => save(true, true)}
          onPause={() => save(false, true)}
        />
      ) : (
        <div
          className="player"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <Play size={42} strokeWidth={1} />
          <button
            className="btn"
            onClick={async () => {
              try {
                const data = await request("/api/student/video", { id });
                setUrl(data.url);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            تشغيل الدرس بأمان
          </button>
          <span className="small" style={{ opacity: 0.6 }}>
            محتوى خاص بتلاميذ المنصة
          </span>
        </div>
      )}
      {error && (
        <div className="error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
      <button
        className="btn soft sm"
        style={{ marginTop: 15 }}
        onClick={async () => {
          try {
            await request("/api/student/progress", {
              id,
              seconds: resume,
              completed: true,
            });
            setError("تم تحديد الدرس كمكتمل");
          } catch {
            setError("تعذر حفظ التقدم");
          }
        }}
      >
        <Check size={14} />
        تحديد الدرس كمكتمل
      </button>
    </div>
  );
}
export function ThemeSelector({ initial = "light" }: { initial?: string }) {
  const [theme, setTheme] = useState(initial);
  const [error, setError] = useState("");
  return (
    <>
      <div className="row wrap">
        {[
          { id: "light", label: "النهاري", icon: Sun },
          { id: "dark", label: "الليلي", icon: Moon },
          { id: "sage", label: "الهدوء", icon: Leaf },
        ].map((t) => (
          <button
            key={t.id}
            className={`btn ${theme === t.id ? "" : "secondary"}`}
            onClick={async () => {
              try {
                await request("/api/student/theme", { theme: t.id });
                document.body.dataset.theme = t.id;
                setTheme(t.id);
              } catch {
                setError("تعذر حفظ المظهر");
              }
            }}
          >
            <t.icon size={17} />
            {t.label}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </>
  );
}
export function ExamRunner({
  id,
  duration,
  questions,
}: {
  id: string;
  duration: number;
  questions: { id: string; text: string; options: string[]; points: number }[];
}) {
  const [attempt, setAttempt] = useState<{
    id: string;
    startedAt: string;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(duration * 60);
  useEffect(() => {
    if (!attempt) return;
    const timer = setInterval(
      () =>
        setRemaining(
          Math.max(
            0,
            Math.ceil(
              (new Date(attempt.startedAt).getTime() +
                duration * 60000 -
                Date.now()) /
                1000,
            ),
          ),
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, [attempt, duration]);
  if (score !== null)
    return (
      <div className="card pad" style={{ textAlign: "center" }}>
        <h2>أحسنت، أكملت الاختبار</h2>
        <p style={{ fontSize: 50, color: "var(--green)", margin: 20 }}>
          {score} / 20
        </p>
        <p className="muted">ستجد هذه النتيجة محفوظة في سجل اختباراتك.</p>
      </div>
    );
  if (!attempt)
    return (
      <div className="card pad">
        <p>
          مدة الاختبار: {duration} دقيقة · عدد الأسئلة: {questions.length}
        </p>
        <p className="muted small" style={{ marginBottom: 20 }}>
          يبدأ احتساب الوقت عند الضغط على الزر. الإرسال بعد نهاية الوقت يحصل على
          صفر.
        </p>
        <button
          className="btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const data = await request("/api/student/exam-start", { id });
              setAttempt(data.attempt);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          بدء الاختبار
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const data = await request("/api/student/exam-submit", {
            id,
            attemptId: attempt.id,
            answers,
          });
          setScore(data.score);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="notice">
        الوقت المتبقي:{" "}
        <span className="latin">
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
        </span>
      </div>
      {questions.map((q, i) => (
        <div key={q.id} className="card question">
          <h3>
            السؤال {i + 1} <span className="pill">{q.points} نقطة</span>
          </h3>
          <MathText text={q.text} />
          {q.options.map((option, index) => (
            <label key={index}>
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === index}
                onChange={() => setAnswers({ ...answers, [q.id]: index })}
              />
              <MathText text={option} />
            </label>
          ))}
        </div>
      ))}
      {error && <div className="error">{error}</div>}
      <button className="btn" disabled={busy}>
        إرسال الإجابات
      </button>
    </form>
  );
}
