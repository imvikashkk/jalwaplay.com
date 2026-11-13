import LegalPageShell from '@/components/LegalPageShell';
import { SUPPORT_EMAIL } from '@/components/SiteChrome';

export const metadata = {
  title: 'Contact Us | Jalwaplay',
};

const TOPICS = [
  { icon: '💳', title: 'Payment issue', desc: 'Money debited but plan not active', subject: 'Payment issue' },
  { icon: '🔁', title: 'Refund request', desc: 'Ask for a refund on a recent payment', subject: 'Refund request' },
  { icon: '🎬', title: 'Playback problem', desc: 'Video not loading or buffering', subject: 'Playback problem' },
  { icon: '👤', title: 'Account help', desc: 'Login, plan or anything else', subject: 'Account help' },
];

export default function ContactPage() {
  return (
    <LegalPageShell>
      <div>
        <h1>Contact Us</h1>
        <p className="mt-1 !text-sm text-white/50">We&apos;re here to help — usually within 24–48 hours.</p>
      </div>

      <div className="mt-6 rounded-3xl p-5 sm:p-6 border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/[0.14] to-white/[0.02]">
        <p className="eyebrow !text-[10px] !leading-normal">Email support</p>
        <p className="mt-1.5 !text-xl sm:!text-2xl !leading-tight font-bold text-white break-all">{SUPPORT_EMAIL}</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="btn-primary !no-underline !text-white mt-4 w-full sm:w-auto rounded-2xl px-6 py-3 text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          Send us an email
        </a>
      </div>

      <section>
        <h2>What do you need help with?</h2>
        <p className="!text-sm text-white/50">Tap a topic — your email opens with the subject filled in.</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOPICS.map((t) => (
            <a
              key={t.title}
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t.subject)}`}
              className="focus-ring !no-underline flex items-center gap-3 rounded-2xl p-4 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/20 transition-colors"
            >
              <span className="w-10 h-10 shrink-0 rounded-xl bg-white/[0.06] flex items-center justify-center text-lg" aria-hidden="true">
                {t.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{t.title}</span>
                <span className="block text-xs text-white/50">{t.desc}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2>Tip</h2>
        <p>
          For payment questions, include your registered mobile number and the transaction ID from your
          payment app so we can help faster.
        </p>
      </section>
    </LegalPageShell>
  );
}
