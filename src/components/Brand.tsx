export function Brand() {
  return (
    <span className="brand">
      <img src="/viaatlas.svg" width="38" height="38" alt="" />
      <span>
        Vía<span className="brand-atlas">Atlas</span>
      </span>
    </span>
  )
}

export function TollIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 7 1.4-3h15.2L21 7v1H3V7Z" />
      <path d="M5.5 8v12m13-12v12M3 20h7m6 0h5M6 11h5v7H6m1.5-3.5h3m.5-2h6.8m-5.8 0 1.6-2m1.7 2 1.6-2" />
    </svg>
  )
}
