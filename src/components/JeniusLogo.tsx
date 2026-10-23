import { memo } from 'react';

interface JeniusLogoProps {
  className?: string;
  title?: string;
}

function JeniusLogoBase({ className = 'w-9 h-9', title = 'OMS by Jenius' }: JeniusLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      <defs>
        <linearGradient id="jenius-j-grad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF7E36" />
          <stop offset="50%" stopColor="#FF3E3D" />
          <stop offset="100%" stopColor="#C8102E" />
        </linearGradient>
        <linearGradient id="jenius-bar-grad" x1="8" y1="56" x2="56" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4A154B" />
          <stop offset="50%" stopColor="#8A2BE2" />
          <stop offset="100%" stopColor="#E024A2" />
        </linearGradient>
      </defs>

      {/* Outer rounded path */}
      <path
        d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z"
        fill="url(#jenius-j-grad)"
        opacity="0.95"
      />

      {/* Internal chart bars */}
      <g fill="url(#jenius-bar-grad)">
        <rect x="20" y="32" width="6" height="16" rx="1.5" />
        <rect x="29" y="24" width="6" height="24" rx="1.5" />
        <rect x="38" y="16" width="6" height="32" rx="1.5" />
      </g>
    </svg>
  );
}

export const JeniusLogo = memo(JeniusLogoBase);
export default JeniusLogo;
