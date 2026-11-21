import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  UtensilsCrossed, 
  Clock, 
  ChefHat, 
  Receipt,
  Phone,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export default function CustomerOrderTrackingPage() {
  const { orderId } = useParams();
  const { restaurant, orders, activeSlug } = useRestaurant();

  const order = orders.find(o => 
    o.id === orderId || 
    o.orderNumber?.toLowerCase() === orderId?.toLowerCase()
  );

  // Live countdown timer calculation based on readyAt timestamp
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (!order?.readyAt) return (order?.estimatedWaitTime || 15) * 60;
    const diff = Math.floor((new Date(order.readyAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!order) return;
    const interval = setInterval(() => {
      if (order.readyAt) {
        const diff = Math.floor((new Date(order.readyAt).getTime() - Date.now()) / 1000);
        setSecondsRemaining(Math.max(0, diff));
      } else {
        setSecondsRemaining(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  const currency = restaurant.billing?.currency || '₹';

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col justify-between text-charcoal-900">
        <header className="bg-white border-b border-cream-200 px-4 py-3 flex items-center gap-3">
          <Link to={`/r/${activeSlug}`} className="p-2 -ml-2 rounded-full hover:bg-cream-100 text-charcoal-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif font-bold text-lg">Order Details</h1>
        </header>

        <main className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-cream-200 text-charcoal-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="font-serif font-bold text-xl text-charcoal-900">Order Not Found</h2>
          <p className="text-xs sm:text-sm text-charcoal-700/80">
            We couldn't locate order reference "{orderId}".
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

  const minsRemaining = Math.floor(secondsRemaining / 60);
  const secsRemaining = secondsRemaining % 60;

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
              <h1 className="font-serif font-bold text-lg leading-tight">Live Waiting Time</h1>
              <p className="text-xs text-forest-700 font-semibold">{order.orderNumber} &bull; {order.tableName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Waiting Time Countdown Display */}
        <div className="bg-forest-800 text-white rounded-2xl p-6 shadow-elevated text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-forest-700 border-2 border-gold-400 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-7 h-7 text-gold-400 animate-spin" />
          </div>

          <div>
            <span className="text-xs text-forest-200 font-medium uppercase tracking-wider block">Estimated Remaining Time</span>
            <div className="font-serif font-bold text-4xl text-white mt-1">
              {secondsRemaining > 0 ? (
                <span>{minsRemaining}m {secsRemaining.toString().padStart(2, '0')}s</span>
              ) : (
                <span className="text-gold-300">Any Moment Now!</span>
              )}
            </div>
          </div>

          <p className="text-xs text-forest-100/80 max-w-xs mx-auto">
            Order received on reception laptop. Chef is preparing your items.
          </p>

          <div className="pt-2 border-t border-forest-700 flex justify-between text-xs text-forest-200">
            <span>Table: <strong>{order.tableName}</strong></span>
            <span>Guest: <strong>{order.customerName}</strong></span>
          </div>
        </div>

        {/* Ordered Dishes with individual prep times */}
        <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-soft space-y-3">
          <h2 className="text-xs font-bold font-serif text-charcoal-900 uppercase tracking-wider border-b border-cream-200 pb-2">
            Dishes & Preparation Times
          </h2>

          <div className="divide-y divide-cream-100 text-xs">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-charcoal-900">{item.quantity}x {item.itemName}</span>
                  <div className="text-[11px] text-forest-700 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{item.prepTime || 10} mins dish waiting time</span>
                  </div>
                </div>
                <span className="font-bold text-charcoal-900">{formatCurrency(item.lineTotal, currency)}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-cream-200 flex justify-between font-bold text-sm text-charcoal-900">
            <span className="font-serif">Total Bill</span>
            <span className="font-serif text-forest-800 text-base">{formatCurrency(order.total, currency)}</span>
          </div>
        </div>

        {/* Direct Payment Note */}
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-amber-700" />
            <span>Pay Directly at Counter</span>
          </div>
          <p className="text-amber-800">
            Please show your bill or quote <strong>{order.orderNumber}</strong> at the reception counter to pay directly via Cash, UPI, or Card after dining.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <Link
            to={`/r/${activeSlug}`}
            className="w-full py-2.5 px-4 bg-white hover:bg-cream-50 text-charcoal-800 rounded-xl font-semibold text-xs border border-cream-300 shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <span>Order Additional Items</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
