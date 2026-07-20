import { ShieldAlert } from 'lucide-react';
import { ErrorState } from './ErrorState';

export default function UnauthorizedPage() {
  return (
    <ErrorState
      code="401"
      icon={ShieldAlert}
      tone="warning"
      title="Access denied"
      description="You don't have permission to view this page. Contact your administrator if this seems wrong."
    />
  );
}
