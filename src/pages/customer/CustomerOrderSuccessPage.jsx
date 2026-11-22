import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  UtensilsCrossed, 
  Clock, 
  ArrowRight, 
  Phone,
  ChefHat,
  Receipt,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency, formatDateTime, formatTime } from '../../utils/formatters';

export default function CustomerOrderSuccessPage() {
  const { restaurantSlug = 'naachi-cafe', orderId } = useParams();
  const location = useLocation();
  const { restaurant, orders } = useRestaurant();
  const { sessionOrderIds, tableInfo, customerInfo } = useCart();

  const [activeTab, setActiveTab] = useState('full-bill'); // 'full-bill' | 'latest'
  const [showRoundsBreakdown, setShowRoundsBreakdown] = useState(false);

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

  // Find all orders placed for this table session (consolidating all rounds)
  const tableOrders = useMemo(() => {
    const targetTableId = order?.tableId || tableInfo?.id;
    const targetTableName = order?.tableName || tableInfo?.name;
    const targetPhone = order?.customerPhone || customerInfo?.phone;

    const matched = orders.filter(o => {
      // 1. If in this device's session orders
      if (sessionOrderIds?.includes(o.id) || sessionOrderIds?.includes(o.orderNumber)) {
        return true;
      }
      // 2. If table matches
      const isSameTable = (
        (targetTableId && o.tableId === targetTableId) ||
        (targetTableName && o.tableName?.toLowerCase() === targetTableName.toLowerCase())
      );

      if (isSameTable) {
        // If phone matches, 100% certainty
        if (targetPhone && o.customerPhone) {
          const p1 = targetPhone.replace(/\D/g, '');
          const p2 = o.customerPhone.replace(/\D/g, '');
          if (p1 && p2 && p1 === p2) return true;
        }
        // If placed in same dining session (last 6 hours)
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

  // Aggregate all items across all order rounds
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
      customerName: tableOrders[0]?.customerName || 'Customer'
    };
  }, [tableOrders]);

  const currency = restaurant.billing?.currency || '₹';
  const waitMinutes = order?.estimatedWaitTime || 15;
  const isMultiRound = consolidated && consolidated.roundCount > 1;

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900 pb-16">
      {/* Top Banner */}
      <div className="bg-forest-700 text-white py-8 px-4 text-center">
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto border-2 border-gold-400 shadow-inner">
            <CheckCircle className="w-8 h-8 text-gold-400 stroke-[2.5]" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-white">
            {isMultiRound ? `Order Round #${consolidated.roundCount} Sent!` : 'Order Sent to Reception!'}
          </h1>
          <p className="text-forest-100 text-xs sm:text-sm">
            {isMultiRound 
              ? `Added to your table bill • Ticket sent to kitchen` 
              : `Received on reception laptop • Bill is being printed for kitchen`}
          </p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 -mt-4 space-y-4">
        {/* If multiple orders exist for this table, show the Tab Switcher */}
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
              <span>Full Table Bill ({consolidated.roundCount} Orders)</span>
            </button>
            <button
              onClick={() => setActiveTab('latest')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'latest'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-charcoal-700 hover:bg-cream-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Latest Food Wait Time</span>
            </button>
          </div>
        )}

        {/* ================= VIEW 1: FULL CONSOLIDATED TABLE BILL ================= */}
        {(!isMultiRound || activeTab === 'full-bill') && consolidated && (
          <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-elevated space-y-4">
            {/* Table & Session Header */}
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <div>
                <span className="text-[10px] text-charcoal-700/70 font-bold uppercase tracking-wider block">
                  Consolidated Dining Bill
                </span>
                <span className="font-serif font-bold text-base text-charcoal-900">
                  {consolidated.tableName} &bull; {consolidated.customerName}
                </span>
              </div>
              <span className="font-mono text-xs font-bold bg-forest-50 text-forest-800 px-2.5 py-1 rounded-md border border-forest-200">
                {consolidated.roundCount} {consolidated.roundCount === 1 ? 'Order' : 'Orders Combined'}
              </span>
            </div>

            {/* Pay at Counter Callout with GRAND TOTAL */}
            <div className="p-4 bg-gradient-to-br from-forest-800 to-forest-900 text-white rounded-2xl text-center space-y-1 shadow-md">
              <span className="text-[11px] text-forest-200 font-semibold uppercase tracking-wider block">
                Total Amount to Pay at Counter
              </span>
              <div className="font-serif font-bold text-3xl sm:text-4xl text-gold-400">
                {formatCurrency(consolidated.grandTotal, currency)}
              </div>
              <p className="text-[11px] text-forest-100/90 pt-1">
                Show this screen at the counter when you are ready to pay via Cash, UPI, or Card.
              </p>
            </div>

            {/* Consolidated All Ordered Dishes */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold font-serif text-charcoal-900 uppercase tracking-wider">
                  All Ordered Items ({consolidated.totalItemsCount} dishes)
                </h2>
                <span className="text-[10px] text-forest-700 font-semibold bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200">
                  Includes All Rounds
                </span>
              </div>

              <div className="divide-y divide-cream-100 text-xs">
                {consolidated.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-charcoal-800">
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

              {/* Bill Totals Summary */}
              <div className="pt-3 border-t border-cream-200 space-y-1 text-xs text-charcoal-700">
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

            {/* Expandable Order Rounds Breakdown */}
            {isMultiRound && (
              <div className="border border-cream-300 rounded-xl overflow-hidden bg-cream-50/50">
                <button
                  type="button"
                  onClick={() => setShowRoundsBreakdown(!showRoundsBreakdown)}
                  className="w-full p-3 text-xs font-bold text-charcoal-800 flex items-center justify-between hover:bg-cream-100/60 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-forest-700" />
                    <span>View Individual Order Tickets ({consolidated.roundCount})</span>
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

        {/* ================= VIEW 2: LATEST ORDER & WAITING TIME ================= */}
        {(isMultiRound && activeTab === 'latest') && (
          <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-elevated text-center space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <span className="text-xs text-charcoal-700/70 font-bold uppercase tracking-wider">
                Latest Order (Round {consolidated.roundCount})
              </span>
              <span className="font-mono font-bold text-base text-forest-800 bg-cream-100 px-2.5 py-1 rounded-md border border-cream-300">
                {order ? order.orderNumber : orderId}
              </span>
            </div>

            {/* Waiting Time Box */}
            <div className="p-4 bg-forest-50 border-2 border-forest-200 rounded-2xl text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-forest-700 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4 text-forest-700 animate-pulse" />
                <span>Estimated Waiting Time for New Items</span>
              </div>
              <div className="font-serif font-bold text-3xl text-forest-900">
                ~{waitMinutes} Minutes
              </div>
              <p className="text-xs text-forest-700/80">
                Chef is preparing newly added dishes for {order?.tableName || 'your table'}.
              </p>
            </div>

            {/* Newly Added Items */}
            {order?.items && (
              <div className="text-left space-y-2 border-t border-cream-200 pt-3">
                <h3 className="text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                  Newly Ordered Dishes
                </h3>
                <div className="divide-y divide-cream-100 text-xs">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-charcoal-900">{it.quantity}x {it.itemName}</div>
                        <div className="text-[10px] text-forest-700 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{it.prepTime || 10} mins prep</span>
                        </div>
                      </div>
                      <span className="font-bold text-charcoal-900">
                        {formatCurrency(it.lineTotal, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Link
            to={`/order/${orderId}`}
            className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>Open Live Countdown & Bill Screen</span>
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
