"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  KeyRound,
  Download,
  Upload,
  X,
  RefreshCw,
} from "lucide-react";
import Papa from "papaparse";
import { specialities } from "@/lib/constants";
import { request } from "./interactive";
import { Button } from "./ui/button";
type Row = Record<string, unknown> & {
  id: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  published?: boolean;
  specialityIds?: string[];
};
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: { id: string; title: string }[];
  required?: boolean;
};
const fieldMap: Record<string, Field[]> = {
  students: [
    { key: "firstName", label: "الاسم", required: true },
    { key: "lastName", label: "اللقب", required: true },
    { key: "username", label: "اسم المستخدم", required: true },
    { key: "phone", label: "الهاتف" },
    { key: "email", label: "البريد الإلكتروني", type: "email" },
    {
      key: "specialityId",
      label: "الشعبة",
      type: "select",
      options: specialities.map((s) => ({ id: s.id, title: s.name })),
      required: true,
    },
    { key: "password", label: "كلمة المرور المؤقتة", type: "password" },
    {
      key: "status",
      label: "حالة الحساب",
      type: "select",
      options: [
        { id: "ACTIVE", title: "نشط" },
        { id: "SUSPENDED", title: "موقوف" },
        { id: "ARCHIVED", title: "مؤرشف" },
      ],
    },
    { key: "notes", label: "ملاحظات إدارية داخلية", type: "textarea" },
  ],
  chapters: [
    { key: "title", label: "عنوان الفصل", required: true },
    { key: "description", label: "الوصف", type: "textarea" },
    { key: "position", label: "الترتيب", type: "number" },
  ],
  lessons: [
    { key: "title", label: "عنوان الدرس", required: true },
    { key: "description", label: "الوصف", type: "textarea" },
    { key: "chapterId", label: "الفصل", type: "chapters", required: true },
    { key: "videoId", label: "الفيديو", type: "videos" },
    { key: "duration", label: "المدة بالدقائق", type: "number" },
    { key: "position", label: "الترتيب", type: "number" },
  ],
  live: [
    { key: "title", label: "عنوان الحصة", required: true },
    { key: "description", label: "الوصف", type: "textarea" },
    {
      key: "startsAt",
      label: "التاريخ والوقت (التوقيت المحلي لجهازك)",
      type: "datetime-local",
      required: true,
    },
    {
      key: "duration",
      label: "المدة بالدقائق",
      type: "number",
      required: true,
    },
    {
      key: "status",
      label: "الحالة",
      type: "select",
      options: [
        { id: "SCHEDULED", title: "مجدولة" },
        { id: "LIVE", title: "مباشر" },
        { id: "COMPLETED", title: "مكتملة" },
        { id: "CANCELLED", title: "ملغاة" },
      ],
    },
  ],
  resources: [
    { key: "title", label: "عنوان الملف", required: true },
    { key: "objectKey", label: "مفتاح ملف R2 المرفوع", required: true },
    {
      key: "kind",
      label: "نوع الملف",
      type: "select",
      options: [
        { id: "PDF", title: "درس PDF" },
        { id: "SUMMARY", title: "ملخص" },
        { id: "CORRECTION", title: "تصحيح" },
        { id: "BAC", title: "موضوع بكالوريا" },
      ],
    },
    { key: "lessonId", label: "الدرس المرتبط (اختياري)", type: "lessons" },
  ],
  exercises: [
    { key: "title", label: "عنوان التمرين", required: true },
    {
      key: "statement",
      label: "نص التمرين (ضع المعادلات بين $...$)",
      type: "textarea",
      required: true,
    },
    { key: "solution", label: "الحل المفصل", type: "textarea" },
    {
      key: "resourceId",
      label: "سلسلة التمارين PDF (اختياري)",
      type: "resources",
    },
  ],
  exams: [
    { key: "title", label: "عنوان الاختبار", required: true },
    {
      key: "duration",
      label: "المدة بالدقائق",
      type: "number",
      required: true,
    },
    {
      key: "kind",
      label: "النوع",
      type: "select",
      options: [
        { id: "PRACTICE", title: "اختبار تجريبي" },
        { id: "BAC", title: "بكالوريا سابقة" },
        { id: "QUIZ", title: "اختبار قصير" },
      ],
    },
  ],
  notifications: [
    { key: "title", label: "العنوان", required: true },
    { key: "body", label: "نص الإعلان", type: "textarea", required: true },
    { key: "userIds", label: "معرّفات تلاميذ محددين، مفصولة بفاصلة (اختياري)" },
  ],
};
function randomPassword() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
export function AdminManager({
  entity,
  rows,
  chapters = [],
  videos = [],
  lessons = [],
  resources = [],
}: {
  entity: string;
  rows: Row[];
  chapters?: { id: string; title: string }[];
  videos?: { id: string; title: string }[];
  lessons?: { id: string; title: string }[];
  resources?: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fields = fieldMap[entity] ?? [];
  const list = rows.filter(
    (r) =>
      JSON.stringify([r.title, r.firstName, r.lastName, r.username])
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!filter || (r.status ?? String(r.published)) === filter) &&
      (!specialityFilter ||
        (r.specialityIds ?? [r.specialityId]).includes(specialityFilter)),
  );
  function edit(row?: Row) {
    setError("");
    setEditing(row ?? { id: "" });
    setValues(
      row
        ? {
            ...row,
            ...(row.startsAt
              ? {
                  startsAt: new Date(
                    new Date(String(row.startsAt)).getTime() -
                      new Date().getTimezoneOffset() * 60000,
                  )
                    .toISOString()
                    .slice(0, 16),
                }
              : {}),
          }
        : {
            specialityIds: [],
            published: false,
            status: entity === "students" ? "ACTIVE" : "SCHEDULED",
            duration: 60,
            position: 0,
            specialityId: "science",
            password: entity === "students" ? randomPassword() : undefined,
            kind: entity === "exams" ? "PRACTICE" : "PDF",
            questions: [
              { text: "", options: ["", ""], correctIndex: 0, points: 1 },
            ],
          },
    );
  }
  function set(key: string, value: unknown) {
    setValues((v) => ({ ...v, [key]: value }));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        ...values,
        id: editing?.id || undefined,
      };
      if (entity === "live")
        body.startsAt = new Date(String(values.startsAt)).toISOString();
      if (entity === "students" && !body.password)
        body.password = randomPassword();
      if (entity === "notifications")
        body.userIds = String(values.userIds ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (entity === "lessons" && !body.videoId) body.videoId = null;
      if (entity === "resources" && !body.lessonId) body.lessonId = null;
      if (entity === "exercises" && !body.resourceId) body.resourceId = null;
      await request(`/api/manage/${entity}`, body);
      setEditing(null);
      setNotice("تم حفظ البيانات بنجاح");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function exportCsv() {
    const safe = rows.map((r) => ({
      firstName: r.firstName,
      lastName: r.lastName,
      username: r.username,
      email: r.email,
      phone: r.phone,
      specialityId: r.specialityId,
      status: r.status,
    }));
    const blob = new Blob(
      ["\uFEFF" + Papa.unparse(safe, { escapeFormulae: true })],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function importCsv(file: File) {
    setBusy(true);
    setNotice("");
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        let count = 0;
        try {
          if (result.errors.length) throw new Error("ملف CSV غير صالح");
          if (result.data.length > 500)
            throw new Error("الحد الأقصى 500 تلميذ لكل ملف");
          for (const row of result.data) {
            await request("/api/manage/students", {
              ...row,
              password: row.password || randomPassword(),
              status: row.status || "ACTIVE",
              notes: row.notes || "",
            });
            count++;
          }
          setNotice(
            `تم استيراد ${count} تلميذاً. استخدم إعادة تعيين كلمة المرور لتسليم بيانات الدخول الفردية بأمان.`,
          );
          router.refresh();
        } catch (e) {
          setNotice(`تم استيراد ${count} قبل التوقف: ${(e as Error).message}`);
        } finally {
          setBusy(false);
        }
      },
      error: () => {
        setNotice("تعذر قراءة الملف");
        setBusy(false);
      },
    });
  }
  return (
    <>
      <div className="row between wrap" style={{ marginBottom: 22 }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          <div className="searchbox">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في القائمة..."
            />
          </div>
          {entity === "students" ? (
            <select
              className="input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">كل الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="SUSPENDED">موقوف</option>
              <option value="ARCHIVED">مؤرشف</option>
            </select>
          ) : (
            entity !== "notifications" && (
              <select
                className="input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">كل الحالات</option>
                <option value={entity === "live" ? "SCHEDULED" : "true"}>
                  {entity === "live" ? "مجدولة" : "منشور"}
                </option>
                <option value={entity === "live" ? "CANCELLED" : "false"}>
                  {entity === "live" ? "ملغاة" : "مسودة"}
                </option>
              </select>
            )
          )}
          {entity !== "notifications" && (
            <select
              className="input"
              value={specialityFilter}
              onChange={(e) => setSpecialityFilter(e.target.value)}
            >
              <option value="">كل الشعب</option>
              {specialities.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="row wrap">
          {entity === "students" && (
            <>
              <button className="btn secondary sm" onClick={exportCsv}>
                <Download size={14} />
                تصدير
              </button>
              <label className="btn secondary sm" style={{ cursor: "pointer" }}>
                <Upload size={14} />
                استيراد CSV
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  disabled={busy}
                  onChange={(e) => {
                    if (e.target.files?.[0]) void importCsv(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </>
          )}
          <Button size="sm" onClick={() => edit()}>
            <Plus size={15} />
            {entity === "notifications" ? "إرسال إعلان" : "إضافة جديد"}
          </Button>
        </div>
      </div>
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button
            style={{ float: "left", background: "none" }}
            onClick={() => setNotice("")}
            aria-label="إغلاق التنبيه"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>{entity === "students" ? "التلميذ" : "العنوان"}</th>
              <th>{entity === "students" ? "اسم المستخدم" : "الشعب"}</th>
              <th>الحالة</th>
              <th>التاريخ</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>
                    {entity === "students"
                      ? `${r.firstName} ${r.lastName}`
                      : r.title}
                  </strong>
                  {entity === "students" && (
                    <div className="muted small" style={{ marginTop: 4 }}>
                      {specialities.find((s) => s.id === r.specialityId)?.name}
                    </div>
                  )}
                </td>
                <td>
                  {entity === "students"
                    ? String(r.username)
                    : (r.specialityIds ?? [])
                        .map(
                          (id) => specialities.find((s) => s.id === id)?.name,
                        )
                        .join("، ") || "—"}
                </td>
                <td>
                  <span
                    className={`pill ${r.status === "SUSPENDED" || r.status === "CANCELLED" ? "red" : ""}`}
                  >
                    {r.status
                      ? ({
                          ACTIVE: "نشط",
                          SUSPENDED: "موقوف",
                          ARCHIVED: "مؤرشف",
                          SCHEDULED: "مجدولة",
                          LIVE: "مباشر",
                          COMPLETED: "مكتملة",
                          CANCELLED: "ملغاة",
                        }[r.status] ?? r.status)
                      : entity === "notifications"
                        ? "مُرسل"
                        : r.published
                          ? "منشور"
                          : "مسودة"}
                  </span>
                </td>
                <td className="muted">
                  {r.createdAt
                    ? new Date(String(r.createdAt)).toLocaleDateString("ar-DZ")
                    : "—"}
                </td>
                <td>
                  <div className="row">
                    {entity !== "notifications" && (
                      <button
                        className="icon-btn"
                        title="تعديل"
                        onClick={() => edit(r)}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {entity === "students" && (
                      <>
                        <button
                          className="icon-btn"
                          title="إعادة تعيين كلمة المرور"
                          onClick={async () => {
                            if (
                              !confirm(
                                "إعادة تعيين كلمة مرور هذا التلميذ وإبطال جلساته الحالية؟",
                              )
                            )
                              return;
                            try {
                              const result = await request(
                                "/api/manage/password",
                                { userId: r.id },
                              );
                              setNotice(
                                `كلمة المرور المؤقتة (انسخها الآن وسلّمها للتلميذ بأمان): ${result.data.password}`,
                              );
                            } catch (e) {
                              setNotice((e as Error).message);
                            }
                          }}
                        >
                          <KeyRound size={14} />
                        </button>
                        <a
                          className="btn soft sm"
                          href={`/admin/students/${r.id}`}
                        >
                          الملف
                        </a>
                      </>
                    )}
                    {entity === "live" && (
                      <a className="btn soft sm" href={`/admin/live/${r.id}`}>
                        بدء / دخول
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={5} className="empty">
                  لا توجد نتائج. أضف أول عنصر للبدء.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="محرر المحتوى"
          >
            <div className="row between">
              <h2>{editing.id ? "تعديل البيانات" : "إضافة جديد"}</h2>
              <button
                className="icon-btn"
                onClick={() => setEditing(null)}
                aria-label="إغلاق"
              >
                <X size={17} />
              </button>
            </div>
            <form onSubmit={save}>
              {fields
                .filter((f) => !(f.key === "password" && editing.id))
                .map((f) => {
                  const options =
                    f.options ??
                    (f.type === "chapters"
                      ? chapters
                      : f.type === "videos"
                        ? videos
                        : f.type === "lessons"
                          ? lessons
                          : f.type === "resources"
                            ? resources
                            : null);
                  return (
                    <div className="field" key={f.key}>
                      <label htmlFor={f.key}>{f.label}</label>
                      {f.type === "textarea" ? (
                        <textarea
                          id={f.key}
                          value={String(values[f.key] ?? "")}
                          required={f.required}
                          onChange={(e) => set(f.key, e.target.value)}
                        />
                      ) : options ? (
                        <select
                          id={f.key}
                          value={String(values[f.key] ?? "")}
                          required={f.required}
                          onChange={(e) => set(f.key, e.target.value)}
                        >
                          <option value="">اختر...</option>
                          {options.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={f.key}
                          type={
                            f.type === "password" ? "text" : (f.type ?? "text")
                          }
                          value={String(values[f.key] ?? "")}
                          required={
                            f.required || (f.key === "password" && !editing.id)
                          }
                          min={f.type === "number" ? 0 : undefined}
                          onChange={(e) =>
                            set(
                              f.key,
                              f.type === "number"
                                ? Number(e.target.value)
                                : e.target.value,
                            )
                          }
                        />
                      )}
                      {f.key === "password" && !editing.id && (
                        <button
                          className="text-link"
                          type="button"
                          style={{ background: "none" }}
                          onClick={() => {
                            const password = randomPassword();
                            set("password", password);
                            setNotice(`كلمة المرور المؤقتة: ${password}`);
                          }}
                        >
                          <RefreshCw size={12} />
                          توليد كلمة مرور آمنة (انسخها من التنبيه)
                        </button>
                      )}
                    </div>
                  );
                })}
              {entity !== "students" && (
                <fieldset
                  style={{
                    border: "1px solid var(--line)",
                    padding: 16,
                    borderRadius: 8,
                    margin: "15px 0",
                  }}
                >
                  <legend className="small">
                    {entity === "notifications"
                      ? "المستهدفون (اتركها فارغة للإرسال للجميع)"
                      : "الشعب المصرح لها"}
                  </legend>
                  <div className="grid grid-2">
                    {specialities.map((s) => (
                      <label className="check" key={s.id}>
                        <input
                          type="checkbox"
                          checked={(
                            (values.specialityIds as string[]) ?? []
                          ).includes(s.id)}
                          onChange={(e) => {
                            const ids =
                              (values.specialityIds as string[]) ?? [];
                            set(
                              "specialityIds",
                              e.target.checked
                                ? [...ids, s.id]
                                : ids.filter((id) => id !== s.id),
                            );
                          }}
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              {[
                "chapters",
                "lessons",
                "resources",
                "exercises",
                "exams",
              ].includes(entity) && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={!!values.published}
                    onChange={(e) => set("published", e.target.checked)}
                  />
                  نشر المحتوى للتلاميذ
                </label>
              )}
              {entity === "live" && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={!!values.recording}
                    onChange={(e) => set("recording", e.target.checked)}
                  />
                  تفعيل التسجيل السحابي (يتطلب خطة Zoom تدعمه)
                </label>
              )}
              {entity === "exams" && (
                <QuestionEditor
                  questions={(values.questions as Question[]) ?? []}
                  onChange={(q) => set("questions", q)}
                />
              )}
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              <div className="form-actions">
                <button className="btn" disabled={busy}>
                  {busy ? "جاري الحفظ..." : "حفظ البيانات"}
                </button>
                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => setEditing(null)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
type Question = {
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
};
function QuestionEditor({
  questions,
  onChange,
}: {
  questions: Question[];
  onChange: (q: Question[]) => void;
}) {
  function update(i: number, data: Partial<Question>) {
    onChange(questions.map((q, j) => (j === i ? { ...q, ...data } : q)));
  }
  return (
    <section>
      <h3>أسئلة الاختبار</h3>
      {questions.map((q, i) => (
        <div className="question" key={i}>
          <div className="field">
            <label>السؤال {i + 1}</label>
            <textarea
              required
              value={q.text}
              onChange={(e) => update(i, { text: e.target.value })}
            />
          </div>
          {q.options.map((o, j) => (
            <div className="row" key={j} style={{ marginBottom: 8 }}>
              <input
                aria-label={`الإجابة الصحيحة ${j + 1}`}
                type="radio"
                name={`correct-${i}`}
                checked={q.correctIndex === j}
                onChange={() => update(i, { correctIndex: j })}
              />
              <input
                className="input"
                aria-label={`الخيار ${j + 1}`}
                required
                value={o}
                onChange={(e) =>
                  update(i, {
                    options: q.options.map((v, k) =>
                      j === k ? e.target.value : v,
                    ),
                  })
                }
              />
            </div>
          ))}
          <div className="row wrap" style={{ marginTop: 12 }}>
            {q.options.length < 6 && (
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => update(i, { options: [...q.options, ""] })}
              >
                إضافة خيار
              </button>
            )}
            <label className="small">
              النقاط{" "}
              <input
                className="input"
                style={{ width: 70 }}
                type="number"
                min={1}
                max={20}
                value={q.points}
                onChange={(e) => update(i, { points: Number(e.target.value) })}
              />
            </label>
            <button
              className="btn secondary sm"
              type="button"
              onClick={() => onChange(questions.filter((_, j) => i !== j))}
            >
              حذف السؤال
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn soft sm"
        onClick={() =>
          onChange([
            ...questions,
            { text: "", options: ["", ""], correctIndex: 0, points: 1 },
          ])
        }
      >
        إضافة سؤال
      </button>
    </section>
  );
}
