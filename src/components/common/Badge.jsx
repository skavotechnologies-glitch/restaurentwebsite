import React from 'react';
import { Clock, CheckCircle2, FileText, Bell, ChefHat } from 'lucide-react';

export function OrderBillStatusBadge({ isBilled, isPaid, paymentStatus, paymentMethod, order }) {
  const paid = Boolean(isPaid || paymentStatus === 'paid' || order?.isPaid || order?.paymentStatus === 'paid');
  const billed = Boolean(isBilled ?? order?.isBilled);
  const method = paymentMethod || order?.paymentMethod;

  if (paid) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
        <span>Paid {method ? `(${method})` : ''}</span>
      </span>
    );
  }

  if (billed) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-800 border-blue-200">
        <ChefHat className="w-3.5 h-3.5 text-blue-600" />
        <span>Billed & In Kitchen</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-100 text-amber-900 border-amber-300 animate-pulse">
      <Bell className="w-3.5 h-3.5 text-amber-700" />
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
export function OrderStatusBadge(props) {
  return <OrderBillStatusBadge {...props} />;
}

export function PaymentStatusBadge(props) {
  return <OrderBillStatusBadge {...props} />;
}
