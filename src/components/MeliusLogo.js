import React from 'react';

function MeliusLogo({ size = 36, spinning = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-70 -70 140 140"
      xmlns="http://www.w3.org/2000/svg"
      style={spinning ? {
        animation: 'rays-spin 20s linear infinite',
        transformOrigin: 'center'
      } : {}}
    >
      {/* Long rays */}
      <polygon points="0,-65 -5,-38 5,-38" fill="#C9A84C"/>
      <polygon points="0,65 -5,38 5,38" fill="#C9A84C"/>
      <polygon points="-65,0 -38,-5 -38,5" fill="#C9A84C"/>
      <polygon points="65,0 38,-5 38,5" fill="#C9A84C"/>
      <polygon points="-46,-46 -28,-23 -23,-28" fill="#C9A84C"/>
      <polygon points="46,-46 28,-23 23,-28" fill="#C9A84C"/>
      <polygon points="-46,46 -28,23 -23,28" fill="#C9A84C"/>
      <polygon points="46,46 28,23 23,28" fill="#C9A84C"/>
      {/* Short rays */}
      <polygon points="0,-48 -3.5,-30 3.5,-30" fill="#C9A84C" opacity="0.7"/>
      <polygon points="0,48 -3.5,30 3.5,30" fill="#C9A84C" opacity="0.7"/>
      <polygon points="-48,0 -30,-3.5 -30,3.5" fill="#C9A84C" opacity="0.7"/>
      <polygon points="48,0 30,-3.5 30,3.5" fill="#C9A84C" opacity="0.7"/>
      <polygon points="-34,-34 -20,-16 -16,-20" fill="#C9A84C" opacity="0.7"/>
      <polygon points="34,-34 20,-16 16,-20" fill="#C9A84C" opacity="0.7"/>
      <polygon points="-34,34 -20,16 -16,20" fill="#C9A84C" opacity="0.7"/>
      <polygon points="34,34 20,16 16,20" fill="#C9A84C" opacity="0.7"/>
      {/* Core */}
      <circle cx="0" cy="0" r="30" fill="#C9A84C"/>
      <circle cx="-8" cy="-8" r="9" fill="#FEEAA0" opacity="0.45"/>
    </svg>
  );
}

export default MeliusLogo;