import { format, parseISO } from 'date-fns';

export function formatCurrency(amount, symbol = '₹') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol}0.00`;
  }
  return `${symbol}${Number(amount).toFixed(2)}`;
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return format(date, 'dd MMM yyyy, hh:mm a');
  } catch (e) {
    return String(dateInput);
  }
}

export function formatTime(dateInput) {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return format(date, 'hh:mm a');
  } catch (e) {
    return String(dateInput);
  }
}

export function formatDate(dateInput) {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return format(date, 'dd MMM yyyy');
  } catch (e) {
    return String(dateInput);
  }
}

export function formatWaitTime(minutes) {
  const mins = Number(minutes) || 10;
  if (mins < 60) {
    return `${mins} mins`;
  }
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}
