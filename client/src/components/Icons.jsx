/**
 * Shared SVG icons.
 */

const svgProps = {
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconInfo({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg className={className} {...svgProps} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

export function IconSuccess({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg className={className} {...svgProps} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconWarning({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg className={className} {...svgProps} {...rest}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function IconSun({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg className={className} {...svgProps} {...rest}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

export function IconMoon({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg className={className} {...svgProps} {...rest}>
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

export function IconSwap({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      fill="currentColor"
      aria-hidden
      {...rest}
    >
      <g transform="translate(0,512) scale(0.1,-0.1)">
        <path d="M3620 4271 l0 -430 -1167 -4 -1168 -3 -85 -22 c-505 -133 -859 -500 -967 -1002 -22 -106 -25 -392 -4 -485 16 -70 60 -195 70 -195 3 0 88 68 188 150 l182 150 -11 31 c-17 50 -4 251 22 334 93 294 310 503 609 588 75 22 84 22 1204 25 l1127 3 0 -426 c0 -234 4 -425 8 -425 11 0 1282 1060 1281 1068 0 7 -1227 1031 -1269 1061 -20 13 -20 9 -20 -418z" />
        <path d="M4634 2841 l-181 -150 8 -48 c65 -398 -194 -791 -606 -920 l-90 -28 -1132 -3 -1133 -3 0 436 c0 239 -4 435 -8 435 -11 0 -1282 -1060 -1281 -1068 0 -4 289 -247 642 -541 l642 -534 3 431 2 431 1168 4 1167 3 85 22 c505 133 859 500 967 1002 22 106 25 392 4 485 -16 70 -60 195 -70 195 -3 0 -88 -67 -187 -149z" />
      </g>
    </svg>
  );
}

export function IconDownload({ className = 'w-4 h-4', ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      className={className}
      fill="currentColor"
      aria-hidden
      {...rest}
    >
      <path d="M832 320c-8.75 0-17.125 1.406-25.625 2.562C757.625 208.25 644.125 128 512 128c-132.156 0-245.562 80.25-294.406 194.562C209.156 321.406 200.781 320 192 320 85.938 320 0 405.938 0 512s85.938 192 192 192c20.531 0 39.875-4.25 58.375-10.375C284.469 731.375 331.312 756.75 384 764.5v-65.25c-49.844-10.375-91.594-42.812-112.625-87.875C249.531 629 222.219 640 192 640c-70.656 0-128-57.375-128-128 0-70.656 57.344-128 128-128 25.281 0 48.625 7.562 68.406 20.094C281.344 283.78099999999995 385.594 192 512 192c126.5 0 229.75 92.219 250.5 212.75 20-13 43.875-20.75 69.5-20.75 70.625 0 128 57.344 128 128 0 70.625-57.375 128-128 128-10.25 0-20-1.5-29.625-3.75C773.438 677.125 725.938 704 672 704c-11.062 0-21.625-1.625-32-4v64.938c10.438 1.688 21.062 3.062 32 3.062 61.188 0 116.5-24.625 156.938-64.438C830 703.625 830.875 704 832 704c106.062 0 192-85.938 192-192S938.062 320 832 320zM576 512H448v320H320l192 192 192-192H576V512z" />
    </svg>
  );
}

const themeIcons = {
  light: IconSun,
  dark: IconMoon,
  'light-high-contrast': IconSun,
  'dark-high-contrast': IconMoon,
};

export function ThemeIcon({ mode, className = 'w-4 h-4', ...rest }) {
  const Icon = themeIcons[mode] ?? IconSun;
  return <Icon className={className} {...rest} />;
}
