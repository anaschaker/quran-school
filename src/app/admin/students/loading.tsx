export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded bg-brand-100" />
      <div className="h-12 w-full animate-pulse rounded-2xl bg-brand-100" />
      <div className="h-64 w-full animate-pulse rounded-2xl bg-brand-100" />
    </div>
  );
}
