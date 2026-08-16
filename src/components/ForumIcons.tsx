/**
 * Small stroke icons for the forum, sharing ShareButton's exact style
 * (currentColor stroke, 2.2 weight, round caps) so nothing looks bolted-on.
 */
type IconProps = { size?: number };

const base = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function IconComment({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.35 0-2.62-.31-3.75-.86L3 20l1.02-4.4A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}

export function IconRepost({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
      <path d="M7 7h9a4 4 0 1 1 0 8" />
      <path d="M15.5 3.5 19 7l-3.5 3.5" />
      <path d="M17 17H8a4 4 0 1 1 0-8" />
      <path d="M8.5 20.5 5 17l3.5-3.5" />
    </svg>
  );
}

export function IconShare({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}

export function IconTrash({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
      <path d="M4 7h16" /><path d="M9 7V4.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8V7" />
      <path d="M6 7l.8 12.2c.05.98.87 1.8 1.85 1.8h6.7c.98 0 1.8-.82 1.85-1.8L18 7" />
      <line x1="10" y1="11" x2="10" y2="16" /><line x1="14" y1="11" x2="14" y2="16" />
    </svg>
  );
}

export function IconClose({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
      <line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

export function IconImage({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="10" r="1.7" />
      <path d="m4 17 5-5 3.5 3.5L17 11l4 5" />
    </svg>
  );
}

export function IconPencil({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
