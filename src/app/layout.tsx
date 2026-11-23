import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cairo } from "next/font/google";

import "./globals.css";

import { PwaRegister } from "@/components/pwa-register";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { school } from "@/config/school";
import { getSession } from "@/lib/auth";
import { getUnreadCount } from "@/lib/messaging";
import { getNotificationSummary } from "@/lib/notify";
import { getSchoolSettings } from "@/lib/school-settings";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const instant = false;

export function generateViewport() {
  return {
    themeColor: "#0f3d2e",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSchoolSettings();

  return {
    title: {
      default: settings.name,
      template: `%s | ${settings.name}`,
    },
    description: school.description,
    applicationName: settings.name,
    manifest: "/manifest.webmanifest",
    keywords: ["القرآن الكريم", "مدرسة قرآن", "تجويد", "تلاوة", "تحفيظ"],
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [settings, session] = await Promise.all([
    getSchoolSettings(),
    getSession(),
  ]);
  const [unreadCount, notificationSummary] = await Promise.all([
    session ? getUnreadCount(session.userId) : Promise.resolve(0),
    session
      ? getNotificationSummary(session.userId)
      : Promise.resolve({ notifications: [], unreadCount: 0 }),
  ]);

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <PwaRegister />
        <SiteHeader
          schoolName={settings.name}
          tagline={school.tagline}
          isAuthenticated={Boolean(session)}
          unreadCount={unreadCount}
          notifications={notificationSummary.notifications}
          notificationUnreadCount={notificationSummary.unreadCount}
        />
        {children}
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
