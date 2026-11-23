import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full border border-brand-900/15 bg-white px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="size-4"
          aria-hidden="true"
        >
          <path
            d="M12.5 6.5V4.8c0-.7-.6-1.3-1.3-1.3H5c-.7 0-1.3.6-1.3 1.3v10.4c0 .7.6 1.3 1.3 1.3h6.2c.7 0 1.3-.6 1.3-1.3v-1.7M9 10h7.5m0 0-2.5-2.5M16.5 10 14 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        تسجيل الخروج
      </button>
    </form>
  );
}
