import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-[#243324]/10 bg-[#FBF9F5] py-10 text-center text-sm text-[#243324]/60 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
        <p className="font-medium text-[#243324]/80">
          Data reflects the latest public releases published on{' '}
          <a
            href="https://data.gov.sg"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-[#243324] font-semibold transition-colors"
          >
            data.gov.sg
          </a>.
        </p>
        <p className="text-xs text-[#243324]/50">
          © 2026 SG DataViz • Built with open public datasets • Not affiliated with or endorsed by the Singapore Government.
        </p>
      </div>
    </footer>
  );
}
