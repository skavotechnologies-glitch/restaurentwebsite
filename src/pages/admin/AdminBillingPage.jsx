import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Receipt, 
  Printer, 
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { OrderBillStatusBadge } from '../../components/common/Badge';
import { generateUpiUri } from '../../utils/upi';

export default function AdminBillingPage() {
  const [searchParams] = useSearchParams();
  const { restaurant, orders, markOrderBilled, generateBill } = useRestaurant();

  const preselectedOrderId = searchParams.get('orderId');
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [printLayout, setPrintLayout] = useState('80mm'); // '80mm' | '58mm' | 'a4'
  const [billedNotice, setBilledNotice] = useState(false);

  useEffect(() => {
    if (!selectedOrderId && orders.length > 0) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const currency = restaurant.billing?.currency || '₹';
  const bill = selectedOrder ? generateBill(selectedOrder.id) : null;

  const handleMarkBilledAndPrint = async () => {
    if (!selectedOrder) return;
    await markOrderBilled(selectedOrder.id);
    setBilledNotice(true);
    setTimeout(() => {
      setBilledNotice(false);
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Bill & Kitchen Order Ticket (KOT)
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Generate and print bills for table orders &bull; Give to kitchen and customer
          </p>
        </div>

        {bill && (
          <div className="flex items-center gap-2">
            <select
              value={printLayout}
              onChange={(e) => setPrintLayout(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-charcoal-800"
            >
              <option value="80mm">80mm Thermal Receipt (Standard)</option>
              <option value="58mm">58mm Compact Receipt</option>
              <option value="a4">Standard A4 Format</option>
            </select>

            <button
              onClick={handleMarkBilledAndPrint}
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill & KOT</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Selector */}
        <div className="lg:col-span-5 space-y-4 no-print">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider">
              Select Table Order
            </label>

            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-semibold"
            >
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} &bull; {o.tableName} &bull; {o.customerName} ({formatCurrency(o.total, currency)})
                </option>
              ))}
            </select>

            {selectedOrder && (
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="font-semibold text-charcoal-800">Status:</span>
                <OrderBillStatusBadge order={selectedOrder} />
              </div>
            )}
          </div>

          {selectedOrder && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold font-serif text-charcoal-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>Direct Counter Payment Notice</span>
                <span className="text-base font-bold text-forest-800">
                  {formatCurrency(selectedOrder.total, currency)}
                </span>
              </h2>

              <p className="text-xs text-charcoal-700 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200">
                Customer will present this bill at the counter and pay directly via Cash, UPI, or Card. Print this receipt, hand one copy to the kitchen for preparation, and one copy to the table.
              </p>

              {/* Dynamic Screen UPI QR Code for Counter Scan */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col items-center text-center space-y-2">
                <span className="text-[11px] font-bold text-charcoal-700 uppercase tracking-wider flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-forest-700" />
                  <span>Counter QR: Pay {formatCurrency(selectedOrder.total, currency)}</span>
                </span>
                <div className="p-2 bg-white border border-slate-300 rounded-xl shadow-sm">
                  <QRCodeSVG 
                    value={generateUpiUri({
                      upiId: restaurant.billing?.upiId || 'palanikathirvel05@okaxis',
                      payeeName: restaurant.billing?.upiPayeeName || restaurant.name,
                      amount: selectedOrder.total || 0,
                      transactionNote: `Bill ${selectedOrder.orderNumber} ${selectedOrder.tableName}`,
                      orderRef: selectedOrder.orderNumber
                    })}
                    size={120}
                    level="M"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  GPay &bull; PhonePe &bull; Paytm &bull; BHIM
                </p>
              </div>

              {billedNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Marked as Billed! Preparing print...</span>
                </div>
              )}

              <button
                onClick={handleMarkBilledAndPrint}
                className="w-full py-3 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Mark Billed & Print Receipt</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Thermal Print Ready Bill */}
        <div className="lg:col-span-7">
          {bill ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col items-center">
              <div 
                id="printable-receipt" 
                className={`bg-white font-mono text-black border border-slate-300 p-6 shadow-sm ${
                  printLayout === '58mm' ? 'max-w-[280px] text-[11px]' :
                  printLayout === '80mm' ? 'max-w-[360px] text-xs' :
                  'max-w-2xl w-full text-sm font-sans'
                }`}
              >
                {/* Header */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-black">
                  <h2 className="font-bold text-base uppercase tracking-wider">
                    {bill.restaurant.name}
                  </h2>
                  <p className="text-[11px] leading-tight">
                    {bill.restaurant.address}
                  </p>
                  <p className="text-[11px]">
                    Phone: {bill.restaurant.phone}
                  </p>
                  {bill.restaurant.gstin && (
                    <p className="text-[11px] font-bold">
                      GSTIN: {bill.restaurant.gstin}
                    </p>
                  )}
                  <div className="mt-2 py-1 bg-black text-white font-bold text-sm tracking-wide rounded">
                    TABLE: {bill.customer.table}
                  </div>
                </div>

                {/* Metadata */}
                <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Bill No: <strong>{bill.billNumber}</strong></span>
                    <span>Order: <strong>{bill.orderNumber}</strong></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time: {formatDateTime(bill.date)}</span>
                    <span>Wait: <strong>~{bill.estimatedWaitTime} Mins</strong></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guest: {bill.customer.name}</span>
                    <span>Ph: {bill.customer.phone}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="py-2.5 border-b border-dashed border-black">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-black text-[10px] font-bold uppercase">
                        <th className="py-1">Dish</th>
                        <th className="py-1 text-center">Wait</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Amt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dotted divide-gray-300">
                      {bill.items.map((item, idx) => (
                        <tr key={idx} className="py-1">
                          <td className="py-1 pr-1 truncate max-w-[120px] font-medium">
                            {item.itemName}
                          </td>
                          <td className="py-1 text-center text-[10px]">
                            {item.prepTime || 10}m
                          </td>
                          <td className="py-1 text-center font-bold">
                            {item.quantity}
                          </td>
                          <td className="py-1 text-right font-bold">
                            {item.lineTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Totals */}
                <div className="py-2.5 border-b border-dashed border-black space-y-1 text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{currency}{bill.subtotal.toFixed(2)}</span>
                  </div>

                  {bill.taxDetails?.totalTax > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>Taxes (CGST + SGST):</span>
                      <span>{currency}{bill.taxDetails.totalTax.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
                    <span>TOTAL BILL:</span>
                    <span>{currency}{bill.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Direct Pay Notice */}
                <div className="text-center pt-3 text-[10px] space-y-1">
                  <p className="font-bold">*** PAY DIRECTLY AT COUNTER ***</p>
                  <p className="text-gray-500">Give copy to kitchen &bull; Present bill at counter after dining</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 no-print">
                <button
                  onClick={handleMarkBilledAndPrint}
                  className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt ({printLayout})</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <p className="text-sm font-semibold text-charcoal-700">Please select an order to display bill.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
