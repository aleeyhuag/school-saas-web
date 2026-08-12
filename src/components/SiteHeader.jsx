import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';

export default function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-display font-bold text-sm">
            {BRAND.productName.charAt(0)}
          </div>
          <span className="font-display font-bold text-ink">{BRAND.productName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/#features" className="text-sm text-muted hover:text-ink transition-colors">Features</Link>
          <Link to="/#how-it-works" className="text-sm text-muted hover:text-ink transition-colors">How it works</Link>
          <Link to="/contact" className="text-sm text-muted hover:text-ink transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-muted hover:text-ink transition-colors">
            Log in
          </Link>
          <Link
            to="/register-school"
            className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
