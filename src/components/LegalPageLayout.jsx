import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

export default function LegalPageLayout({ title, updated, children }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16 w-full">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-ink mb-2">{title}</h1>
        {updated && <p className="text-xs text-muted mb-8">Last updated: {updated}</p>}
        <div className="prose-legal text-sm md:text-base text-ink space-y-5">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
