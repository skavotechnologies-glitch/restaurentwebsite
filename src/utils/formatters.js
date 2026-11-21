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

export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    description: 'Order placed, awaiting confirmation'
  },
  accepted: {
    label: 'Accepted',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dot: 'bg-blue-500',
    description: 'Order confirmed by kitchen'
  },
  preparing: {
    label: 'Preparing',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
    description: 'Chef is preparing your meal'
  },
  ready: {
    label: 'Ready',
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-300',
    dot: 'bg-teal-500',
    description: 'Food is ready for serving'
  },
  served: {
    label: 'Served',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
    description: 'Served on table'
  },
  completed: {
    label: 'Completed',
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
    dot: 'bg-gray-500',
    description: 'Order settled and completed'
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
    description: 'Order was cancelled'
  }
};

export const PAYMENT_STATUS_CONFIG = {
  unpaid: {
    label: 'Unpaid',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200'
  },
  'partially-paid': {
    label: 'Partial',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  }
};
