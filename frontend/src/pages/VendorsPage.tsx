import { Truck } from 'lucide-react';
import { ComingSoon } from './ComingSoon';

export default function VendorsPage() {
  return (
    <ComingSoon
      icon={Truck}
      title="Vendors"
      description="Suppliers you buy spare parts from."
      note="Vendor profiles and payables will be managed here in a later phase."
    />
  );
}
