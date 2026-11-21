import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  UtensilsCrossed, 
  Clock, 
  ChefHat, 
  Check, 
  CheckCircle2, 
  X, 
  Receipt, 
  Eye, 
  Phone,
  MessageSquare
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/Badge';
import VegNonVegIcon from '../../components/common/VegNonVegIcon';

const STATUS_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'preparing', label: 'In Kitchen' },
  { id: 'ready', label: 'Ready' },
  { id: 'served', label: 'Served' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' }
];

export default function AdminOrdersPage() {
  const [searchParams] = useSearchParams();
  const { restaurant, orders, updateOrderStatus } = useRestaurant();
  
  const initialOrderId = searchParams.get('id');
  const [selectedOrder, setSelectedOrder] = useState(() => 
    initialOrderId ? orders.find(o => o.id === initialOrderId) : null
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currency = restaurant.billing?.currency || '₹';

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.orderStatus !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = order.orderNumber?.toLowerCase().includes(q);
        const matchesName = order.customerName?.toLowerCase().includes(q);
        const matchesTable = order.tableName?.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone?.includes(q);
        if (!matchesNum && !matchesName && !matchesTable && !matchesPhone) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Order Management
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Realtime customer orders, kitchen workflows, and status tracking
          </p>
        </div>

        <div className="text-xs text-charcoal-700/70 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
          Total orders in system: <strong className="text-charcoal-900">{orders.length}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {STATUS_TABS.map(tab => {
              const count = tab.id === 'all' 
                ? orders.length 
                : orders.filter(o => o.orderStatus === tab.id).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    statusFilter === tab.id
                      ? 'bg-forest-700 text-white shadow-sm'
                      : 'bg-slate-100 text-charcoal-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id ? 'bg-forest-600 text-white' : 'bg-slate-200 text-charcoal-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, phone, customer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Orders Grid / Cards for touch-friendly management */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-sm font-semibold text-charcoal-700">No orders found in this view.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isPending = order.orderStatus === 'pending';

            return (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between ${
                  isPending ? 'border-amber-400 ring-1 ring-amber-200 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                    <div>
                      <span className="font-mono font-bold text-sm text-forest-800">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] text-charcoal-700/60 block">
                        {formatTime(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <OrderStatusBadge status={order.orderStatus} />
                    </div>
                  </div>

                  {/* Table & Customer */}
                  <div className="flex items-center justify-between text-xs mb-3 bg-slate-50 p-2 rounded-lg">
                    <span className="font-bold text-charcoal-900 flex items-center gap-1">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-forest-700" />
                      <span>{order.tableName}</span>
                    </span>

                    <span className="font-semibold text-charcoal-700 truncate max-w-[140px]">
                      {order.customerName}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1 text-xs text-charcoal-800 mb-3">
                    {order.items?.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate max-w-[180px]">{item.quantity}x {item.itemName}</span>
                        <span className="font-semibold">{formatCurrency(item.lineTotal, currency)}</span>
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <div className="text-[11px] text-charcoal-700/60 italic">
                        +{order.items.length - 3} more items...
                      </div>
                    )}
                  </div>

                  {order.specialInstructions && (
                    <div className="text-[11px] bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-200 mb-3 line-clamp-1">
                      Note: "{order.specialInstructions}"
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-charcoal-700/60 uppercase tracking-wider block">Total</span>
                    <span className="font-serif font-bold text-sm text-charcoal-900">
                      {formatCurrency(order.total, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    {order.orderStatus === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'accepted')}
                        className="px-2.5 py-1 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-bold"
                      >
                        Accept
                      </button>
                    )}
                    {order.orderStatus === 'accepted' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold"
                      >
                        Cook
                      </button>
                    )}
                    {order.orderStatus === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                      >
                        Ready
                      </button>
                    )}
                    {order.orderStatus === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        Serve
                      </button>
                    )}
                    <Link
                      to={`/admin/billing?orderId=${order.id}`}
                      className="p-1.5 text-slate-500 hover:text-forest-700 hover:bg-slate-100 rounded-lg"
                      title="Bill Order"
                    >
                      <Receipt className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Order Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-elevated overflow-hidden">
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
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
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

              {selectedOrder.specialInstructions && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block">Cooking Notes:</span>
                  <p className="mt-1 font-medium">{selectedOrder.specialInstructions}</p>
                </div>
              )}

              {/* Items */}
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

              {/* Financial summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-charcoal-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal, currency)}</span>
                </div>
                {selectedOrder.taxDetails?.totalTax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax (CGST + SGST)</span>
                    <span>{formatCurrency(selectedOrder.taxDetails.totalTax, currency)}</span>
                  </div>
                )}
                {selectedOrder.serviceCharge > 0 && (
                  <div className="flex justify-between">
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

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {selectedOrder.orderStatus === 'pending' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'accepted');
                      setSelectedOrder(prev => ({ ...prev, orderStatus: 'accepted' }));
                    }}
                    className="px-3 py-1.5 bg-forest-700 text-white rounded-xl text-xs font-bold"
                  >
                    Accept
                  </button>
                )}
                {['pending', 'accepted'].includes(selectedOrder.orderStatus) && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'preparing');
                      setSelectedOrder(prev => ({ ...prev, orderStatus: 'preparing' }));
                    }}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold"
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
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold"
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
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
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
                    className="px-3 py-1.5 bg-charcoal-900 text-white rounded-xl text-xs font-bold"
                  >
                    Complete
                  </button>
                )}
              </div>

              <Link
                to={`/admin/billing?orderId=${selectedOrder.id}`}
                className="px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-charcoal-900 font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Bill</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
