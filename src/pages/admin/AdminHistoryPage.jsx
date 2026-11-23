import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Receipt, 
  UtensilsCrossed, 
  Clock, 
  Printer, 
  X,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime, formatTime } from '../../utils/formatters';
import { OrderBillStatusBadge } from '../../components/common/Badge';

export default function AdminHistoryPage() {
  const { restaurant, orders } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [billFilter, setBillFilter] = useState('all'); // 'all' | 'paid' | 'billed' | 'pending'
  const [timeFilter, setTimeFilter] = useState('all'); // 'today' | '7days' | '30days' | 'all'
  const [printOrder, setPrintOrder] = useState(null);

  const currency = restaurant.billing?.currency || '₹';

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const result = orders.filter(order => {
      const isPaid = Boolean(order.isPaid || order.paymentStatus === 'paid' || order.status === 'paid');

      // Time filter
      if (timeFilter !== 'all' && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);

        if (timeFilter === 'today' && diffDays > 1) return false;
        if (timeFilter === '7days' && diffDays > 7) return false;
        if (timeFilter === '30days' && diffDays > 30) return false;
      }

      // Bill status filter
      if (billFilter === 'paid' && !isPaid) return false;
      if (billFilter === 'billed' && (!order.isBilled || isPaid)) return false;
      if (billFilter === 'pending' && (order.isBilled || isPaid)) return false;

      // Search query
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

    // Newest orders first
    return result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders, timeFilter, billFilter, searchQuery]);

  const totalFilteredRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [filteredOrders]);

  const paidOrdersCount = useMemo(() => {
    return orders.filter(o => o.isPaid || o.paymentStatus === 'paid' || o.status === 'paid').length;
  }, [orders]);

  const handlePrint = (order) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Order &amp; Kitchen Billing History
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Archive of completed table orders, payment settlements, and kitchen tickets
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-xs">
          <div>
            <span className="text-charcoal-700/60 block">Paid Orders</span>
            <strong className="text-emerald-700 text-sm font-bold">{paidOrdersCount}</strong>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-charcoal-700/60 block">Filtered Sales</span>
            <strong className="text-forest-800 text-sm font-serif">
              {formatCurrency(totalFilteredRevenue, currency)}
            </strong>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, phone, customer..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          {/* Time range */}
          <div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-semibold"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
            </select>
          </div>

          {/* Bill status */}
          <div>
            <select
              value={billFilter}
              onChange={(e) => setBillFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-semibold"
            >
              <option value="all">All Orders ({orders.length})</option>
              <option value="paid">✓ Paid &amp; Settled ({paidOrdersCount})</option>
              <option value="billed">Billed in Kitchen</option>
              <option value="pending">Pending Bill</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-charcoal-700/70 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order No</th>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Wait Time</th>
                <th className="py-3 px-4">Bill Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Reprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-charcoal-700/70">
                    No orders matching selected criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isPaid = Boolean(order.isPaid || order.paymentStatus === 'paid' || order.status === 'paid');

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-slate-50 transition ${
                        isPaid ? 'bg-emerald-50/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-forest-800">
                        {order.orderNumber}
                      </td>

                      <td className="py-3 px-4 text-charcoal-700/80 whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>

                      <td className="py-3 px-4 font-bold text-charcoal-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-charcoal-800">
                          <UtensilsCrossed className="w-3 h-3 text-forest-700" />
                          <span>{order.tableName}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal-900">{order.customerName}</div>
                        <div className="text-[11px] text-charcoal-700/70">{order.customerPhone}</div>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-charcoal-800">
                        {order.items?.map(i => `${i.quantity}x ${i.itemName}`).join(', ')}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>~{order.estimatedWaitTime || 10}m</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold font-serif text-charcoal-900 whitespace-nowrap">
                        {formatCurrency(order.total, currency)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <OrderBillStatusBadge order={order} />
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handlePrint(order)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-charcoal-800 rounded-lg font-bold text-xs transition"
                          title="Reprint receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-forest-700" />
                          <span>Bill</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden container for print */}
      {printOrder && (
        <div id="printable-receipt" className="hidden print:block font-mono text-xs text-black p-4">
          <div className="text-center pb-2 border-b border-dashed border-black">
            <h2 className="font-bold text-base uppercase">{restaurant.name}</h2>
            <p className="text-[11px]">{restaurant.address}</p>
            <div className="mt-1 font-bold text-sm bg-black text-white py-0.5">
              TABLE: {printOrder.tableName}
            </div>
          </div>

          <div className="py-2 border-b border-dashed border-black text-[11px]">
            <div>Order: {printOrder.orderNumber} &bull; Time: {formatDateTime(printOrder.createdAt)}</div>
            <div>Guest: {printOrder.customerName} ({printOrder.customerPhone})</div>
          </div>

          <div className="py-2 border-b border-dashed border-black">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black text-[10px] uppercase">
                  <th className="text-left">Dish</th>
                  <th className="text-center">Wait</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Amt</th>
                </tr>
              </thead>
              <tbody>
                {printOrder.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td className="text-left">{it.itemName}</td>
                    <td className="text-center">{it.prepTime || 10}m</td>
                    <td className="text-center">{it.quantity}</td>
                    <td className="text-right">{it.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="py-2 text-right font-bold text-sm">
            <div>TOTAL BILL: {currency}{printOrder.total?.toFixed(2)}</div>
          </div>

          <div className="text-center text-[10px] pt-2">
            <p>{printOrder.isPaid ? '*** PAID & SETTLED ***' : '*** CHEF PREPARATION COPY ***'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
