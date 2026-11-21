import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  UtensilsCrossed, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Check, 
  Phone,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { OrderStatusBadge } from '../../components/common/Badge';

const STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Received by restaurant', icon: Clock },
  { key: 'accepted', label: 'Confirmed', desc: 'Order accepted by staff', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', desc: 'In the kitchen / brew bar', icon: ChefHat },
  { key: 'ready', label: 'Ready', desc: 'Packed / plated for serving', icon: UtensilsCrossed },
  { key: 'served', label: 'Served', desc: 'Served at your table', icon: Check },
  { key: 'completed', label: 'Completed', desc: 'Bill settled & finished', icon: CheckCircle2 }
];

export default function CustomerOrderTrackingPage() {
  const { orderId } = useParams();
  const { restaurant, orders, activeSlug } = useRestaurant();

  // Look up order by id or orderNumber
  const order = orders.find(o => 
    o.id === orderId || 
    o.orderNumber?.toLowerCase() === orderId?.toLowerCase()
  );

  const currency = restaurant.billing?.currency || '₹';

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col justify-between text-charcoal-900">
        <header className="bg-white border-b border-cream-200 px-4 py-3 flex items-center gap-3">
          <Link to={`/r/${activeSlug}`} className="p-2 -ml-2 rounded-full hover:bg-cream-100 text-charcoal-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif font-bold text-lg">Order Tracking</h1>
        </header>

        <main className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-cream-200 text-charcoal-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="font-serif font-bold text-xl text-charcoal-900">Order Not Found</h2>
          <p className="text-xs sm:text-sm text-charcoal-700/80">
            We couldn't locate order reference "{orderId}". It may have expired or belongs to another session.
          </p>
          <Link 
            to={`/r/${activeSlug}`}
            className="inline-block px-5 py-2.5 bg-forest-700 text-white rounded-xl text-xs font-bold"
          >
            Return to Menu
          </Link>
        </main>
      </div>
    );
  }

  const currentStatusIndex = STEPS.findIndex(s => s.key === order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-cream-200 px-4 py-3 shadow-sm sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/r/${activeSlug}`} className="p-2 -ml-2 rounded-full hover:bg-cream-100 text-charcoal-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-serif font-bold text-lg leading-tight">Order Status</h1>
              <p className="text-xs text-forest-700 font-semibold">{order.orderNumber} &bull; {order.tableName}</p>
            </div>
          </div>

          <OrderStatusBadge status={order.orderStatus} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Estimated Time & Table Hero */}
        <div className="bg-forest-700 text-white rounded-2xl p-4 sm:p-5 shadow-elevated">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-forest-100 font-medium block">Table Seating</span>
              <span className="text-xl font-bold font-serif text-white">{order.tableName}</span>
            </div>

            <div className="text-right">
              <span className="text-xs text-forest-100 font-medium block">Estimated Prep Time</span>
              <span className="text-sm font-bold text-gold-400">
                {restaurant.estimatedPrepTime || '15-20 mins'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-forest-600/60 flex items-center justify-between text-xs text-forest-100">
            <span>Ordered at {formatDateTime(order.createdAt)}</span>
            <span className="flex items-center gap-1 text-gold-400 font-semibold">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Live tracking</span>
            </span>
          </div>
        </div>

        {/* Live Timeline */}
        <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-soft">
          <h2 className="text-sm font-bold font-serif text-charcoal-900 border-b border-cream-200 pb-3 mb-4">
            Preparation Progress
          </h2>

          {isCancelled ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-1">
              <span className="font-bold text-rose-800 text-sm">Order Cancelled</span>
              <p className="text-xs text-rose-700">
                This order was cancelled by restaurant management. Please check with staff.
              </p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cream-300">
              {STEPS.map((step, idx) => {
                const IconComponent = step.icon;
                const isPassed = currentStatusIndex >= idx;
                const isCurrent = currentStatusIndex === idx;

                return (
                  <div key={step.key} className="relative flex items-start gap-4">
                    {/* Step Icon circle */}
                    <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-forest-700 text-white ring-4 ring-forest-100 scale-110 shadow-md'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-cream-200 text-charcoal-600'
                    }`}>
                      <IconComponent className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-baseline justify-between">
                        <span className={`text-xs font-bold ${
                          isCurrent ? 'text-forest-800 font-serif text-sm' : isPassed ? 'text-charcoal-900' : 'text-charcoal-700/60'
                        }`}>
                          {step.label}
                        </span>

                        {isCurrent && (
                          <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200 animate-pulse">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-charcoal-700/70 mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Items & Bill Details */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-cream-200 shadow-soft space-y-3">
          <h2 className="text-xs font-bold font-serif text-charcoal-900 uppercase tracking-wider border-b border-cream-200 pb-2">
            Items in this order ({order.items.length})
          </h2>

          <div className="space-y-1.5 text-xs text-charcoal-700">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-1">
                <span>{item.quantity}x {item.itemName}</span>
                <span className="font-semibold text-charcoal-900">{formatCurrency(item.lineTotal, currency)}</span>
              </div>
            ))}

            <div className="pt-2 border-t border-cream-200 flex justify-between font-bold text-sm text-charcoal-900">
              <span className="font-serif">Total Amount</span>
              <span className="font-serif text-forest-800">{formatCurrency(order.total, currency)}</span>
            </div>

            <div className="pt-1 text-[11px] text-charcoal-700/70 flex justify-between">
              <span>Payment:</span>
              <span className="font-semibold capitalize">{order.paymentStatus} ({order.paymentMethod || 'Pay at Counter'})</span>
            </div>
          </div>
        </div>

        {/* Support & Actions */}
        <div className="space-y-2 pt-2">
          <Link
            to={`/r/${activeSlug}`}
            className="w-full py-2.5 px-4 bg-white hover:bg-cream-50 text-charcoal-800 rounded-xl font-semibold text-xs border border-cream-300 shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <span>Order More Items</span>
          </Link>

          {restaurant.phone && (
            <div className="text-center pt-2">
              <a 
                href={`tel:${restaurant.phone}`}
                className="inline-flex items-center gap-1.5 text-xs text-forest-700 hover:underline font-semibold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Restaurant Server ({restaurant.phone})</span>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
