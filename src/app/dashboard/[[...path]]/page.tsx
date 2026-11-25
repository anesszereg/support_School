import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Video,
  Clock3,
  CalendarDays,
  ArrowLeft,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import {
  Dashboard,
  Empty,
  LessonCard,
  PageHeading,
  type DashboardData,
} from "@/components/dashboard";
import { Classroom } from "@/components/classroom";
import {
  DocumentButton,
  ExamRunner,
  MathText,
  ReadNotification,
  ThemeSelector,
  VideoPlayer,
} from "@/components/interactive";
import { PasswordForm } from "@/components/password-form";
export default async function StudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");
  const specialityId = user.profile?.specialityId;
  if (!specialityId) notFound();
  const { path = [] } = await params;
  const [page = "", id] = path;
  const { q = "" } = await searchParams;
  const scope = { specialities: { some: { specialityId } } };
  const lessonScope = {
    ...scope,
    published: true,
    chapter: { published: true },
  };
  const [unread, settings] = await Promise.all([
    db.notificationRecipient.count({
      where: { userId: user.id, readAt: null },
    }),
    db.platformSettings.findUnique({ where: { id: "platform" } }),
  ]);
  let content: React.ReactNode;
  if (page === "") {
    const [
      lessonCount,
      completedCount,
      attendanceCount,
      exerciseCount,
      sessions,
      lessons,
      notifications,
      continuing,
    ] = await Promise.all([
      db.lesson.count({ where: lessonScope }),
      db.lessonProgress.count({
        where: { userId: user.id, completed: true, lesson: lessonScope },
      }),
      db.attendance.count({ where: { userId: user.id } }),
      db.exercise.count({
        where: { published: true, specialityIds: { has: specialityId } },
      }),
      db.liveSession.findMany({
        where: {
          ...scope,
          status: { in: ["SCHEDULED", "LIVE"] },
          startsAt: { gte: new Date(Date.now() - 3600000) },
        },
        orderBy: { startsAt: "asc" },
        take: 2,
      }),
      db.lesson.findMany({
        where: lessonScope,
        include: { chapter: true, progress: { where: { userId: user.id } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.notificationRecipient.findMany({
        where: { userId: user.id },
        include: { notification: true },
        orderBy: { notification: { createdAt: "desc" } },
        take: 2,
      }),
      db.lessonProgress.findMany({
        where: {
          userId: user.id,
          completed: false,
          seconds: { gt: 0 },
          lesson: lessonScope,
        },
        include: { lesson: { include: { chapter: true } } },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
    ]);
    const data: DashboardData = {
      name: user.firstName,
      speciality: user.profile?.speciality.name ?? "",
      lessonCount,
      completedCount,
      attendanceCount,
      exerciseCount,
      examDate: settings?.examDate?.toISOString() ?? null,
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        duration: s.duration,
        status: s.status,
        startsAt: s.startsAt.toISOString(),
      })),
      continuing: continuing.map((p) => ({
        id: p.lesson.id,
        title: p.lesson.title,
        chapter: p.lesson.chapter.title,
        duration: p.lesson.duration,
        seconds: p.seconds,
        completed: p.completed,
      })),
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        chapter: l.chapter.title,
        duration: l.duration,
        seconds: l.progress[0]?.seconds ?? 0,
        completed: l.progress[0]?.completed ?? false,
      })),
      notifications: notifications.map((n) => ({
        ...n.notification,
        createdAt: n.notification.createdAt.toISOString(),
      })),
    };
    content = <Dashboard data={data} />;
  } else if (page === "lessons" && id) {
    const lesson = await db.lesson.findFirst({
      where: { id, ...lessonScope },
      include: {
        chapter: true,
        resources: { where: { published: true, ...scope } },
        progress: { where: { userId: user.id } },
      },
    });
    if (!lesson) notFound();
    const siblings = await db.lesson.findMany({
      where: { ...lessonScope, chapterId: lesson.chapterId },
      orderBy: { position: "asc" },
      select: { id: true, title: true },
    });
    const index = siblings.findIndex((l) => l.id === id);
    content = (
      <>
        <PageHeading title={lesson.title} subtitle={lesson.chapter.title} />
        <div className="lesson-layout">
          <div className="stack">
            <VideoPlayer id={id} resume={lesson.progress[0]?.seconds ?? 0} />
            <section className="card pad">
              <h2>عن هذا الدرس</h2>
              <p className="muted" style={{ marginTop: 12 }}>
                {lesson.description}
              </p>
              <div className="row between" style={{ marginTop: 25 }}>
                {index > 0 ? (
                  <Link
                    className="btn secondary sm"
                    href={`/dashboard/lessons/${siblings[index - 1].id}`}
                  >
                    الدرس السابق
                  </Link>
                ) : (
                  <span />
                )}
                {index < siblings.length - 1 && (
                  <Link
                    className="btn sm"
                    href={`/dashboard/lessons/${siblings[index + 1].id}`}
                  >
                    الدرس التالي <ArrowLeft size={14} />
                  </Link>
                )}
              </div>
            </section>
            <section className="card pad">
              <h3>ملفات الدرس</h3>
              {lesson.resources.map((r) => (
                <div
                  key={r.id}
                  className="row between"
                  style={{ paddingTop: 15 }}
                >
                  <span>{r.title}</span>
                  <DocumentButton id={r.id} />
                </div>
              ))}
            </section>
          </div>
          <aside className="card pad">
            <h3 style={{ marginBottom: 20 }}>دروس الفصل</h3>
            {siblings.map((l, i) => (
              <Link
                className={`nav-item ${l.id === id ? "active" : ""}`}
                key={l.id}
                href={`/dashboard/lessons/${l.id}`}
              >
                <span className="latin small">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {l.title}
              </Link>
            ))}
          </aside>
        </div>
      </>
    );
  } else if (page === "lessons") {
    const lessons = await db.lesson.findMany({
      where: {
        ...lessonScope,
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      },
      include: { chapter: true, progress: { where: { userId: user.id } } },
      orderBy: { createdAt: "desc" },
    });
    content = (
      <>
        <PageHeading
          title="الدروس المسجلة"
          subtitle="افهم على مهل. راجع وقتما تشاء، وتابع من حيث توقفت."
        />
        <form className="filters">
          <input
            className="input"
            name="q"
            defaultValue={q}
            placeholder="ابحث عن درس..."
          />
          <button className="btn sm">بحث</button>
        </form>
        {lessons.length ? (
          <div className="grid grid-3">
            {lessons.map((l, i) => (
              <LessonCard
                key={l.id}
                index={i}
                lesson={{
                  id: l.id,
                  title: l.title,
                  chapter: l.chapter.title,
                  duration: l.duration,
                  seconds: l.progress[0]?.seconds ?? 0,
                  completed: l.progress[0]?.completed ?? false,
                }}
              />
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </>
    );
  } else if (page === "live" && id) {
    const session = await db.liveSession.findFirst({ where: { id, ...scope } });
    if (!session) notFound();
    content = (
      <>
        <PageHeading
          title={session.title}
          subtitle={`${new Date(session.startsAt).toLocaleString("ar-DZ", { timeZone: "Africa/Algiers" })} · ${session.duration} دقيقة`}
        />
        <p className="muted" style={{ marginBottom: 20 }}>
          {session.description}
        </p>
        {session.status === "CANCELLED" ? (
          <Empty text="تم إلغاء هذه الحصة" />
        ) : session.status === "COMPLETED" ? (
          <Empty text="انتهت هذه الحصة. سيُنشر التسجيل بعد مراجعته من الأستاذ." />
        ) : (
          <Classroom id={id} recording={session.recording} />
        )}
      </>
    );
  } else if (page === "live" || page === "schedule") {
    const sessions = await db.liveSession.findMany({
      where: scope,
      orderBy: { startsAt: "asc" },
    });
    content = (
      <>
        <PageHeading
          title={page === "live" ? "الحصص المباشرة" : "جدول الحصص"}
          subtitle="لقاؤنا مع الفهم. جميع المواعيد بتوقيت الجزائر."
        />
        {sessions.length ? (
          <div className="grid grid-2">
            {sessions.map((s) => (
              <div key={s.id} className="card pad">
                <div className="row between">
                  <Video size={22} color="var(--green)" />
                  <span
                    className={`pill ${s.status === "CANCELLED" ? "red" : ""}`}
                  >
                    {
                      {
                        SCHEDULED: "مجدولة",
                        LIVE: "مباشر الآن",
                        COMPLETED: "مكتملة",
                        CANCELLED: "ملغاة",
                      }[s.status]
                    }
                  </span>
                </div>
                <h2 style={{ margin: "18px 0 10px" }}>{s.title}</h2>
                <p className="muted small">{s.description}</p>
                <div className="meta" style={{ margin: "18px 0" }}>
                  <span>
                    <CalendarDays size={13} />
                    {s.startsAt.toLocaleDateString("ar-DZ")}
                  </span>
                  <span>
                    <Clock3 size={13} />
                    {s.startsAt.toLocaleTimeString("ar-DZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Africa/Algiers",
                    })}{" "}
                    · {s.duration} دقيقة
                  </span>
                </div>
                <Link className="btn soft sm" href={`/dashboard/live/${s.id}`}>
                  تفاصيل الحصة <ArrowLeft size={13} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="سيظهر جدول الحصص هنا عند نشر المواعيد." />
        )}
      </>
    );
  } else if (page === "curriculum") {
    const chapters = await db.chapter.findMany({
      where: { published: true, ...scope },
      orderBy: { position: "asc" },
      include: {
        lessons: {
          where: lessonScope,
          orderBy: { position: "asc" },
          select: { id: true, title: true, duration: true },
        },
      },
    });
    content = (
      <>
        <PageHeading
          title="برنامجك الدراسي"
          subtitle={`مسار الرياضيات الخاص بشعبة ${user.profile?.speciality.name}`}
        />
        <div className="stack">
          {chapters.length ? (
            chapters.map((c, i) => (
              <section className="card pad" key={c.id}>
                <div className="row" style={{ marginBottom: 14 }}>
                  <span className="stat-icon latin">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2>{c.title}</h2>
                    <p className="muted small">{c.description}</p>
                  </div>
                </div>
                {c.lessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/dashboard/lessons/${l.id}`}
                    className="nav-item"
                  >
                    <span>{l.title}</span>
                    <span
                      className="muted small"
                      style={{ marginRight: "auto" }}
                    >
                      {l.duration} دقيقة
                    </span>
                    <ChevronLeft size={15} />
                  </Link>
                ))}
              </section>
            ))
          ) : (
            <Empty />
          )}
        </div>
      </>
    );
  } else if (page === "resources") {
    const resources = await db.resource.findMany({
      where: {
        published: true,
        ...scope,
        OR: [{ lessonId: null }, { lesson: lessonScope }],
      },
      orderBy: { createdAt: "desc" },
    });
    content = (
      <>
        <PageHeading
          title="مكتبتك التعليمية"
          subtitle="كل ما تحتاجه للمراجعة، دون مغادرة المنصة."
        />
        {resources.length ? (
          <div className="grid grid-3">
            {resources.map((r) => (
              <section className="card pad" key={r.id}>
                <FileText size={30} color="var(--green)" />
                <h3 style={{ margin: "18px 0" }}>{r.title}</h3>
                <div className="row between">
                  <span className="pill">{r.kind}</span>
                  <DocumentButton id={r.id} />
                </div>
              </section>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </>
    );
  } else if (page === "exercises") {
    const exercises = await db.exercise.findMany({
      where: { published: true, specialityIds: { has: specialityId } },
      orderBy: { createdAt: "desc" },
    });
    content = (
      <>
        <PageHeading
          title="التمارين والتحديات"
          subtitle="كل محاولة تقرّبك من الفهم. حاول أولاً، ثم راجع الحل."
        />
        <div className="stack">
          {exercises.length ? (
            exercises.map((e) => (
              <article className="card pad" key={e.id}>
                <h2 style={{ marginBottom: 15 }}>{e.title}</h2>
                <MathText text={e.statement} />
                {e.resourceId && (
                  <div style={{ marginTop: 15 }}>
                    <DocumentButton id={e.resourceId} />
                  </div>
                )}
                <details style={{ marginTop: 20 }}>
                  <summary className="text-link" style={{ cursor: "pointer" }}>
                    عرض الحل المفصل
                  </summary>
                  <div className="notice" style={{ marginTop: 15 }}>
                    <MathText
                      text={e.solution || "سينشر الأستاذ الحل قريباً."}
                    />
                  </div>
                </details>
              </article>
            ))
          ) : (
            <Empty />
          )}
        </div>
      </>
    );
  } else if ((page === "exams" || page === "bac") && id) {
    const exam = await db.exam.findFirst({
      where: { id, published: true, specialityIds: { has: specialityId } },
      select: {
        id: true,
        title: true,
        duration: true,
        questions: {
          select: { id: true, text: true, options: true, points: true },
          orderBy: { position: "asc" },
        },
      },
    });
    if (!exam) notFound();
    content = (
      <>
        <PageHeading
          title={exam.title}
          subtitle="اقرأ السؤال جيداً، وخذ وقتك في التفكير."
        />
        <ExamRunner {...exam} />
      </>
    );
  } else if (page === "exams" || page === "bac") {
    const exams = await db.exam.findMany({
      where: {
        published: true,
        specialityIds: { has: specialityId },
        ...(page === "bac" ? { kind: "BAC" } : {}),
      },
      include: {
        _count: { select: { questions: true } },
        attempts: {
          where: { userId: user.id, submittedAt: { not: null } },
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
    });
    content = (
      <>
        <PageHeading
          title={page === "bac" ? "مواضيع البكالوريا" : "اختبر جاهزيتك"}
          subtitle="تدرّب بجدية اليوم، لتدخل الامتحان بثقة غداً."
        />
        {exams.length ? (
          <div className="grid grid-3">
            {exams.map((e) => (
              <article className="card pad" key={e.id}>
                <span className="pill">{e.kind}</span>
                <h2 style={{ margin: "18px 0" }}>{e.title}</h2>
                <p className="muted small">
                  {e.duration} دقيقة · {e._count.questions} أسئلة
                </p>
                {e.attempts[0] && (
                  <p className="success" style={{ marginTop: 15 }}>
                    آخر نتيجة: {e.attempts[0].score} / 20
                  </p>
                )}
                <Link
                  className="btn soft sm"
                  style={{ marginTop: 20 }}
                  href={`/dashboard/${page}/${e.id}`}
                >
                  فتح الاختبار <ArrowLeft size={13} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </>
    );
  } else if (page === "notifications") {
    const items = await db.notificationRecipient.findMany({
      where: { userId: user.id },
      include: { notification: true },
      orderBy: { notification: { createdAt: "desc" } },
    });
    content = (
      <>
        <PageHeading
          title="إشعاراتك"
          subtitle={`${unread} إشعار غير مقروء · لا يفوتك جديد رحلتك.`}
        />
        <div className="stack">
          {items.length ? (
            items.map((n) => (
              <section className="card pad" key={n.notificationId}>
                <div className="row between wrap">
                  <h3>{n.notification.title}</h3>
                  <ReadNotification id={n.notificationId} read={!!n.readAt} />
                </div>
                <p className="muted" style={{ margin: "12px 0" }}>
                  {n.notification.body}
                </p>
                <span className="muted small">
                  {n.notification.createdAt.toLocaleDateString("ar-DZ")}
                </span>
              </section>
            ))
          ) : (
            <Empty text="أنت على اطلاع بكل جديد. لا توجد إشعارات بعد." />
          )}
        </div>
      </>
    );
  } else if (page === "settings")
    content = (
      <>
        <PageHeading
          title="مساحتك، بطريقتك"
          subtitle="خصص مظهر المنصة وحافظ على أمان حسابك."
        />
        <div className="grid grid-2">
          <section className="card pad">
            <h2 style={{ marginBottom: 20 }}>مظهر المنصة</h2>
            <ThemeSelector initial={user.preferences?.theme} />
            <h2 style={{ margin: "30px 0 15px" }}>معلومات حسابك</h2>
            <p>
              {user.firstName} {user.lastName}
            </p>
            <p className="muted">{user.profile?.speciality.name}</p>
            <p className="muted latin">{user.username}</p>
            <p className="notice" style={{ marginTop: 20 }}>
              لتعديل معلوماتك أو شعبتك، تواصل مع الأستاذ.
            </p>
          </section>
          <section className="card pad">
            <h2 style={{ marginBottom: 25 }}>تغيير كلمة المرور</h2>
            <PasswordForm />
          </section>
        </div>
      </>
    );
  else notFound();
  return (
    <Shell
      name={`${user.firstName} ${user.lastName}`}
      speciality={user.profile?.speciality.name ?? ""}
      unread={unread}
      theme={user.preferences?.theme ?? settings?.defaultTheme}
      phone={settings?.contactPhone}
    >
      {content}
    </Shell>
  );
}
