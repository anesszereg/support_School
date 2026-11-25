"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
const schema = z.object({
  username: z.string().min(1, "أدخل اسم المستخدم"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});
export function AuthForm({ configured }: { configured: boolean }) {
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        setError("");
        try {
          const result = await signIn("credentials", {
            ...values,
            redirect: false,
          });
          if (result?.error)
            setError(
              "بيانات الدخول غير صحيحة أو الحساب غير نشط. حاول لاحقاً أو تواصل مع الأستاذ.",
            );
          else window.location.assign("/dashboard");
        } catch {
          setError("تعذر الاتصال بالخادم. حاول مجدداً.");
        }
      })}
    >
      {!configured && (
        <div className="notice">
          وضع الإعداد: لم يتم ربط قاعدة البيانات بعد. الدخول متوقف حتى إتمام
          الإعداد.
        </div>
      )}
      <div className="field">
        <label htmlFor="username">اسم المستخدم</label>
        <input
          id="username"
          autoComplete="username"
          dir="ltr"
          placeholder="your.username"
          {...register("username")}
        />
        {errors.username && (
          <span className="error">{errors.username.message}</span>
        )}
      </div>
      <div className="field">
        <label htmlFor="password">كلمة المرور</label>
        <div className="row">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            dir="ltr"
            placeholder="••••••••••••"
            {...register("password")}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShow(!show)}
            aria-label="إظهار كلمة المرور"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <button
        type="submit"
        className="btn"
        style={{ marginTop: 15 }}
        disabled={isSubmitting || !configured}
      >
        {isSubmitting ? "جاري الدخول..." : "تسجيل الدخول"}
        <ArrowLeft size={17} />
      </button>
      <p className="muted small" style={{ marginTop: 20, textAlign: "center" }}>
        نسيت كلمة المرور؟ تواصل مع الأستاذ لإعادة تعيينها.
      </p>
    </form>
  );
}
