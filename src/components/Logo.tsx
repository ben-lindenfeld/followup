export default function Logo({ size = 30, onDark = false, wordmark = true }: { size?: number; onDark?: boolean; wordmark?: boolean }) {
  const fg = onDark ? "#3D4FC4" : "#FFFFFF";
  const bg = onDark ? "#FFFFFF" : "#3D4FC4";
  return (
    <span className="inline-flex items-center gap-2 select-none" dir="ltr">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={bg} />
        <path
          d="M23.6 10.4A8 8 0 1 0 24.4 19.2"
          stroke={fg}
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path
          d="M23.9 6.9v3.9h-3.9"
          stroke={fg}
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.4 16.7l2.7 2.7 5.1-5.6"
          stroke={fg}
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {wordmark && (
        <span className={`text-[19px] font-bold tracking-tight ${onDark ? "text-white" : "text-ink"}`}>
          Follow<span className={onDark ? "text-white" : "text-primary"}>Up</span>
        </span>
      )}
    </span>
  );
}
