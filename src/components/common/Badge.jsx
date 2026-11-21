import React from 'react';
import { Clock, CheckCircle2, FileText, Bell } from 'lucide-react';

export function OrderBillStatusBadge({ isBilled }) {
  if (isBilled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-300">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Billed & In Kitchen</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-100 text-amber-900 border-amber-300 animate-pulse">
      <Bell className="w-3 h-3 text-amber-700" />
      <span>New Order (Pending Bill)</span>
    </span>
  );
}

export function WaitingTimeBadge({ minutes, size = 'sm' }) {
  const mins = Number(minutes) || 10;
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-lg border ${
      size === 'lg'
        ? 'px-3 py-1.5 text-sm bg-forest-50 text-forest-800 border-forest-200'
        : 'px-2 py-0.5 text-xs bg-amber-50 text-amber-800 border-amber-200'
    }`}>
      <Clock className={size === 'lg' ? 'w-4 h-4 text-forest-700' : 'w-3 h-3 text-amber-600'} />
      <span>{mins} mins prep</span>
    </span>
  );
}

// Backward compatible aliases
export function OrderStatusBadge({ status, isBilled }) {
  const billed = isBilled !== undefined ? isBilled : (status === 'completed' || status === 'served');
  return <OrderBillStatusBadge isBilled={billed} />;
}

export function PaymentStatusBadge() {
  return null; // Payments removed from customer and simplified to direct counter pay
}
