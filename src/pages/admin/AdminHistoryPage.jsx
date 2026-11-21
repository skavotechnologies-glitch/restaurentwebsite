import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  Receipt, 
  UtensilsCrossed, 
  Phone, 
  ArrowUpRight,
  Download
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/Badge';

export default function AdminHistoryPage() {
  const { restaurant, orders } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // 'today' | '7days' | '30days' | 'all'

  const currency = restaurant.billing?.currency || '₹';

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      // Time filter
      if (timeFilter !== 'all' && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);

        if (timeFilter === 'today' && diffDays > 1) return false;
        if (timeFilter === '7days' && diffDays > 7) return false;
        if (timeFilter === '30days' && diffDays > 30) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && order.orderStatus !== statusFilter) {
        return false;
      }

      // Payment filter
      if (paymentFilter !== 'all' && order.paymentStatus !== paymentFilter) {
        return false;
      }

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
  }, [orders, timeFilter, statusFilter, paymentFilter, searchQuery]);

  const totalFilteredRevenue = useMemo(() => {
    return filteredOrders
      .filter(o => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Order & Billing History
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Archive of all customer orders, payments, receipts, and past transactions
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-xs">
          <div>
            <span className="text-charcoal-700/60 block">Filtered Orders</span>
            <strong className="text-charcoal-900 text-sm">{filteredOrders.length}</strong>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-charcoal-700/60 block">Filtered Volume</span>
            <strong className="text-forest-800 text-sm font-serif">
              {formatCurrency(totalFilteredRevenue, currency)}
            </strong>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

          {/* Order status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="served">Served Only</option>
              <option value="cancelled">Cancelled Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>

          {/* Payment status */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-semibold"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid in Full</option>
              <option value="partially-paid">Partial Payment</option>
              <option value="unpaid">Unpaid</option>
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
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Reprint Bill</th>
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
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
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

                    <td className="py-3 px-4 font-bold font-serif text-charcoal-900 whitespace-nowrap">
                      {formatCurrency(order.total, currency)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <PaymentStatusBadge status={order.paymentStatus} />
                        {order.paymentMethod && (
                          <div className="text-[10px] text-charcoal-700/60 uppercase">
                            {order.paymentMethod}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/billing?orderId=${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-charcoal-800 rounded-lg font-bold text-xs transition"
                      >
                        <Receipt className="w-3.5 h-3.5 text-forest-700" />
                        <span>Bill</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
