"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Headphones,
  ArrowUpLeft,
} from "lucide-react";
import { Brand } from "./brand";
import { Icon } from "./icons";
import { adminNav, studentNav } from "@/lib/constants";
export function Shell({
  children,
  name,
  speciality,
  admin = false,
  preview = false,
  unread = 0,
  theme = "light",
  phone = "",
}: {
  children: React.ReactNode;
  name: string;
  speciality: string;
  admin?: boolean;
  preview?: boolean;
  unread?: number;
  theme?: string;
  phone?: string;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const base = preview ? "/preview" : admin ? "/admin" : "/dashboard";
  const nav = admin ? adminNav : studentNav;
  useEffect(() => {
    const previous = document.body.dataset.theme;
    document.body.dataset.theme = theme;
    return () => {
      if (previous) document.body.dataset.theme = previous;
      else delete document.body.dataset.theme;
    };
  }, [theme]);
  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Brand />
        <div className="row between">
          <div className="nav-label">
            {admin ? "مساحة الإدارة" : "مساحتك التعليمية"}
          </div>
          <button
            className="icon-btn mobile-toggle"
            onClick={() => setOpen(false)}
            aria-label="إغلاق القائمة"
          >
            <X size={17} />
          </button>
        </div>
        <nav>
          {nav.map(([href, label, icon]) => (
            <Link
              className={`nav-item ${path === `${base}${href ? "/" + href : ""}` ? "active" : ""}`}
              key={href}
              href={`${base}${href ? "/" + href : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon name={icon} />
              {label}
              {href === "notifications" && unread > 0 && (
                <span className="badge-count">{unread}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support">
            <Headphones size={22} color="var(--green)" />
            <h3 style={{ fontSize: 12, marginTop: 7 }}>نحن هنا لمساعدتك</h3>
            <p>لديك سؤال؟ الأستاذ قريب منك.</p>
            <a
              href={
                phone
                  ? `https://wa.me/${phone.replace(/\D/g, "")}`
                  : "/#contact"
              }
              className="text-link"
            >
              تواصل مع الأستاذ <ArrowUpLeft size={13} />
            </a>
          </div>
          <button
            className="nav-item"
            style={{ width: "100%", background: "none" }}
            onClick={() =>
              preview ? router.push("/") : signOut({ callbackUrl: "/login" })
            }
          >
            <LogOut size={17} />
            تسجيل الخروج
          </button>
          <div
            className="small muted"
            style={{ textAlign: "center", fontSize: 9, marginTop: 5 }}
          >
            عصام ماث · نتعلم اليوم، لننجح غداً
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-btn mobile-toggle"
              onClick={() => setOpen(!open)}
              aria-label="فتح القائمة"
            >
              <Menu size={18} />
            </button>
            <span className="topbar-title">
              {admin ? "لوحة إدارة المنصة" : "مساحة التلميذ"}
              <span className="muted" style={{ margin: "0 12px" }}>
                /
              </span>
              <span className="muted">
                {nav.find(
                  ([href]) => path === `${base}${href ? "/" + href : ""}`,
                )?.[1] ?? "تفاصيل المحتوى"}
              </span>
            </span>
          </div>
          <div className="row">
            <form className="searchbox" action={`${base}/lessons`}>
              <Search size={16} />
              <input
                name="q"
                placeholder="ابحث عن درس، فصل..."
                aria-label="البحث عن درس"
              />
              <kbd className="small">↵</kbd>
            </form>
            <Link
              href={`${base}/notifications`}
              className="icon-btn"
              style={{ position: "relative" }}
              aria-label="الإشعارات"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 7,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#d79664",
                  }}
                />
              )}
            </Link>
            <Link href={`${base}/settings`} className="row top-user">
              <span className="avatar">{name.charAt(0)}</span>
              <div className="user-name">
                <strong style={{ fontSize: 12 }}>{name}</strong>
                <div className="muted" style={{ fontSize: 10, marginTop: 3 }}>
                  {speciality}
                </div>
              </div>
              <ChevronDown size={12} className="muted" />
            </Link>
          </div>
        </header>
        <motion.main
          className="content"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {preview && (
            <div className="notice">
              معاينة تطوير ببيانات توضيحية — ليست حساباً حقيقياً. العمليات
              الخاصة والتكاملات متوقفة هنا.
            </div>
          )}
          {children}
          <footer className="platform-footer">
            <span>© 2027 عصام ماث. جميع الحقوق محفوظة.</span>
            <span>صُنع بشغف، من أجل نجاحك</span>
          </footer>
        </motion.main>
      </div>
    </>
  );
}
