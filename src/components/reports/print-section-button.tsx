"use client";

import { useEffect } from "react";

type PrintSectionButtonProps = {
  targetId: string;
  label?: string;
};

/**
 * يطبع قسم تقرير واحد فقط عبر إخفاء بقية الأقسام أثناء الطباعة.
 */
export function PrintSectionButton({
  targetId,
  label = "طباعة",
}: PrintSectionButtonProps) {
  useEffect(() => {
    const cleanup = () => {
      document
        .querySelectorAll<HTMLElement>("[data-report-section]")
        .forEach((section) => section.removeAttribute("data-print-hidden"));
    };

    window.addEventListener("afterprint", cleanup);

    return () => window.removeEventListener("afterprint", cleanup);
  }, []);

  function handlePrint() {
    document
      .querySelectorAll<HTMLElement>("[data-report-section]")
      .forEach((section) => {
        if (section.id === targetId) {
          section.removeAttribute("data-print-hidden");
        } else {
          section.dataset.printHidden = "true";
        }
      });

    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-xl border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50 print:hidden"
    >
      {label}
    </button>
  );
}
