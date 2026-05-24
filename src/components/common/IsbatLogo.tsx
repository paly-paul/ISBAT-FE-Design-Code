interface IsbatLogoProps {
  size?: number
  className?: string
}

export function IsbatLogo({ size = 64, className = '' }: IsbatLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      aria-label="ISBAT University logo"
      role="img"
    >
      <rect width="200" height="200" rx="24" fill="#2d448f" />
      <g
        transform="translate(60,60)"
        fill="#ffffff"
        fontFamily="Inter, sans-serif"
        fontWeight="800"
      >
        <text x="40" y="55" fontSize="48" textAnchor="middle">
          IU
        </text>
      </g>
      <rect x="60" y="130" width="80" height="6" rx="3" fill="#60a5fa" />
    </svg>
  )
}
