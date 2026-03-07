export function ReportCtaBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Interested in migrating your website to a modern platform?
        </p>
        <a
          href="https://pagepro.co/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Contact Pagepro
        </a>
      </div>
    </div>
  );
}
