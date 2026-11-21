import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  UtensilsCrossed, 
  MessageSquare, 
  ShieldCheck, 
  Loader2,
  CheckCircle2,
  AlertCircle
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

  // Validation
  const validateForm = () => {
    if (!name.trim()) {
      return 'Please enter your full name.';
    }
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return 'Please enter your mobile number.';
    }
    // Indian 10-digit mobile number starting with 6, 7, 8, or 9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).';
    }
    if (!tableInfo || !tableInfo.id) {
      return 'Please select your dine-in table.';
    }
    if (cartItems.length === 0) {
      return 'Your cart is empty. Please add items to proceed.';
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
      // Save customer info for reuse
      setCustomerInfo({
        name: name.trim(),
        phone: phone.trim(),
        instructions: instructions.trim()
      });

      // Submit order to RestaurantContext with server-level price snapshot validation
      const result = await submitCustomerOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        tableId: tableInfo.id,
        tableName: tableInfo.name,
        items: cartItems,
        specialInstructions: instructions.trim()
      });

      if (result.success) {
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
            <h1 className="font-serif font-bold text-lg leading-tight">Confirm & Place Order</h1>
            <p className="text-xs text-forest-700 font-medium">{restaurant.name} &bull; Dine-In</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Error Alert if any */}
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{formError}</div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="space-y-4">
          {/* Customer Details Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-cream-200 shadow-soft space-y-4">
            <h2 className="text-sm font-bold font-serif text-charcoal-900 border-b border-cream-200 pb-2 flex items-center justify-between">
              <span>Customer Information</span>
              <span className="text-[11px] font-sans font-normal text-charcoal-700/60">No account required</span>
            </h2>

            {/* Name */}
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

            {/* Mobile Number */}
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
              <p className="text-[10px] text-charcoal-700/60 mt-1">
                Used by restaurant staff for order verification and updates.
              </p>
            </div>

            {/* Table Confirmation */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">
                Dine-In Table <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UtensilsCrossed className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-700/50" />
                <select
                  value={tableInfo?.id || ''}
                  onChange={(e) => {
                    const selected = tables.find(t => t.id === e.target.value);
                    if (selected) {
                      setTableInfo({
                        id: selected.id,
                        name: selected.name,
                        tableNumber: selected.tableNumber
                      });
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2.5 text-sm bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-semibold text-charcoal-900"
                >
                  <option value="" disabled>-- Select Table --</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Overall Order Instructions */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-forest-700" />
                <span>Special Instructions for the Kitchen (Optional)</span>
              </label>
              <textarea 
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Please serve drinks first, less spice in all items..."
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
              {totals.serviceChargeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge</span>
                  <span>{formatCurrency(totals.serviceChargeAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-sm font-bold text-charcoal-900 pt-1 border-t border-cream-200">
                <span className="font-serif">Total to Pay</span>
                <span className="text-base font-serif text-forest-800">
                  {formatCurrency(totals.grandTotal, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Notice */}
          <div className="p-3 bg-cream-50 border border-cream-300 rounded-xl flex items-center gap-2.5 text-xs text-charcoal-700">
            <ShieldCheck className="w-5 h-5 text-forest-700 flex-shrink-0" />
            <span>Pay directly at the counter or to your server after your meal via Cash, UPI, or Card.</span>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded-xl shadow-elevated transition flex items-center justify-center gap-2 text-base active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Order to Restaurant...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Place Order &bull; {formatCurrency(totals.grandTotal, currency)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
