import LegalPageLayout from '../components/LegalPageLayout';
import { BRAND } from '../config/brand';

const VERSION = '2026-08-11';

export default function Terms() {
  return (
    <LegalPageLayout title="Terms of Service" updated="11 August 2026">
      <p className="text-xs bg-warning-soft border border-warning/20 rounded-lg p-3 text-muted not-prose">
        These terms are a product-aligned draft and should be reviewed by qualified Nigerian legal counsel before production publication.
      </p>

      <p><strong>Terms version:</strong> {VERSION}</p>
      <p>These Terms govern use of {BRAND.productName} (“the Platform”), operated by <strong>{BRAND.parentCompany}</strong> (“we”, “us”, or “our”). By registering a school or using the Platform on behalf of a school, you agree to these Terms.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">1. The Platform</h2>
      <p>The Platform provides school-management functions including student records, staff and teacher assignments, attendance, academic scores and results, fees and payment records, timetables, subscriptions and related administrative tools. Features may change as the service develops.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">2. School account and authorized users</h2>
      <p>The person registering a school must have authority to register the school and accept these Terms. The proprietor or other authorized administrator is responsible for assigning appropriate roles and ensuring that staff, students and parents use only the access appropriate to them.</p>
      <p>Users must protect their credentials, must not share accounts improperly and must notify the school administrator or us through the available support channel if unauthorized access is suspected.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">3. School data</h2>
      <p>The school retains its rights in the student, staff, parent, academic, attendance and financial information it enters into the Platform. The school is responsible for the accuracy and lawfulness of information it enters and for determining which users should have access.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">4. Subscriptions and payments</h2>
      <p>Subscription plans, prices, periods and payment instructions are those displayed or communicated by the Platform. Payment references and payment evidence must be genuine and must relate to the school making the payment. We may review, reject or request clarification for payment evidence that is incomplete, inconsistent or appears fraudulent.</p>
      <p>Subscription access may be restricted or suspended when a subscription expires, payment is not completed, or an account is suspended under these Terms. Any refund or credit is subject to the applicable plan terms and our published refund decision for the relevant transaction.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">5. Acceptable use</h2>
      <p>You must not use the Platform to access another school’s information, bypass authorization controls, upload malicious or unlawful material, impersonate another user, submit fraudulent payment evidence, interfere with service operation, reverse-engineer the Platform except where permitted by law, or use the Platform for unlawful purposes.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">6. Security and availability</h2>
      <p>We take reasonable measures to protect the Platform, but no internet service can guarantee uninterrupted availability or absolute security. Schools remain responsible for appropriate account management, backups or exports they require, and the accuracy of data entered by their users.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">7. Suspension and termination</h2>
      <p>We may restrict or suspend access where reasonably necessary for security, fraud prevention, non-payment, unlawful use, serious breach of these Terms, or protection of the Platform and its users. Where appropriate, we will provide notice and an opportunity to resolve the issue.</p>
      <p>A school may stop using the Platform subject to the applicable subscription terms. Data export and deletion will be handled according to the subscription arrangement, applicable law and our Privacy Policy.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">8. Intellectual property</h2>
      <p>The Platform’s software, interface, branding and related materials are owned by or licensed to {BRAND.parentCompany}. These Terms do not transfer ownership of the Platform to a school. Schools retain their rights in their own data.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">9. Third-party services</h2>
      <p>The Platform may depend on third-party infrastructure, payment, email, hosting or other services. Those services may have their own terms and privacy policies. We are not responsible for failures outside our reasonable control.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">10. Changes to the service or Terms</h2>
      <p>We may improve, modify or discontinue features. We may also update these Terms when necessary. Material changes will be presented through reasonable notice or the Platform. The version and date shown on this page identify the current version.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">11. Governing law and disputes</h2>
      <p>These Terms are governed by the laws of the Federal Republic of Nigeria, subject to any mandatory rights or remedies that cannot lawfully be excluded. The parties should first attempt to resolve disputes in good faith before pursuing any formal remedy available under Nigerian law.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">12. Contact</h2>
      <p>Questions about these Terms should be submitted through the <a href="/contact" className="text-primary hover:underline">Contact page</a>.</p>
    </LegalPageLayout>
  );
}
