import { Suspense } from 'react';
import PaymentStatusPage from '@/components/PaymentStatus';
import { AuthShellFallback } from '@/components/AuthShell';

export default function page() {
  return (
    <Suspense fallback={<AuthShellFallback />}>
      <PaymentStatusPage />
    </Suspense>
  );
}
