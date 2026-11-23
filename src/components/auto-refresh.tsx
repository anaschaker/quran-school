"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AutoRefreshProps = {
  intervalMs?: number;
};

/**
 * تحديث تلقائي للصفحة كل 15 ثانية (polling) دون WebSocket.
 */
export function AutoRefresh({ intervalMs = 15000 }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
