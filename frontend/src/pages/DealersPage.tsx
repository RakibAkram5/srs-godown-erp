import { Store } from 'lucide-react';
import { ComingSoon } from './ComingSoon';

export default function DealersPage() {
  return (
    <ComingSoon
      icon={Store}
      title="Dealers"
      description="Your dealer network and their outstanding balances."
      note="Dealer profiles, credit limits and balances will be managed here later."
    />
  );
}
