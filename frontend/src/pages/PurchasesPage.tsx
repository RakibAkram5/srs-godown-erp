import { ShoppingCart } from 'lucide-react';
import { ComingSoon } from './ComingSoon';

export default function PurchasesPage() {
  return (
    <ComingSoon
      icon={ShoppingCart}
      title="Purchases"
      description="Purchase orders and incoming stock from vendors."
      note="Recording purchases and updating stock from vendors comes in a later phase."
    />
  );
}
