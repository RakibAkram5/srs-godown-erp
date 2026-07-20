import { ReceiptText } from 'lucide-react';
import { ComingSoon } from './ComingSoon';

export default function SalesPage() {
  return (
    <ComingSoon
      icon={ReceiptText}
      title="Sales"
      description="Invoices and outgoing stock to dealers."
      note="Billing, invoicing and sales tracking will be added in a later phase."
    />
  );
}
