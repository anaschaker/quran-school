"use client";

import { useEffect } from "react";

const styles = {
  page: {
    margin: 0,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    color: "#08251c",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
    direction: "rtl" as const,
    padding: "1.25rem",
    textAlign: "center" as const,
  },
  inner: { maxWidth: "42rem", width: "100%", padding: "5rem 0" },
  badge: {
    display: "inline-block",
    borderRadius: "9999px",
    border: "1px solid rgba(197, 155, 63, 0.45)",
    backgroundColor: "#fdf6e7",
    color: "#7a5a12",
    padding: "0.375rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  title: { marginTop: "1.5rem", fontSize: "2.25rem", fontWeight: 700 },
  text: { marginTop: "1rem", lineHeight: 2, color: "#2f5b4a" },
  button: {
    marginTop: "2rem",
    border: 0,
    borderRadius: "9999px",
    backgroundColor: "#0f3d2e",
    color: "#ffffff",
    padding: "0.75rem 1.5rem",
    fontSize: "0.875rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("حدث خطأ جسيم في التطبيق:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={styles.page}>
        <main style={styles.inner}>
          <span style={styles.badge}>خطأ ٥٠٠</span>

          <h1 style={styles.title}>تعذّر تحميل التطبيق</h1>

          <p style={styles.text}>
            حدث خطأ غير متوقع أثناء تحميل الموقع. يرجى إعادة المحاولة، وإن استمرت
            المشكلة فتواصل مع إدارة المدرسة.
          </p>

          <button type="button" onClick={reset} style={styles.button}>
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
