import type { Metadata } from "next";
import "./globals.css";
import { db, databaseConfigured } from "@/lib/db";
import { BrandingProvider } from "@/components/branding";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: {
    default: "عصام ماث | معك نحو بكالوريا 2027",
    template: "%s | عصام ماث",
  },
  description:
    "منصة الأستاذ عصام بن بليل لتعلم الرياضيات. حصص مباشرة، دروس مسجلة وتمارين لجميع شعب بكالوريا 2027، مجاناً.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = databaseConfigured()
    ? await db.platformSettings.findUnique({ where: { id: "platform" } })
    : null;
  return (
    <html lang="ar" dir="rtl">
      <body
        data-theme={settings?.defaultTheme ?? "light"}
        style={
          {
            "--green": settings?.accentColor ?? "#128c73",
          } as React.CSSProperties
        }
      >
        <BrandingProvider
          name={settings?.brandName ?? "عصام ماث"}
          year={settings?.academicYear ?? "2027"}
        >
          {children}
        </BrandingProvider>
      </body>
    </html>
  );
}
