// Utility: Convert number to Indian words
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const numToWords = (n) => {
  if (n === 0) return 'Zero';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
  if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
  if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
  return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
};

const amountInWords = (amount) => {
  const rounded = Math.round(amount * 100) / 100;
  const intPart = Math.floor(rounded);
  const decPart = Math.round((rounded - intPart) * 100);
  let words = 'Rupees ' + numToWords(intPart);
  if (decPart > 0) words += ' and ' + numToWords(decPart) + ' Paise';
  return words + ' Only';
};

// GST calculation helpers
const calculateGST = (sellingPriceInclusive, gstRate, quantity = 1) => {
  const rate = parseFloat(gstRate);
  const price = parseFloat(sellingPriceInclusive);
  const taxableValue = parseFloat((price / (1 + rate / 100)).toFixed(2));
  const halfGST = rate / 2;
  const cgstAmount = parseFloat((taxableValue * halfGST / 100).toFixed(2));
  const sgstAmount = parseFloat((taxableValue * halfGST / 100).toFixed(2));
  const lineTotal = price; // per unit
  return {
    taxable_value: parseFloat((taxableValue * quantity).toFixed(2)),
    gst_rate: rate,
    cgst_rate: halfGST,
    cgst_amount: parseFloat((cgstAmount * quantity).toFixed(2)),
    sgst_rate: halfGST,
    sgst_amount: parseFloat((sgstAmount * quantity).toFixed(2)),
    line_total: parseFloat((lineTotal * quantity).toFixed(2)),
  };
};

// Financial year helper (Indian FY: April 1 to March 31)
const getFinancialYear = (date = new Date()) => {
  const month = date.getMonth() + 1; // 1-indexed
  const year = date.getFullYear();
  return month >= 4 ? year : year - 1;
};

// Pagination helper
const paginate = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;
  return { page: p, limit: l, offset };
};

module.exports = { amountInWords, calculateGST, getFinancialYear, paginate };
