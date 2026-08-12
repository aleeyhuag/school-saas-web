import PageHeader from '../../components/PageHeader';
import ChangePasswordCard from '../../components/ChangePasswordCard';

/**
 * Bursar's Settings is deliberately narrower than Proprietor/
 * Principal's — just account password. Grading configuration isn't
 * finance-related, so it's not shown here at all (not even read-only).
 */
export default function BursarSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Your account." />
      <div className="p-4 md:p-8 max-w-2xl">
        <ChangePasswordCard />
      </div>
    </>
  );
}
