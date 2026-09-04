'use client';

import React from 'react';

export default function Footer() {
  const handleOpenFeedback = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-feedback'));
    }
  };

  return (
    <footer className="border-t border-[#243324]/10 bg-[#FBF9F5] py-10 text-center text-sm text-[#243324]/60 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5">
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
        <p className="text-xs text-[#243324]/60 max-w-4xl mx-auto leading-relaxed">
          This is an ongoing personal project. Feel free to report issues, suggest enhancements, or share general feedback via the{' '}
          <button
            type="button"
            onClick={handleOpenFeedback}
            className="underline underline-offset-2 hover:text-[#243324] font-semibold text-[#243324]/80 transition-colors inline-flex items-center cursor-pointer"
          >
            Feedback
          </button>.
        </p>
        <p className="text-xs text-[#243324]/40 pt-1">
          © 2026 SG DataViz • Built with open public datasets • Not affiliated with or endorsed by the Singapore Government.
        </p>
      </div>
    </footer>
  );
}
