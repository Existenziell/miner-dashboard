/**
 * Shared SVG icons. Use with className="w-4 h-4" (or similar) and stroke="currentColor" where needed.
 */

const svgProps = {
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Sun icon for light theme – circle with clear ray lines */
export function IconSun({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg className={className} {...svgProps} {...rest}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

/** Moon/crescent for dark theme */
export function IconMoon({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg className={className} {...svgProps} {...rest}>
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

/** Monitor/screen for system theme */
export function IconMonitor({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg className={className} {...svgProps} {...rest}>
      <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

/** Info circle for hints/tooltips */
export function IconInfo({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg className={className} {...svgProps} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

/** Question mark circle for hints/tooltips (filled, use currentColor) */
export function IconQuestion({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg className={className} viewBox="0 0 160 160" {...rest}>
      <g fill="currentColor">
        <path d="m80 15c-35.88 0-65 29.12-65 65s29.12 65 65 65 65-29.12 65-65-29.12-65-65-65zm0 10c30.36 0 55 24.64 55 55s-24.64 55-55 55-55-24.64-55-55 24.64-55 55-55z" />
        <path d="m57.373 18.231a9.3834 9.1153 0 1 1 -18.767 0 9.3834 9.1153 0 1 1 18.767 0z" transform="matrix(1.1989 0 0 1.2342 21.214 28.75)" />
        <path d="m90.665 110.96c-0.069 2.73 1.211 3.5 4.327 3.82l5.008 0.1v5.12h-39.073v-5.12l5.503-0.1c3.291-0.1 4.082-1.38 4.327-3.82v-30.813c0.035-4.879-6.296-4.113-10.757-3.968v-5.074l30.665-1.105" />
      </g>
    </svg>
  );
}

const themeIcons = {
  light: IconSun,
  dark: IconMoon,
  system: IconMonitor,
};

/** Single component that picks the icon by mode (avoids creating components during render). */
export function ThemeIcon({ mode, className = 'w-4 h-4', ...rest }) {
  const Icon = themeIcons[mode] ?? IconSun;
  return <Icon className={className} {...rest} />;
}
