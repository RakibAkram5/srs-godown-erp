import { BookOpen } from 'lucide-react';
import { ComingSoon } from './ComingSoon';

export default function LedgersPage() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Ledgers"
      description="Account statements for dealers and vendors."
      note="Financial ledgers and running balances will be available in a later phase."
    />
  );
}
