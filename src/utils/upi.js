/**
 * UPI URI & Dynamic QR Helper for Indian Restaurant Payments
 * Compliant with NPCI (National Payments Corporation of India) UPI Deep-linking specifications.
 */

export function generateUpiUri({
  upiId = 'naachicafe@okaxis',
  payeeName = 'Naachi Café',
  amount = 0,
  transactionNote = 'Restaurant Bill',
  orderRef = ''
}) {
  const cleanUpi = encodeURIComponent(upiId ? upiId.trim() : 'naachicafe@okaxis');
  const cleanName = encodeURIComponent(payeeName ? payeeName.trim() : 'Restaurant');
  const cleanAmount = Number(amount || 0).toFixed(2);
  const cleanNote = encodeURIComponent(transactionNote ? transactionNote.trim() : 'Dining Bill');
  const cleanRef = encodeURIComponent(orderRef ? orderRef.trim() : `ORD-${Date.now().toString(36)}`);

  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}&tr=${cleanRef}`;
}
