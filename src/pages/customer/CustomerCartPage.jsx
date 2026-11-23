import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  UtensilsCrossed, 
  Receipt, 
  ArrowRight,
  MessageSquare,
  Clock,
  Layers,
  Lock
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import VegNonVegIcon from '../../components/common/VegNonVegIcon';
import { formatCurrency } from '../../utils/formatters';

export default function CustomerCartPage() {
  const { restaurantSlug = 'naachi-cafe' } = useParams();
  const navigate = useNavigate();
  const { restaurant, tables, orders } = useRestaurant();
  const { 
    cartItems, 
    totalItemCount, 
    updateQuantity, 
    removeItem, 
    updateItemInstructions,
    clearCart, 
    tableInfo, 
    setTableInfo, 
    sessionOrderIds,
    calculateTotals 
  } = useCart();

  const billingConfig = restaurant.billing || {};
  const totals = calculateTotals(billingConfig);
  const currency = billingConfig.currency || '₹';

  // Active orders placed by THIS customer for this dining session (only their own orders, not full table)
  const activeTableOrders = useMemo(() => {
    if (!sessionOrderIds || sessionOrderIds.length === 0) return [];
    return orders.filter(o => {
      // Once customer has paid for their session, do NOT show the unpaid running bill banner
      if (o.isBilled || o.isPaid || o.paymentStatus === 'paid' || o.status === 'paid') return false;
      return sessionOrderIds.includes(o.id) || sessionOrderIds.includes(o.orderNumber);
    }).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [orders, sessionOrderIds]);

  const activeTableGrandTotal = useMemo(() => {
    return activeTableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [activeTableOrders]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col justify-between text-charcoal-900">
        <header className="bg-white border-b border-cream-200 px-4 py-3 flex items-center gap-3">
          <Link to={`/r/${restaurantSlug}`} className="p-2 -ml-2 rounded-full hover:bg-cream-100 text-charcoal-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif font-bold text-lg">Your Cart</h1>
        </header>

        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-cream-200 text-charcoal-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShoppingBag className="w-10 h-10 text-forest-700" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-charcoal-900">Your cart is empty</h2>
          <p className="text-sm text-charcoal-700/80 mt-1 max-w-xs mx-auto">
            You haven't added any dishes yet.
          </p>
          <Link 
            to={`/r/${restaurantSlug}`}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-sm font-semibold shadow-md transition"
          >
            <span>Explore Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Active Orders Card if customer previously ordered */}
          {activeTableOrders.length > 0 && (
            <div className="mt-6 p-4 bg-forest-50 border border-forest-200 rounded-2xl text-center space-y-2 max-w-xs mx-auto shadow-sm">
              <span className="text-xs text-forest-800 font-bold block">
                🍽️ You have active order #{activeTableOrders[activeTableOrders.length - 1].orderNumber} for {tableInfo?.name || 'your table'}!
              </span>
              <div className="font-serif font-bold text-lg text-forest-900">
                Order Total: {formatCurrency(activeTableOrders[activeTableOrders.length - 1].total, currency)}
              </div>
              <Link
                to={`/order/${activeTableOrders[activeTableOrders.length - 1].id}`}
                className="w-full py-2.5 px-3 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Track Active Order</span>
              </Link>
            </div>
          )}
        </main>

        <footer className="py-4 text-center text-xs text-charcoal-700/60">
          {restaurant.name} &bull; Dine-In Digital Menu
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-cream-200 px-4 py-3 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/r/${restaurantSlug}`} className="p-2 -ml-2 rounded-full hover:bg-cream-100 text-charcoal-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-serif font-bold text-lg leading-tight">Your Cart</h1>
              <p className="text-xs text-forest-700 font-medium">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} &bull; {restaurant.name}
              </p>
            </div>
          </div>

          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition"
          >
            Clear Cart
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* New Order Notice */}
        {activeTableOrders.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0 text-amber-800">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="font-bold block text-amber-950">
                Ordering Additional Dishes for {tableInfo?.name || 'Table'}
              </span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                These dishes will be sent to the kitchen as a separate order ticket.
              </p>
            </div>
          </div>
        )}

        {/* Estimated Waiting Time Banner */}
        <div className="bg-forest-800 text-white rounded-2xl p-4 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-700 border border-forest-600 flex items-center justify-center text-gold-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-forest-200 font-medium uppercase tracking-wider block">Estimated Waiting Time</span>
              <span className="font-serif font-bold text-lg text-white">
                ~{totals.estimatedOrderWaitTime || 10} Minutes
              </span>
            </div>
          </div>
          <span className="text-[11px] bg-forest-700 px-2.5 py-1 rounded-full text-gold-300 font-bold border border-forest-600">
            Freshly prepared
          </span>
        </div>

        {/* Table Assignment Card (Fixed to QR) */}
        <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700/70 flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-forest-700" />
              <span>Dine-In Table</span>
            </span>
            <span className="text-[11px] bg-forest-50 text-forest-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-forest-200">
              <Lock className="w-3 h-3 text-forest-700" />
              <span>Locked to Table QR</span>
            </span>
          </div>

          <div className="flex items-center justify-between bg-forest-50/70 border border-forest-200 p-3 rounded-xl">
            <div>
              <span className="text-[11px] text-forest-700 font-medium block">Ordering for:</span>
              <span className="text-base font-bold text-forest-900">
                {tableInfo?.name || (tables[0]?.name || 'Table 1')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider block">Assigned Table</span>
              <span className="text-xs text-charcoal-600 font-medium">Automatic from QR</span>
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-soft space-y-4">
          <h2 className="text-sm font-bold font-serif text-charcoal-900 border-b border-cream-200 pb-2">
            Selected Dishes
          </h2>

          <div className="divide-y divide-cream-200">
            {cartItems.map(item => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="mt-1">
                      <VegNonVegIcon type={item.foodType} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-bold text-sm text-charcoal-900 leading-snug truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-charcoal-700/70 font-medium">
                          {formatCurrency(item.price, currency)} each
                        </span>
                        <span className="text-[10px] text-forest-700 font-semibold bg-forest-50 px-1.5 py-0.2 rounded border border-forest-100 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{item.prepTime || 10}m prep</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Price */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-cream-100 rounded-lg border border-cream-300 px-1 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-charcoal-700 hover:bg-cream-200 rounded transition"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold font-sans">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-charcoal-700 hover:bg-cream-200 rounded transition"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>

                    <div className="text-right min-w-[60px]">
                      <span className="text-sm font-bold text-charcoal-900">
                        {formatCurrency(item.price * item.quantity, currency)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-charcoal-700/50 hover:text-rose-600 rounded transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Per-item cooking instruction note */}
                <div className="pl-6">
                  <div className="flex items-center gap-1.5 text-xs text-charcoal-700/80">
                    <MessageSquare className="w-3 h-3 text-forest-700 flex-shrink-0" />
                    <input 
                      type="text"
                      value={item.specialInstructions || ''}
                      onChange={(e) => updateItemInstructions(item.id, e.target.value)}
                      placeholder="Special note (e.g. less sugar, extra crispy)..."
                      maxLength={70}
                      className="w-full text-xs bg-cream-50/80 border border-cream-200 rounded px-2 py-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link 
              to={`/r/${restaurantSlug}`}
              className="text-xs font-bold text-forest-700 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add more dishes</span>
            </Link>
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-soft space-y-3">
          <h2 className="text-sm font-bold font-serif text-charcoal-900 flex items-center gap-2 border-b border-cream-200 pb-2">
            <Receipt className="w-4 h-4 text-forest-700" />
            <span>Bill Amount</span>
          </h2>

          <div className="space-y-1.5 text-xs text-charcoal-700">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="font-semibold">{formatCurrency(totals.subtotal, currency)}</span>
            </div>

            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Restaurant Discount</span>
                <span>-{formatCurrency(totals.discountAmount, currency)}</span>
              </div>
            )}

            {totals.totalTax > 0 && (
              <div className="flex justify-between text-charcoal-700/80">
                <span>Taxes (CGST + SGST)</span>
                <span>{formatCurrency(totals.totalTax, currency)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-cream-200 flex justify-between items-baseline text-sm font-bold text-charcoal-900">
              <span className="font-serif">Grand Total</span>
              <span className="text-lg font-serif text-forest-800">{formatCurrency(totals.grandTotal, currency)}</span>
            </div>
          </div>
          
          <p className="text-[11px] text-charcoal-600 bg-cream-50 p-2 rounded-lg border border-cream-200 text-center font-medium">
            Pay directly at the counter after your meal.
          </p>
        </div>
      </main>

      {/* Sticky Bottom Checkout Action */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-cream-200 shadow-elevated">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] text-charcoal-700/70 font-semibold uppercase tracking-wider">Bill Total</div>
            <div className="text-xl font-bold font-serif text-forest-800">
              {formatCurrency(totals.grandTotal, currency)}
            </div>
          </div>

          <button
            onClick={() => {
              if (!tableInfo && tables && tables.length > 0) {
                setTableInfo({
                  id: tables[0].id,
                  name: tables[0].name,
                  tableNumber: tables[0].tableNumber
                });
              }
              navigate(`/r/${restaurantSlug}/checkout`);
            }}
            className="flex-1 py-3 px-6 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm sm:text-base active:scale-98"
          >
            <span>Confirm Order</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </footer>
    </div>
  );
}
