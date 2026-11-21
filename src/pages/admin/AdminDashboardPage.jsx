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
  UtensilsCrossed, 
  Receipt, 
  Printer,
  Phone,
  MessageSquare,
  Sparkles,
  Bell,
  X
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters';
import { OrderBillStatusBadge } from '../../components/common/Badge';
import VegNonVegIcon from '../../components/common/VegNonVegIcon';

export default function AdminDashboardPage() {
  const { 
    restaurant, 
    orders, 
    markOrderBilled, 
    generateBill,
    soundEnabled, 
    testNotificationSound,
    resetDemoData
  } = useRestaurant();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [billModalOrder, setBillModalOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'new' | 'billed'

  const currency = restaurant.billing?.currency || '₹';

  // Compute live statistics for reception
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.createdAt?.startsWith(today));
    const activePool = todayOrders.length > 0 ? todayOrders : orders;

    const pendingBillCount = orders.filter(o => !o.isBilled).length;
    const billedCount = orders.filter(o => o.isBilled).length;
    const todayRevenue = activePool.reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      totalOrders: activePool.length,
      pendingBills: pendingBillCount,
      billedOrders: billedCount,
      revenue: todayRevenue
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filterType === 'new' && order.isBilled) return false;
      if (filterType === 'billed' && !order.isBilled) return false;

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
  }, [orders, filterType, searchQuery]);

  const handleGenerateAndPrintBill = async (order) => {
    await markOrderBilled(order.id);
    setBillModalOrder(order);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Reception Desk & Table Orders
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Receive incoming table orders in realtime &bull; Generate bills and dispatch to kitchen
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Reset demo orders and menu back to initial state?')) {
                resetDemoData();
              }
            }}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-charcoal-800 rounded-xl text-xs font-semibold transition"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Reception Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Bills for Kitchen */}
        <div className={`bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 ${
          stats.pendingBills > 0 ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/40' : 'border-slate-200'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">New Orders (Pending Bill)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold font-serif text-amber-900">{stats.pendingBills}</span>
              {stats.pendingBills > 0 && (
                <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                  Action Required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Billed to Kitchen */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Billed & in Kitchen</span>
            <span className="text-2xl font-bold font-serif text-charcoal-900">{stats.billedOrders}</span>
          </div>
        </div>

        {/* Total Orders Today */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Total Orders</span>
            <span className="text-2xl font-bold font-serif text-charcoal-900">{stats.totalOrders}</span>
          </div>
        </div>

        {/* Sales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Today's Sales</span>
            <span className="text-2xl font-bold font-serif text-forest-800">
              {formatCurrency(stats.revenue, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterType === 'all'
                ? 'bg-forest-700 text-white'
                : 'bg-slate-100 text-charcoal-700 hover:bg-slate-200'
            }`}
          >
            All Orders ({orders.length})
          </button>

          <button
            onClick={() => setFilterType('new')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterType === 'new'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            Pending Bill ({orders.filter(o => !o.isBilled).length})
          </button>

          <button
            onClick={() => setFilterType('billed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterType === 'billed'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-charcoal-700 hover:bg-slate-200'
            }`}
          >
            Billed & In Kitchen ({orders.filter(o => o.isBilled).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, table, customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
          />
        </div>
      </div>

      {/* Incoming Orders Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-charcoal-900">
            Realtime Table Queue ({filteredOrders.length})
          </h2>
          <span className="text-xs text-charcoal-700/60 font-medium">
            Customer places order &rarr; Shows here &rarr; Generate bill & give to kitchen
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-serif font-bold text-base text-charcoal-900">No orders in this queue</h3>
            <p className="text-xs text-charcoal-700/70 mt-0.5">
              When customers place an order through their table QR code, it will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-charcoal-700/70 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Dine-In Table</th>
                  <th className="py-3 px-4">Guest Details</th>
                  <th className="py-3 px-4">Ordered Dishes & Wait Times</th>
                  <th className="py-3 px-4">Est. Waiting Time</th>
                  <th className="py-3 px-4">Bill Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => {
                  const isNew = !order.isBilled;

                  return (
                    <tr 
                      key={order.id}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isNew ? 'bg-amber-50/50' : ''
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-forest-800">
                        {order.orderNumber}
                      </td>

                      <td className="py-3 px-4 font-bold text-charcoal-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-charcoal-800 font-bold">
                          <UtensilsCrossed className="w-3 h-3 text-forest-700" />
                          <span>{order.tableName}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal-900">{order.customerName}</div>
                        <div className="text-[11px] text-charcoal-700/70">{order.customerPhone}</div>
                      </td>

                      {/* Dishes with their individual waiting times */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="space-y-0.5">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-charcoal-800">
                              <span className="font-semibold">{it.quantity}x {it.itemName}</span>
                              <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-mono">
                                {it.prepTime || 10}m
                              </span>
                            </div>
                          ))}
                        </div>
                        {order.specialInstructions && (
                          <div className="text-[10px] text-forest-700 italic mt-1">
                            Note: "{order.specialInstructions}"
                          </div>
                        )}
                      </td>

                      {/* Overall Waiting Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>~{order.estimatedWaitTime || 15} Mins</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold font-serif text-sm text-charcoal-900 whitespace-nowrap">
                        {formatCurrency(order.total, currency)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <OrderBillStatusBadge isBilled={order.isBilled} />
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleGenerateAndPrintBill(order)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto shadow-sm ${
                            isNew
                              ? 'bg-forest-700 hover:bg-forest-800 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-charcoal-800 border border-slate-300'
                          }`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{isNew ? 'Generate Bill & KOT' : 'Reprint Bill'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Preview & Print Modal */}
      {billModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[95vh] flex flex-col p-6 shadow-elevated overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Print Bill & Kitchen Order Ticket (KOT)
              </h3>
              <button
                onClick={() => setBillModalOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Print Receipt (Formatted for 80mm printer) */}
            <div id="printable-receipt" className="flex-1 overflow-y-auto py-4 font-mono text-xs text-black border border-slate-200 p-4 rounded-xl bg-white space-y-3">
              {/* Receipt Header */}
              <div className="text-center pb-2 border-b border-dashed border-black">
                <h2 className="font-bold text-base uppercase">{restaurant.name}</h2>
                <p className="text-[11px]">{restaurant.address}</p>
                <p className="text-[11px]">Phone: {restaurant.phone}</p>
                {restaurant.billing?.gstin && (
                  <p className="text-[11px] font-bold">GSTIN: {restaurant.billing.gstin}</p>
                )}
                <div className="mt-1 font-bold text-xs bg-black text-white py-0.5 rounded">
                  TABLE: {billModalOrder.tableName}
                </div>
              </div>

              {/* Order Meta */}
              <div className="text-[11px] space-y-0.5 border-b border-dashed border-black pb-2">
                <div className="flex justify-between">
                  <span>Order: <strong>{billModalOrder.orderNumber}</strong></span>
                  <span>Time: {formatTime(billModalOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest: {billModalOrder.customerName}</span>
                  <span>Ph: {billModalOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between text-forest-900 font-bold">
                  <span>Waiting Time:</span>
                  <span>~{billModalOrder.estimatedWaitTime || 15} Mins</span>
                </div>
              </div>

              {/* Kitchen Instruction */}
              {billModalOrder.specialInstructions && (
                <div className="p-1.5 bg-gray-100 border border-gray-300 rounded text-[11px] font-bold">
                  KITCHEN NOTE: {billModalOrder.specialInstructions}
                </div>
              )}

              {/* Itemized Table */}
              <div className="border-b border-dashed border-black pb-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black text-[10px] uppercase font-bold">
                      <th className="py-1">Dish</th>
                      <th className="py-1 text-center">Wait</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-gray-300">
                    {billModalOrder.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="py-1 pr-1 font-medium">{it.itemName}</td>
                        <td className="py-1 text-center text-[10px]">{it.prepTime || 10}m</td>
                        <td className="py-1 text-center font-bold">{it.quantity}</td>
                        <td className="py-1 text-right font-bold">{it.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="text-right space-y-1 text-xs border-b border-dashed border-black pb-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currency}{billModalOrder.subtotal.toFixed(2)}</span>
                </div>
                {billModalOrder.taxDetails?.totalTax > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span>Taxes (CGST + SGST):</span>
                    <span>{currency}{billModalOrder.taxDetails.totalTax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
                  <span>TOTAL BILL:</span>
                  <span>{currency}{billModalOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] pt-1">
                <p className="font-bold">*** PAY DIRECTLY AT COUNTER ***</p>
                <p className="text-gray-500">Give one copy to kitchen &bull; One copy to guest</p>
              </div>
            </div>

            {/* Print Trigger */}
            <div className="pt-4 flex gap-2 no-print">
              <button
                onClick={() => setBillModalOrder(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill & KOT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
