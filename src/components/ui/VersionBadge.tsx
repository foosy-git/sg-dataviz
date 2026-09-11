'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, History, CheckCircle2 } from 'lucide-react';

export default function VersionBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  }, []);

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-[#243324]/5 text-[#243324]/75 border border-[#243324]/15 hover:bg-[#243324]/10 hover:text-[#243324] transition-all cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-[#243324]/30"
        aria-label="View version 1.1 changelog"
        title="View version 1.1 changelog"
      >
        v1.1
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Version 1.1 Changelog"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute top-full left-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-[#243324]/10 z-50 p-4 sm:p-5 text-[#243324] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#243324]/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-semibold text-base text-[#243324]">Version 1.1</span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-100/80 text-emerald-800 px-1.5 py-0.5 rounded-full font-medium">
                    Latest
                  </span>
                </div>
                <span className="text-xs text-slate-500">12 Sep 2026 · Changelog &amp; Updates</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close changelog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* v1.1 Change Items */}
          <div className="py-3 space-y-3">
            {/* Item 1: Card Padding */}
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-[#243324]">Roomier Card Layout</div>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                  Added comfortable padding inside all cards on the home page so details no longer feel crowded against the edges.
                </p>
              </div>
            </div>

            {/* Item 2: Air Quality Trends */}
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-[#243324]">3-Day &amp; 7-Day Air Quality Trends</div>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                  You can now track haze and PM2.5 trends over the past 24 hours, 3 days, or 7 days to see how air conditions develop over time.
                </p>
              </div>
            </div>

            {/* Item 3: Average-Based Severity */}
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-[#243324]">Balanced Air Quality Rating</div>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                  The overall haze and PM2.5 severity rating is now calculated using the islandwide average rather than a single regional spike, giving a more balanced picture of everyday air.
                </p>
              </div>
            </div>
          </div>

          {/* Previous version footer */}
          <div className="pt-2.5 border-t border-[#243324]/5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>v1.0 · Initial release</span>
            </span>
            <span>06 Sep 2026</span>
          </div>
        </div>
      )}
    </div>
  );
}
