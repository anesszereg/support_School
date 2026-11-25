"use client";
import { useState } from "react";
export function PasswordForm({ first = false }: { first?: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const data = new FormData(e.currentTarget);
        if (data.get("password") !== data.get("confirm")) {
          setMessage("كلمتا المرور غير متطابقتين");
          setBusy(false);
          return;
        }
        try {
          const res = await fetch("/api/student/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(data)),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          setMessage(
            first
              ? "تم تأمين حسابك. سجّل الدخول بكلمة المرور الجديدة."
              : "تم تغيير كلمة المرور وإبطال الجلسات القديمة. سجّل الدخول مجدداً.",
          );
          window.location.assign("/login");
        } catch {
          setMessage("تعذر تغيير كلمة المرور. تحقق من كلمة المرور الحالية.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="field">
        <label>كلمة المرور الحالية</label>
        <input
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </div>
      <div className="field">
        <label>كلمة المرور الجديدة (12 حرفاً على الأقل)</label>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </div>
      <div className="field">
        <label>تأكيد كلمة المرور</label>
        <input
          type="password"
          name="confirm"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <button className="btn" disabled={busy}>
        حفظ كلمة المرور
      </button>
    </form>
  );
}
