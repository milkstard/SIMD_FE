// Inline stroke icons from the sign-in mock; decorative, so hidden from assistive tech.

export function BuildingIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="2" width="11" height="12.5" rx="1" />
      <path d="M5.5 5h1.5M9 5h1.5M5.5 8h1.5M9 8h1.5M7 14.5v-3h2v3" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      style={{ flex: 'none', marginTop: 1 }}
    >
      <rect x="3" y="7" width="10" height="7" rx="1" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function OctagonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <polygon points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5" fill="currentColor" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      style={{ flex: 'none', marginTop: 1 }}
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.8V8l2.2 1.6" strokeLinecap="round" />
    </svg>
  );
}
