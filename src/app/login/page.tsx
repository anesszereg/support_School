import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth-form";
import { databaseConfigured } from "@/lib/db";
import { currentUser } from "@/lib/access";
import { redirect } from "next/navigation";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Login() {
  const user = await currentUser();
  if (user)
    redirect(
      user.mustChangePassword
        ? "/change-password"
        : user.role === "ADMIN"
          ? "/admin"
          : "/dashboard",
    );
  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="latin small">ISSAM MATH / BAC 2027</div>
        <div>
          <div
            style={{
              font: "italic 70px Georgia",
              color: "#83b39a",
              marginBottom: 35,
            }}
          >
            lim &nbsp; x → ∞
          </div>
          <h1>
            كل مسألة لها حل.
            <br />
            وكل طموح له طريق.
          </h1>
          <p>
            ابدأ يومك بخطوة جديدة نحو النجاح.
            <br />
            الأستاذ عصام معك، في كل خطوة.
          </p>
        </div>
        <span className="small" style={{ color: "#94b4a2" }}>
          منصة خاصة · تعليم مجاني · مستقبل أفضل
        </span>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <Brand />
          <span className="eyebrow">أهلاً بعودتك</span>
          <h1>سعيدون برؤيتك مجدداً</h1>
          <p>أدخل البيانات التي حصلت عليها من الأستاذ للمتابعة.</p>
          <AuthForm configured={databaseConfigured()} />
          <div
            style={{
              marginTop: 30,
              paddingTop: 20,
              borderTop: "1px solid var(--line)",
              textAlign: "center",
            }}
          >
            <p className="small muted">
              ليس لديك حساب؟ الحسابات ينشئها الأستاذ فقط.
            </p>
            <Link href="/#contact" className="text-link">
              تواصل مع الأستاذ للحصول على حسابك
            </Link>
          </div>
          {process.env.NODE_ENV !== "production" && !databaseConfigured() && (
            <Link
              href="/preview"
              className="text-link"
              style={{ display: "block", marginTop: 20, textAlign: "center" }}
            >
              معاينة التطوير — بيانات توضيحية فقط
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
