import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  ShoppingBag, 
  IndianRupee, 
  CheckCircle2, 
  XCircle, 
  PieChart as PieIcon,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../utils/formatters';

const PIE_COLORS = ['#183D2B', '#C59A5B', '#8FA58B', '#2A5C43', '#D6AE6E', '#1F4733', '#E8DECE'];

export default function AdminAnalyticsPage() {
  const { restaurant, orders, categories } = useRestaurant();
  const currency = restaurant.billing?.currency || '₹';

  // Core metrics derived from real orders
  const metrics = useMemo(() => {
    const validOrders = orders.filter(o => o.orderStatus !== 'cancelled');
    const totalRev = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = validOrders.length > 0 ? totalRev / validOrders.length : 0;
    const completedCount = orders.filter(o => o.orderStatus === 'completed' || o.orderStatus === 'served').length;
    const cancelledCount = orders.filter(o => o.orderStatus === 'cancelled').length;

    return {
      totalOrders: orders.length,
      validOrdersCount: validOrders.length,
      totalRevenue: totalRev,
      aov: avgOrderValue,
      completedCount,
      cancelledCount
    };
  }, [orders]);

  // Daily revenue trend (aggregating past orders by date)
  const dailyTrendData = useMemo(() => {
    const dateMap = {};

    // Seed recent 7 days if empty
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      dateMap[key] = { date: label, revenue: 0, orders: 0 };
    }

    orders.forEach(o => {
      if (o.orderStatus === 'cancelled' || !o.createdAt) return;
      const key = o.createdAt.split('T')[0];
      if (dateMap[key]) {
        dateMap[key].revenue += (o.total || 0);
        dateMap[key].orders += 1;
      }
    });

    return Object.values(dateMap);
  }, [orders]);

  // Top-selling items aggregation
  const popularItemsData = useMemo(() => {
    const itemMap = {};

    orders.forEach(order => {
      if (order.orderStatus === 'cancelled' || !order.items) return;
      order.items.forEach(it => {
        const name = it.itemName;
        if (!itemMap[name]) {
          itemMap[name] = { name, quantity: 0, revenue: 0 };
        }
        itemMap[name].quantity += it.quantity;
        itemMap[name].revenue += (it.lineTotal || 0);
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [orders]);

  // Payment method breakdown
  const paymentBreakdownData = useMemo(() => {
    const methodMap = {
      'Cash': 0,
      'UPI': 0,
      'Card': 0,
      'Pending': 0
    };

    orders.forEach(o => {
      const method = o.paymentMethod || 'Pending';
      if (methodMap[method] !== undefined) {
        methodMap[method] += (o.total || 0);
      } else {
        methodMap['Pending'] += (o.total || 0);
      }
    });

    return Object.keys(methodMap)
      .map(key => ({ name: key, value: Number(methodMap[key].toFixed(2)) }))
      .filter(item => item.value > 0);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Performance & Sales Analytics
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Realtime revenue trends, popular food items, and payment analytics for {restaurant.name}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-xs font-semibold text-charcoal-700">
          <Calendar className="w-3.5 h-3.5 text-forest-700" />
          <span>Live Aggregated Metrics</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Total Revenue</span>
            <span className="text-2xl font-bold font-serif text-charcoal-900">
              {formatCurrency(metrics.totalRevenue, currency)}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Total Orders</span>
            <span className="text-2xl font-bold font-serif text-charcoal-900">
              {metrics.totalOrders}
            </span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Avg. Order Value</span>
            <span className="text-2xl font-bold font-serif text-charcoal-900">
              {formatCurrency(metrics.aov, currency)}
            </span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Settled Orders</span>
            <span className="text-2xl font-bold font-serif text-charcoal-900">
              {metrics.completedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="font-serif font-bold text-base text-charcoal-900 mb-1 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-forest-700" />
            <span>Daily Revenue Trend (7 Days)</span>
          </h2>
          <p className="text-xs text-charcoal-700/60 mb-4">
            Aggregated gross dine-in sales across the week
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(val) => [formatCurrency(val, currency), 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#183D2B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best-Selling Dishes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="font-serif font-bold text-base text-charcoal-900 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold-600" />
            <span>Top-Selling Menu Items</span>
          </h2>
          <p className="text-xs text-charcoal-700/60 mb-4">
            Customer favorites ordered most frequently from table QR codes
          </p>

          <div className="h-64 w-full">
            {popularItemsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularItemsData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip 
                    formatter={(val, name) => [val, name === 'quantity' ? 'Units Ordered' : 'Total']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="quantity" fill="#C59A5B" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No orders data yet.
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="font-serif font-bold text-base text-charcoal-900 mb-1 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-forest-700" />
            <span>Payment Method Distribution</span>
          </h2>
          <p className="text-xs text-charcoal-700/60 mb-4">
            Revenue volume share by settlement type (Cash, UPI, Card)
          </p>

          <div className="h-64 w-full flex items-center justify-center">
            {paymentBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdownData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name} (${formatCurrency(entry.value, currency)})`}
                  >
                    {paymentBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [formatCurrency(val, currency), 'Volume']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No payment data yet.</div>
            )}
          </div>
        </div>

        {/* Order Workflow Performance Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-charcoal-900 mb-1">
            Kitchen & Service Overview
          </h2>
          <p className="text-xs text-charcoal-700/60">
            Status distribution of all recorded customer tickets
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-charcoal-800">Total Valid Orders</span>
              <span className="font-bold text-charcoal-900">{metrics.validOrdersCount}</span>
            </div>

            <div className="flex justify-between items-center bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-900">
              <span className="font-semibold">Successfully Served & Settled</span>
              <span className="font-bold">{metrics.completedCount}</span>
            </div>

            <div className="flex justify-between items-center bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-rose-900">
              <span className="font-semibold">Cancelled Orders</span>
              <span className="font-bold">{metrics.cancelledCount}</span>
            </div>

            <div className="flex justify-between items-center bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900">
              <span className="font-semibold">Active Pending / Cooking Queue</span>
              <span className="font-bold">
                {orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.orderStatus)).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
