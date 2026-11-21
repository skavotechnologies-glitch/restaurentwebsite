import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Receipt, 
  Printer, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  Search, 
  UtensilsCrossed,
  ArrowRight,
  FileText
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/Badge';

export default function AdminBillingPage() {
  const [searchParams] = useSearchParams();
  const { restaurant, orders, recordPayment, generateBill, activeSlug } = useRestaurant();

  const preselectedOrderId = searchParams.get('orderId');
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [printLayout, setPrintLayout] = useState('80mm'); // '80mm' | '58mm' | 'a4'

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' | 'UPI' | 'Card' | 'Other'
  const [paymentStatus, setPaymentStatus] = useState('paid'); // 'paid' | 'unpaid' | 'partially-paid'
  const [customPaidAmount, setCustomPaidAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSavedNotice, setPaymentSavedNotice] = useState(false);

  // Set default selection to first available order if none preselected
  useEffect(() => {
    if (!selectedOrderId && orders.length > 0) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const currency = restaurant.billing?.currency || '₹';

  useEffect(() => {
    if (selectedOrder) {
      setPaymentMethod(selectedOrder.paymentMethod !== 'Pending' ? selectedOrder.paymentMethod : 'Cash');
      setPaymentStatus(selectedOrder.paymentStatus || 'paid');
      setCustomPaidAmount(selectedOrder.paidAmount ? selectedOrder.paidAmount.toString() : selectedOrder.total.toString());
    }
  }, [selectedOrderId, selectedOrder]);

  const bill = selectedOrder ? generateBill(selectedOrder.id) : null;

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    await recordPayment(selectedOrder.id, {
      paymentMethod,
      paymentStatus,
      paidAmount: Number(customPaidAmount) || selectedOrder.total,
      note: paymentNote
    });

    setPaymentSavedNotice(true);
    setTimeout(() => setPaymentSavedNotice(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Billing & POS Checkout
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Generate itemized invoices, record cash/UPI/card payments, and print 80mm/58mm thermal receipts
          </p>
        </div>

        {bill && (
          <div className="flex items-center gap-2">
            <select
              value={printLayout}
              onChange={(e) => setPrintLayout(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-charcoal-800"
            >
              <option value="80mm">80mm Thermal Receipt</option>
              <option value="58mm">58mm Compact Receipt</option>
              <option value="a4">Standard A4 Invoice</option>
            </select>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Selector & Payment Form */}
        <div className="lg:col-span-5 space-y-4 no-print">
          {/* Order Selector Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider">
              Select Order to Bill
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
                <div className="flex gap-1.5">
                  <OrderStatusBadge status={selectedOrder.orderStatus} />
                  <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                </div>
              </div>
            )}
          </div>

          {/* Payment Recording Form */}
          {selectedOrder && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold font-serif text-charcoal-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>Record Payment</span>
                <span className="text-base font-bold text-forest-800">
                  {formatCurrency(selectedOrder.total, currency)}
                </span>
              </h2>

              {paymentSavedNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Payment recorded successfully!</span>
                </div>
              )}

              <form onSubmit={handleRecordPayment} className="space-y-4">
                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Cash', label: 'Cash', icon: Banknote },
                      { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                      { id: 'Card', label: 'Card (POS)', icon: CreditCard },
                      { id: 'Other', label: 'Other', icon: Receipt },
                    ].map(method => {
                      const Icon = method.icon;
                      const isSelected = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition ${
                            isSelected
                              ? 'bg-forest-700 text-white border-forest-800 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Status Selector */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                    Payment Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'paid', label: 'Paid in Full' },
                      { id: 'partially-paid', label: 'Partial' },
                      { id: 'unpaid', label: 'Unpaid' }
                    ].map(status => (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => setPaymentStatus(status.id)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-semibold text-center transition ${
                          paymentStatus === status.id
                            ? 'bg-charcoal-900 text-white border-charcoal-950'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">
                    Amount Received ({currency})
                  </label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    value={customPaidAmount}
                    onChange={(e) => setCustomPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-bold"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">
                    Reference / Transaction Note (Optional)
                  </label>
                  <input 
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="e.g. GPay Ref #123456"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Save Payment Record
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Print-Ready Bill Receipt */}
        <div className="lg:col-span-7">
          {bill ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col items-center">
              {/* Receipt Body */}
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
                </div>

                {/* Metadata */}
                <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Bill No: <strong>{bill.billNumber}</strong></span>
                    <span>Order: <strong>{bill.orderNumber}</strong></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table: <strong>{bill.customer.table}</strong></span>
                    <span>Date: {formatDateTime(bill.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer: {bill.customer.name}</span>
                    <span>Ph: {bill.customer.phone}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="py-2.5 border-b border-dashed border-black">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-black text-[10px] font-bold uppercase">
                        <th className="py-1">Item</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Rate</th>
                        <th className="py-1 text-right">Amt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dotted divide-gray-300">
                      {bill.items.map((item, idx) => (
                        <tr key={idx} className="py-1">
                          <td className="py-1 pr-1 truncate max-w-[120px] font-medium">
                            {item.itemName}
                          </td>
                          <td className="py-1 text-center font-bold">
                            {item.quantity}
                          </td>
                          <td className="py-1 text-right">
                            {item.priceAtOrder.toFixed(2)}
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

                  {bill.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{currency}{bill.discount.toFixed(2)}</span>
                    </div>
                  )}

                  {bill.taxDetails?.cGstRate > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>CGST ({bill.taxDetails.cGstRate}%):</span>
                      <span>{currency}{bill.taxDetails.cGstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {bill.taxDetails?.sGstRate > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>SGST ({bill.taxDetails.sGstRate}%):</span>
                      <span>{currency}{bill.taxDetails.sGstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {bill.serviceCharge > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>Service Charge:</span>
                      <span>{currency}{bill.serviceCharge.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
                    <span>GRAND TOTAL:</span>
                    <span>{currency}{bill.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Status Info */}
                <div className="py-2 text-[11px] space-y-0.5 border-b border-dashed border-black">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-bold uppercase">{bill.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-bold uppercase">{bill.paymentStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-bold">{currency}{bill.paidAmount.toFixed(2)}</span>
                  </div>
                  {bill.balanceDue > 0 && (
                    <div className="flex justify-between font-bold text-rose-700">
                      <span>Balance Due:</span>
                      <span>{currency}{bill.balanceDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Footer Message */}
                <div className="text-center pt-3 text-[10px] space-y-1">
                  <p className="font-semibold">{bill.restaurant.footerMessage}</p>
                  <p className="text-gray-500">Computer Generated Invoice &bull; No Signature Required</p>
                </div>
              </div>

              {/* Action Toolbar below receipt */}
              <div className="mt-6 flex items-center gap-3 no-print">
                <button
                  onClick={handlePrint}
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
