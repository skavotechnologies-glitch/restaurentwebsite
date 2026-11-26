/**
 * UPI URI & Dynamic QR Helper for Indian Restaurant Payments
 * Compliant with NPCI (National Payments Corporation of India) UPI Deep-linking specifications.
 */

export function generateUpiUri({
  upiId = 'palanikathirvel05@okaxis',
  payeeName = 'Naachi Café',
  amount = 0,
  transactionNote = 'Restaurant Bill',
  orderRef = '',
  callbackUrl = ''
}) {
  // UPI ID must NOT have its '@' character URL-encoded to '%40' because UPI apps require literal '@'
  const cleanUpi = (upiId ? upiId.trim() : 'palanikathirvel05@okaxis');
  const cleanName = encodeURIComponent(payeeName ? payeeName.trim() : 'Restaurant');
  const cleanAmount = Number(amount || 0).toFixed(2);
  const cleanNote = encodeURIComponent(transactionNote ? transactionNote.trim() : 'Dining Bill');

  // Standard NPCI P2P URI format (clean, universally accepted across GPay, PhonePe, Paytm):
  // Note: For personal VPAs (e.g. @okaxis), merchant-specific tags like &tr and &url must be omitted
  // otherwise Indian banks (Axis/SBI/HDFC) reject the transaction with "Bank limit exceeded" error.
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}
