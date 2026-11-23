import React, { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  UtensilsCrossed, 
  Clock, 
  ArrowRight, 
  Receipt,
  ShoppingBag,
  User,
  Phone,
  AlertCircle
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../utils/formatters';

export default function CustomerOrderSuccessPage() {
  const { restaurantSlug = 'naachi-cafe', orderId } = useParams();
  const location = useLocation();
  const { restaurant, orders } = useRestaurant();

  // Find strictly the single entered order
  const order = location.state?.order || orders.find(o => 
    o.id === orderId || 
    o.orderNumber?.toLowerCase() === orderId?.toLowerCase()
  );

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
  const waitMinutes = order?.estimatedWaitTime || 10;

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col justify-between text-charcoal-900">
        <header className="bg-white border-b border-cream-200 px-4 py-3 flex items-center gap-3">
          <Link to={`/r/${restaurantSlug}`} className="text-forest-700 font-bold text-sm">
            &larr; Back to Menu
          </Link>
        </header>

        <main className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-cream-200 text-charcoal-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="font-serif font-bold text-xl text-charcoal-900">Order Received!</h2>
          <p className="text-xs sm:text-sm text-charcoal-700/80">
            Your order #{orderId} has been registered at the counter.
          </p>
          <Link 
            to={`/order/${orderId}`}
            className="inline-block px-5 py-2.5 bg-forest-700 text-white rounded-xl text-xs font-bold"
          >
            Track Order Status
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900 pb-16">
      {/* Top Banner */}
      <div className="bg-forest-700 text-white py-8 px-4 text-center">
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto border-2 border-gold-400 shadow-inner">
            <CheckCircle className="w-8 h-8 text-gold-400 stroke-[2.5]" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-white">
            Order Sent to Kitchen!
          </h1>
          <p className="text-forest-100 text-xs sm:text-sm">
            Received on reception laptop &bull; Chef is preparing your dishes
          </p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-4 space-y-4">
        {/* Single Entered Order Bill Card */}
        <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-elevated space-y-4">
          {/* Table & Guest Header */}
          <div className="flex items-center justify-between border-b border-cream-200 pb-3">
            <div>
              <span className="text-[10px] text-charcoal-700/70 font-bold uppercase tracking-wider block">
                Order Ticket
              </span>
              <span className="font-serif font-bold text-base text-charcoal-900">
                {order.tableName} &bull; {order.customerName}
              </span>
            </div>
            <span className="font-mono text-xs font-bold bg-forest-50 text-forest-800 px-2.5 py-1 rounded-md border border-forest-200">
              {order.orderNumber}
            </span>
          </div>

          {/* Pay at Counter Callout */}
          <div className="p-4 bg-gradient-to-br from-forest-800 to-forest-900 text-white rounded-2xl text-center space-y-1 shadow-md">
            <span className="text-[11px] text-forest-200 font-semibold uppercase tracking-wider block">
              Bill Amount to Pay at Counter
            </span>
            <div className="font-serif font-bold text-3xl sm:text-4xl text-gold-400">
              {formatCurrency(order.total, currency)}
            </div>
            <p className="text-[11px] text-forest-100/90 pt-1">
              Show this bill at the counter after your meal. Pay via UPI, Cash, or Card.
            </p>
          </div>

          {/* Waiting Time Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
              <span className="font-bold text-amber-950">Estimated Prep Time</span>
            </div>
            <span className="font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-300">
              ~{waitMinutes} Mins
            </span>
          </div>

          {/* Strictly this order's dishes */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold font-serif text-charcoal-900 uppercase tracking-wider">
                Ordered Dishes ({order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0} items)
              </h2>
              <span className="text-[10px] text-forest-700 font-semibold bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200">
                Current Order
              </span>
            </div>

            <div className="divide-y divide-cream-100 text-xs">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center text-charcoal-800">
                  <div>
                    <span className="font-bold text-charcoal-900">{item.quantity}x {item.itemName}</span>
                    <div className="text-[10px] text-charcoal-500 flex items-center gap-1.5 mt-0.5">
                      <span>{item.quantity} &times; {formatCurrency(item.priceAtOrder || (item.lineTotal / (item.quantity || 1)), currency)}</span>
                      <span>&bull;</span>
                      <span className="text-forest-700">{item.prepTime || 10}m prep</span>
                    </div>
                  </div>
                  <span className="font-bold text-charcoal-900 font-serif">
                    {formatCurrency(item.lineTotal, currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill Totals Summary */}
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
                <span className="font-serif">Grand Total</span>
                <span className="text-lg font-serif text-forest-800">
                  {formatCurrency(order.total, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Link
            to={`/order/${order.id || orderId}`}
            className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>View Live Bill &amp; Kitchen Status</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to={`/r/${restaurantSlug}`}
            className="w-full py-2.5 px-4 bg-white hover:bg-cream-50 text-charcoal-800 rounded-xl font-semibold text-xs border border-cream-300 shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Additional Items</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
