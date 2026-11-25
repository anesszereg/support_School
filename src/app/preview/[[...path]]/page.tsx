import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import {
  Dashboard,
  PageHeading,
  Empty,
  LessonCard,
  type DashboardData,
} from "@/components/dashboard";
import { studentNav } from "@/lib/constants";
const now = new Date();
const data: DashboardData = {
  name: "أحمد",
  speciality: "علوم تجريبية",
  lessonCount: 24,
  completedCount: 9,
  attendanceCount: 8,
  exerciseCount: 36,
  examDate: "2027-06-06T07:00:00.000Z",
  sessions: [
    {
      id: "sample",
      title: "الدوال اللوغاريتمية — حل تمارين تطبيقية",
      startsAt: new Date(now.getTime() + 86400000).toISOString(),
      duration: 90,
      status: "SCHEDULED",
    },
  ],
  lessons: [
    {
      id: "one",
      title: "الدالة اللوغاريتمية: المفهوم والخواص",
      chapter: "الفصل الثالث · الدوال اللوغاريتمية",
      duration: 45,
      seconds: 1755,
      completed: false,
    },
    {
      id: "two",
      title: "حساب النهايات ورفع حالات عدم التعيين",
      chapter: "الفصل الأول · النهايات والاستمرارية",
      duration: 38,
      seconds: 912,
      completed: false,
    },
    {
      id: "three",
      title: "المتتاليات الهندسية وتطبيقاتها",
      chapter: "الفصل الثاني · المتتاليات العددية",
      duration: 52,
      seconds: 0,
      completed: false,
    },
  ],
  notifications: [
    {
      id: "sample",
      title: "رحلتنا نحو البكالوريا مستمرة",
      body: "خصص وقتاً قصيراً كل يوم للمراجعة. الاستمرارية تصنع الفرق.",
      createdAt: now.toISOString(),
    },
    {
      id: "sample2",
      title: "حضّر أسئلتك للحصة القادمة",
      body: "راجع خواص الدالة اللوغاريتمية وحاول حل التمارين قبل الحصة.",
      createdAt: now.toISOString(),
    },
  ],
};
export default async function Preview({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { path = [] } = await params;
  const [page = "", id] = path;
  const nav = studentNav.find((n) => n[0] === page);
  if (!nav) notFound();
  return (
    <Shell name="أحمد بن عمر" speciality="علوم تجريبية" preview unread={2}>
      {page === "" ? (
        <Dashboard data={data} base="/preview" />
      ) : page === "lessons" && !id ? (
        <>
          <PageHeading
            title="الدروس المسجلة"
            subtitle="بيانات توضيحية — اربط قاعدة البيانات وأضف دروسك الحقيقية للبدء."
          />
          <div className="grid grid-3">
            {data.lessons.map((l, i) => (
              <LessonCard key={l.id} lesson={l} index={i} base="/preview" />
            ))}
          </div>
        </>
      ) : (
        <>
          <PageHeading title={nav[1]} subtitle="معاينة التطوير" />
          <Empty text="هذه معاينة بصرية فقط. يتطلب هذا القسم حساباً حقيقياً وقاعدة بيانات وخدمات مهيأة؛ لا توجد عمليات وهمية أو بيانات اعتماد تجريبية." />
        </>
      )}
    </Shell>
  );
}
