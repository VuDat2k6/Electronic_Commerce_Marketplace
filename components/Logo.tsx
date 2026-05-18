// TFDTRONIC Logo SVG
// Modern tech/electronics logo with gradient

export const LogoSVG = () => (
  <svg
    width="180"
    height="50"
    viewBox="0 0 180 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="logo-svg"
  >
    <defs>
      {/* Gradient cho logo */}
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9333ea" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>
      
      {/* Glow effect */}
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* Icon - Circuit/Chip stylized */}
    <g filter="url(#glow)">
      {/* Main chip body */}
      <rect x="5" y="12" width="26" height="26" rx="4" fill="url(#logoGradient)"/>
      
      {/* Chip pins left */}
      <rect x="1" y="17" width="4" height="4" rx="1" fill="url(#logoGradient)"/>
      <rect x="1" y="24" width="4" height="4" rx="1" fill="url(#logoGradient)"/>
      <rect x="1" y="31" width="4" height="4" rx="1" fill="url(#logoGradient)"/>
      
      {/* Chip pins right */}
      <rect x="31" y="17" width="4" height="4" rx="1" fill="url(#logoGradient)"/>
      <rect x="31" y="24" width="4" height="4" rx="1" fill="url(#logoGradient)"/>
      <rect x="31" y="31" width="4" height="4" rx="1" fill="url(#logoGradient)"/>
      
      {/* Circuit lines inside */}
      <path 
        d="M12 20 L12 25 L18 25 L18 30" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path 
        d="M24 20 L24 25 L18 25" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="20" r="2" fill="white"/>
      <circle cx="24" cy="20" r="2" fill="white"/>
      <circle cx="18" cy="30" r="2" fill="white"/>
    </g>

    {/* Text - TFDTRONIC */}
    <text 
      x="45" 
      y="32" 
      fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      fontSize="22"
      fontWeight="800"
      fill="url(#logoGradient)"
      letterSpacing="-0.5"
    >
      TFDTRONIC
    </text>
    
    {/* Tagline */}
    <text 
      x="46" 
      y="44" 
      fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      fontSize="8"
      fontWeight="500"
      fill="#6b7280"
      letterSpacing="2"
    >
      ELECTRONICS STORE
    </text>
  </svg>
);

export const LogoIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="logo-icon"
  >
    <defs>
      <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9333ea" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>
    </defs>
    
    <rect x="5" y="10" width="22" height="22" rx="3" fill="url(#iconGradient)"/>
    <rect x="1" y="14" width="4" height="3" rx="1" fill="url(#iconGradient)"/>
    <rect x="1" y="20" width="4" height="3" rx="1" fill="url(#iconGradient)"/>
    <rect x="27" y="14" width="4" height="3" rx="1" fill="url(#iconGradient)"/>
    <rect x="27" y="20" width="4" height="3" rx="1" fill="url(#iconGradient)"/>
    <path d="M10 16 L10 20 L15 20 L15 24" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M20 16 L20 20 L15 20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="10" cy="16" r="1.5" fill="white"/>
    <circle cx="20" cy="16" r="1.5" fill="white"/>
  </svg>
);

export default LogoSVG;
