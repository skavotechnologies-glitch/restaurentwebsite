/**
 * UPI URI & Dynamic QR Helper for Indian Restaurant Payments
 * Compliant with NPCI (National Payments Corporation of India) UPI Deep-linking specifications.
 */

export const OFFICIAL_CAFE_UPI = {
  vpa: 'palanikathirvel05@okaxis',
  payeeName: 'Palani P.K__001',
  bankName: 'Indian Overseas Bank 2679',
  aid: 'uGICAgMD27bClFw',
  qrImage: '/images/cafe-upi-qr.jpg',
  rawQrUri: 'upi://pay?pa=palanikathirvel05@okaxis&pn=Palani%20P.K__001&aid=uGICAgMD27bClFw'
};

/**
 * Generate Clean Verified UPI Intent URI
 * Matches the official Google Pay physical stand QR format without forced web amount injection.
 * Prevents Google Pay from triggering the "Bank limit exceeded" catch-all anti-fraud error on personal VPAs.
 */
export function generateCleanIntentUri({
  upiId = 'palanikathirvel05@okaxis',
  payeeName = 'Palani P.K__001',
  aid = 'uGICAgMD27bClFw'
} = {}) {
  const cleanUpi = (upiId ? upiId.trim() : 'palanikathirvel05@okaxis');
  const cleanName = encodeURIComponent(payeeName ? payeeName.trim() : 'Palani P.K__001');
  let uri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}`;
  if (aid) {
    uri += `&aid=${encodeURIComponent(aid)}`;
  }
  return uri;
}

/**
 * Generate Standard UPI URI (with optional amount)
 */
export function generateUpiUri({
  upiId = 'palanikathirvel05@okaxis',
  payeeName = 'Palani P.K__001',
  amount = 0,
  transactionNote = 'Restaurant Bill',
  orderRef = '',
  callbackUrl = '',
  aid = 'uGICAgMD27bClFw',
  includeAmount = true
}) {
  const cleanUpi = (upiId ? upiId.trim() : 'palanikathirvel05@okaxis');
  const cleanName = encodeURIComponent(payeeName ? payeeName.trim() : 'Palani P.K__001');

  if (!includeAmount) {
    return generateCleanIntentUri({ upiId: cleanUpi, payeeName, aid });
  }

  const cleanAmount = Number(amount || 0).toFixed(2);
  const cleanNote = encodeURIComponent(transactionNote ? transactionNote.trim() : 'Dining Bill');

  let uri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
  if (aid) {
    uri += `&aid=${encodeURIComponent(aid)}`;
  }
  return uri;
}
