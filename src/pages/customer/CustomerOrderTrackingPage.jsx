import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  UtensilsCrossed, 
  Clock, 
  ChefHat, 
  Receipt,
  Phone,
  Sparkles,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  ShoppingBag
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export default function CustomerOrderTrackingPage() {
  const { orderId } = useParams();
  const { restaurant, orders, activeSlug } = useRestaurant();
  const { sessionOrderIds, tableInfo, customerInfo } = useCart();

  const [activeTab, setActiveTab] = useState('full-bill'); // 'full-bill' | 'timer'
  const [showRoundsBreakdown, setShowRoundsBreakdown] = useState(false);

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

  // Find all orders placed for this table session
  const tableOrders = useMemo(() => {
    const targetTableId = order?.tableId || tableInfo?.id;
    const targetTableName = order?.tableName || tableInfo?.name;
    const targetPhone = order?.customerPhone || customerInfo?.phone;

    const matched = orders.filter(o => {
      if (sessionOrderIds?.includes(o.id) || sessionOrderIds?.includes(o.orderNumber)) {
        return true;
      }
      const isSameTable = (
        (targetTableId && o.tableId === targetTableId) ||
        (targetTableName && o.tableName?.toLowerCase() === targetTableName.toLowerCase())
      );

      if (isSameTable) {
        if (targetPhone && o.customerPhone) {
          const p1 = targetPhone.replace(/\D/g, '');
          const p2 = o.customerPhone.replace(/\D/g, '');
          if (p1 && p2 && p1 === p2) return true;
        }
        if (o.createdAt) {
          const diffHours = (Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60);
          if (diffHours < 6) return true;
        }
      }
      return false;
    });

    if (order && !matched.some(m => m.id === order.id)) {
      matched.push(order);
    }

    return matched.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [orders, order, sessionOrderIds, tableInfo, customerInfo]);

  // Consolidated table calculations
  const consolidated = useMemo(() => {
    if (tableOrders.length === 0) return null;

    let subtotal = 0;
    let totalTax = 0;
    let grandTotal = 0;
    let totalItemsCount = 0;
    const aggregated = {};

    tableOrders.forEach((ord, roundIdx) => {
      subtotal += (ord.subtotal || 0);
      totalTax += (ord.taxDetails?.totalTax || 0);
      grandTotal += (ord.total || 0);

      ord.items?.forEach(it => {
        totalItemsCount += (it.quantity || 1);
        const key = it.menuItemId || it.itemName;
        if (!aggregated[key]) {
          aggregated[key] = {
            name: it.itemName,
            quantity: 0,
            price: it.priceAtOrder || (it.lineTotal / (it.quantity || 1)),
            lineTotal: 0,
            foodType: it.foodType,
            prepTime: it.prepTime,
            rounds: []
          };
        }
        aggregated[key].quantity += (it.quantity || 1);
        aggregated[key].lineTotal += (it.lineTotal || 0);
        aggregated[key].rounds.push(`Round ${roundIdx + 1}`);
      });
    });

    return {
      roundCount: tableOrders.length,
      orders: tableOrders,
      items: Object.values(aggregated),
      totalItemsCount,
      subtotal,
      totalTax,
      grandTotal: Number(grandTotal.toFixed(2)),
      latestOrder: tableOrders[tableOrders.length - 1],
      tableName: tableOrders[0]?.tableName || 'Table',
      customerName: tableOrders[0]?.customerName || 'Guest'
    };
  }, [tableOrders]);

  const currency = restaurant.billing?.currency || '₹';
  const isMultiRound = consolidated && consolidated.roundCount > 1;

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
              <h1 className="font-serif font-bold text-lg leading-tight">
                {isMultiRound ? 'Consolidated Dining Bill' : 'Live Order & Bill'}
              </h1>
              <p className="text-xs text-forest-700 font-semibold">
                {order.tableName} &bull; {order.customerName}
              </p>
            </div>
          </div>

          {isMultiRound && (
            <span className="text-[11px] font-bold bg-forest-100 text-forest-800 px-2 py-0.5 rounded-full border border-forest-200">
              {consolidated.roundCount} Orders
            </span>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Tab Switcher if multiple rounds exist */}
        {isMultiRound && (
          <div className="bg-white p-1.5 rounded-2xl border border-cream-300 shadow-soft flex gap-1">
            <button
              onClick={() => setActiveTab('full-bill')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'full-bill'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-charcoal-700 hover:bg-cream-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Full Bill ({formatCurrency(consolidated.grandTotal, currency)})</span>
            </button>
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'timer'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-charcoal-700 hover:bg-cream-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Latest Wait Timer</span>
            </button>
          </div>
        )}

        {/* ================= VIEW 1: CONSOLIDATED FULL BILL ================= */}
        {(!isMultiRound || activeTab === 'full-bill') && consolidated && (
          <div className="space-y-4">
            {/* Pay at Counter Card */}
            <div className="bg-gradient-to-br from-forest-800 to-forest-900 text-white rounded-2xl p-6 shadow-elevated text-center space-y-2">
              <span className="text-xs text-forest-200 font-medium uppercase tracking-wider block">
                Total Amount to Pay at Counter
              </span>
              <div className="font-serif font-bold text-4xl text-gold-400">
                {formatCurrency(consolidated.grandTotal, currency)}
              </div>
              <p className="text-xs text-forest-100/90 max-w-xs mx-auto">
                Show this screen at the counter when you finish dining. Combines all orders placed at {consolidated.tableName}.
              </p>
            </div>

            {/* Complete Itemized List across all orders */}
            <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-soft space-y-3">
              <div className="flex items-center justify-between border-b border-cream-200 pb-2">
                <h2 className="text-xs font-bold font-serif text-charcoal-900 uppercase tracking-wider">
                  Complete Table Bill ({consolidated.totalItemsCount} items)
                </h2>
                <span className="text-[10px] text-forest-800 font-semibold bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200">
                  {consolidated.roundCount} {consolidated.roundCount === 1 ? 'Round' : 'Rounds'}
                </span>
              </div>

              <div className="divide-y divide-cream-100 text-xs">
                {consolidated.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center text-charcoal-800">
                    <div>
                      <span className="font-bold text-charcoal-900">{item.quantity}x {item.name}</span>
                      <div className="text-[10px] text-charcoal-500">
                        {item.quantity} &times; {formatCurrency(item.price, currency)}
                      </div>
                    </div>
                    <span className="font-bold text-charcoal-900">
                      {formatCurrency(item.lineTotal, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Totals */}
              <div className="pt-3 border-t border-cream-200 space-y-1.5 text-xs text-charcoal-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(consolidated.subtotal, currency)}</span>
                </div>
                {consolidated.totalTax > 0 && (
                  <div className="flex justify-between">
                    <span>Taxes (CGST + SGST)</span>
                    <span>{formatCurrency(consolidated.totalTax, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-sm font-bold text-charcoal-900 pt-2 border-t border-cream-200">
                  <span className="font-serif">Grand Total</span>
                  <span className="text-lg font-serif text-forest-800">
                    {formatCurrency(consolidated.grandTotal, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Order Tickets breakdown */}
            {isMultiRound && (
              <div className="border border-cream-300 rounded-xl overflow-hidden bg-cream-50/50">
                <button
                  type="button"
                  onClick={() => setShowRoundsBreakdown(!showRoundsBreakdown)}
                  className="w-full p-3 text-xs font-bold text-charcoal-800 flex items-center justify-between hover:bg-cream-100/60 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-forest-700" />
                    <span>View Individual Tickets ({consolidated.roundCount})</span>
                  </div>
                  {showRoundsBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showRoundsBreakdown && (
                  <div className="p-3 pt-0 space-y-2 border-t border-cream-200 text-xs">
                    {consolidated.orders.map((ord, idx) => (
                      <div key={ord.id} className="bg-white p-2.5 rounded-lg border border-cream-200 space-y-1">
                        <div className="flex justify-between items-center font-semibold text-charcoal-900">
                          <span className="text-forest-800 font-bold">Round {idx + 1}: {ord.orderNumber}</span>
                          <span>{formatCurrency(ord.total, currency)}</span>
                        </div>
                        <p className="text-[11px] text-charcoal-600">
                          {ord.items?.map(i => `${i.quantity}x ${i.itemName}`).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: LIVE WAITING TIMER ================= */}
        {(!isMultiRound || activeTab === 'timer') && (
          <div className="space-y-4">
            {/* Waiting Time Countdown Display */}
            <div className="bg-forest-800 text-white rounded-2xl p-6 shadow-elevated text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-forest-700 border-2 border-gold-400 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-7 h-7 text-gold-400 animate-spin" />
              </div>

              <div>
                <span className="text-xs text-forest-200 font-medium uppercase tracking-wider block">
                  {isMultiRound ? `Round #${consolidated.roundCount} Wait Time` : 'Estimated Wait Time'}
                </span>
                <div className="font-serif font-bold text-4xl text-white mt-1">
                  {secondsRemaining > 0 ? (
                    <span>{minsRemaining}m {secsRemaining.toString().padStart(2, '0')}s</span>
                  ) : (
                    <span className="text-gold-300">Any Moment Now!</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-forest-100/80 max-w-xs mx-auto">
                Order #{order.orderNumber} is being prepared by the chef.
              </p>

              <div className="pt-2 border-t border-forest-700 flex justify-between text-xs text-forest-200">
                <span>Table: <strong>{order.tableName}</strong></span>
                <span>Guest: <strong>{order.customerName}</strong></span>
              </div>
            </div>

            {/* Dishes for this specific ticket */}
            <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-soft space-y-3">
              <h2 className="text-xs font-bold font-serif text-charcoal-900 uppercase tracking-wider border-b border-cream-200 pb-2">
                Order #{order.orderNumber} Dishes
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
                <span className="font-serif">Ticket Total</span>
                <span className="font-serif text-forest-800 text-base">{formatCurrency(order.total, currency)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Counter Pay Notice */}
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-amber-700" />
            <span>Pay Directly at Counter</span>
          </div>
          <p className="text-amber-800">
            Please show this screen at the counter when paying. Cashier will bill all <strong>{consolidated?.tableName}</strong> orders ({formatCurrency(consolidated?.grandTotal || order.total, currency)}).
          </p>
        </div>

        {/* Action Button: Order more items */}
        <div className="space-y-2 pt-1">
          <Link
            to={`/r/${activeSlug}`}
            className="w-full py-2.5 px-4 bg-white hover:bg-cream-50 text-charcoal-800 rounded-xl font-semibold text-xs border border-cream-300 shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Additional Items for {order.tableName}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
