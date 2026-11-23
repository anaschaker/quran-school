type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16 7.2c-2.5-1.7-5.6-2.4-9.2-2.1v18.1c3.6-.3 6.7.4 9.2 2.1 2.5-1.7 5.6-2.4 9.2-2.1V5.1c-3.6-.3-6.7.4-9.2 2.1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M16 7.2v18.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10.2 11.1c1.1.1 2.1.4 3 .9M10.2 15.2c1.1.1 2.1.4 3 .9M21.8 11.1c-1.1.1-2.1.4-3 .9M21.8 15.2c-1.1.1-2.1.4-3 .9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M23.8 1.8l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7Z"
        fill="currentColor"
      />
    </svg>
  );
}
