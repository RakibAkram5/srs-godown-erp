import { ServerCrash } from 'lucide-react';
import { ErrorState } from './ErrorState';

export default function ServerErrorPage() {
  return (
    <ErrorState
      code="500"
      icon={ServerCrash}
      tone="danger"
      title="Something went wrong"
      description="An unexpected error occurred on our side. Please try again in a moment."
      primaryAction={{ label: 'Reload', onClick: () => window.location.reload() }}
    />
  );
}
