import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata = {
  title: 'Refund & Cancellation Policy | Jalwaplay',
};

export default function RefundAndCancellationPage() {
  return (
    <LegalPageShell>
      <div>
        <h1 className="text-3xl font-bold mt-4">Refund &amp; Cancellation Policy</h1>
        <p className="text-sm text-white/40 mt-1">Last updated: September 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Overview</h2>
        <p className="text-sm leading-relaxed">
          This policy explains how subscription cancellations and refunds are handled on
          Jalwaplay. By subscribing to our service, you agree to the terms outlined below.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Subscription Cancellation</h2>
        <p className="text-sm leading-relaxed">
          You may cancel your subscription at any time from your account settings. Cancellation
          will stop future renewals, but you will continue to have access to the service until
          the end of your current billing period.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Refund Eligibility</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed space-y-1">
          <li>
            Refund requests raised within 24 hours of a successful payment, where the
            subscription has not been used, are eligible for a full refund.
          </li>
          <li>
            If content has already been accessed or streamed after purchase, the subscription is
            considered used and is not eligible for a refund.
          </li>
          <li>
            Duplicate or accidental payments made in error are eligible for a full refund upon
            verification.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Non-Refundable Cases</h2>
        <p className="text-sm leading-relaxed">
          Refunds will not be provided for change of mind after content has been accessed, or for
          subscriptions cancelled after the eligible refund window has passed.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. How to Request a Refund</h2>
        <p className="text-sm leading-relaxed">
          To request a refund, please contact our support team at{' '}
          <a
            href="mailto:support@dharvix.com"
            className="text-white/90 underline underline-offset-2 hover:text-white"
          >
            support@dharvix.com
          </a>{' '}
          with your registered mobile number and payment details. Requests are typically
          reviewed within 3–5 business days.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Refund Processing Time</h2>
        <p className="text-sm leading-relaxed">
          Approved refunds are processed back to the original payment method within 5–7 business
          days, depending on your bank or payment provider.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Changes to This Policy</h2>
        <p className="text-sm leading-relaxed">
          We may update this Refund &amp; Cancellation Policy from time to time. Any changes will
          be posted on this page with a revised &quot;last updated&quot; date.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">8. Contact Us</h2>
        <p className="text-sm leading-relaxed">
          For any questions regarding refunds or cancellations, reach out to us at{' '}
          <a
            href="mailto:support@dharvix.com"
            className="text-white/90 underline underline-offset-2 hover:text-white"
          >
            support@dharvix.com
          </a>{' '}
          or visit our{' '}
          <Link href="/contact" className="text-white/90 underline underline-offset-2 hover:text-white">
            Contact page
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
