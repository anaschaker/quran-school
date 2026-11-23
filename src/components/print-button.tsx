"use client";

type PrintButtonProps = {
  label?: string;
};

export function PrintButton({ label = "طباعة الإيصال" }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800 print:hidden"
    >
      {label}
    </button>
  );
}
