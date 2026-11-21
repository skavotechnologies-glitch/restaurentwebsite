import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UtensilsCrossed, 
  Clock, 
  Receipt, 
  Printer, 
  Phone,
  X
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters';
import { OrderBillStatusBadge } from '../../components/common/Badge';

export default function AdminOrdersPage() {
  const { restaurant, orders, markOrderBilled } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'new' | 'billed'
  const [printOrder, setPrintOrder] = useState(null);

  const currency = restaurant.billing?.currency || '₹';

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filterType === 'new' && order.isBilled) return false;
      if (filterType === 'billed' && !order.isBilled) return false;

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
  }, [orders, filterType, searchQuery]);

  const handlePrint = (order) => {
    markOrderBilled(order.id);
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
            Table Orders & Kitchen Dispatch
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Live orders from dining tables &bull; Print bill and kitchen order tickets
          </p>
        </div>

        <div className="text-xs text-charcoal-700/70 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
          Total orders: <strong className="text-charcoal-900">{orders.length}</strong>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-forest-700 text-white'
                : 'bg-slate-100 text-charcoal-700 hover:bg-slate-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilterType('new')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'new'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            Pending Bill ({orders.filter(o => !o.isBilled).length})
          </button>
          <button
            onClick={() => setFilterType('billed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'billed'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-charcoal-700 hover:bg-slate-200'
            }`}
          >
            Billed & Sent to Kitchen ({orders.filter(o => o.isBilled).length})
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

      {/* Order Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map(order => {
          const isNew = !order.isBilled;

          return (
            <div 
              key={order.id}
              className={`bg-white rounded-2xl p-4 border transition-all shadow-sm flex flex-col justify-between ${
                isNew ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                  <div>
                    <span className="font-mono font-bold text-sm text-forest-800">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-charcoal-700/60 block">
                      {formatTime(order.createdAt)}
                    </span>
                  </div>
                  <OrderBillStatusBadge isBilled={order.isBilled} />
                </div>

                <div className="flex items-center justify-between text-xs mb-3 bg-slate-50 p-2 rounded-lg">
                  <span className="font-bold text-charcoal-900 flex items-center gap-1">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-forest-700" />
                    <span>{order.tableName}</span>
                  </span>
                  <span className="font-semibold text-charcoal-700 truncate max-w-[140px]">
                    {order.customerName} ({order.customerPhone})
                  </span>
                </div>

                {/* Dishes and their wait times */}
                <div className="space-y-1 text-xs text-charcoal-800 mb-3">
                  {order.items?.map((it, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="truncate max-w-[180px]">
                        {it.quantity}x {it.itemName}
                      </span>
                      <span className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-mono">
                        {it.prepTime || 10}m prep
                      </span>
                    </div>
                  ))}
                </div>

                {order.specialInstructions && (
                  <div className="text-[11px] bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-200 mb-3">
                    Note: "{order.specialInstructions}"
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-charcoal-700/60 uppercase tracking-wider block">Total Bill</span>
                  <span className="font-serif font-bold text-sm text-charcoal-900">
                    {formatCurrency(order.total, currency)}
                  </span>
                </div>

                <button
                  onClick={() => handlePrint(order)}
                  className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isNew ? 'Generate Bill & KOT' : 'Reprint Bill'}</span>
                </button>
              </div>
            </div>
          );
        })}
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
            <div>Order: {printOrder.orderNumber} &bull; Time: {formatTime(printOrder.createdAt)}</div>
            <div>Guest: {printOrder.customerName} ({printOrder.customerPhone})</div>
            <div>Wait Time: ~{printOrder.estimatedWaitTime || 15} Mins</div>
          </div>

          {printOrder.specialInstructions && (
            <div className="py-1 font-bold">
              NOTE: {printOrder.specialInstructions}
            </div>
          )}

          <div className="py-2 border-b border-dashed border-black">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black text-[10px] uppercase">
                  <th>Dish</th>
                  <th className="text-center">Wait</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Amt</th>
                </tr>
              </thead>
              <tbody>
                {printOrder.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.itemName}</td>
                    <td className="text-center">{it.prepTime || 10}m</td>
                    <td className="text-center">{it.quantity}</td>
                    <td className="text-right">{it.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="py-2 text-right font-bold text-sm">
            <div>TOTAL BILL: {currency}{printOrder.total.toFixed(2)}</div>
          </div>

          <div className="text-center text-[10px] pt-2">
            <p>*** PAY DIRECTLY AT COUNTER ***</p>
          </div>
        </div>
      )}
    </div>
  );
}
