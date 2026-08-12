import LegalPageLayout from '../components/LegalPageLayout';
import { BRAND } from '../config/brand';

const VERSION = '2026-08-11';

export default function Privacy() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="11 August 2026">
      <p className="text-xs bg-warning-soft border border-warning/20 rounded-lg p-3 text-muted not-prose">
        This policy is a product-aligned draft and should be reviewed by qualified Nigerian legal/data-protection counsel before production publication.
      </p>

      <p><strong>Policy version:</strong> {VERSION}</p>
      <p>{BRAND.productName}, operated by <strong>{BRAND.parentCompany}</strong> (“we”, “us”, or “our”), provides school-management software for registered schools and their authorized users. This Privacy Policy explains how personal data is handled when the Platform is used.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">1. Data we handle</h2>
      <p><strong>School and account data:</strong> school name and contact details, proprietor and staff names, email addresses, phone numbers, roles, account status and authentication-related information.</p>
      <p><strong>Student and academic data:</strong> student names, admission information, date of birth, gender, class, attendance, scores, results, promotion information and other records entered by a school.</p>
      <p><strong>Parent/guardian data:</strong> names, contact details and relationships to students.</p>
      <p><strong>Fees and payments:</strong> fee records, payment references, payment status and payment evidence uploaded by authorized school users. We do not intend to store customers’ bank-card PINs, passwords or banking credentials.</p>
      <p><strong>Technical data:</strong> IP address, browser/device information, timestamps, security logs and similar information needed to operate and protect the Platform.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">2. How data is used</h2>
      <p>We use data to provide and secure the Platform, authenticate users, maintain school records, support attendance and academic workflows, manage fees and subscriptions, provide support, communicate important service information, prevent abuse, troubleshoot technical problems and comply with applicable law.</p>
      <p>We do not sell student personal data and do not use student records for advertising.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">3. Schools and their responsibilities</h2>
      <p>A school decides what student, staff and parent information it enters into the Platform and is responsible for having an appropriate lawful basis and, where required, appropriate notices or permissions for that processing. The Platform is intended to process school data on the school’s instructions.</p>
      <p>Schools should give children, parents/guardians and staff appropriate privacy information where required and should only give access to users who need it for their role.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">4. Security</h2>
      <p>We use reasonable technical and organizational safeguards appropriate to the Platform, including authenticated access, school-level data isolation, access controls, secure transport where HTTPS is enabled, validation of user input and security monitoring appropriate to the service. No online service can guarantee absolute security.</p>
      <p>If we become aware of a personal-data breach, we will assess it and take notification and remediation steps required by applicable Nigerian data-protection law.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">5. Service providers</h2>
      <p>We may use infrastructure, hosting, email, payment and other service providers needed to operate the Platform. Where a provider processes personal data on our behalf, we expect appropriate contractual and security safeguards to apply.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">6. Retention</h2>
      <p>We retain information for as long as reasonably necessary to provide the service, meet contractual and legal obligations, resolve disputes, protect the Platform and support legitimate school requests. Specific deletion or export periods may depend on the school’s subscription and the applicable retention requirements. We will not state a fixed deletion period unless the corresponding operational process is in place.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">7. Your rights and requests</h2>
      <p>Depending on the applicable law and circumstances, individuals may have rights relating to access, correction, deletion, restriction, objection, portability and withdrawal of consent where consent is the legal basis. School users should normally direct requests concerning school records to their school first; requests about our own processing may be made through the Platform’s Contact page.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">8. Cookies and local storage</h2>
      <p>The web application may use essential browser storage, cookies or similar mechanisms required for authentication, security and user preferences. We do not intentionally use advertising trackers as part of the core school-management service.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">9. Children’s information</h2>
      <p>The Platform may process information about students who are children. Schools are responsible for ensuring that the collection and use of student information has an appropriate lawful basis and that required parent/guardian or child-facing information is provided.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">10. Changes</h2>
      <p>We may update this Policy when the Platform, our processing practices or applicable law changes. The version and “Last updated” date on this page identify the version presented to users.</p>

      <h2 className="font-display font-semibold text-lg text-ink pt-2">11. Contact and complaints</h2>
      <p>For privacy questions or requests, use the <a href="/contact" className="text-primary hover:underline">Contact page</a>. A person may also have the right to complain to the Nigeria Data Protection Commission or another competent authority where applicable.</p>
    </LegalPageLayout>
  );
}
