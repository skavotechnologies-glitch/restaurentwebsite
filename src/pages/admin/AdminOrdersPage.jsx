import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ArrowRight,
  Banknote,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters';
import { generateUpiUri } from '../../utils/upi';

// Robust helper to match orders to tables regardless of format (e.g. "T06", "6", "T6", "Table 6")
const isOrderForTable = (order, table) => {
  if (!order || !table) return false;
  
  const oTId = (order.tableId || '').toString().toLowerCase().trim();
  const tId = (table.id || '').toString().toLowerCase().trim();
  if (oTId && tId && oTId === tId) return true;

  // Normalized table number comparison (e.g. T06 -> 6, T6 -> 6, 6 -> 6)
  const oNum = oTId.replace(/^t0*/i, '');
  const tNum = (table.tableNumber || tId.replace(/^t0*/i, '')).toString().toLowerCase().trim();
  if (oNum && tNum && oNum === tNum) return true;

  // Normalized table name comparison (e.g. "Table 6" -> "table6", "Table T06" -> "table6")
  const oName = (order.tableName || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '').replace(/t0*/g, '');
  const tName = (table.name || `Table ${tNum}`).toString().toLowerCase().replace(/[^a-z0-9]/g, '').replace(/t0*/g, '');
  if (oName && tName && (oName === tName || oName === `table${tNum}`)) return true;

  return false;
};

export default function AdminOrdersPage() {
  const { restaurant, tables, orders, markOrderBilled, settleOrders, generateBill, clearAllOrders } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'occupied' | 'pending'

  // Modal 1: Details Modal for a specific round [Details]
  const [selectedRoundModal, setSelectedRoundModal] = useState(null);

  // Modal 2: Dynamic Combined UPI QR Modal [Pay Bill]
  const [upiModalData, setUpiModalData] = useState(null);
  const [modalQrMode, setModalQrMode] = useState('stand'); // 'stand' | 'dynamic'

  // Print state: single round KOT OR combined dining bill
  const [printData, setPrintData] = useState(null);

  // Notification toast on settling an order
  const [settledToast, setSettledToast] = useState(null);

  // Auto-Print Toggle (Cash on Delivery orders trigger automatic printing on billing printer)
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => {
    return restaurant.billing?.autoPrintCashOrders !== false;
  });
  const autoPrintedOrderIdsRef = useRef(new Set());

  // Listen for newly placed orders broadcasted by customer
  useEffect(() => {
    const handleOrderArrival = (e) => {
      const order = e.detail?.order;
      if (!order || !autoPrintEnabled) return;

      // Auto-print all placed orders (Cash on Delivery OR Online UPI) directly to billing machine!
      if (autoPrintedOrderIdsRef.current.has(order.id)) return;
      autoPrintedOrderIdsRef.current.add(order.id);

      markOrderBilled(order.id);
      const bill = generateBill(order.id);
      setPrintData({
        type: 'kot',
        roundNumber: order.roundNumber || 1,
        order,
        tableName: order.tableName,
        customerName: order.customerName,
        bill
      });

      const modeText = order.paymentMethod === 'upi' ? 'Paid via UPI' : 'Cash on Delivery';
      setSettledToast({
        title: `🖨️ KOT Sent to Billing Machine`,
        message: `${order.tableName} • ${order.customerName} • ${modeText} • Tear & Give to Kitchen`
      });

      setTimeout(() => {
        window.print();
      }, 250);
    };

    window.addEventListener('qr_new_order_placed', handleOrderArrival);
    return () => window.removeEventListener('qr_new_order_placed', handleOrderArrival);
  }, [autoPrintEnabled, markOrderBilled, generateBill]);

  // Also auto-print recently placed orders synced from database/storage
  useEffect(() => {
    if (!autoPrintEnabled) return;
    orders.forEach(order => {
      if (order.isSettled || order.status === 'settled' || order.status === 'archived') return;
      const ageInMs = Date.now() - new Date(order.createdAt || 0).getTime();
      if (ageInMs < 25000 && !autoPrintedOrderIdsRef.current.has(order.id)) {
        autoPrintedOrderIdsRef.current.add(order.id);
        markOrderBilled(order.id);
        const bill = generateBill(order.id);
        setPrintData({
          type: 'kot',
          roundNumber: order.roundNumber || 1,
          order,
          tableName: order.tableName,
          customerName: order.customerName,
          bill
        });
        const modeText = order.paymentMethod === 'upi' ? 'Paid via UPI' : 'Cash on Delivery';
        setSettledToast({
          title: `🖨️ KOT Sent to Billing Machine`,
          message: `${order.tableName} • ${order.customerName} • ${modeText} • Tear & Give to Kitchen`
        });
        setTimeout(() => {
          window.print();
        }, 250);
      }
    });
  }, [orders, autoPrintEnabled, markOrderBilled, generateBill]);

  const currency = restaurant.billing?.currency || '₹';

  // 1. ACTIVE DINING ORDERS: table sessions currently dining (not yet settled/cleared by admin)
  const activeUnpaidOrders = useMemo(() => {
    return orders.filter(o => !o.isSettled && o.status !== 'settled' && o.status !== 'archived');
  }, [orders]);

  // 2. BUILD TABLE-BASED STRUCTURE (Matching the exact layout in the handwritten sketch)
  // Table 1, Table 2, ... Table N -> each table has horizontal customer columns
  const tableDataList = useMemo(() => {
    // A. Map known tables from configuration
    const mappedTables = tables.map(table => {
      // Find orders matching this table using robust matcher
      const tableOrders = activeUnpaidOrders.filter(o => isOrderForTable(o, table));

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

      // Compute earliest and latest active order timestamps for this table
      const orderTimestamps = customers.flatMap(c => 
        c.rounds.map(r => new Date(r.createdAt || 0).getTime())
      ).filter(t => !isNaN(t) && t > 0);

      const earliestOrderTime = orderTimestamps.length > 0 ? Math.min(...orderTimestamps) : Infinity;
      const latestOrderTime = orderTimestamps.length > 0 ? Math.max(...orderTimestamps) : 0;

      return {
        tableId: table.id,
        tableName: table.name || `Table ${table.tableNumber}`,
        capacity: table.capacity || 4,
        customers,
        isOccupied: customers.length > 0,
        hasUnbilled: customers.some(c => c.hasUnbilled),
        totalActiveGuests: customers.length,
        earliestOrderTime,
        latestOrderTime
      };
    });

    // B. Check for any unmatched active orders (e.g. from custom/dynamic table names)
    const unmappedOrders = activeUnpaidOrders.filter(o => 
      !tables.some(table => isOrderForTable(o, table))
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

        const orderTimestamps = customers.flatMap(c => 
          c.rounds.map(r => new Date(r.createdAt || 0).getTime())
        ).filter(t => !isNaN(t) && t > 0);

        const earliestOrderTime = orderTimestamps.length > 0 ? Math.min(...orderTimestamps) : Infinity;
        const latestOrderTime = orderTimestamps.length > 0 ? Math.max(...orderTimestamps) : 0;

        mappedTables.push({
          tableId: `extra-${tName}`,
          tableName: tName,
          capacity: 4,
          customers,
          isOccupied: customers.length > 0,
          hasUnbilled: customers.some(c => c.hasUnbilled),
          totalActiveGuests: customers.length,
          earliestOrderTime,
          latestOrderTime
        });
      });
    }

    // First-come, first-served priority sorting:
    // 1. Occupied tables with active orders ALWAYS appear FIRST (at the top).
    // 2. Among occupied tables:
    //    a) Tables with unbilled rounds needing kitchen bill are prioritized.
    //    b) First-come, first-served (FIFO: earliest active order timestamp first).
    // 3. Available/vacant tables appear after occupied tables, sorted numerically (Table 1, Table 2, ...).
    return mappedTables.sort((a, b) => {
      // 1. Occupied tables come before available tables
      if (a.isOccupied !== b.isOccupied) {
        return a.isOccupied ? -1 : 1;
      }

      // 2. Both tables have active orders
      if (a.isOccupied && b.isOccupied) {
        // High priority: needs kitchen bill
        if (a.hasUnbilled !== b.hasUnbilled) {
          return a.hasUnbilled ? -1 : 1;
        }

        // First-come, first-served: table with earliest active order first
        if (a.earliestOrderTime !== b.earliestOrderTime) {
          return a.earliestOrderTime - b.earliestOrderTime;
        }
      }

      // 3. Natural table ordering for available tables (Table 1, Table 2...)
      return a.tableName.localeCompare(b.tableName, undefined, { numeric: true });
    });
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

    const upiId = restaurant.billing?.upiId || 'palanikathirvel05@okaxis';
    const payeeName = restaurant.billing?.upiPayeeName || 'Palani P.K__001';
    const note = `Bill ${customer.tableName} (${customer.orderNumbers.join(', ')})`;

    const upiUri = generateUpiUri({
      upiId,
      payeeName,
      amount: customer.combinedTotal,
      transactionNote: note,
      orderRef: customer.orderNumbers.join('-'),
      aid: restaurant.billing?.upiAid || 'uGICAgMD27bClFw'
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
          <button
            type="button"
            onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border ${
              autoPrintEnabled 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title="Toggle automatic thermal printing when Cash on Delivery orders arrive"
          >
            <Printer className={`w-3.5 h-3.5 ${autoPrintEnabled ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span>Auto-Print: {autoPrintEnabled ? 'ON' : 'OFF'}</span>
          </button>

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
          const occupiedQueueRank = isOccupied ? (filteredTableList.filter(t => t.isOccupied).indexOf(tableRow) + 1) : null;

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
                      <div className="flex items-center gap-1.5">
                        <h2 className="font-serif font-bold text-lg text-charcoal-900 leading-tight">
                          {tableName}
                        </h2>
                        {occupiedQueueRank && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap">
                            Queue #{occupiedQueueRank}
                          </span>
                        )}
                      </div>
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
                      const isUpiPayment = customer.rounds.some(r => r.paymentMethod === 'upi');
                      const upiRef = customer.rounds.find(r => r.upiRef)?.upiRef;

                      return (
                        <div 
                          key={customer.customerKey}
                          className="border border-slate-300 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3 shadow-xs hover:border-slate-400 transition"
                        >
                          <div>
                            {/* Card Header: Customer Name, Phone & Payment Method Badge */}
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                              <div>
                                <span className="text-[10px] text-charcoal-400 uppercase tracking-wider font-semibold block">
                                  Customer Name
                                </span>
                                <h3 className="font-serif font-bold text-base text-charcoal-900 leading-tight">
                                  {customer.customerName}
                                </h3>
                                {customer.customerPhone && (
                                  <span className="text-[11px] text-charcoal-500 font-mono block">
                                    {customer.customerPhone}
                                  </span>
                                )}
                                {upiRef && (
                                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                                    <span>UTR: {upiRef}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 border border-forest-200 self-end">
                                  {customer.roundCount} {customer.roundCount === 1 ? 'Round' : 'Rounds'}
                                </span>
                                {isUpiPayment ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                                    <Smartphone className="w-3 h-3 text-purple-700" />
                                    <span>UPI to Owner</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <Banknote className="w-3 h-3 text-emerald-700" />
                                    <span>Cash on Counter</span>
                                  </span>
                                )}
                              </div>
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
                                        {round.paymentMethod === 'upi' ? (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">
                                            UPI
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                                            Cash
                                          </span>
                                        )}
                                      </div>

                                      <span className="font-serif font-bold text-charcoal-900">
                                        {formatCurrency(round.total, currency)}
                                      </span>
                                    </div>

                                    {/* Summary of dishes in this round with quantities & notes */}
                                    <div className="space-y-1 bg-white p-2 rounded-xl border border-slate-200">
                                      {round.items?.map((it, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                          <span className="font-semibold text-charcoal-900">
                                            {it.quantity}x {it.itemName}
                                          </span>
                                          <span className="text-charcoal-500 font-mono text-[11px]">
                                            {formatCurrency(it.lineTotal, currency)}
                                          </span>
                                        </div>
                                      ))}
                                      {round.specialInstructions && (
                                        <div className="mt-1 text-[10px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                                          📝 Note: {round.specialInstructions}
                                        </div>
                                      )}
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
                              <div className="text-right">
                                <span className="font-serif font-bold text-base text-forest-900 block">
                                  {formatCurrency(customer.combinedTotal, currency)}
                                </span>
                                {isUpiPayment ? (
                                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                    PAID ONLINE (UPI)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    TO COLLECT AT COUNTER
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* [Pay bill] and [Paid] / [Clear Table] Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* [Pay bill]: Shows dynamic UPI QR for Round 1 + Round 2 */}
                              <button
                                type="button"
                                onClick={(e) => handleOpenCombinedUpi(e, customer)}
                                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                title="Show combined UPI QR for payment"
                              >
                                <QrCode className="w-3.5 h-3.5 text-amber-200" />
                                <span>Pay bill</span>
                              </button>

                              {/* [Paid]: Marks order as paid, disappears from table, stored in history */}
                              <button
                                type="button"
                                onClick={(e) => handleMarkCustomerPaid(e, customer, isUpiPayment ? 'Online UPI' : 'Counter Cash')}
                                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                title="Mark bill as Paid & Settled: table clears and moves to History"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isUpiPayment ? 'Clear Table' : 'Paid'}</span>
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

            {/* Mode switcher for cashier */}
            <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-xl max-w-xs mx-auto text-xs">
              <button
                type="button"
                onClick={() => setModalQrMode('stand')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition text-[11px] ${
                  modalQrMode === 'stand' ? 'bg-white text-forest-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Official Stand QR
              </button>
              <button
                type="button"
                onClick={() => setModalQrMode('dynamic')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition text-[11px] ${
                  modalQrMode === 'dynamic' ? 'bg-white text-forest-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Auto-Amount QR
              </button>
            </div>

            {/* Combined UPI QR Code Container */}
            <div className="p-3 bg-amber-50/50 rounded-2xl border-2 border-amber-200 inline-block">
              {modalQrMode === 'stand' ? (
                <div className="p-1 bg-white rounded-xl shadow-inner border border-slate-200 max-w-[210px] mx-auto">
                  <img
                    src="/images/cafe-upi-qr.jpg"
                    alt="Official Cafe Google Pay QR"
                    className="w-full h-auto rounded-lg object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200">
                  <QRCodeSVG
                    value={upiModalData.upiUri}
                    size={195}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              )}
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
        <div id="printable-receipt" className="hidden print:block font-mono text-xs text-black p-4 max-w-[360px] mx-auto">
          <div className="text-center pb-2 border-b-2 border-black">
            <h2 className="font-bold text-base uppercase tracking-wider">{restaurant.name}</h2>
            <div className="my-1 font-black text-xs bg-black text-white py-0.5 uppercase tracking-wider">
              *** KITCHEN ORDER TICKET (KOT) ***
            </div>
            <div className="font-black text-xl mt-1 py-1 border-2 border-black">
              TABLE: {printData.tableName || printData.order?.tableName}
            </div>
          </div>

          <div className="py-2 border-b border-dashed border-black text-[11px] space-y-0.5">
            <div>
              <strong>Order #:</strong> {printData.order?.orderNumber} &bull; <strong>Time:</strong> {formatTime(new Date().toISOString())}
            </div>
            <div>
              <strong>Guest:</strong> {printData.customerName || printData.order?.customerName} ({printData.order?.customerPhone || 'N/A'})
            </div>
            <div className="font-bold">
              <strong>Payment:</strong> {printData.order?.paymentMethod === 'upi' ? `PAID ONLINE (UPI) • UTR: ${printData.order?.upiRef || 'Verified'}` : 'CASH ON DELIVERY (COLLECT AT DESK)'}
            </div>
          </div>

          {/* Kitchen Note if present */}
          {printData.order?.specialInstructions && (
            <div className="my-1.5 p-1 border-2 border-black font-bold text-xs bg-slate-100">
              ⚠️ KITCHEN NOTE: {printData.order.specialInstructions}
            </div>
          )}

          <div className="py-2 border-b border-black">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-black text-[10px] uppercase">
                  <th className="text-left py-1">Dish Name</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-center py-1">Prep</th>
                  <th className="text-right py-1">Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-black">
                {printData.order?.items?.map((it, idx) => (
                  <tr key={idx} className="font-semibold">
                    <td className="text-left py-1">
                      <span className="font-bold">{it.itemName}</span>
                      {it.specialInstructions && (
                        <div className="text-[10px] italic font-normal">
                          &bull; {it.specialInstructions}
                        </div>
                      )}
                    </td>
                    <td className="text-center py-1 font-bold text-sm">{it.quantity}</td>
                    <td className="text-center py-1">{it.prepTime || 10}m</td>
                    <td className="text-right py-1">{it.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="py-2 text-right font-black text-sm border-b border-dashed border-black">
            TOTAL: {currency}{printData.order?.total?.toFixed(2)}
          </div>

          <div className="text-center pt-2 space-y-0.5">
            <div className="border-t border-dashed border-black pt-1 font-bold text-xs tracking-wider">
              - - - - - - TEAR &amp; GIVE TO KITCHEN - - - - - -
            </div>
            <p className="text-[10px] font-bold">*** CHEF PREPARATION COPY ***</p>
          </div>
        </div>
      )}
    </div>
  );
}
