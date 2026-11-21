import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  IndianRupee, 
  Search, 
  Eye, 
  Check, 
  X, 
  UtensilsCrossed, 
  Receipt, 
  ArrowUpRight,
  Phone,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/Badge';
import VegNonVegIcon from '../../components/common/VegNonVegIcon';

export default function AdminDashboardPage() {
  const { 
    restaurant, 
    orders, 
    updateOrderStatus, 
    tables, 
    soundEnabled, 
    testNotificationSound,
    resetDemoData
  } = useRestaurant();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickStatusFilter, setQuickStatusFilter] = useState('all');

  const currency = restaurant.billing?.currency || '₹';

  // Compute live statistics from orders
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Filter orders created today
    const todayOrders = orders.filter(o => o.createdAt?.startsWith(today));
    const activePool = todayOrders.length > 0 ? todayOrders : orders; // fallback to all demo orders if no new orders today

    const totalOrdersCount = activePool.length;
    const pendingCount = orders.filter(o => o.orderStatus === 'pending').length;
    const preparingCount = orders.filter(o => ['accepted', 'preparing'].includes(o.orderStatus)).length;
    const completedCount = activePool.filter(o => o.orderStatus === 'completed' || o.orderStatus === 'served').length;

    // Calculate today's revenue from non-cancelled orders
    const todayRevenue = activePool
      .filter(o => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      totalOrders: totalOrdersCount,
      pendingOrders: pendingCount,
      preparingOrders: preparingCount,
      completedOrders: completedCount,
      revenue: todayRevenue
    };
  }, [orders]);

  // Filter orders for table list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (quickStatusFilter !== 'all' && order.orderStatus !== quickStatusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrder = order.orderNumber?.toLowerCase().includes(q);
        const matchesName = order.customerName?.toLowerCase().includes(q);
        const matchesTable = order.tableName?.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone?.includes(q);
        if (!matchesOrder && !matchesName && !matchesTable && !matchesPhone) return false;
      }

      return true;
    });
  }, [orders, quickStatusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Reset for testing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Realtime Dashboard
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Live orders, kitchen queue & counter activity for {restaurant.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Reset demo orders and menu back to initial clean state?')) {
                resetDemoData();
              }
            }}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-charcoal-800 rounded-xl text-xs font-semibold transition"
          >
            Reset Demo Data
          </button>

          <Link
            to="/admin/billing"
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Generate Bill / POS</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Today's Orders */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Today's Orders</span>
            <span className="text-xl font-bold font-serif text-charcoal-900">{stats.totalOrders}</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className={`bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 ${
          stats.pendingOrders > 0 ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/30' : 'border-slate-200'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Pending Confirm</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold font-serif text-amber-900">{stats.pendingOrders}</span>
              {stats.pendingOrders > 0 && (
                <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                  New
                </span>
              )}
            </div>
          </div>
        </div>

        {/* In Kitchen / Preparing */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">In Kitchen</span>
            <span className="text-xl font-bold font-serif text-charcoal-900">{stats.preparingOrders}</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Completed</span>
            <span className="text-xl font-bold font-serif text-charcoal-900">{stats.completedOrders}</span>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Today's Revenue</span>
            <span className="text-xl font-bold font-serif text-forest-800">
              {formatCurrency(stats.revenue, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Quick status tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'preparing', label: 'Preparing' },
              { id: 'ready', label: 'Ready' },
              { id: 'served', label: 'Served' },
              { id: 'completed', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setQuickStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  quickStatusFilter === tab.id
                    ? 'bg-forest-700 text-white shadow-sm'
                    : 'bg-slate-100 text-charcoal-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order, table, customer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Recent Orders List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-charcoal-900">
            Incoming Orders Stream ({filteredOrders.length})
          </h2>
          <span className="text-xs text-charcoal-700/60">
            Realtime Firestore Sync Active
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-charcoal-900">No orders in this view</h3>
            <p className="text-xs text-charcoal-700/70 mt-0.5">
              When customers place orders from the table QR codes, they will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-charcoal-700/70 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Ordered</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => {
                  const isPending = order.orderStatus === 'pending';

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isPending ? 'bg-amber-50/50' : ''
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Order Number */}
                      <td className="py-3 px-4 font-mono font-bold text-forest-800">
                        {order.orderNumber}
                      </td>

                      {/* Table */}
                      <td className="py-3 px-4 font-bold text-charcoal-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-charcoal-800">
                          <UtensilsCrossed className="w-3 h-3 text-forest-700" />
                          <span>{order.tableName}</span>
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal-900">{order.customerName}</div>
                        <div className="text-[11px] text-charcoal-700/70">{order.customerPhone}</div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="truncate text-charcoal-800">
                          {order.items?.map(i => `${i.quantity}x ${i.itemName}`).join(', ')}
                        </div>
                        {order.specialInstructions && (
                          <div className="text-[10px] text-amber-800 truncate">
                            Note: "{order.specialInstructions}"
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 font-bold font-serif text-charcoal-900 whitespace-nowrap">
                        {formatCurrency(order.total, currency)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <OrderStatusBadge status={order.orderStatus} />
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 text-charcoal-700/70 whitespace-nowrap">
                        {formatTime(order.createdAt)}
                      </td>

                      {/* Fast Action Buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {order.orderStatus === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'accepted')}
                              className="px-2.5 py-1 bg-forest-700 hover:bg-forest-800 text-white rounded-lg font-bold text-xs shadow-sm transition"
                            >
                              Accept
                            </button>
                          )}

                          {order.orderStatus === 'accepted' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
                            >
                              Cook
                            </button>
                          )}

                          {order.orderStatus === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
                            >
                              Ready
                            </button>
                          )}

                          {order.orderStatus === 'ready' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'served')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
                            >
                              Serve
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-elevated overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-charcoal-900">
                    Order {selectedOrder.orderNumber}
                  </h3>
                  <OrderStatusBadge status={selectedOrder.orderStatus} />
                </div>
                <p className="text-xs text-charcoal-700/60 mt-0.5">
                  Placed at {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Customer & Table details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-charcoal-700/60 font-semibold block">Dine-In Table</span>
                  <span className="font-bold text-sm text-charcoal-900 flex items-center gap-1 mt-0.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-forest-700" />
                    <span>{selectedOrder.tableName}</span>
                  </span>
                </div>

                <div>
                  <span className="text-charcoal-700/60 font-semibold block">Customer Details</span>
                  <span className="font-bold text-sm text-charcoal-900 block mt-0.5">
                    {selectedOrder.customerName}
                  </span>
                  <a 
                    href={`tel:${selectedOrder.customerPhone}`}
                    className="text-forest-700 font-semibold flex items-center gap-1 mt-0.5 hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{selectedOrder.customerPhone}</span>
                  </a>
                </div>
              </div>

              {/* Special instructions if any */}
              {selectedOrder.specialInstructions && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>Customer Cooking Instructions:</span>
                  </span>
                  <p className="mt-1 font-medium">{selectedOrder.specialInstructions}</p>
                </div>
              )}

              {/* Itemized Order List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 border-b border-slate-200 pb-1.5">
                  Ordered Items ({selectedOrder.items?.length || 0})
                </h4>

                <div className="divide-y divide-slate-100 text-xs">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <VegNonVegIcon type={item.foodType} size="sm" />
                        </div>
                        <div>
                          <div className="font-bold text-charcoal-900">
                            {item.quantity}x {item.itemName}
                          </div>
                          <div className="text-[11px] text-charcoal-700/60">
                            {formatCurrency(item.priceAtOrder, currency)} each
                          </div>
                          {item.specialInstructions && (
                            <div className="text-[10px] text-forest-700 italic">
                              Note: {item.specialInstructions}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="font-bold text-charcoal-900">
                        {formatCurrency(item.lineTotal, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-charcoal-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal, currency)}</span>
                </div>
                {selectedOrder.taxDetails?.totalTax > 0 && (
                  <div className="flex justify-between text-charcoal-700/80">
                    <span>Tax (CGST + SGST)</span>
                    <span>{formatCurrency(selectedOrder.taxDetails.totalTax, currency)}</span>
                  </div>
                )}
                {selectedOrder.serviceCharge > 0 && (
                  <div className="flex justify-between text-charcoal-700/80">
                    <span>Service Charge</span>
                    <span>{formatCurrency(selectedOrder.serviceCharge, currency)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-charcoal-900">
                  <span className="font-serif">Grand Total</span>
                  <span className="font-serif text-forest-800 text-base">
                    {formatCurrency(selectedOrder.total, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Workflow Action Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
              <div className="flex flex-wrap gap-2 justify-between items-center">
                {/* Workflow Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedOrder.orderStatus === 'pending' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'accepted');
                        setSelectedOrder(prev => ({ ...prev, orderStatus: 'accepted' }));
                      }}
                      className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Accept Order
                    </button>
                  )}

                  {['pending', 'accepted'].includes(selectedOrder.orderStatus) && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'preparing');
                        setSelectedOrder(prev => ({ ...prev, orderStatus: 'preparing' }));
                      }}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Start Preparing
                    </button>
                  )}

                  {['accepted', 'preparing'].includes(selectedOrder.orderStatus) && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'ready');
                        setSelectedOrder(prev => ({ ...prev, orderStatus: 'ready' }));
                      }}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Mark Ready
                    </button>
                  )}

                  {['preparing', 'ready'].includes(selectedOrder.orderStatus) && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'served');
                        setSelectedOrder(prev => ({ ...prev, orderStatus: 'served' }));
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Mark Served
                    </button>
                  )}

                  {selectedOrder.orderStatus !== 'completed' && selectedOrder.orderStatus !== 'cancelled' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'completed');
                        setSelectedOrder(prev => ({ ...prev, orderStatus: 'completed' }));
                      }}
                      className="px-3 py-1.5 bg-charcoal-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Complete Order
                    </button>
                  )}

                  {selectedOrder.orderStatus !== 'cancelled' && selectedOrder.orderStatus !== 'completed' && (
                    <button
                      onClick={() => {
                        if (confirm(`Cancel order ${selectedOrder.orderNumber}?`)) {
                          updateOrderStatus(selectedOrder.id, 'cancelled');
                          setSelectedOrder(prev => ({ ...prev, orderStatus: 'cancelled' }));
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>

                {/* Direct to Billing */}
                <Link
                  to={`/admin/billing?orderId=${selectedOrder.id}`}
                  className="px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-charcoal-900 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Generate Bill</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
