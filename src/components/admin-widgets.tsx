"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Upload, RefreshCw } from "lucide-react";
import { request } from "./interactive";
export function AnalyticsChart({
  data,
}: {
  data: { name: string; students: number }[];
}) {
  return (
    <div className="chart" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--line)"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #e9eeee" }}
          />
          <Bar
            dataKey="students"
            name="التلاميذ"
            fill="#128c73"
            radius={[5, 5, 0, 0]}
            maxBarSize={35}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function UploadPanel({ type }: { type: "video" | "document" }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <section className="card pad" style={{ marginBottom: 25 }}>
      <h2 style={{ marginBottom: 15 }}>
        {type === "video"
          ? "رفع فيديو إلى Cloudflare Stream"
          : "رفع مستند PDF إلى R2"}
      </h2>
      <p className="muted small" style={{ marginBottom: 15 }}>
        الرفع خاص ومباشر إلى مزود التخزين.{" "}
        {type === "video"
          ? "بعد المعالجة، اربط الفيديو بدرس وحدد الشعب ثم انشره."
          : "انسخ مفتاح الملف الناتج عند إنشاء المورد. الحد الأقصى 50 ميغابايت."}
      </p>
      <input
        className="input"
        placeholder="عنوان الملف"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ maxWidth: 400, marginBottom: 15 }}
      />
      <div>
        <label
          className="btn soft sm"
          style={{ cursor: busy ? "wait" : "pointer" }}
        >
          <Upload size={15} />
          {busy ? "جاري الرفع..." : "اختيار ملف ورفعه"}
          <input
            hidden
            type="file"
            disabled={busy || title.trim().length < 2}
            accept={type === "video" ? "video/*" : "application/pdf"}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (
                type === "document" &&
                (file.type !== "application/pdf" ||
                  file.size > 50 * 1024 * 1024)
              ) {
                setMessage("اختر ملف PDF لا يتجاوز 50 ميغابايت");
                return;
              }
              setBusy(true);
              setMessage("");
              try {
                const result = await request("/api/uploads", { type, title });
                let response;
                if (type === "video") {
                  const form = new FormData();
                  form.append("file", file);
                  response = await fetch(result.url, {
                    method: "POST",
                    body: form,
                  });
                } else
                  response = await fetch(result.url, {
                    method: "PUT",
                    headers: { "Content-Type": "application/pdf" },
                    body: file,
                  });
                if (!response.ok)
                  throw new Error(
                    "فشل الرفع. تحقق من CORS وحجم الملف وإعدادات الخدمة.",
                  );
                setMessage(
                  type === "document"
                    ? `تم الرفع. مفتاح الملف: ${result.key}`
                    : "تم رفع الفيديو. حدّث حالة المعالجة لاحقاً.",
                );
                router.refresh();
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
      </div>
      {message && (
        <p className="notice" style={{ marginTop: 15, userSelect: "all" }}>
          {message}
        </p>
      )}
    </section>
  );
}
export function RefreshVideo({ id }: { id: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        className="btn soft sm"
        onClick={async () => {
          try {
            const result = await request("/api/uploads", { id }, "PATCH");
            setMessage(result.status);
            router.refresh();
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        <RefreshCw size={13} />
        تحديث المعالجة
      </button>
      {message && <p className="small muted">{message}</p>}
    </>
  );
}
function LocalDateInput({ value }: { value: string }) {
  const [local, setLocal] = useState("");
  useEffect(() => {
    setLocal(
      value
        ? new Date(
            new Date(value).getTime() - new Date().getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : "",
    );
  }, [value]);
  return (
    <input
      id="examDate"
      name="examDate"
      type="datetime-local"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
    />
  );
}
export function PlatformForm({
  settings,
}: {
  settings: {
    teacherName: string;
    brandName: string;
    accentColor: string;
    defaultTheme: string;
    academicYear: string;
    contactPhone: string;
    contactEmail: string;
    examDate: string;
  };
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="card pad"
      style={{ maxWidth: 750 }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const data = Object.fromEntries(new FormData(e.currentTarget));
          await request("/api/manage/settings", {
            ...data,
            examDate: data.examDate
              ? new Date(String(data.examDate)).toISOString()
              : null,
          });
          setMessage("تم حفظ إعدادات المنصة");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {[
        { key: "teacherName", label: "اسم الأستاذ", type: "text" },
        { key: "brandName", label: "اسم المنصة", type: "text" },
        { key: "academicYear", label: "السنة الدراسية", type: "text" },
        {
          key: "contactPhone",
          label: "رقم WhatsApp الدولي، دون +",
          type: "tel",
        },
        {
          key: "contactEmail",
          label: "البريد الإلكتروني للتواصل",
          type: "email",
        },
        {
          key: "examDate",
          label: "موعد البكالوريا (عند إعلانه رسمياً)",
          type: "datetime-local",
        },
      ].map((f) => (
        <div className="field" key={f.key}>
          <label htmlFor={f.key}>{f.label}</label>
          {f.key === "examDate" ? (
            <LocalDateInput value={settings.examDate} />
          ) : (
            <input
              id={f.key}
              name={f.key}
              type={f.type}
              defaultValue={settings[f.key as keyof typeof settings]}
              required={["teacherName", "academicYear", "brandName"].includes(
                f.key,
              )}
            />
          )}
        </div>
      ))}
      <div className="field">
        <label htmlFor="accentColor">لون الهوية</label>
        <select
          id="accentColor"
          name="accentColor"
          defaultValue={settings.accentColor}
        >
          <option value="#128c73">الزمردي</option>
          <option value="#137f93">البترولي</option>
          <option value="#3865a8">الأزرق</option>
          <option value="#7954a1">البنفسجي</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="defaultTheme">المظهر الافتراضي للمنصة</label>
        <select
          id="defaultTheme"
          name="defaultTheme"
          defaultValue={settings.defaultTheme}
        >
          <option value="light">النهاري</option>
          <option value="dark">الليلي</option>
          <option value="sage">الهدوء</option>
        </select>
      </div>
      {message && <p className="notice">{message}</p>}
      <button className="btn" disabled={busy}>
        حفظ الإعدادات
      </button>
    </form>
  );
}
