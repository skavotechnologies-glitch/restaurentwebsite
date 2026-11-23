import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  UtensilsCrossed, 
  Clock, 
  Receipt, 
  Printer, 
  Phone,
  QrCode, 
  Check, 
  X, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  History,
  Trash2,
  Users,
  CheckCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters';
import { generateUpiUri } from '../../utils/upi';

export default function AdminOrdersPage() {
  const { restaurant, tables, orders, markOrderBilled, settleOrders, generateBill, clearAllOrders } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'occupied' | 'pending'

  // Modal 1: Details Modal for a specific round [Details]
  const [selectedRoundModal, setSelectedRoundModal] = useState(null);

  // Modal 2: Dynamic Combined UPI QR Modal [Pay Bill]
  const [upiModalData, setUpiModalData] = useState(null);

  // Print state: single round KOT OR combined dining bill
  const [printData, setPrintData] = useState(null);

  // Notification toast on settling an order
  const [settledToast, setSettledToast] = useState(null);

  const currency = restaurant.billing?.currency || '₹';

  // 1. ONLY ACTIVE UNPAID ORDERS appear in this screen
  const activeUnpaidOrders = useMemo(() => {
    return orders.filter(o => !(o.isPaid || o.paymentStatus === 'paid' || o.status === 'paid'));
  }, [orders]);

  // 2. BUILD TABLE-BASED STRUCTURE (Matching the exact layout in the handwritten sketch)
  // Table 1, Table 2, ... Table N -> each table has horizontal customer columns
  const tableDataList = useMemo(() => {
    // A. Map known tables from configuration
    const mappedTables = tables.map(table => {
      // Find orders matching this table
      const tableOrders = activeUnpaidOrders.filter(o => 
        o.tableId === table.id || 
        (o.tableName && table.name && o.tableName.toLowerCase() === table.name.toLowerCase()) ||
        (table.tableNumber && o.tableName && o.tableName.toLowerCase() === `table ${table.tableNumber}`.toLowerCase())
      );

      // Group active orders for this table by Customer (phone or name)
      const customerMap = new Map();
      tableOrders.forEach(order => {
        const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
        const guestKey = cleanPhone || (order.customerName?.toLowerCase().trim() || 'guest');

        if (!customerMap.has(guestKey)) {
          customerMap.set(guestKey, {
            customerKey: guestKey,
            customerName: order.customerName || 'Guest',
            customerPhone: order.customerPhone || '',
            tableId: table.id,
            tableName: table.name || `Table ${table.tableNumber}`,
            rounds: []
          });
        }
        customerMap.get(guestKey).rounds.push(order);
      });

      const customers = [];
      customerMap.forEach(cust => {
        // Sort rounds chronologically (Round 1 = oldest, Round 2 = reorder, etc.)
        const sortedRounds = cust.rounds.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        const combinedTotal = sortedRounds.reduce((sum, r) => sum + (r.total || 0), 0);
        const combinedSubtotal = sortedRounds.reduce((sum, r) => sum + (r.subtotal || 0), 0);
        const combinedTax = sortedRounds.reduce((sum, r) => sum + (r.taxDetails?.totalTax || 0), 0);
        const orderIds = sortedRounds.map(r => r.id);
        const orderNumbers = sortedRounds.map(r => r.orderNumber);
        const hasUnbilled = sortedRounds.some(r => !r.isBilled);
        const totalDishes = sortedRounds.reduce((sum, r) => sum + (r.items?.reduce((c, i) => c + (i.quantity || 1), 0) || 0), 0);

        customers.push({
          ...cust,
          rounds: sortedRounds,
          roundCount: sortedRounds.length,
          combinedTotal: Number(combinedTotal.toFixed(2)),
          combinedSubtotal,
          combinedTax,
          orderIds,
          orderNumbers,
          hasUnbilled,
          totalDishes
        });
      });

      return {
        tableId: table.id,
        tableName: table.name || `Table ${table.tableNumber}`,
        capacity: table.capacity || 4,
        customers,
        isOccupied: customers.length > 0,
        hasUnbilled: customers.some(c => c.hasUnbilled),
        totalActiveGuests: customers.length
      };
    });

    // B. Check for any unmatched active orders (e.g. from custom/dynamic table names)
    const knownTableIds = new Set(tables.map(t => t.id));
    const knownTableNames = new Set(tables.map(t => t.name?.toLowerCase()));
    const unmappedOrders = activeUnpaidOrders.filter(o => 
      !knownTableIds.has(o.tableId) && !knownTableNames.has(o.tableName?.toLowerCase())
    );

    if (unmappedOrders.length > 0) {
      const extraTableMap = new Map();
      unmappedOrders.forEach(order => {
        const tName = order.tableName || 'Other Table';
        if (!extraTableMap.has(tName)) {
          extraTableMap.set(tName, []);
        }
        extraTableMap.get(tName).push(order);
      });

      extraTableMap.forEach((ordersAtTable, tName) => {
        const customerMap = new Map();
        ordersAtTable.forEach(order => {
          const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
          const guestKey = cleanPhone || (order.customerName?.toLowerCase().trim() || 'guest');
          if (!customerMap.has(guestKey)) {
            customerMap.set(guestKey, {
              customerKey: guestKey,
              customerName: order.customerName || 'Guest',
              customerPhone: order.customerPhone || '',
              tableId: order.tableId || 'T-extra',
              tableName: tName,
              rounds: []
            });
          }
          customerMap.get(guestKey).rounds.push(order);
        });

        const customers = [];
        customerMap.forEach(cust => {
          const sortedRounds = cust.rounds.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
          const combinedTotal = sortedRounds.reduce((sum, r) => sum + (r.total || 0), 0);
          const combinedSubtotal = sortedRounds.reduce((sum, r) => sum + (r.subtotal || 0), 0);
          const combinedTax = sortedRounds.reduce((sum, r) => sum + (r.taxDetails?.totalTax || 0), 0);
          const orderIds = sortedRounds.map(r => r.id);
          const orderNumbers = sortedRounds.map(r => r.orderNumber);
          const hasUnbilled = sortedRounds.some(r => !r.isBilled);
          const totalDishes = sortedRounds.reduce((sum, r) => sum + (r.items?.reduce((c, i) => c + (i.quantity || 1), 0) || 0), 0);

          customers.push({
            ...cust,
            rounds: sortedRounds,
            roundCount: sortedRounds.length,
            combinedTotal: Number(combinedTotal.toFixed(2)),
            combinedSubtotal,
            combinedTax,
            orderIds,
            orderNumbers,
            hasUnbilled,
            totalDishes
          });
        });

        mappedTables.push({
          tableId: `extra-${tName}`,
          tableName: tName,
          capacity: 4,
          customers,
          isOccupied: customers.length > 0,
          hasUnbilled: customers.some(c => c.hasUnbilled),
          totalActiveGuests: customers.length
        });
      });
    }

    return mappedTables;
  }, [tables, activeUnpaidOrders]);

  // Filter tables according to search query and active tab
  const filteredTableList = useMemo(() => {
    return tableDataList.filter(item => {
      // Filter tab
      if (filterType === 'occupied' && !item.isOccupied) return false;
      if (filterType === 'pending' && !item.hasUnbilled) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTable = item.tableName.toLowerCase().includes(q);
        const matchesCustomer = item.customers.some(c => 
          c.customerName.toLowerCase().includes(q) || 
          c.customerPhone.includes(q) ||
          c.orderNumbers.some(num => num?.toLowerCase().includes(q))
        );
        if (!matchesTable && !matchesCustomer) return false;
      }

      return true;
    });
  }, [tableDataList, filterType, searchQuery]);

  // Overall KPI counts
  const totalOccupiedTables = useMemo(() => {
    return tableDataList.filter(t => t.isOccupied).length;
  }, [tableDataList]);

  const totalUnbilledRounds = useMemo(() => {
    return activeUnpaidOrders.filter(o => !o.isBilled).length;
  }, [activeUnpaidOrders]);

  const totalActiveRevenue = useMemo(() => {
    return activeUnpaidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [activeUnpaidOrders]);

  // HANDLERS
  // 1. [Bill] button: Generate Bill & KOT for an individual round
  const handlePrintRoundKOT = async (e, round, roundNumber, tableName, customerName) => {
    if (e) e.stopPropagation();
    await markOrderBilled(round.id);
    const bill = generateBill(round.id);
    setPrintData({
      type: 'kot',
      roundNumber,
      order: round,
      tableName,
      customerName,
      bill
    });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // 2. [Details] button: Open details modal for that specific round
  const handleOpenRoundDetails = (e, round, roundNumber, tableName, customerName) => {
    if (e) e.stopPropagation();
    setSelectedRoundModal({
      round,
      roundNumber,
      tableName,
      customerName
    });
  };

  // 3. [Pay Bill] button: Open dynamic combined UPI QR for Round 1 + Round 2
  const handleOpenCombinedUpi = (e, customer) => {
    if (e) e.stopPropagation();

    const upiId = restaurant.billing?.upiId || 'naachicafe@okaxis';
    const payeeName = restaurant.billing?.upiPayeeName || restaurant.name || 'Naachi Café';
    const note = `Bill ${customer.tableName} (${customer.orderNumbers.join(', ')})`;

    const upiUri = generateUpiUri({
      upiId,
      payeeName,
      amount: customer.combinedTotal,
      transactionNote: note,
      orderRef: customer.orderNumbers.join('-')
    });

    setUpiModalData({
      customer,
      guestName: customer.customerName,
      guestPhone: customer.customerPhone,
      tableName: customer.tableName,
      orderIds: customer.orderIds,
      amount: customer.combinedTotal,
      rounds: customer.rounds,
      orderRef: customer.orderNumbers.join(', '),
      upiId,
      payeeName,
      upiUri
    });
  };

  // 4. [Paid] button: Mark customer's tab as Paid -> disappears immediately and archives to History
  const handleMarkCustomerPaid = async (e, customer, paymentMethod = 'Counter') => {
    if (e) e.stopPropagation();

    await settleOrders(customer.orderIds, paymentMethod);

    // Close any open modals
    setUpiModalData(null);
    setSelectedRoundModal(null);

    // Show temporary confirmation toast
    setSettledToast(`${customer.tableName} (${customer.customerName}) bill of ${formatCurrency(customer.combinedTotal, currency)} marked as Paid and stored in History!`);
    setTimeout(() => setSettledToast(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {settledToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-elevated border border-emerald-600 flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <span className="text-xs font-semibold">{settledToast}</span>
          <button onClick={() => setSettledToast(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Table Dining &amp; Orders Queue
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Table view &bull; Per-round kitchen billing &bull; Combined UPI QR checkout &bull; Auto-archive to history
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeUnpaidOrders.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all active orders?")) {
                  clearAllOrders();
                }
              }}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Clear all orders in queue"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Clear Orders</span>
            </button>
          )}

          <Link
            to="/admin/history"
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-charcoal-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <History className="w-4 h-4 text-forest-700" />
            <span>Order History</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">Occupied Tables</div>
          <div className="font-serif font-bold text-2xl text-charcoal-900 mt-0.5">{totalOccupiedTables}</div>
          <span className="text-[10px] text-charcoal-400">of {tableDataList.length} tables active</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm bg-amber-50/20">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending Kitchen Bills</div>
          <div className="font-serif font-bold text-2xl text-amber-900 mt-0.5">{totalUnbilledRounds}</div>
          <span className="text-[10px] text-amber-700/80">Need [Bill] generation</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">Active Rounds</div>
          <div className="font-serif font-bold text-2xl text-forest-900 mt-0.5">{activeUnpaidOrders.length}</div>
          <span className="text-[10px] text-forest-700">Rounds across dining tables</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm bg-emerald-50/20">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Total Active Bill</div>
          <div className="font-serif font-bold text-2xl text-emerald-900 mt-0.5">
            {formatCurrency(totalActiveRevenue, currency)}
          </div>
          <span className="text-[10px] text-emerald-700/80">Dining balance</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterType === 'all'
                ? 'bg-forest-700 text-white shadow-sm'
                : 'bg-slate-100 text-charcoal-700 hover:bg-slate-200'
            }`}
          >
            All Tables ({tableDataList.length})
          </button>
          <button
            onClick={() => setFilterType('occupied')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterType === 'occupied'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            Occupied Tables ({totalOccupiedTables})
          </button>
          <button
            onClick={() => setFilterType('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterType === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            Needs Kitchen Bill ({totalUnbilledRounds})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search table, guest, order #..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABLE-BASED LAYOUT (MATCHING THE HANDWRITTEN SKETCH EXACTLY)              */}
      {/* Table 1 | Customer 1 (Rounds, Bill, Details, Pay bill, Paid) | Customer 2 */}
      {/* Table 2 | Customer 1 ...                                                  */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {filteredTableList.map(tableRow => {
          const { tableId, tableName, capacity, customers, isOccupied, hasUnbilled } = tableRow;

          return (
            <div 
              key={tableId}
              className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden flex flex-col md:flex-row ${
                isOccupied 
                  ? (hasUnbilled ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-300')
                  : 'border-slate-200 opacity-80'
              }`}
            >
              {/* LEFT COLUMN: TABLE IDENTIFIER (Table 1, Table 2, ... Table N) */}
              <div className="md:w-52 p-4 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex md:flex-col justify-between items-center md:items-start flex-shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-forest-800 text-gold-400 font-bold flex items-center justify-center text-xs shadow-sm">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-serif font-bold text-lg text-charcoal-900 leading-tight">
                        {tableName}
                      </h2>
                      <span className="text-[11px] text-charcoal-500 font-medium">
                        Capacity: {capacity} Seats
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-0 md:mt-4">
                  {isOccupied ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-forest-100 text-forest-800 border border-forest-300">
                        <Users className="w-3 h-3" />
                        <span>Occupied ({customers.length} {customers.length === 1 ? 'Guest' : 'Guests'})</span>
                      </span>
                      {hasUnbilled && (
                        <span className="block text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 animate-pulse">
                          ● Needs Kitchen Bill
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-200/70 text-charcoal-600">
                      <span>Available</span>
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT AREA: CUSTOMER COLUMNS UNDER THIS TABLE */}
              <div className="flex-1 p-3 sm:p-4 bg-white overflow-x-auto">
                {!isOccupied ? (
                  <div className="py-6 px-4 text-center text-charcoal-400 text-xs italic">
                    No active orders placed at {tableName}. When a customer scans and orders, their round details will appear here.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {customers.map(customer => {
                      return (
                        <div 
                          key={customer.customerKey}
                          className="border border-slate-300 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3 shadow-xs hover:border-slate-400 transition"
                        >
                          <div>
                            {/* Card Header: Customer Name (and phone) */}
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                              <div>
                                <span className="text-[10px] text-charcoal-400 uppercase tracking-wider font-semibold block">
                                  Customer Name
                                </span>
                                <h3 className="font-serif font-bold text-base text-charcoal-900 leading-tight">
                                  {customer.customerName}
                                </h3>
                                {customer.customerPhone && (
                                  <span className="text-[11px] text-charcoal-500 font-mono">
                                    {customer.customerPhone}
                                  </span>
                                )}
                              </div>

                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 border border-forest-200 self-start">
                                {customer.roundCount} {customer.roundCount === 1 ? 'Round' : 'Rounds'}
                              </span>
                            </div>

                            {/* ROUNDS LIST (round 1, round 2, etc.) */}
                            <div className="space-y-2">
                              {customer.rounds.map((round, rIdx) => {
                                const isRoundBilled = Boolean(round.isBilled);

                                return (
                                  <div 
                                    key={round.id}
                                    className={`p-2.5 rounded-xl border text-xs space-y-2 transition ${
                                      !isRoundBilled
                                        ? 'bg-amber-50/80 border-amber-300'
                                        : 'bg-white border-slate-200'
                                    }`}
                                  >
                                    {/* Round label & items preview */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-forest-900 font-serif">
                                          round {rIdx + 1}
                                        </span>
                                        <span className="text-[10px] font-mono text-charcoal-500">
                                          ({round.orderNumber})
                                        </span>
                                      </div>

                                      <span className="font-serif font-bold text-charcoal-900">
                                        {formatCurrency(round.total, currency)}
                                      </span>
                                    </div>

                                    {/* Summary of dishes in this round */}
                                    <div className="text-[11px] text-charcoal-700 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                                      {round.items?.map(it => `${it.quantity}x ${it.itemName}`).join(', ')}
                                    </div>

                                    {/* Side-by-side [Bill] and [details] buttons exactly as in sketch */}
                                    <div className="flex items-center justify-end gap-2 pt-0.5">
                                      {/* [Bill] Button: Generates kitchen bill / KOT */}
                                      <button
                                        type="button"
                                        onClick={(e) => handlePrintRoundKOT(e, round, rIdx + 1, customer.tableName, customer.customerName)}
                                        className={`py-1 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95 ${
                                          !isRoundBilled
                                            ? 'bg-forest-700 hover:bg-forest-800 text-white'
                                            : 'bg-slate-200 hover:bg-slate-300 text-charcoal-800'
                                        }`}
                                        title={!isRoundBilled ? `Generate KOT bill for round ${rIdx + 1}` : `Reprint KOT bill for round ${rIdx + 1}`}
                                      >
                                        <Printer className="w-3 h-3" />
                                        <span>{!isRoundBilled ? 'Bill' : 'Billed (Reprint)'}</span>
                                      </button>

                                      {/* [details] Button: Shows dishes details of this round */}
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenRoundDetails(e, round, rIdx + 1, customer.tableName, customer.customerName)}
                                        className="py-1 px-3 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-charcoal-800 border border-slate-300 transition flex items-center gap-1 shadow-xs active:scale-95"
                                        title={`View details of round ${rIdx + 1}`}
                                      >
                                        <Eye className="w-3 h-3 text-forest-700" />
                                        <span>details</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* BOTTOM ROW: Combined Total + [Pay bill] + [Paid] (Matches sketch!) */}
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            {/* Combined Total Display */}
                            <div className="flex items-center justify-between text-xs px-1">
                              <span className="text-charcoal-500 font-semibold uppercase tracking-wider text-[10px]">
                                Combined Total ({customer.roundCount} {customer.roundCount === 1 ? 'Round' : 'Rounds'})
                              </span>
                              <span className="font-serif font-bold text-base text-forest-900">
                                {formatCurrency(customer.combinedTotal, currency)}
                              </span>
                            </div>

                            {/* [Pay bill] and [Paid] Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* [Pay bill]: Shows dynamic UPI QR for Round 1 + Round 2 */}
                              <button
                                type="button"
                                onClick={(e) => handleOpenCombinedUpi(e, customer)}
                                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                title="Generate combined UPI QR for all rounds"
                              >
                                <QrCode className="w-3.5 h-3.5 text-amber-200" />
                                <span>Pay bill</span>
                              </button>

                              {/* [Paid]: Marks order as paid, disappears from table, stored in history */}
                              <button
                                type="button"
                                onClick={(e) => handleMarkCustomerPaid(e, customer, 'Counter')}
                                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                title="Mark bill as Paid: tab closes and moves to History"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Paid</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: [details] BUTTON MODAL                                           */}
      {/* ========================================================================= */}
      {selectedRoundModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-elevated border border-slate-200 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-forest-800 text-gold-400 font-bold flex items-center justify-center shadow-xs">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-charcoal-900 leading-tight">
                    {selectedRoundModal.tableName} &bull; round {selectedRoundModal.roundNumber} details
                  </h3>
                  <p className="text-[11px] text-charcoal-500">
                    Customer: {selectedRoundModal.customerName} &bull; Order #{selectedRoundModal.round.orderNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRoundModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Dishes itemized list */}
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider border-b border-slate-100 pb-1">
                Ordered Dishes in round {selectedRoundModal.roundNumber}
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {selectedRoundModal.round.items?.map((it, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-charcoal-800">
                    <div>
                      <div className="font-bold text-charcoal-900">
                        {it.quantity}x {it.itemName}
                      </div>
                      <div className="text-[10px] text-charcoal-500 flex items-center gap-1.5 mt-0.5">
                        <span>{it.quantity} &times; {formatCurrency(it.priceAtOrder || (it.lineTotal / (it.quantity || 1)), currency)}</span>
                        <span>&bull;</span>
                        <span className="text-amber-800 font-mono font-semibold">{it.prepTime || 10}m prep</span>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-charcoal-900">
                      {formatCurrency(it.lineTotal, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {selectedRoundModal.round.specialInstructions && (
                <div className="text-xs text-forest-800 italic bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  Special Note: "{selectedRoundModal.round.specialInstructions}"
                </div>
              )}

              {/* Round Totals */}
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs text-charcoal-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedRoundModal.round.subtotal, currency)}</span>
                </div>
                {selectedRoundModal.round.taxDetails?.totalTax > 0 && (
                  <div className="flex justify-between">
                    <span>Taxes (CGST + SGST)</span>
                    <span>{formatCurrency(selectedRoundModal.round.taxDetails.totalTax, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-sm font-bold text-charcoal-900 pt-1.5 border-t border-slate-200">
                  <span className="font-serif">Round Total</span>
                  <span className="font-serif text-forest-900 text-base">
                    {formatCurrency(selectedRoundModal.round.total, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={(e) => {
                  handlePrintRoundKOT(e, selectedRoundModal.round, selectedRoundModal.roundNumber, selectedRoundModal.tableName, selectedRoundModal.customerName);
                  setSelectedRoundModal(null);
                }}
                className="py-1.5 px-3 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill / KOT</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoundModal(null)}
                className="py-1.5 px-3 bg-white hover:bg-slate-100 text-charcoal-800 border border-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: [Pay bill] DYNAMIC COMBINED UPI QR MODAL                          */}
      {/* ========================================================================= */}
      {upiModalData && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-elevated border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-left">
                <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                  Combined Dine-In Payment
                </span>
                <h3 className="font-serif font-bold text-base text-charcoal-900">
                  {upiModalData.tableName} &bull; {upiModalData.guestName}
                </h3>
              </div>
              <button
                onClick={() => setUpiModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Combined Dynamic UPI QR Code */}
            <div className="p-4 bg-amber-50/50 rounded-2xl border-2 border-amber-200 inline-block">
              <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200">
                <QRCodeSVG
                  value={upiModalData.upiUri}
                  size={195}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Combined Bill Summary */}
            <div className="space-y-1">
              <div className="text-[11px] text-charcoal-500 uppercase tracking-wider font-semibold">
                Total Amount to Collect ({upiModalData.rounds?.length} Rounds Combined)
              </div>
              <div className="font-serif font-bold text-3xl text-forest-900">
                {formatCurrency(upiModalData.amount, currency)}
              </div>
              <div className="text-xs text-charcoal-600 font-mono">
                UPI ID: <strong>{upiModalData.upiId}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Ref: {upiModalData.orderRef}
              </div>
            </div>

            {/* Round Breakdown chips */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
              <span className="font-bold text-charcoal-800 text-[11px] block">
                Includes All Rounds:
              </span>
              {upiModalData.rounds?.map((r, idx) => (
                <div key={r.id} className="flex justify-between text-[11px] text-charcoal-600">
                  <span>round {idx + 1} ({r.orderNumber}): {r.items?.map(i => `${i.quantity}x ${i.itemName}`).join(', ')}</span>
                  <span className="font-semibold text-charcoal-900">{formatCurrency(r.total, currency)}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-charcoal-500">
              Customer scans via GPay, PhonePe, Paytm, or BHIM &bull; One single scan pays all rounds.
            </p>

            {/* [Paid] button inside modal: marks as paid, disappears from table, archives to history */}
            <button
              type="button"
              onClick={(e) => handleMarkCustomerPaid(e, upiModalData.customer, 'UPI')}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Payment Received (Mark as Paid)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIDDEN PRINT RECEIPT (KOT OR COMBINED BILL)                               */}
      {/* ========================================================================= */}
      {printData && (
        <div id="printable-receipt" className="hidden print:block font-mono text-xs text-black p-4">
          <div className="text-center pb-2 border-b border-dashed border-black">
            <h2 className="font-bold text-base uppercase">{restaurant.name}</h2>
            <p className="text-[11px]">{restaurant.address}</p>
            <div className="mt-1 font-bold text-sm bg-black text-white py-0.5">
              {printData.type === 'kot' ? `KITCHEN ORDER TICKET (ROUND ${printData.roundNumber})` : 'FINAL DINING RECEIPT'}
            </div>
            <div className="font-bold text-sm mt-1">
              TABLE: {printData.tableName || printData.order?.tableName}
            </div>
          </div>

          <div className="py-2 border-b border-dashed border-black text-[11px]">
            <div>
              Order: {printData.order?.orderNumber} &bull; Time: {formatTime(new Date().toISOString())}
            </div>
            <div>
              Guest: {printData.customerName || printData.order?.customerName} 
            </div>
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
                {printData.order?.items?.map((it, idx) => (
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
            <div>
              TOTAL: {currency}{printData.order?.total?.toFixed(2)}
            </div>
          </div>

          <div className="text-center text-[10px] pt-2">
            <p>*** CHEF PREPARATION COPY ***</p>
          </div>
        </div>
      )}
    </div>
  );
}
