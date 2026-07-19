import { BarChart3 } from 'lucide-react';
import { ComingSoon } from './ComingSoon';

export default function ReportsPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Reports"
      description="Sales, stock and payment reports with Excel export."
      note="Rich reports with Excel and PDF export will be added in a later phase."
    />
  );
}
