/** Formats a number as Philippine pesos, e.g. `1234.5` -> `₱1,234.50`. */
export function formatPeso(value: number) {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Formats an ISO timestamp as `24 Oct · 2:48 PM`. */
export function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} · ${hours}:${minutes} ${meridiem}`;
}

/** Formats an ISO timestamp as a clock time, e.g. `1:30 PM`. */
export function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${meridiem}`;
}

/**
 * Builds a demo ticket number, e.g. `PJA-DEMO-251024-0837`.
 * Format: PJA-DEMO-{YY}{MM}{DD}-{NNNN}.
 */
export function formatTicketNumber(date = new Date(), sequence = 1) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(Math.max(1, sequence)).padStart(4, '0');
  return `PJA-DEMO-${yy}${mm}${dd}-${seq}`;
}
