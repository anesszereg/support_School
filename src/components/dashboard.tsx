import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Video,
  BookOpen,
  Play,
  FileText,
  PenLine,
  Trophy,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { Countdown } from "./interactive";
export type DashboardData = {
  name: string;
  speciality: string;
  lessonCount: number;
  completedCount: number;
  attendanceCount: number;
  exerciseCount: number;
  examDate: string | null;
  sessions: {
    id: string;
    title: string;
    startsAt: string;
    duration: number;
    status: string;
  }[];
  lessons: {
    id: string;
    title: string;
    chapter: string;
    duration: number;
    seconds: number;
    completed: boolean;
  }[];
  continuing?: DashboardData["lessons"];
  notifications: {
    id: string;
    title: string;
    body: string;
    createdAt: string;
  }[];
};
export function PageHeading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading row between wrap">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
export function Empty({
  text = "لا يوجد محتوى منشور بعد. ترقّب جديد الأستاذ.",
}: {
  text?: string;
}) {
  return (
    <div className="card empty">
      <BookOpen size={30} strokeWidth={1.2} />
      <p>{text}</p>
    </div>
  );
}
export function LessonCard({
  lesson,
  index = 0,
  base = "/dashboard",
}: {
  lesson: DashboardData["lessons"][number];
  index?: number;
  base?: string;
}) {
  const percent = lesson.completed
    ? 100
    : lesson.duration
      ? Math.min(
          99,
          Math.round((lesson.seconds / (lesson.duration * 60)) * 100),
        )
      : 0;
  return (
    <Link href={`${base}/lessons/${lesson.id}`} className="card lesson-card">
      <div className={`lesson-cover ${["", "blue", "purple"][index % 3]}`}>
        <span className="pill" style={{ fontSize: 9, background: "#ffffffad" }}>
          الرياضيات
        </span>
        <span className="cover-formula">
          {["f(x) = ln(x)", "lim f(x) = ℓ", "uₙ = u₀ × qⁿ"][index % 3]}
        </span>
        <span className="play-circle">
          <Play size={12} fill="currentColor" />
        </span>
        <span className="duration latin">{lesson.duration}:00</span>
      </div>
      <div className="lesson-body">
        <span className="muted" style={{ fontSize: 10 }}>
          {lesson.chapter}
        </span>
        <h3>{lesson.title}</h3>
        <div className="row between lesson-foot" style={{ marginBottom: 9 }}>
          <span>
            {lesson.completed
              ? "مكتمل"
              : percent
                ? "تابع من حيث توقفت"
                : "ابدأ هذا الدرس"}
          </span>
          <span className="latin">{percent}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="row between lesson-foot">
          <span className="row" style={{ gap: 4 }}>
            <Clock3 size={11} />
            {lesson.duration} دقيقة
          </span>
          <ChevronLeft size={12} />
        </div>
      </div>
    </Link>
  );
}
export function Dashboard({
  data,
  base = "/dashboard",
}: {
  data: DashboardData;
  base?: string;
}) {
  const progress = data.lessonCount
    ? Math.round((data.completedCount / data.lessonCount) * 100)
    : 0;
  return (
    <>
      <PageHeading
        title={`أهلاً، ${data.name}`}
        subtitle="يوم جديد، فرصة جديدة لتقترب من حلمك. مستعد لنبدأ؟"
      >
        <div className="date-chip row">
          <CalendarDays size={15} />
          {new Date().toLocaleDateString("ar-DZ", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </PageHeading>
      <section className="welcome-banner">
        <div className="welcome-copy">
          <span className="pill" style={{ background: "#d4e8dd" }}>
            <Sparkles size={12} /> معك حتى النجاح · بكالوريا 2027
          </span>
          <h2>خطوة صغيرة اليوم، فرق كبير غداً.</h2>
          <p>
            لا تحتاج أن تكون الأفضل لتبدأ، لكن عليك أن تبدأ لتصبح الأفضل.
            <br />
            دروسك، تمارينك وأستاذك... كلهم هنا من أجلك.
          </p>
          <Link href={`${base}/lessons`} className="btn sm">
            لنواصل التعلّم <ArrowLeft size={14} />
          </Link>
        </div>
        <div className="math-art">
          <span className="float-symbol a">π</span>
          <span className="float-symbol b">√x</span>
          <span className="float-symbol c">∞</span>
          <div className="equation" dir="ltr">
            f(x) = x²
          </div>
        </div>
      </section>
      <div className="grid grid-4 stats">
        {[
          {
            icon: BookOpen,
            value: data.lessonCount,
            label: "درس متاح للتعلّم",
            color: "",
          },
          {
            icon: Video,
            value: data.attendanceCount,
            label: "حصة مباشرة حضرتها",
            color: "blue",
          },
          {
            icon: PenLine,
            value: data.exerciseCount,
            label: "تمرين ينتظر تحديك",
            color: "orange",
          },
          {
            icon: Trophy,
            value: `${progress}%`,
            label: "نسبة تقدمك الدراسي",
            color: "purple",
          },
        ].map((s) => (
          <div className="card stat" key={s.label}>
            <div className={`stat-icon ${s.color}`}>
              <s.icon size={21} strokeWidth={1.5} />
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-columns">
        <div className="stack">
          <section>
            <div className="section-head">
              <h2 className="row">
                <Video size={18} color="var(--green)" /> حصتك المباشرة القادمة
              </h2>
              <Link className="text-link" href={`${base}/schedule`}>
                جدول الحصص <ArrowLeft size={13} />
              </Link>
            </div>
            {data.sessions.length ? (
              data.sessions.slice(0, 2).map((s) => (
                <div
                  className="card live-card"
                  key={s.id}
                  style={{ marginBottom: 10 }}
                >
                  <div className="row between">
                    <span className="pill">{data.speciality}</span>
                    <span
                      className={`pill ${s.status === "LIVE" ? "red" : "orange"}`}
                    >
                      <span
                        className="status-dot"
                        style={{ background: "currentColor" }}
                      />
                      {s.status === "LIVE" ? "مباشر الآن" : "قريباً"}
                    </span>
                  </div>
                  <div className="live-inner">
                    <div className="calendar-block">
                      <small>
                        {new Date(s.startsAt).toLocaleDateString("ar-DZ", {
                          month: "long",
                        })}
                      </small>
                      <strong>{new Date(s.startsAt).getDate()}</strong>
                    </div>
                    <div className="live-details">
                      <h3>{s.title}</h3>
                      <div className="meta">
                        <span>
                          <Clock3 size={12} />
                          {new Date(s.startsAt).toLocaleTimeString("ar-DZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Africa/Algiers",
                          })}
                        </span>
                        <span>
                          <Video size={12} />
                          {s.duration} دقيقة
                        </span>
                        <span>الأستاذ عصام</span>
                      </div>
                    </div>
                    <Link className="btn soft sm" href={`${base}/live/${s.id}`}>
                      {s.status === "LIVE" ? "انضم للحصة" : "تفاصيل الحصة"}
                      <ArrowLeft size={13} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <Empty text="لا توجد حصص قادمة حالياً. سنُعلمك بالموعد الجديد." />
            )}
          </section>
          {!!(
            data.continuing ??
            data.lessons.filter((l) => l.seconds > 0 && !l.completed)
          ).length && (
            <section>
              <div className="section-head">
                <h2 className="row">
                  <Play size={18} color="var(--green)" /> أكمل من حيث توقفت
                </h2>
              </div>
              <div className="grid grid-3">
                {(
                  data.continuing ??
                  data.lessons.filter((l) => l.seconds > 0 && !l.completed)
                ).map((lesson, index) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    index={index}
                    base={base}
                  />
                ))}
              </div>
            </section>
          )}
          <section>
            <div className="section-head">
              <h2 className="row">
                <Play size={18} color="var(--green)" /> أُضيف حديثاً لرحلتك
              </h2>
              <Link className="text-link" href={`${base}/lessons`}>
                كل الدروس <ArrowLeft size={13} />
              </Link>
            </div>
            {data.lessons.length ? (
              <div className="grid grid-3">
                {data.lessons.slice(0, 3).map((l, i) => (
                  <LessonCard lesson={l} index={i} base={base} key={l.id} />
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </section>
          <section>
            <div className="section-head">
              <h2>خطوتك التالية نحو التفوق</h2>
            </div>
            <div className="grid grid-2">
              <Link className="card quick-card" href={`${base}/exercises`}>
                <div className="stat-icon orange">
                  <PenLine size={21} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3>اختبر فهمك، ثبّت معلوماتك</h3>
                  <p>تمارين متنوعة مع حلول مفصلة</p>
                </div>
                <ChevronLeft size={16} className="muted" />
              </Link>
              <Link className="card quick-card" href={`${base}/resources`}>
                <div className="stat-icon blue">
                  <FileText size={21} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3>مراجعك، دائماً بين يديك</h3>
                  <p>ملخصات وملفات جاهزة للمراجعة</p>
                </div>
                <ChevronLeft size={16} className="muted" />
              </Link>
            </div>
          </section>
        </div>
        <aside className="stack dashboard-aside">
          <section className="card countdown">
            <div className="row">
              <CalendarDays size={17} />
              <h3>العد التنازلي للبكالوريا</h3>
            </div>
            <p>كل يوم يقربك من حلمك. اجعله يستحق.</p>
            <Countdown date={data.examDate} />
            <div className="countdown-note">
              {data.examDate
                ? "موعد تحدده إدارة المنصة · توقيت الجزائر"
                : "يُضبط موعد الامتحان عند إعلان التاريخ الرسمي"}
            </div>
          </section>
          <section className="card pad">
            <h3>إنجازك يستحق أن تراه</h3>
            <div
              className="progress-circle"
              style={{ "--value": progress } as React.CSSProperties}
            >
              <div>
                <strong>{progress}%</strong>
                <span>من رحلتك التعليمية</span>
              </div>
            </div>
            <div className="progress-legend">
              <span>
                <i className="dot" />
                دروس مكتملة
              </span>
              <strong className="latin">
                {data.completedCount} / {data.lessonCount}
              </strong>
            </div>
            <div className="progress-legend muted">
              <span>
                <i className="dot" style={{ background: "var(--line)" }} />
                باقي الدروس
              </span>
              <span className="latin">
                {data.lessonCount - data.completedCount}
              </span>
            </div>
          </section>
          <section className="card pad">
            <div className="section-head">
              <h3>من الأستاذ إليك</h3>
              <span className="pill" style={{ fontSize: 9 }}>
                إعلانات
              </span>
            </div>
            {data.notifications.length ? (
              data.notifications.slice(0, 2).map((n) => (
                <div className="announcement" key={n.id}>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                  <time>
                    {new Date(n.createdAt).toLocaleDateString("ar-DZ")}
                  </time>
                </div>
              ))
            ) : (
              <p className="muted small">لا توجد إعلانات جديدة.</p>
            )}
            <Link
              href={`${base}/notifications`}
              className="text-link"
              style={{ marginTop: 20 }}
            >
              كل الإشعارات <ArrowLeft size={12} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
