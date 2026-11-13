import LegalPageShell from '@/components/LegalPageShell';

export const metadata = {
  title: 'Privacy Policy | Jalwaplay',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell>
      <div>
        <h1 className="text-3xl font-bold mt-4">Privacy Policy</h1>
        <p className="text-sm text-white/40 mt-1">Last updated: September 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Introduction</h2>
        <p className="text-sm leading-relaxed">
          Jalwaplay (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) values your privacy. This Privacy
          Policy explains how we collect, use, and protect your information when you use our
          website and services.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Information We Collect</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed space-y-1">
          <li>Mobile number, used to verify your identity via OTP.</li>
          <li>Basic device and usage information (browser type, IP address, pages visited).</li>
          <li>Payment and subscription information processed through our payment partners.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
        <p className="text-sm leading-relaxed">
          We use the information we collect to provide and improve our services, authenticate
          your account, process payments, communicate with you about your subscription, and
          comply with legal obligations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Data Security</h2>
        <p className="text-sm leading-relaxed">
          We implement reasonable technical and organizational measures to protect your personal
          information from unauthorized access, alteration, disclosure, or destruction.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Sharing of Information</h2>
        <p className="text-sm leading-relaxed">
          We do not sell your personal information. We may share limited information with trusted
          third-party service providers (such as payment gateways and SMS/OTP providers) solely
          to operate our services.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Your Rights</h2>
        <p className="text-sm leading-relaxed">
          You may request access to, correction of, or deletion of your personal data at any time
          by contacting our support team.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Changes to This Policy</h2>
        <p className="text-sm leading-relaxed">
          We may update this Privacy Policy from time to time. Any changes will be posted on this
          page with a revised &quot;last updated&quot; date.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">8. Contact Us</h2>
        <p className="text-sm leading-relaxed">
          If you have any questions about this Privacy Policy, please contact us at{' '}
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
