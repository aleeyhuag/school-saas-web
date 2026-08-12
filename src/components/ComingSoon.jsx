import PageHeader from './PageHeader';
import Card from './ui/Card';

/**
 * Placeholder for a dashboard section not yet built. Used so sidebar
 * nav links are all clickable/real from the start, instead of dead
 * links — each gets replaced with real content stage by stage.
 */
export default function ComingSoon({ title, description }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="p-8">
        <Card>
          <p className="text-sm text-muted">This section is coming in an upcoming build stage.</p>
        </Card>
      </div>
    </>
  );
}
