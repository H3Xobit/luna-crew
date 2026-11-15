// Small inline icons. Each bar and job has its own shape, so nothing in the
// game depends on color alone.

const ICONS = {
  power:
    '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor"/>',
  life:
    '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z" fill="currentColor"/>',
  shield:
    '<path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Z" fill="currentColor"/>',
  science:
    '<path d="M9 2h6v2h-1v5l5 9a2 2 0 0 1-1.8 3H6.800A2 2 0 0 1 5 18l5-9V4H9V2Z" fill="currentColor"/>',
  star:
    '<path d="m12 2 2.9 6.300 6.900.800-5.100 4.700 1.400 6.800L12 17.200 5.900 20.600l1.400-6.800L2.200 9.100l6.900-.800L12 2Z" fill="currentColor"/>',
  sun:
    '<circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.200 4.200l2.100 2.100M17.700 17.700l2.100 2.100M4.200 19.800l2.100-2.100M17.700 6.300l2.100-2.100" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  moon:
    '<path d="M20 14.500A8.500 8.500 0 1 1 9.500 4a7 7 0 0 0 10.500 10.500Z" fill="currentColor"/>',
  lamp:
    '<path d="M9 21h6v-2H9v2Zm3-19a7 7 0 0 0-4 12.700V17h8v-2.300A7 7 0 0 0 12 2Z" fill="currentColor"/>',
  radio:
    '<path d="M4 9h16v11H4V9Zm3-6 10 4-.700 1.800L6.300 4.800 7 3Zm1 11a2.500 2.500 0 1 0 0 .010ZM13 12h5v2h-5v-2Zm0 4h5v2h-5v-2Z" fill="currentColor" fill-rule="evenodd"/>',
  sound:
    '<path d="M4 9v6h4l5 4V5L8 9H4Zm12.500-1.500v9a5 5 0 0 0 0-9Z" fill="currentColor"/>',
  mute:
    '<path d="M4 9v6h4l5 4V5L8 9H4Zm11.300.300 1.400-1.400L19 10.200l2.300-2.300 1.400 1.400-2.300 2.300 2.300 2.300-1.400 1.400L19 13l-2.300 2.300-1.400-1.400 2.300-2.300-2.300-2.300Z" fill="currentColor"/>',
  gear:
    '<path d="M12 8.500a3.500 3.500 0 1 0 0 7 3.500 3.500 0 0 0 0-7Zm9 5v-3l-2.300-.500a7 7 0 0 0-.800-1.800l1.300-2-2.100-2.100-2 1.300a7 7 0 0 0-1.800-.800L13 2h-3l-.500 2.300a7 7 0 0 0-1.800.800l-2-1.300L3.600 5.900l1.300 2a7 7 0 0 0-.800 1.800L2 10.500v3l2.300.500c.200.600.400 1.200.800 1.800l-1.300 2 2.100 2.100 2-1.300c.600.400 1.200.600 1.800.800L10 22h3l.500-2.300c.600-.200 1.200-.400 1.800-.800l2 1.300 2.100-2.100-1.300-2c.400-.600.600-1.200.800-1.800l2.100-.800Z" fill="currentColor" fill-rule="evenodd"/>',
  home:
    '<path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3L12 3Z" fill="currentColor"/>',
  check:
    '<path d="m5 12.500 4.500 4.500L19 7.500" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  alert:
    '<path d="M12 2 1 21h22L12 2Zm-1 7h2v6h-2V9Zm0 8h2v2h-2v-2Z" fill="currentColor" fill-rule="evenodd"/>',
  lock:
    '<path d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Zm2 0h6V7a3 3 0 0 0-6 0v3Z" fill="currentColor"/>',
  book:
    '<path d="M4 4h7a3 3 0 0 1 1 .200A3 3 0 0 1 13 4h7v15h-7a1 1 0 0 0-1 1 1 1 0 0 0-1-1H4V4Zm2 2v11h5V6H6Zm7 0v11h5V6h-5Z" fill="currentColor" fill-rule="evenodd"/>'
};

export function icon(name, className = "") {
  const body = ICONS[name] || ICONS.star;
  const classes = `icon icon-${name} ${className}`.trim();
  return `<svg class="${classes}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const ICON_NAMES = Object.keys(ICONS);
