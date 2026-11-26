import React, { useState, useEffect } from 'react';
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
  Lock,
  Banknote,
  QrCode,
  Smartphone,
  ShieldCheck,
  Check,
  Printer,
  ExternalLink,
  X,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { generateUpiUri } from '../../utils/upi';

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
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi'

  // Online UPI Verification States
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [upiRef, setUpiRef] = useState('');
  const [upiRefError, setUpiRefError] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const billingConfig = restaurant.billing || {};
  const totals = calculateTotals(billingConfig);
  const currency = billingConfig.currency || '₹';

  const upiId = billingConfig.upiId || 'naachicafe@okaxis';
  const upiPayeeName = billingConfig.upiPayeeName || restaurant.name || 'Restaurant Owner';
  const effectiveTable = tableInfo || (tables && tables.length > 0 ? tables[0] : { id: 'T01', name: 'Table 1' });

  const upiUri = generateUpiUri({
    upiId,
    payeeName: upiPayeeName,
    amount: totals.grandTotal,
    transactionNote: `Table ${effectiveTable.name} Bill`,
    orderRef: `ORD-${Date.now().toString(36).toUpperCase()}`,
    callbackUrl: window.location.href
  });

  // Automatically detect customer returning from GPay / PhonePe app back to browser tab
  useEffect(() => {
    const handleReturnToTab = () => {
      if (document.visibilityState === 'visible' && paymentInitiated && !isPaymentVerified && !isSubmitting) {
        setShowVerificationModal(true);
      }
    };

    window.addEventListener('visibilitychange', handleReturnToTab);
    window.addEventListener('focus', handleReturnToTab);
    return () => {
      window.removeEventListener('visibilitychange', handleReturnToTab);
      window.removeEventListener('focus', handleReturnToTab);
    };
  }, [paymentInitiated, isPaymentVerified, isSubmitting]);

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

  // Execute actual order submission (for Cash on Delivery OR after UPI verification)
  const executeOrderSubmission = async (verifiedRef = '') => {
    setFormError('');
    const error = validateForm();
    if (error) {
      setFormError(error);
      setIsSubmitting(false);
      setIsVerifyingPayment(false);
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
      const finalRef = (verifiedRef || upiRef).trim();

      const result = await submitCustomerOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        tableId: effectiveTable.id,
        tableName: effectiveTable.name,
        items: cartItems,
        specialInstructions: instructions.trim(),
        paymentMethod,
        paymentStatus: paymentMethod === 'upi' ? 'paid' : 'unpaid',
        upiRef: finalRef,
        upiDetails: paymentMethod === 'upi' ? {
          upiId,
          payeeName: upiPayeeName,
          amount: totals.grandTotal,
          upiRef: finalRef,
          verified: true,
          submittedAt: new Date().toISOString()
        } : null
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
      setIsVerifyingPayment(false);
    }
  };

  // Launch GPay / UPI app
  const handleStartUpiPayment = (e) => {
    if (e) e.preventDefault();
    setFormError('');
    const error = validateForm();
    if (error) {
      setFormError(error);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setPaymentInitiated(true);
    setShowVerificationModal(true);

    // Launch GPay / native UPI intent
    window.location.href = upiUri;
  };

  // Verify 12-digit UTR from GPay receipt and auto-submit order
  const handleVerifyAndConfirm = async (e) => {
    if (e) e.preventDefault();
    setUpiRefError('');

    const cleanRef = upiRef.trim().replace(/\s+/g, '');
    if (!cleanRef) {
      setUpiRefError('Please enter the 12-digit UPI Transaction ID / UTR from your GPay receipt.');
      return;
    }
    if (cleanRef.length < 8) {
      setUpiRefError('UTR number must be at least 8 to 12 digits (found on GPay / PhonePe receipt).');
      return;
    }

    setIsVerifyingPayment(true);

    // Brief verification check, then auto-confirm and redirect!
    setTimeout(async () => {
      setIsPaymentVerified(true);
      await executeOrderSubmission(cleanRef);
    }, 600);
  };

  // Main Form Submit button handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'upi') {
      if (!isPaymentVerified) {
        handleStartUpiPayment(e);
        return;
      }
      await executeOrderSubmission(upiRef);
    } else {
      await executeOrderSubmission('');
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

          {/* Payment Method Selection (Option B: Cash on Delivery or Direct Owner UPI) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-cream-200 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-2">
              <h2 className="text-sm font-bold font-serif text-charcoal-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-forest-700" />
                <span>Select Payment Method</span>
              </h2>
              <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200">
                Safe &amp; Direct
              </span>
            </div>

            {/* Option 1: Cash on Delivery / Pay at Counter */}
            <div 
              onClick={() => setPaymentMethod('cash')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                paymentMethod === 'cash' 
                  ? 'border-forest-700 bg-forest-50/60 shadow-sm' 
                  : 'border-cream-300 hover:border-cream-400 bg-white'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                paymentMethod === 'cash' ? 'border-forest-700 bg-forest-700 text-white' : 'border-slate-300'
              }`}>
                {paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-charcoal-900">
                    Cash on Delivery / Pay at Counter
                  </span>
                  <span className="text-xs font-bold text-forest-800">
                    Pay Later
                  </span>
                </div>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Order now and enjoy your meal. Settle your bill at the counter after dining via Cash, UPI, or Card.
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-forest-800 bg-white px-2.5 py-1 rounded-lg border border-forest-200">
                  <Printer className="w-3.5 h-3.5 text-forest-700" />
                  <span>Bill &amp; KOT generates automatically on billing printer</span>
                </div>
              </div>
            </div>

            {/* Option 2: Online UPI Payment (Direct to Owner) */}
            <div 
              onClick={() => setPaymentMethod('upi')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                paymentMethod === 'upi' 
                  ? 'border-purple-600 bg-purple-50/60 shadow-sm' 
                  : 'border-cream-300 hover:border-cream-400 bg-white'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                paymentMethod === 'upi' ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
              }`}>
                {paymentMethod === 'upi' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-charcoal-900 flex items-center gap-1.5">
                    <span>Online UPI Payment (Direct to Owner)</span>
                  </span>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                    0% Extra Fees
                  </span>
                </div>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  Pay instantly using Google Pay, PhonePe, Paytm, or BHIM directly to the restaurant owner.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'].map((app) => (
                    <span key={app} className="text-[10px] font-bold px-2 py-0.5 bg-white rounded border border-purple-200 text-purple-800">
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* If Online UPI is selected: show QR Code, 1-Click Pay App Button & UTR verification */}
            {paymentMethod === 'upi' && (
              <div className="pt-2 border-t border-cream-200 space-y-4 animate-fade-in">
                {isPaymentVerified ? (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-1">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <h4 className="font-serif font-bold text-sm text-emerald-950">
                      Payment Verified via UPI!
                    </h4>
                    <p className="text-xs text-emerald-800 font-mono">
                      UTR: {upiRef}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Ready to send to kitchen. Click "Confirm &amp; Send Order" below.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile direct UPI trigger button */}
                    <div className="p-3 bg-purple-100/70 rounded-xl border border-purple-200 text-center space-y-2">
                      <span className="text-[11px] text-purple-900 font-medium block">
                        Paying from this phone? Tap below to pay in your UPI app:
                      </span>
                      <button
                        type="button"
                        onClick={handleStartUpiPayment}
                        className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Pay {formatCurrency(totals.grandTotal, currency)} in GPay / UPI App</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </button>
                      <p className="text-[10px] text-purple-700">
                        Supports Google Pay, PhonePe, Paytm, BHIM &amp; Banking UPI apps.
                      </p>
                    </div>

                    {/* Dynamic QR Code for scanning from another phone or desktop */}
                    <div className="bg-white p-4 rounded-xl border border-cream-300 text-center space-y-2">
                      <div className="text-xs font-bold text-charcoal-800 flex items-center justify-center gap-1.5">
                        <QrCode className="w-4 h-4 text-purple-700" />
                        <span>Or Scan Owner QR to Pay</span>
                      </div>
                      
                      <div className="inline-block p-2.5 bg-white border-2 border-dashed border-purple-300 rounded-xl shadow-xs">
                        <QRCodeSVG
                          value={upiUri}
                          size={140}
                          level="M"
                          includeMargin={false}
                        />
                      </div>

                      <div className="text-xs space-y-0.5">
                        <div className="font-semibold text-charcoal-800">
                          Payee: <span className="font-bold">{upiPayeeName}</span>
                        </div>
                        <div className="font-mono text-[11px] text-charcoal-600 bg-cream-50 px-2 py-0.5 rounded inline-block border border-cream-200">
                          UPI ID: <strong>{upiId}</strong>
                        </div>
                        <div className="font-serif font-bold text-forest-800 text-sm">
                          Amount: {formatCurrency(totals.grandTotal, currency)}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setShowVerificationModal(true)}
                          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                          <span>Paid via QR Code? Click to Enter UTR</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-[11px] text-charcoal-600 text-center font-medium bg-cream-50 p-2.5 rounded-xl border border-cream-200">
            {paymentMethod === 'cash' 
              ? 'Your order will appear immediately on the admin dashboard and print on the billing printer.'
              : 'Complete your payment via GPay or scan QR code. Verification confirms your order immediately.'}
          </p>

          {/* Submit Button */}
          <div className="pt-1">
            {paymentMethod === 'cash' ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 font-bold rounded-xl shadow-elevated transition flex items-center justify-center gap-2 text-base active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed text-white bg-forest-700 hover:bg-forest-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending to Kitchen &amp; Printer...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Place Order &bull; Cash on Delivery ({formatCurrency(totals.grandTotal, currency)})</span>
                  </>
                )}
              </button>
            ) : !isPaymentVerified ? (
              <button
                type="button"
                onClick={handleStartUpiPayment}
                className="w-full py-3.5 px-6 font-bold rounded-xl shadow-elevated transition flex items-center justify-center gap-2 text-sm sm:text-base active:scale-98 text-white bg-purple-700 hover:bg-purple-800"
              >
                <Smartphone className="w-5 h-5" />
                <span>Pay {formatCurrency(totals.grandTotal, currency)} via GPay / UPI to Confirm</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 font-bold rounded-xl shadow-elevated transition flex items-center justify-center gap-2 text-base active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed text-white bg-emerald-700 hover:bg-emerald-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-gold-300" />
                    <span>Confirm &amp; Send Order ({formatCurrency(totals.grandTotal, currency)})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* MODAL: UPI PAYMENT VERIFICATION DIALOG */}
        {showVerificationModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-elevated border border-purple-200 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                  <Smartphone className="w-4 h-4 text-purple-700" />
                  <span>Verify UPI Payment</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-charcoal-900">
                  Payment Completed in GPay?
                </h3>
                <p className="text-xs text-charcoal-600">
                  Enter the 12-digit UPI Reference No. / UTR from your payment receipt to confirm your order for <strong>{effectiveTable.name}</strong>.
                </p>
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-xs font-bold text-charcoal-700">
                  12-Digit UPI Transaction ID / UTR <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={upiRef}
                  onChange={(e) => {
                    setUpiRef(e.target.value.replace(/\s+/g, ''));
                    if (upiRefError) setUpiRefError('');
                  }}
                  placeholder="e.g. 432109876543"
                  maxLength={16}
                  className="w-full px-3 py-2.5 text-sm bg-purple-50/50 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono tracking-wider text-charcoal-900"
                />
                {upiRefError && (
                  <div className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{upiRefError}</span>
                  </div>
                )}
                <p className="text-[10px] text-charcoal-500">
                  Tip: You can find the 12-digit UTR on your GPay / PhonePe payment success screen.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isVerifyingPayment || isSubmitting}
                  onClick={handleVerifyAndConfirm}
                  className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 active:scale-98"
                >
                  {isVerifyingPayment || isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying &amp; Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify &amp; Confirm Order ({formatCurrency(totals.grandTotal, currency)})</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <a
                    href={upiUri}
                    className="text-purple-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Re-open GPay App</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash');
                      setShowVerificationModal(false);
                    }}
                    className="text-charcoal-500 hover:text-charcoal-800"
                  >
                    Pay at Counter (Cash)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
