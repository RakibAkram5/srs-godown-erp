import { Compass } from 'lucide-react';
import { ErrorState } from './ErrorState';

export default function NotFoundPage() {
  return (
    <ErrorState
      code="404"
      icon={Compass}
      tone="primary"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have been moved."
    />
  );
}
