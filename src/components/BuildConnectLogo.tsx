type LogoSize = "default" | "sm";

/**
 * Логотип BuildConnect по брендовому макету: оранжевый скруглённый квадрат,
 * три белые силуэта зданий, подпись.
 */
export function BuildConnectLogo({
  className,
  size = "default",
}: {
  className?: string;
  size?: LogoSize;
}) {
  const iconPx = size === "sm" ? 30 : 36;
  const textClass = size === "sm" ? "text-lg" : "text-xl";

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconPx}
        height={iconPx}
        viewBox="0 0 40 40"
        className="shrink-0"
        aria-hidden
      >
        <title>BuildConnect</title>
        <rect width="40" height="40" rx="8" ry="8" fill="#f97316" />
        <g fill="#ffffff">
          <rect x="7" y="19" width="7" height="13" rx="1" />
          <rect x="16" y="10" width="8" height="22" rx="1" />
          <rect x="26" y="21" width="7" height="11" rx="1" />
        </g>
        <g fill="#f97316">
          <rect x="9" y="21" width="1.4" height="1.4" rx="0.2" />
          <rect x="11.2" y="21" width="1.4" height="1.4" rx="0.2" />
          <rect x="9" y="23.8" width="1.4" height="1.4" rx="0.2" />
          <rect x="11.2" y="23.8" width="1.4" height="1.4" rx="0.2" />
          <rect x="18" y="12.8" width="1.6" height="1.6" rx="0.25" />
          <rect x="20.8" y="12.8" width="1.6" height="1.6" rx="0.25" />
          <rect x="18" y="16" width="1.6" height="1.6" rx="0.25" />
          <rect x="20.8" y="16" width="1.6" height="1.6" rx="0.25" />
          <rect x="18" y="19.2" width="1.6" height="1.6" rx="0.25" />
          <rect x="20.8" y="19.2" width="1.6" height="1.6" rx="0.25" />
          <rect x="28" y="23.2" width="1.3" height="1.3" rx="0.2" />
          <rect x="30.5" y="23.2" width="1.3" height="1.3" rx="0.2" />
        </g>
      </svg>
      <span className={`${textClass} font-bold tracking-tight text-foreground font-sans select-none`}>
        BuildConnect
      </span>
    </span>
  );
}
