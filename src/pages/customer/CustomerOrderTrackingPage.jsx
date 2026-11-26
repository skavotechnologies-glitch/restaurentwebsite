import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  UtensilsCrossed, 
  Clock, 
  Receipt,
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  Layers,
  ChevronRight,
  Banknote,
  Smartphone,
  ShieldCheck,
  QrCode,
  Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { generateUpiUri } from '../../utils/upi';

export default function CustomerOrderTrackingPage() {
  const { orderId } = useParams();
  const { restaurant, orders, activeSlug } = useRestaurant();
  const { sessionOrderIds, clearSessionOrders } = useCart();

  // Find direct order from URL parameter
  const directOrder = useMemo(() => {
    return orders.find(o => 
      o.id === orderId || 
      o.orderNumber?.toLowerCase() === orderId?.toLowerCase()
    );
  }, [orders, orderId]);

  // Find all orders belonging to THIS customer's session (Round 1, Round 2, etc.)
  const customerSessionOrders = useMemo(() => {
    const matched = orders.filter(o => {
      // 1. Matches this browser's session order IDs
      if (sessionOrderIds && sessionOrderIds.includes(o.id)) return true;
      if (sessionOrderIds && sessionOrderIds.includes(o.orderNumber)) return true;

      // 2. Matches the table and customer identity of the direct order
      if (directOrder) {
        const sameTable = o.tableId === directOrder.tableId || 
          (o.tableName && directOrder.tableName && o.tableName.toLowerCase() === directOrder.tableName.toLowerCase());
        const cleanOPhone = (o.customerPhone || '').replace(/\D/g, '');
        const cleanDPhone = (directOrder.customerPhone || '').replace(/\D/g, '');
        const samePhone = cleanOPhone && cleanDPhone && cleanOPhone === cleanDPhone;
        const sameName = o.customerName && directOrder.customerName && 
          o.customerName.toLowerCase().trim() === directOrder.customerName.toLowerCase().trim();
        return sameTable && (samePhone || sameName);
      }
      return false;
    });

    // Sort chronologically (Round 1 = oldest, Round 2 = reorder, etc.)
    return matched.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [orders, sessionOrderIds, directOrder]);

  // Active dining rounds for this customer (session not yet settled/closed by admin)
  const activeRounds = useMemo(() => {
    return customerSessionOrders.filter(o => 
      !o.isSettled && o.status !== 'settled' && o.status !== 'archived'
    );
  }, [customerSessionOrders]);

  // Check if all customer orders in this session have been settled/cleared by admin
  const isPaid = activeRounds.length === 0 && customerSessionOrders.length > 0 && 
    customerSessionOrders.every(o => o.isSettled || o.status === 'settled' || o.status === 'archived');

  // Merged totals across all active rounds
  const mergedTotal = useMemo(() => {
    return activeRounds.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [activeRounds]);

  const mergedSubtotal = useMemo(() => {
    return activeRounds.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  }, [activeRounds]);

  const mergedTax = useMemo(() => {
    return activeRounds.reduce((sum, o) => sum + (o.taxDetails?.totalTax || 0), 0);
  }, [activeRounds]);

  const totalDishesCount = useMemo(() => {
    return activeRounds.reduce((sum, o) => sum + (o.items?.reduce((c, i) => c + (i.quantity || 1), 0) || 0), 0);
  }, [activeRounds]);

  // Reference details (Table & Customer name)
  const displayTable = activeRounds[0]?.tableName || customerSessionOrders[0]?.tableName || directOrder?.tableName || 'Your Table';
  const displayCustomer = activeRounds[0]?.customerName || customerSessionOrders[0]?.customerName || directOrder?.customerName || 'Guest';

  const primaryOrder = activeRounds[0] || customerSessionOrders[0] || directOrder;
  const isUpiOrder = activeRounds.some(o => o.paymentMethod === 'upi') || primaryOrder?.paymentMethod === 'upi';
  const upiRef = activeRounds.find(o => o.upiRef)?.upiRef || primaryOrder?.upiRef;
  const upiId = restaurant.billing?.upiId || 'palanikathirvel05@okaxis';
  const upiPayeeName = restaurant.billing?.upiPayeeName || restaurant.name || 'Restaurant Owner';

  const upiUri = generateUpiUri({
    upiId,
    payeeName: upiPayeeName,
    amount: mergedTotal,
    transactionNote: `Table ${displayTable} Bill`,
    orderRef: activeRounds[0]?.orderNumber || 'ORD-BILL'
  });
  const [showUpiQr, setShowUpiQr] = useState(false);

  // Live countdown timer for the latest active round
  const latestRound = activeRounds[activeRounds.length - 1];
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (!latestRound?.readyAt) return (latestRound?.estimatedWaitTime || 10) * 60;
    const diff = Math.floor((new Date(latestRound.readyAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!latestRound) return;
    const interval = setInterval(() => {
      if (latestRound.readyAt) {
        const diff = Math.floor((new Date(latestRound.readyAt).getTime() - Date.now()) / 1000);
        setSecondsRemaining(Math.max(0, diff));
      } else {
        setSecondsRemaining(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [latestRound]);

  const currency = restaurant.billing?.currency || '₹';
  const minsRemaining = Math.floor(secondsRemaining / 60);
  const secsRemaining = secondsRemaining % 60;

  // Case 1: When customer has paid, the bill DISAPPEARS and confirmation is shown
  if (isPaid) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col justify-between text-charcoal-900 pb-12">
        <header className="bg-white border-b border-cream-200 px-4 py-3 flex items-center justify-between">
          <Link 
            to={`/r/${activeSlug}`}
            onClick={() => clearSessionOrders()}
            className="p-2 -ml-2 rounded-full hover:bg-cream-100 text-charcoal-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-serif font-bold text-base">{displayTable} &bull; Paid</span>
          <div className="w-6" />
        </header>

        <main className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-300 shadow-elevated animate-scale-up">
            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif font-bold text-2xl text-charcoal-900">
              Bill Paid &amp; Settled!
            </h2>
            <p className="text-xs text-charcoal-600 max-w-xs mx-auto">
              Your dining bill for {displayTable} ({displayCustomer}) has been settled at the counter. The active bill is now cleared.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-cream-200 shadow-soft text-left space-y-2 max-w-xs mx-auto">
            <div className="text-[11px] text-forest-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>Session Completed</span>
            </div>
            <p className="text-xs text-charcoal-600">
              Thank you for dining with {restaurant.name}! We look forward to welcoming you back.
            </p>
          </div>

          <div className="pt-4">
            <Link
              to={`/r/${activeSlug}`}
              onClick={() => clearSessionOrders()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Start a Fresh Order</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Case 2: No active orders found
  if (activeRounds.length === 0) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col justify-between text-charcoal-900 pb-12">
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
          <h2 className="font-serif font-bold text-xl text-charcoal-900">No Active Bill Found</h2>
          <p className="text-xs sm:text-sm text-charcoal-700/80">
            There are no active unpaid rounds for this table session.
          </p>
          <Link 
            to={`/r/${activeSlug}`}
            className="inline-block px-5 py-2.5 bg-forest-700 text-white rounded-xl text-xs font-bold"
          >
            Go to Menu &amp; Place Order
          </Link>
        </main>
      </div>
    );
  }

  // Case 3: Active Orders: Displays merged bill for Round 1 + Round 2
  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-cream-200 px-4 py-3 shadow-sm sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/r/${activeSlug}`} className="p-2 -ml-2 rounded-full hover:bg-cream-100 text-charcoal-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-serif font-bold text-lg leading-tight">
                {activeRounds.length === 1 ? 'Your Dining Bill' : `Your Bill (${activeRounds.length} Rounds Merged)`}
              </h1>
              <p className="text-xs text-forest-700 font-semibold">
                {displayTable} &bull; {displayCustomer}
              </p>
            </div>
          </div>

          <span className="font-mono text-xs font-bold bg-cream-100 text-forest-800 px-2 py-0.5 rounded-md border border-cream-300">
            {activeRounds.length === 1 ? activeRounds[0].orderNumber : `${activeRounds.length} Rounds`}
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* PAYMENT DETAILS BANNER (Option B: Cash on Delivery or Direct Owner UPI) */}
        {isUpiOrder ? (
          <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-white rounded-2xl p-6 shadow-elevated text-center space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mx-auto mb-1 bg-white/10 text-purple-200 uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Online UPI Payment (Direct to Owner)</span>
            </div>
            <div className="font-serif font-bold text-4xl text-gold-300">
              {formatCurrency(mergedTotal, currency)}
            </div>
            <p className="text-xs text-purple-100/90 max-w-xs mx-auto">
              Paid directly to <strong>{upiPayeeName}</strong> ({upiId}).
            </p>
            {upiRef && (
              <div className="inline-flex items-center gap-1.5 text-xs font-mono bg-purple-950/70 text-purple-200 px-3 py-1 rounded-xl border border-purple-700/60">
                <ShieldCheck className="w-4 h-4 text-gold-400" />
                <span>UTR: {upiRef}</span>
              </div>
            )}
            <div className="pt-1 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowUpiQr(!showUpiQr)}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showUpiQr ? 'Hide UPI QR' : 'Show UPI QR'}</span>
              </button>
              <a
                href={upiUri}
                className="px-3 py-1.5 bg-gold-400 hover:bg-gold-500 rounded-xl text-xs font-bold text-charcoal-900 transition flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Open UPI App</span>
              </a>
            </div>
            {showUpiQr && (
              <div className="mt-3 p-4 bg-white rounded-2xl text-charcoal-900 space-y-2 animate-scale-up">
                <div className="inline-block p-2 bg-white border border-purple-300 rounded-xl">
                  <QRCodeSVG value={upiUri} size={140} level="M" />
                </div>
                <div className="text-xs font-mono text-charcoal-600">
                  UPI ID: <strong>{upiId}</strong>
                </div>
              </div>
            )}
            <div className="text-[11px] text-purple-200/80 pt-1">
              Status: <span className="font-bold text-gold-300">Verification Pending at Counter</span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-forest-800 to-forest-900 text-white rounded-2xl p-6 shadow-elevated text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mx-auto mb-1 bg-white/10 text-forest-200 uppercase tracking-wider">
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash on Delivery / Pay at Counter</span>
            </div>
            <div className="font-serif font-bold text-4xl text-gold-400">
              {formatCurrency(mergedTotal, currency)}
            </div>
            <p className="text-xs text-forest-100/90 max-w-xs mx-auto">
              {activeRounds.length > 1 ? `Includes all dishes from Round 1 and Round 2. ` : ''}
              Show this screen at the counter when you finish dining. Pay via Cash, UPI, or Card.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-forest-200 bg-forest-950/50 px-2.5 py-1 rounded-lg border border-forest-700/50">
              <Printer className="w-3 h-3 text-gold-400" />
              <span>KOT &amp; Bill sent to counter billing printer</span>
            </div>
          </div>
        )}

        {/* Kitchen Countdown Timer (for latest round in preparation) */}
        <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-soft text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-forest-700 animate-pulse" />
            <span>
              {activeRounds.length > 1 ? `Kitchen Status (Round ${activeRounds.length})` : 'Kitchen Status'}
            </span>
          </div>

          <div className="font-mono font-bold text-3xl sm:text-4xl text-charcoal-900 tracking-wider">
            {secondsRemaining > 0 ? (
              <span>
                {String(minsRemaining).padStart(2, '0')}:{String(secsRemaining).padStart(2, '0')}
              </span>
            ) : (
              <span className="text-emerald-700 text-2xl font-serif">Dishes are Ready!</span>
            )}
          </div>

          <p className="text-xs text-charcoal-600">
            {secondsRemaining > 0
              ? `Chef is preparing your dishes for ${displayTable}.`
              : 'Your dishes are served or ready for pickup.'}
          </p>
        </div>

        {/* ORDERED DISHES: Grouped by Round (Round 1, Round 2) */}
        <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-cream-200 pb-2.5">
            <h2 className="text-xs font-bold font-serif text-charcoal-900 uppercase tracking-wider flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-forest-700" />
              <span>
                All Ordered Dishes ({totalDishesCount} Items)
              </span>
            </h2>
            <span className="text-xs text-forest-700 font-bold">
              {activeRounds.length} {activeRounds.length === 1 ? 'Round' : 'Rounds Combined'}
            </span>
          </div>

          {/* List each round separately and cleanly */}
          <div className="space-y-3">
            {activeRounds.map((round, rIdx) => (
              <div key={round.id} className="p-3 bg-cream-50/70 rounded-xl border border-cream-200 space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-cream-200/80 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-forest-900 font-serif">
                      Round {rIdx + 1}
                    </span>
                    <span className="font-mono text-[10px] text-charcoal-500">
                      ({round.orderNumber})
                    </span>
                  </div>
                  <span className="font-serif font-bold text-charcoal-900">
                    {formatCurrency(round.total, currency)}
                  </span>
                </div>

                <div className="divide-y divide-cream-100 text-xs">
                  {round.items?.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between items-center text-charcoal-800">
                      <div>
                        <span className="font-bold text-charcoal-900">
                          {item.quantity}x {item.itemName}
                        </span>
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
              </div>
            ))}
          </div>

          {/* Breakdown Totals (Merged) */}
          <div className="pt-3 border-t border-cream-200 space-y-1.5 text-xs text-charcoal-700">
            <div className="flex justify-between">
              <span>Subtotal ({totalDishesCount} dishes)</span>
              <span>{formatCurrency(mergedSubtotal, currency)}</span>
            </div>
            {mergedTax > 0 && (
              <div className="flex justify-between">
                <span>Taxes (CGST + SGST)</span>
                <span>{formatCurrency(mergedTax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline text-sm font-bold text-charcoal-900 pt-2 border-t border-cream-200">
              <span className="font-serif">Combined Grand Total</span>
              <span className="text-xl font-serif text-forest-800">
                {formatCurrency(mergedTotal, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Order Additional Dishes (Next Round) */}
        <div className="pt-1">
          <Link
            to={`/r/${activeSlug}`}
            className="w-full py-3 px-4 bg-white hover:bg-cream-50 text-charcoal-800 rounded-xl font-bold text-xs border border-cream-300 shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Additional Dishes (Round {activeRounds.length + 1})</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
