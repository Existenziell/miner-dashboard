/** Strip ANSI escape sequences (e.g. [0;32m ... [0m) for plain-text display. */
// eslint-disable-next-line no-control-regex -- intentional match of ESC character
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

export function stripAnsi(str) {
  if (typeof str !== 'string') return '';
  return str.replace(ANSI_REGEX, '');
}
