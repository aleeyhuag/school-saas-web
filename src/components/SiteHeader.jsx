import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';
import ThemeSwitcher from './ThemeSwitcher';

export default function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label={`${BRAND.productName} home`}>
          <img src={BRAND.logoPath} alt={`${BRAND.productName} logo`} className="w-9 h-9 object-contain" />
          <span className="font-display font-bold text-ink">{BRAND.productName}</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-6">
          <Link to="/#features" className="text-sm text-muted hover:text-ink transition-colors">Features</Link>
          <Link to="/#how-it-works" className="text-sm text-muted hover:text-ink transition-colors">How it works</Link>
          <Link to="/help" className="text-sm text-muted hover:text-ink transition-colors">Help Center</Link>
          <Link to="/contact" className="text-sm text-muted hover:text-ink transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSwitcher />
          <Link to="/login" className="hidden sm:inline text-sm font-medium text-muted hover:text-ink transition-colors">Log in</Link>
          <Link to="/register-school" className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">Get Started</Link>
        </div>
      </div>
    </header>
  );
}
