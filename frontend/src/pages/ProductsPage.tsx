import { Package } from 'lucide-react';
import { ComingSoon } from './ComingSoon';

export default function ProductsPage() {
  return (
    <ComingSoon
      icon={Package}
      title="Products"
      description="Your full catalogue of bike spare parts."
      note="Product catalogue, pricing and stock levels will live here in a later phase."
    />
  );
}
