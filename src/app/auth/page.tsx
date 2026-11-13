import { Suspense } from 'react';
import AuthPage from '@/components/Auth';
import { AuthShellFallback } from '@/components/AuthShell';

export const metadata = { title: 'Login | Jalwaplay' };

export default function page() {
  return (
    <Suspense fallback={<AuthShellFallback />}>
      <AuthPage />
    </Suspense>
  );
}
