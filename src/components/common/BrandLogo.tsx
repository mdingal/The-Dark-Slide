import React from 'react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src="/dark-slide-logo-transparent.svg"
    alt="Dark Slide — Fingerboard Lab"
    width={552}
    height={164}
    className={`block object-contain dark:invert ${className}`}
    draggable={false}
  />
);
