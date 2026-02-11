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
