export default function Loading() {
  return (
    <main className="flex-1" aria-busy="true" aria-live="polite">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-8">
        <span
          className="size-12 animate-spin rounded-full border-4 border-brand-900/15 border-t-gold-500"
          aria-hidden="true"
        />
        <p className="mt-5 text-sm font-semibold text-brand-700">
          جارٍ تحميل المحتوى…
        </p>
        <span className="sr-only">يرجى الانتظار قليلًا</span>
      </section>
    </main>
  );
}
