import { notFound } from "next/navigation";
import {
  Users,
  Video,
  BookOpen,
  UserCheck,
  CalendarDays,
  BarChart3,
  FileText,
  Activity,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access";
import { Shell } from "@/components/shell";
import { PageHeading, Empty } from "@/components/dashboard";
import { AdminManager } from "@/components/admin-manager";
import {
  AnalyticsChart,
  PlatformForm,
  RefreshVideo,
  UploadPanel,
} from "@/components/admin-widgets";
import { Classroom } from "@/components/classroom";
import { LiveCalendar } from "@/components/live-calendar";
import { specialities } from "@/lib/constants";
function serialize<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
export default async function AdminPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const user = await requireAdmin();
  const { path = [] } = await params;
  const [page = "", id] = path;
  const settings = await db.platformSettings.findUnique({
    where: { id: "platform" },
  });
  let content: React.ReactNode;
  if (page === "") {
    const [
      total,
      active,
      suspended,
      lessons,
      videos,
      completed,
      attendance,
      progress,
      studentsBySpeciality,
      sessions,
      logs,
    ] = await Promise.all([
      db.user.count({ where: { role: "STUDENT" } }),
      db.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
      db.user.count({ where: { role: "STUDENT", status: "SUSPENDED" } }),
      db.lesson.count({ where: { published: true } }),
      db.video.count(),
      db.liveSession.count({ where: { status: "COMPLETED" } }),
      db.attendance.count(),
      db.lessonProgress.count({ where: { completed: true } }),
      db.studentProfile.groupBy({ by: ["specialityId"], _count: true }),
      db.liveSession.findMany({
        where: {
          status: { in: ["SCHEDULED", "LIVE"] },
          startsAt: { gte: new Date(Date.now() - 3600000) },
        },
        orderBy: { startsAt: "asc" },
        take: 5,
      }),
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actor: { select: { firstName: true, lastName: true } } },
      }),
    ]);
    content = (
      <>
        <PageHeading
          title={`مرحباً أستاذ ${user.firstName}`}
          subtitle="كل ما تحتاجه لإدارة رحلة تلاميذك، في مساحة واحدة."
        />
        <section className="welcome-banner">
          <div className="welcome-copy">
            <span className="pill">لوحة الإدارة · BAC 2027</span>
            <h2>وراء كل نجاح، أستاذ يصنع الفرق.</h2>
            <p>تابع تلاميذك، نظّم محتواك، واصنع تجربة تعليمية تستحق طموحهم.</p>
          </div>
          <div className="math-art">
            <div className="equation">∑ النجاح</div>
          </div>
        </section>
        <div className="grid grid-4 stats">
          {[
            { icon: Users, value: total, label: "إجمالي التلاميذ", color: "" },
            {
              icon: UserCheck,
              value: active,
              label: "حسابات نشطة",
              color: "blue",
            },
            {
              icon: BookOpen,
              value: lessons,
              label: "دروس منشورة",
              color: "orange",
            },
            {
              icon: Video,
              value: videos,
              label: "فيديو في المكتبة",
              color: "purple",
            },
          ].map((s) => (
            <div className="card stat" key={s.label}>
              <span className={`stat-icon ${s.color}`}>
                <s.icon size={21} />
              </span>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-2">
          <section className="card pad">
            <div className="section-head">
              <h2>التلاميذ حسب الشعبة</h2>
              <BarChart3 size={18} color="var(--green)" />
            </div>
            <AnalyticsChart
              data={specialities.map((s) => ({
                name: s.name,
                students:
                  studentsBySpeciality.find((v) => v.specialityId === s.id)
                    ?._count ?? 0,
              }))}
            />
          </section>
          <section className="card pad">
            <h2 style={{ marginBottom: 20 }}>نبض المنصة</h2>
            {[
              { label: "حسابات موقوفة", value: suspended },
              { label: "حصص مكتملة", value: completed },
              { label: "سجلات حضور", value: attendance },
              { label: "دروس أُكملت من التلاميذ", value: progress },
            ].map((s) => (
              <div
                className="row between"
                key={s.label}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span className="muted">{s.label}</span>
                <strong className="latin">{s.value}</strong>
              </div>
            ))}
          </section>
          <section className="card pad">
            <h2 style={{ marginBottom: 20 }}>الحصص القادمة</h2>
            {sessions.length ? (
              sessions.map((s) => (
                <a className="nav-item" key={s.id} href={`/admin/live/${s.id}`}>
                  <CalendarDays size={17} />
                  <div>
                    <strong>{s.title}</strong>
                    <p className="small muted">
                      {s.startsAt.toLocaleString("ar-DZ", {
                        timeZone: "Africa/Algiers",
                      })}
                    </p>
                  </div>
                </a>
              ))
            ) : (
              <p className="muted small">لا توجد حصص مجدولة.</p>
            )}
          </section>
          <section className="card pad">
            <h2 style={{ marginBottom: 20 }}>سجل النشاط الإداري</h2>
            {logs.length ? (
              logs.map((l) => (
                <div
                  className="row"
                  key={l.id}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <Activity size={15} color="var(--green)" />
                  <div style={{ flex: 1 }}>
                    <strong className="small">
                      {l.actor?.firstName ?? "النظام"}
                    </strong>
                    <p className="muted small latin">{l.action}</p>
                  </div>
                  <span className="muted small">
                    {l.createdAt.toLocaleDateString("ar-DZ")}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted small">ستظهر العمليات الإدارية هنا.</p>
            )}
          </section>
        </div>
      </>
    );
  } else if (page === "students" && id) {
    const student = await db.user.findFirst({
      where: { id, role: "STUDENT" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        profile: { include: { speciality: true } },
        progress: { include: { lesson: { select: { title: true } } } },
        attendance: { include: { liveSession: { select: { title: true } } } },
        attempts: {
          include: { exam: { select: { title: true } } },
          orderBy: { startedAt: "desc" },
        },
      },
    });
    if (!student) notFound();
    content = (
      <>
        <PageHeading
          title={`${student.firstName} ${student.lastName}`}
          subtitle={`${student.profile?.speciality.name} · ${student.username}`}
        />
        <div className="grid grid-2">
          <div className="card pad">
            <h2>معلومات التلميذ</h2>
            <p style={{ marginTop: 20 }}>الحالة: {student.status}</p>
            <p>البريد: {student.email || "—"}</p>
            <p>الهاتف: {student.phone || "—"}</p>
            <p className="muted">
              ملاحظات داخلية: {student.profile?.notes || "—"}
            </p>
          </div>
          <div className="card pad">
            <h2>التقدم الدراسي</h2>
            {student.progress.map((p) => (
              <p key={p.id} style={{ marginTop: 12 }}>
                {p.lesson.title}{" "}
                <span className="pill">
                  {p.completed ? "مكتمل" : `${p.seconds} ثانية`}
                </span>
              </p>
            ))}
            {!student.progress.length && (
              <p className="muted" style={{ marginTop: 20 }}>
                لا يوجد تقدم مسجل.
              </p>
            )}
          </div>
          <div className="card pad">
            <h2>سجل الحضور</h2>
            {student.attendance.map((a) => (
              <p key={a.id} style={{ marginTop: 15 }}>
                {a.liveSession.title}
                <span className="muted small">
                  {" "}
                  · {a.joinedAt.toLocaleString("ar-DZ")}
                  {a.leftAt
                    ? ` — ${Math.round((a.leftAt.getTime() - a.joinedAt.getTime()) / 60000)} دقيقة`
                    : ""}
                </span>
              </p>
            ))}
          </div>
          <div className="card pad">
            <h2>نتائج الاختبارات</h2>
            {student.attempts.map((a) => (
              <p key={a.id} style={{ marginTop: 15 }}>
                {a.exam.title}{" "}
                <span className="pill">{a.score ?? "جارٍ"} / 20</span>
              </p>
            ))}
          </div>
        </div>
      </>
    );
  } else if (page === "live" && id) {
    const session = await db.liveSession.findUnique({
      where: { id },
      include: {
        attendance: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!session) notFound();
    content = (
      <>
        <PageHeading
          title={session.title}
          subtitle="ابدأ الحصة من القاعة المدمجة أو راقب الحضور."
        />
        <Classroom id={id} recording={session.recording} />
        <section className="card pad" style={{ marginTop: 25 }}>
          <h2>سجل الحضور</h2>
          {session.attendance.map((a) => (
            <p key={a.id} style={{ marginTop: 15 }}>
              {a.user.firstName} {a.user.lastName} ·{" "}
              {a.joinedAt.toLocaleTimeString("ar-DZ")}
            </p>
          ))}
        </section>
      </>
    );
  } else if (page === "specialities") {
    const specs = await db.speciality.findMany({
      include: {
        _count: { select: { students: true, chapters: true, lessons: true } },
      },
    });
    content = (
      <>
        <PageHeading
          title="الشعب الدراسية"
          subtitle="ست شعب ثابتة، لكل منها برنامج مستقل. تُدار الروابط بالمحتوى من محررات الفصول والدروس."
        />
        <div className="grid grid-3">
          {specs.map((s) => (
            <section className="card pad" key={s.id}>
              <span className="speciality-symbol">
                {specialities.find((v) => v.id === s.id)?.symbol}
              </span>
              <h2 style={{ margin: "15px 0 5px" }}>{s.name}</h2>
              <p className="small muted latin">{s.nameFr}</p>
              <div className="row wrap" style={{ marginTop: 20 }}>
                <span className="pill">{s._count.students} تلميذ</span>
                <span className="pill">{s._count.chapters} فصل</span>
                <span className="pill">{s._count.lessons} درس</span>
              </div>
            </section>
          ))}
        </div>
      </>
    );
  } else if (page === "videos") {
    const videos = await db.video.findMany({
      orderBy: { createdAt: "desc" },
      include: { lesson: { select: { title: true } } },
    });
    const jobs = await db.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, status: true, error: true, attempts: true },
    });
    content = (
      <>
        <PageHeading
          title="مكتبة الفيديو"
          subtitle="فيديوهات خاصة، وروابط تشغيل مؤقتة، ووصول حسب الشعبة."
        />
        <UploadPanel type="video" />
        <div className="grid grid-3">
          {videos.map((v) => (
            <section className="card pad" key={v.id}>
              <Video size={24} color="var(--green)" />
              <h3 style={{ margin: "15px 0" }}>{v.title}</h3>
              <p className="muted small" style={{ marginBottom: 15 }}>
                الحالة: {v.status} · {v.lesson?.title ?? "غير مرتبط بدرس"}
              </p>
              <RefreshVideo id={v.id} />
            </section>
          ))}
        </div>
        <section className="card pad" style={{ marginTop: 25 }}>
          <h2>استيراد تسجيلات Zoom</h2>
          {jobs.length ? (
            jobs.map((j) => (
              <p className="small muted" key={j.id} style={{ marginTop: 12 }}>
                {j.id} · {j.status} · محاولات: {j.attempts}
                {j.error && ` · ${j.error}`}
              </p>
            ))
          ) : (
            <p className="muted small" style={{ marginTop: 15 }}>
              لم تصل أحداث تسجيل بعد.
            </p>
          )}
        </section>
      </>
    );
  } else if (page === "settings")
    content = (
      <>
        <PageHeading
          title="إعدادات المنصة"
          subtitle="معلومات الأستاذ والتواصل والسنة الدراسية وموعد البكالوريا."
        />
        <PlatformForm
          settings={{
            teacherName: settings?.teacherName ?? "الأستاذ عصام بن بليل",
            brandName: settings?.brandName ?? "عصام ماث",
            accentColor: settings?.accentColor ?? "#128c73",
            defaultTheme: settings?.defaultTheme ?? "light",
            academicYear: settings?.academicYear ?? "2027",
            contactPhone: settings?.contactPhone ?? "",
            contactEmail: settings?.contactEmail ?? "",
            examDate: settings?.examDate ? settings.examDate.toISOString() : "",
          }}
        />
      </>
    );
  else if (
    [
      "students",
      "chapters",
      "lessons",
      "live",
      "resources",
      "exercises",
      "exams",
      "notifications",
    ].includes(page)
  ) {
    const [chapters, videos, lessons, resources] = await Promise.all([
      db.chapter.findMany({ select: { id: true, title: true } }),
      db.video.findMany({ select: { id: true, title: true } }),
      db.lesson.findMany({ select: { id: true, title: true } }),
      db.resource.findMany({ select: { id: true, title: true } }),
    ]);
    let rows: Record<string, unknown>[] = [];
    if (page === "students") {
      const users = await db.user.findMany({
        where: { role: "STUDENT" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          profile: { select: { specialityId: true, notes: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      rows = users.map(({ profile, ...u }) => ({
        ...u,
        specialityId: profile?.specialityId,
        notes: profile?.notes,
      }));
    }
    if (page === "chapters")
      rows = (
        await db.chapter.findMany({
          include: { specialities: true },
          orderBy: { position: "asc" },
        })
      ).map(({ specialities, ...r }) => ({
        ...r,
        specialityIds: specialities.map((s) => s.specialityId),
      }));
    if (page === "lessons")
      rows = (
        await db.lesson.findMany({
          include: { specialities: true },
          orderBy: { createdAt: "desc" },
        })
      ).map(({ specialities, ...r }) => ({
        ...r,
        specialityIds: specialities.map((s) => s.specialityId),
      }));
    if (page === "live")
      rows = (
        await db.liveSession.findMany({
          include: { specialities: true },
          orderBy: { startsAt: "asc" },
        })
      ).map(({ specialities, passcode, ...r }) => {
        void passcode;
        return { ...r, specialityIds: specialities.map((s) => s.specialityId) };
      });
    if (page === "resources")
      rows = (
        await db.resource.findMany({
          include: { specialities: true },
          orderBy: { createdAt: "desc" },
        })
      ).map(({ specialities, ...r }) => ({
        ...r,
        specialityIds: specialities.map((s) => s.specialityId),
      }));
    if (page === "exercises")
      rows = await db.exercise.findMany({ orderBy: { createdAt: "desc" } });
    if (page === "exams")
      rows = await db.exam.findMany({
        include: { questions: { orderBy: { position: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
    if (page === "notifications")
      rows = await db.notification.findMany({ orderBy: { createdAt: "desc" } });
    const titles: Record<string, string> = {
      students: "إدارة التلاميذ",
      chapters: "الفصول الدراسية",
      lessons: "الدروس المسجلة",
      live: "إدارة الحصص المباشرة",
      resources: "الملفات التعليمية",
      exercises: "التمارين والتصحيحات",
      exams: "الاختبارات والبكالوريا",
      notifications: "إرسال الإشعارات",
    };
    content = (
      <>
        <PageHeading
          title={titles[page]}
          subtitle="أضف، راجع، ثم انشر. أنت تتحكم في تجربة التعلم."
        />
        {page === "resources" && <UploadPanel type="document" />}
        {page === "students" && (
          <p className="notice">
            CSV: firstName, lastName, username, specialityId, password (12+),
            email, phone, status. معرّفات الشعب: science, math, technical,
            economy, literature, languages.
          </p>
        )}
        {page === "live" ? (
          <LiveCalendar
            sessions={
              serialize(rows) as {
                id: string;
                title: string;
                startsAt: string;
                status: string;
              }[]
            }
          >
            <AdminManager
              entity={page}
              rows={serialize(rows) as { id: string }[]}
              chapters={chapters}
              videos={videos}
              lessons={lessons}
              resources={resources}
            />
          </LiveCalendar>
        ) : (
          <AdminManager
            entity={page}
            rows={serialize(rows) as { id: string }[]}
            chapters={chapters}
            videos={videos}
            lessons={lessons}
            resources={resources}
          />
        )}
      </>
    );
  } else notFound();
  return (
    <Shell
      name={`${user.firstName} ${user.lastName}`}
      speciality="مدير المنصة"
      admin
      theme={user.preferences?.theme ?? settings?.defaultTheme}
      phone={settings?.contactPhone}
    >
      {content}
    </Shell>
  );
}
