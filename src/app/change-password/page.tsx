import { requireUser } from "@/lib/access";
import { PasswordForm } from "@/components/password-form";
import { Brand } from "@/components/brand";
export default async function ChangePassword() {
  await requireUser(true);
  return (
    <main style={{ maxWidth: 470, margin: "70px auto", padding: 25 }}>
      <Brand />
      <div className="card pad" style={{ marginTop: 30 }}>
        <h1 style={{ fontSize: 25 }}>أمّن حسابك أولاً</h1>
        <p className="muted small" style={{ margin: "10px 0 25px" }}>
          استبدل كلمة المرور المؤقتة بكلمة مرور خاصة بك قبل المتابعة.
        </p>
        <PasswordForm first />
      </div>
    </main>
  );
}
