import { Link, useSearchParams } from 'react-router-dom';

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const done = params.get('done') === '1';
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-ink">{done ? 'You are unsubscribed' : 'Unsubscribe'}</h1>
        <p className="text-sm text-muted mt-3">
          {done
            ? 'You will no longer receive Skulag promotional emails at this address. Transactional messages related to an account or school service are not affected.'
            : 'Use the unsubscribe link from the promotional email to update your preference.'}
        </p>
        <Link to="/" className="inline-flex mt-6 bg-primary text-white px-5 py-3 rounded-xl">Back to Skulag</Link>
      </div>
    </div>
  );
}
