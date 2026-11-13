import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata = {
  title: 'Terms & Conditions | Jalwaplay',
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPageShell>
      <div>
        <h1 className="text-3xl font-bold mt-4">Terms &amp; Conditions</h1>
        <p className="text-sm text-white/40 mt-1">Last updated: September 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
        <p className="text-sm leading-relaxed">
          By accessing or using Jalwaplay (&quot;the Service&quot;), you agree to be bound by
          these Terms &amp; Conditions. If you do not agree, please do not use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Eligibility</h2>
        <p className="text-sm leading-relaxed">
          You must be at least 18 years old to create an account and use this Service. By
          registering, you confirm that you meet this age requirement.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Account Registration</h2>
        <p className="text-sm leading-relaxed">
          You are required to provide a valid mobile number and verify it via OTP to access the
          Service. You are responsible for maintaining the confidentiality of your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Subscription &amp; Payments</h2>
        <p className="text-sm leading-relaxed">
          Access to certain content requires an active paid subscription. All payments are
          processed securely through our payment partners. Refunds and cancellations are governed
          by our{' '}
          <Link href="/refund-and-cancellation" className="text-white/90 underline underline-offset-2 hover:text-white">
            Refund &amp; Cancellation Policy
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Content Usage</h2>
        <p className="text-sm leading-relaxed">
          All content available on the Service is for personal, non-commercial use only. You may
          not copy, redistribute, or publicly share any content without prior written permission.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Prohibited Conduct</h2>
        <p className="text-sm leading-relaxed">
          You agree not to misuse the Service, attempt unauthorized access, or use the Service for
          any unlawful purpose.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Termination</h2>
        <p className="text-sm leading-relaxed">
          We reserve the right to suspend or terminate your account if we believe you have
          violated these Terms &amp; Conditions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">8. Limitation of Liability</h2>
        <p className="text-sm leading-relaxed">
          The Service is provided &quot;as is&quot; without warranties of any kind. We are not
          liable for any indirect or consequential damages arising from your use of the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">9. Changes to Terms</h2>
        <p className="text-sm leading-relaxed">
          We may update these Terms &amp; Conditions from time to time. Continued use of the
          Service after changes constitutes acceptance of the revised terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">10. Contact Us</h2>
        <p className="text-sm leading-relaxed">
          For any questions regarding these Terms &amp; Conditions, please contact us at{' '}
          <a
            href="mailto:support@dharvix.com"
            className="text-white/90 underline underline-offset-2 hover:text-white"
          >
            support@dharvix.com
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
