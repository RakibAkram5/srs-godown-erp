// Invoice defaults shared by Sale and Purchase invoices.
// Company name/logo come from Settings; these are fallbacks.

export const DEFAULT_COMPANY_NAME = 'SRS Traders';

// Terms & conditions printed at the bottom of every invoice (Urdu).
// Edit these lines to change the terms on all invoices.
export const URDU_TERMS: string[] = [
  'خریدا گیا مال واپس یا تبدیل نہیں ہوگا۔',
  'مال وصول کرتے وقت اچھی طرح چیک کر لیں، بعد میں کمپنی ذمہ دار نہیں ہوگی۔',
  'ادائیگی مقررہ مدت میں کرنا لازمی ہے۔',
  'کسی بھی تنازع کی صورت میں فیصلہ مقامی عدالت کے تابع ہوگا۔',
  'یہ کمپیوٹرائزڈ رسید ہے، دستخط کی ضرورت نہیں۔',
];

export const URDU_TERMS_HEADING = 'شرائط و ضوابط';

// Footer shown at the bottom of every invoice.
export const INVOICE_FOOTER = {
  developedBy: 'SRS Matrix',
  contact: '03014334151',
};
