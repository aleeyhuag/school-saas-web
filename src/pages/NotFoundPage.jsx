import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';

/**
 * Catch-all for any URL that doesn't match a real route — a stale
 * bookmark, a fat-fingered link, an old link shared before a route
 * was renamed. Without this, React Router just renders nothing at
 * that path: a blank white screen with no way back, which reads as
 * "broken" rather than "page not found."
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center max-w-sm">
        <img src={BRAND.logoPath} alt={`${BRAND.productName} logo`} className="w-12 h-12 object-contain mx-auto mb-6" />
        <h1 className="text-2xl font-display font-bold text-ink mb-2">Page not found</h1>
        <p className="text-sm text-muted mb-6">
          The page you're looking for doesn't exist, or the link may be out of date.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
