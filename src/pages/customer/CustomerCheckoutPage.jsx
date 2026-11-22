import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  UtensilsCrossed, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Lock 
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

export default function CustomerCheckoutPage() {
  const { restaurantSlug = 'naachi-cafe' } = useParams();
  const navigate = useNavigate();
  const { restaurant, tables, submitCustomerOrder } = useRestaurant();
  const { 
    cartItems, 
    totalItemCount, 
    tableInfo, 
    setTableInfo, 
    customerInfo, 
    setCustomerInfo, 
    addSessionOrder,
    clearCart, 
    calculateTotals 
  } = useCart();

  const [name, setName] = useState(customerInfo.name || '');
  const [phone, setPhone] = useState(customerInfo.phone || '');
  const [instructions, setInstructions] = useState(customerInfo.instructions || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const billingConfig = restaurant.billing || {};
  const totals = calculateTotals(billingConfig);
  const currency = billingConfig.currency || '₹';

  const validateForm = () => {
    if (!name.trim()) {
      return 'Please enter your name.';
    }
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return 'Please enter your mobile number.';
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return 'Please enter a valid 10-digit Indian mobile number.';
    }
    if (cartItems.length === 0) {
      return 'Your cart is empty.';
    }
    return null;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    setIsSubmitting(true);

    try {
      setCustomerInfo({
        name: name.trim(),
        phone: phone.trim(),
        instructions: instructions.trim()
      });

      const effectiveTable = tableInfo || (tables && tables.length > 0 ? tables[0] : { id: 'T01', name: 'Table 1' });

      // Submit order to reception laptop with calculated waiting time
      const result = await submitCustomerOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        tableId: effectiveTable.id,
        tableName: effectiveTable.name,
        items: cartItems,
        specialInstructions: instructions.trim()
      });

      if (result.success) {
        addSessionOrder(result.orderId);
        clearCart();
        navigate(`/r/${restaurantSlug}/order-success/${result.orderId}`, {
          state: { order: result.order }
        });
      } else {
        throw new Error(result.error || 'Failed to submit order. Please try again.');
      }
    } catch (err) {
      console.error('Order placement error:', err);
      setFormError(err.message || 'An unexpected error occurred while placing your order.');
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="font-serif font-bold text-xl text-charcoal-900 mb-2">Cart is empty</h2>
        <Link 
          to={`/r/${restaurantSlug}`}
          className="px-5 py-2.5 bg-forest-700 text-white rounded-xl text-sm font-semibold"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-cream-200 px-4 py-3 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link to={`/r/${restaurantSlug}/cart`} className="p-2 -ml-2 rounded-full hover:bg-cream-100 text-charcoal-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif font-bold text-lg leading-tight">Confirm & Send to Reception</h1>
            <p className="text-xs text-forest-700 font-medium">{restaurant.name} &bull; {tableInfo?.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Waiting Time Notice */}
        <div className="bg-forest-800 text-white rounded-2xl p-4 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gold-400" />
            <div>
              <span className="text-xs text-forest-200 block">Estimated Waiting Time</span>
              <span className="font-serif font-bold text-base text-white">
                ~{totals.estimatedOrderWaitTime || 10} Minutes
              </span>
            </div>
          </div>
          <span className="text-xs bg-forest-700 px-3 py-1 rounded-full text-gold-300 font-bold border border-forest-600">
            {tableInfo?.name}
          </span>
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{formError}</div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="space-y-4">
          {/* Customer Details */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-cream-200 shadow-soft space-y-4">
            <h2 className="text-sm font-bold font-serif text-charcoal-900 border-b border-cream-200 pb-2">
              Guest Details
            </h2>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Your Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-700/50" />
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  maxLength={50}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-charcoal-700/60">
                  +91
                </span>
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(cleaned);
                  }}
                  placeholder="98765 43210"
                  className="w-full pl-11 pr-3 py-2.5 text-sm bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1 flex items-center justify-between">
                <span>Dine-In Table</span>
                <span className="text-[11px] font-semibold text-forest-700 flex items-center gap-1 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200">
                  <Lock className="w-3 h-3 text-forest-700" />
                  <span>Locked to Table QR</span>
                </span>
              </label>
              <div className="flex items-center justify-between p-3 bg-forest-50/70 border border-forest-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-forest-700 text-gold-400 flex items-center justify-center font-bold">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-charcoal-600 block font-medium">Assigned Table</span>
                    <span className="text-sm font-bold text-forest-900">
                      {tableInfo?.name || (tables[0]?.name || 'Table 1')}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white text-forest-800 px-2.5 py-1 rounded-md border border-forest-300">
                  Fixed Table
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-forest-700" />
                <span>Special Instructions for Kitchen (Optional)</span>
              </label>
              <textarea 
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Serve hot, less spice in all items..."
                maxLength={150}
                className="w-full p-2.5 text-xs bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Items Summary Card */}
          <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-soft space-y-3">
            <div className="flex items-center justify-between border-b border-cream-200 pb-2">
              <span className="text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                Order Summary ({totalItemCount} Items)
              </span>
              <Link to={`/r/${restaurantSlug}/cart`} className="text-xs font-semibold text-forest-700 hover:underline">
                Edit
              </Link>
            </div>

            <div className="space-y-1 text-xs">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between py-1 text-charcoal-700">
                  <span className="truncate max-w-[200px]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-semibold text-charcoal-900">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-cream-200 space-y-1 text-xs text-charcoal-700/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal, currency)}</span>
              </div>
              {totals.totalTax > 0 && (
                <div className="flex justify-between">
                  <span>Taxes (CGST + SGST)</span>
                  <span>{formatCurrency(totals.totalTax, currency)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-sm font-bold text-charcoal-900 pt-1 border-t border-cream-200">
                <span className="font-serif">Total Bill</span>
                <span className="text-base font-serif text-forest-800">
                  {formatCurrency(totals.grandTotal, currency)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-charcoal-600 text-center font-medium bg-cream-50 p-2.5 rounded-xl border border-cream-200">
            Your order will show directly on the reception laptop. You can pay directly at the counter.
          </p>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded-xl shadow-elevated transition flex items-center justify-center gap-2 text-base active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending to Reception...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Send Order &bull; {formatCurrency(totals.grandTotal, currency)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
