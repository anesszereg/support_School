import Link from "next/link";
import {
  ArrowLeft,
  Video,
  Play,
  BookOpen,
  ShieldCheck,
  Check,
  GraduationCap,
  FileText,
  Sparkles,
  CalendarCheck,
  MessageCircle,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Contact } from "@/components/contact";
import { specialities } from "@/lib/constants";
import { db, databaseConfigured } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function Landing() {
  const settings = databaseConfigured()
    ? await db.platformSettings.findUnique({ where: { id: "platform" } })
    : null;
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <nav className="landing-nav-links">
          <a href="#about">عن المنصة</a>
          <a href="#specialities">الشعب الدراسية</a>
          <a href="#features">ماذا ستتعلم؟</a>
          <a href="#faq">أسئلة شائعة</a>
        </nav>
        <Link href="/login" className="btn secondary">
          تسجيل الدخول <ArrowLeft size={16} />
        </Link>
      </header>
      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span className="status-dot" /> رحلتك إلى بكالوريا 2027 تبدأ هنا
            </div>
            <h1>
              الرياضيات أبسط
              <br />
              مما تتخيّل.
              <br />
              <em>والنجاح أقرب إليك.</em>
            </h1>
            <p>
              مع الأستاذ عصام، افهم بعمق، تدرّب بثقة، واستعد لبكالوريا 2027.
              مساحة تعليمية واحدة، لكل خطوة في رحلتك.
            </p>
            <div className="row wrap">
              <Link href="/login" className="btn">
                تسجيل الدخول <ArrowLeft size={17} />
              </Link>
              <a href="#features" className="btn secondary">
                <Play size={16} /> اكتشف المنصة
              </a>
            </div>
            <div className="trust-row">
              <ShieldCheck size={20} />
              <span>تعليم مجاني بالكامل</span>
              <span>•</span>
              <span>6 شعب دراسية</span>
              <span>•</span>
              <span>رياضيات فقط</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-board">
              <small>Math is not a problem. It’s a possibility.</small>
              <span>f(x) = x² − 2x + 1</span>
              <span style={{ fontSize: 24 }}>∫₀¹ x² dx &nbsp; = &nbsp; ⅓</span>
            </div>
            <div className="hero-chip one">
              <span className="hero-chips-icon">
                <GraduationCap />
              </span>
              <div>
                <strong>بكالوريا 2027</strong>
                <span className="muted small">خطوة بخطوة نحو التفوق</span>
              </div>
            </div>
            <div className="hero-chip two">
              <span className="hero-chips-icon">
                <Video />
              </span>
              <div>
                <strong>تعلّم، أينما كنت</strong>
                <span className="muted small">مباشر ومسجّل داخل المنصة</span>
              </div>
            </div>
          </div>
        </section>
        <section id="specialities" className="landing-section">
          <div className="section-intro">
            <span className="eyebrow" style={{ justifyContent: "center" }}>
              لكل طموح، مسار
            </span>
            <h2>شعبتك، برنامجك، طريقك للنجاح</h2>
            <p>
              برنامج رياضيات مخصص لكل شعبة، بمحتوى يناسب منهجك الدراسي وأهدافك.
            </p>
          </div>
          <div className="grid grid-3">
            {specialities.map((s) => (
              <div className="card speciality-card" key={s.id}>
                <span className="speciality-symbol">{s.symbol}</span>
                <div>
                  <h3>{s.name}</h3>
                  <p className="muted small latin">{s.nameFr}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section id="features" className="landing-section">
          <div className="section-intro">
            <span className="eyebrow" style={{ justifyContent: "center" }}>
              كل ما تحتاجه، في مكان واحد
            </span>
            <h2>مش مجرد دروس. تجربة تعلّم متكاملة.</h2>
            <p>
              من أول فكرة إلى آخر تمرين، أدوات تساعدك على الفهم، المراجعة
              والتقدم.
            </p>
          </div>
          <div className="grid grid-3">
            {[
              {
                icon: Video,
                title: "حصص مباشرة، تفاعل حقيقي",
                text: "احضر مع الأستاذ عبر Zoom داخل المنصة. اسأل، ناقش وشارك دون مغادرة موقعك.",
              },
              {
                icon: Play,
                title: "دروس ترافق وقتك",
                text: "شاهد الدروس المسجلة بجودة متكيفة، واستكمل من حيث توقفت بالسرعة التي تناسبك.",
              },
              {
                icon: FileText,
                title: "مراجع تبقى معك",
                text: "ملخصات، سلاسل تمارين وتصحيحات مفصلة. اقرأ ملفاتك التعليمية مباشرة داخل المنصة.",
              },
              {
                icon: BookOpen,
                title: "برنامج منظم، فهم أعمق",
                text: "فصول ودروس مرتبة حسب شعبتك، دون تشتت بين المواد أو المصادر.",
              },
              {
                icon: CalendarCheck,
                title: "تدرّب قبل يوم الامتحان",
                text: "اختبارات تفاعلية ومواضيع بكالوريا سابقة، مع تصحيح تلقائي للأسئلة المدعومة.",
              },
              {
                icon: ShieldCheck,
                title: "مجانية، وخاصة بطلابنا",
                text: "كل المحتوى متاح لتلاميذ الأستاذ دون اشتراكات أو مدفوعات. حسابك تحصل عليه من الأستاذ.",
              },
            ].map((f) => (
              <article className="card feature-card" key={f.title}>
                <f.icon size={27} strokeWidth={1.5} />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="about" className="landing-section">
          <div className="teacher-section">
            <div>
              <span className="eyebrow">
                <Sparkles size={16} /> أستاذك، وشريك رحلتك
              </span>
              <h2>{settings?.teacherName ?? "الأستاذ عصام بن بليل"}</h2>
              <p>
                نؤمن أن الرياضيات ليست موهبة حصرية، بل فهم وممارسة. هنا نشرح
                الأفكار ببساطة، نبني الأساس خطوة بخطوة، ونجعل كل تمرين فرصة
                جديدة للتقدم.
              </p>
              <div className="row wrap">
                <span className="pill">
                  <Check size={13} /> شرح مبسط ومنهجي
                </span>
                <span className="pill">
                  <Check size={13} /> متابعة طوال العام
                </span>
              </div>
            </div>
            <div className="teacher-art">∑ &nbsp; √x &nbsp; π</div>
          </div>
        </section>
        <section id="faq" className="landing-section">
          <div className="section-intro">
            <span className="eyebrow" style={{ justifyContent: "center" }}>
              نجيب عن تساؤلاتك
            </span>
            <h2>قبل أن تبدأ رحلتك</h2>
          </div>
          <div className="faq">
            {[
              [
                "هل المنصة مجانية فعلاً؟",
                "نعم. جميع الدروس والحصص والملفات المخصصة لشعبتك مجانية بالكامل، دون اشتراكات أو رسوم.",
              ],
              [
                "كيف أحصل على حساب؟",
                "تواصل مع الأستاذ للحصول على اسم المستخدم وكلمة المرور المؤقتة. لا يوجد تسجيل ذاتي، وسيُطلب منك تغيير كلمة المرور عند أول دخول.",
              ],
              [
                "هل أحتاج إلى تطبيق Zoom؟",
                "يمكنك حضور الحصص داخل المنصة باستخدام المتصفحات والأجهزة المدعومة من Zoom Meeting SDK، دون التحويل إلى التطبيق.",
              ],
              [
                "هل يمكنني مراجعة الحصص لاحقاً؟",
                "عند تسجيل الحصة ومراجعتها ونشرها من الأستاذ، ستجدها في قسم الدروس المسجلة الخاص بشعبتك.",
              ],
              [
                "هل تعمل المنصة على الهاتف؟",
                "نعم، الواجهة متجاوبة مع الهاتف واللوحة والحاسوب. بعض خصائص Zoom تعتمد على توافق جهازك ومتصفحك.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section id="contact" className="landing-section">
          <div className="cta">
            <span className="pill">مستقبلك يستحق البداية</span>
            <h2 style={{ marginTop: 18 }}>جاهز لتكتب قصة نجاحك؟</h2>
            <p>
              تواصل مع الأستاذ للحصول على بيانات الدخول الخاصة بك. لا تحتاج إلى
              التسجيل أو الدفع، فقط رغبتك في التعلّم.
            </p>
            <Contact phone={settings?.contactPhone} label="احصل على حسابك" />
            {!settings?.contactPhone &&
              !process.env.NEXT_PUBLIC_CONTACT_PHONE && (
                <p className="small" style={{ marginTop: 15 }}>
                  سيُعلن الأستاذ عن معلومات التواصل قريباً.
                </p>
              )}
            {settings?.contactEmail && (
              <p className="small" style={{ marginTop: 15 }}>
                <a href={`mailto:${settings.contactEmail}`}>
                  {settings.contactEmail}
                </a>
              </p>
            )}
          </div>
        </section>
      </main>
      <footer className="footer">
        <Brand />
        <span>جميع الحقوق محفوظة © 2027 · الأستاذ عصام</span>
        <span className="row">
          <MessageCircle size={14} /> نتعلم اليوم، لننجح غداً.
        </span>
      </footer>
    </div>
  );
}
