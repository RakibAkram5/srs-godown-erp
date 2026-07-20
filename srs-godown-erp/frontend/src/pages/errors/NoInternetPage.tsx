import { WifiOff } from 'lucide-react';
import { ErrorState } from './ErrorState';

export default function NoInternetPage() {
  return (
    <ErrorState
      icon={WifiOff}
      tone="warning"
      title="No internet connection"
      description="Check your network and try again. Your work is safe."
      primaryAction={{ label: 'Retry', onClick: () => window.location.reload() }}
    />
  );
}
