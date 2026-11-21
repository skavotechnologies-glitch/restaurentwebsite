import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
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
  Clock, 
  BarChart3,
  Calendar,
  UtensilsCrossed
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../utils/formatters';

const PIE_COLORS = ['#183D2B', '#C59A5B', '#8FA58B', '#2A5C43', '#D6AE6E', '#1F4733', '#E8DECE'];

export default function AdminAnalyticsPage() {
  const { restaurant, orders } = useRestaurant();
  const currency = restaurant.billing?.currency || '₹';

  const metrics = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRev / orders.length : 0;
    const billedCount = orders.filter(o => o.isBilled).length;
    const avgWaitTime = orders.length > 0
      ? Math.round(orders.reduce((sum, o) => sum + (o.estimatedWaitTime || 10), 0) / orders.length)
      : 12;

    return {
      totalOrders: orders.length,
      totalRevenue: totalRev,
      aov: avgOrderValue,
      billedCount,
      avgWaitTime
    };
  }, [orders]);

  // Daily revenue trend (aggregating past orders by date)
  const dailyTrendData = useMemo(() => {
    const dateMap = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      dateMap[key] = { date: label, revenue: 0, orders: 0 };
    }

    orders.forEach(o => {
      if (!o.createdAt) return;
      const key = o.createdAt.split('T')[0];
      if (dateMap[key]) {
        dateMap[key].revenue += (o.total || 0);
        dateMap[key].orders += 1;
      }
    });

    return Object.values(dateMap);
  }, [orders]);

  // Top-selling items aggregation with prep times
  const popularItemsData = useMemo(() => {
    const itemMap = {};

    orders.forEach(order => {
      if (!order.items) return;
      order.items.forEach(it => {
        const name = it.itemName;
        if (!itemMap[name]) {
          itemMap[name] = { name, quantity: 0, revenue: 0, prepTime: it.prepTime || 10 };
        }
        itemMap[name].quantity += it.quantity;
        itemMap[name].revenue += (it.lineTotal || 0);
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Table Sales & Waiting Time Analytics
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Realtime dining revenue, dish popularity, and kitchen turnaround times for {restaurant.name}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-xs font-semibold text-charcoal-700">
          <Calendar className="w-3.5 h-3.5 text-forest-700" />
          <span>Realtime Metrics</span>
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
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Total Sales</span>
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
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Total Table Orders</span>
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
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Avg. Bill Value</span>
            <span className="text-2xl font-bold font-serif text-charcoal-900">
              {formatCurrency(metrics.aov, currency)}
            </span>
          </div>
        </div>

        {/* Average Waiting Time */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-charcoal-700/60 block">Avg. Wait Time</span>
            <span className="text-2xl font-bold font-serif text-charcoal-900">
              ~{metrics.avgWaitTime} mins
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
            <span>Daily Sales Trend</span>
          </h2>
          <p className="text-xs text-charcoal-700/60 mb-4">
            Aggregated gross dine-in revenue across the week
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(val) => [formatCurrency(val, currency), 'Sales']}
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
            Dishes ordered most frequently from table QR codes
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
      </div>
    </div>
  );
}
