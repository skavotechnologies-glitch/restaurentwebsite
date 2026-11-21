import React, { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  UtensilsCrossed, 
  Clock, 
  ArrowRight, 
  FileText, 
  Phone,
  ChefHat
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { OrderStatusBadge } from '../../components/common/Badge';

export default function CustomerOrderSuccessPage() {
  const { restaurantSlug = 'naachi-cafe', orderId } = useParams();
  const location = useLocation();
  const { restaurant, orders } = useRestaurant();

  // Try to find order from location state or from orders list
  const order = location.state?.order || orders.find(o => o.id === orderId);

  useEffect(() => {
    // Fire celebration confetti once upon mounting
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  }, []);

  const currency = restaurant.billing?.currency || '₹';

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900 pb-16">
      {/* Top Banner */}
      <div className="bg-forest-700 text-white py-10 px-4 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto border-2 border-gold-400 shadow-inner">
            <CheckCircle className="w-9 h-9 text-gold-400 stroke-[2.5]" />
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white">
            Order Placed Successfully!
          </h1>
          <p className="text-forest-100 text-xs sm:text-sm">
            Your order has been sent directly to the kitchen dashboard.
          </p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-5 space-y-4">
        {/* Order Identifier Card */}
        <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-elevated text-center space-y-3">
          <div className="flex items-center justify-between border-b border-cream-200 pb-3">
            <span className="text-xs text-charcoal-700/70 font-bold uppercase tracking-wider">Order No</span>
            <span className="font-mono font-bold text-base text-forest-800 bg-cream-100 px-2.5 py-1 rounded-md border border-cream-300">
              {order ? order.orderNumber : orderId}
            </span>
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

          {/* Status Banner */}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Current Status:</span>
            </div>
            <OrderStatusBadge status={order?.orderStatus || 'pending'} />
          </div>

          <p className="text-xs text-charcoal-700/70 text-center">
            {order?.orderStatus === 'pending'
              ? 'Status: Pending confirmation by restaurant reception'
              : `Status: ${order?.orderStatus?.toUpperCase()}`}
          </p>
        </div>

        {/* Ordered Items Breakdown */}
        {order?.items && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-cream-200 shadow-soft space-y-3">
            <h2 className="text-xs font-bold font-serif text-charcoal-900 uppercase tracking-wider border-b border-cream-200 pb-2">
              Order Receipt ({order.items.length} items)
            </h2>

            <div className="space-y-2 text-xs">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-charcoal-700">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-semibold text-charcoal-900">
                      {item.quantity}x {item.itemName}
                    </span>
                    {item.specialInstructions && (
                      <p className="text-[10px] text-forest-700 italic">
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
              {order.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge</span>
                  <span>{formatCurrency(order.serviceCharge, currency)}</span>
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
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Link
            to={`/order/${orderId}`}
            className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <ChefHat className="w-4 h-4" />
            <span>Track Live Order Status</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to={`/r/${restaurantSlug}`}
            className="w-full py-2.5 px-4 bg-white hover:bg-cream-50 text-charcoal-800 rounded-xl font-semibold text-xs border border-cream-300 shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <span>Back to Digital Menu</span>
          </Link>
        </div>

        {/* Restaurant Contact Help */}
        {restaurant.phone && (
          <div className="text-center pt-2">
            <a 
              href={`tel:${restaurant.phone}`}
              className="inline-flex items-center gap-1.5 text-xs text-forest-700 hover:underline font-semibold"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Need help? Call {restaurant.name}</span>
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
