import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <img src={BRAND.logoPath} alt={`${BRAND.productName} logo`} className="w-9 h-9 object-contain" />
                <span className="font-display font-semibold text-ink text-sm">{BRAND.productName}</span>
              </div>
            </div>
            <p className="text-xs text-muted">School management, built for how Nigerian schools actually run.</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/#features" className="text-xs text-muted hover:text-ink transition-colors">Features</Link>
            <Link to="/register-school" className="text-xs text-muted hover:text-ink transition-colors">Register a school</Link>
            <Link to="/login" className="text-xs text-muted hover:text-ink transition-colors">Log in</Link>
            <Link to="/contact" className="text-xs text-muted hover:text-ink transition-colors">Contact</Link>
            <Link to="/terms" className="text-xs text-muted hover:text-ink transition-colors">Terms</Link>
            <Link to="/privacy" className="text-xs text-muted hover:text-ink transition-colors">Privacy</Link>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {BRAND.productName}. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            By <span className="font-medium text-ink">{BRAND.parentCompany}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
