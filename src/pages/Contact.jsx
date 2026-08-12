import LegalPageLayout from '../components/LegalPageLayout';
import { BRAND } from '../config/brand';

export default function Contact() {
  return (
    <LegalPageLayout title="Contact us">
      <p className="text-muted">
        Questions about setting your school up, a bug to report, or anything else — reach us directly.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">General support</p>
          <a href={`mailto:${BRAND.supportEmail}`} className="text-primary font-medium hover:underline break-all">
            {BRAND.supportEmail}
          </a>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Legal / data requests</p>
          <a href={`mailto:${BRAND.legalEmail}`} className="text-primary font-medium hover:underline break-all">
            {BRAND.legalEmail}
          </a>
        </div>
      </div>

      <p className="text-sm text-muted">
        {BRAND.productName} is operated by <strong className="text-ink">{BRAND.parentCompany}</strong>.
        Phone and office address — [Insert phone number] · [Insert registered business address].
      </p>
    </LegalPageLayout>
  );
}
