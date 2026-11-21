import React, { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  UtensilsCrossed, 
  Clock, 
  ArrowRight, 
  Phone,
  ChefHat,
  Receipt
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export default function CustomerOrderSuccessPage() {
  const { restaurantSlug = 'naachi-cafe', orderId } = useParams();
  const location = useLocation();
  const { restaurant, orders } = useRestaurant();

  const order = location.state?.order || orders.find(o => o.id === orderId);

  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  }, []);

  const currency = restaurant.billing?.currency || '₹';
  const waitMinutes = order?.estimatedWaitTime || 15;

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900 pb-16">
      {/* Top Banner */}
      <div className="bg-forest-700 text-white py-10 px-4 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto border-2 border-gold-400 shadow-inner">
            <CheckCircle className="w-9 h-9 text-gold-400 stroke-[2.5]" />
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white">
            Order Sent to Reception!
          </h1>
          <p className="text-forest-100 text-xs sm:text-sm">
            Received on the reception laptop &bull; Bill is being printed for kitchen
          </p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-5 space-y-4">
        {/* Waiting Time Display Card */}
        <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-elevated text-center space-y-4">
          <div className="flex items-center justify-between border-b border-cream-200 pb-3">
            <span className="text-xs text-charcoal-700/70 font-bold uppercase tracking-wider">Order No</span>
            <span className="font-mono font-bold text-base text-forest-800 bg-cream-100 px-2.5 py-1 rounded-md border border-cream-300">
              {order ? order.orderNumber : orderId}
            </span>
          </div>

          {/* Big Waiting Time Callout */}
          <div className="p-4 bg-forest-50 border-2 border-forest-200 rounded-2xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-forest-700 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-forest-700 animate-pulse" />
              <span>Estimated Waiting Time</span>
            </div>
            <div className="font-serif font-bold text-3xl text-forest-900">
              ~{waitMinutes} Minutes
            </div>
            <p className="text-xs text-forest-700/80">
              Your food is being freshly prepared for {order?.tableName || 'your table'}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-2 text-left bg-cream-50/80 p-3 rounded-xl border border-cream-200">
            <div>
              <span className="text-[11px] text-charcoal-700/60 font-semibold block">Dine-In Table</span>
              <span className="text-sm font-bold text-charcoal-900 flex items-center gap-1 mt-0.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-forest-700" />
                <span>{order?.tableName || 'Table'}</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] text-charcoal-700/60 font-semibold block">Customer</span>
              <span className="text-sm font-bold text-charcoal-900 truncate block mt-0.5">
                {order?.customerName || 'Customer'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
            💳 <strong>Pay Directly at Counter:</strong> Simply show this bill or quote {order?.orderNumber} when paying after your meal.
          </div>
        </div>

        {/* Ordered Items Breakdown */}
        {order?.items && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-cream-200 shadow-soft space-y-3">
            <h2 className="text-xs font-bold font-serif text-charcoal-900 uppercase tracking-wider border-b border-cream-200 pb-2">
              Itemized Bill ({order.items.length} items)
            </h2>

            <div className="space-y-2 text-xs">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-charcoal-700">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-semibold text-charcoal-900">
                      {item.quantity}x {item.itemName}
                    </div>
                    <div className="text-[10px] text-forest-700 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{item.prepTime || 10} mins prep</span>
                    </div>
                    {item.specialInstructions && (
                      <p className="text-[10px] text-charcoal-600 italic">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-charcoal-900">
                    {formatCurrency(item.lineTotal, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-cream-200 space-y-1 text-xs text-charcoal-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal, currency)}</span>
              </div>
              {order.taxDetails?.totalTax > 0 && (
                <div className="flex justify-between">
                  <span>Taxes (CGST + SGST)</span>
                  <span>{formatCurrency(order.taxDetails.totalTax, currency)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-sm font-bold text-charcoal-900 pt-2 border-t border-cream-200">
                <span className="font-serif">Total Bill to Pay</span>
                <span className="text-lg font-serif text-forest-800">
                  {formatCurrency(order.total, currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Link
            to={`/order/${orderId}`}
            className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>View Live Waiting Timer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to={`/r/${restaurantSlug}`}
            className="w-full py-2.5 px-4 bg-white hover:bg-cream-50 text-charcoal-800 rounded-xl font-semibold text-xs border border-cream-300 shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <span>Back to Digital Menu</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
