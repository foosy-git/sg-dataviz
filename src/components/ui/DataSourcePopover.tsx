'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Database, ExternalLink, ShieldCheck, X, Layers, RefreshCw } from 'lucide-react';
import { DataSourceMetadata } from '@/lib/dataSourceConfig';
import { cn } from '@/lib/utils';

export interface DataSourcePopoverProps {
  source: DataSourceMetadata;
  className?: string;
  iconClassName?: string;
  align?: 'left' | 'center' | 'right';
  side?: 'top' | 'bottom';
}

export default function DataSourcePopover({
  source,
  className,
  iconClassName,
  align = 'left',
  side = 'bottom'
}: DataSourcePopoverProps) {
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const alignClasses = {
    left: 'left-0 sm:left-0 sm:-translate-x-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0 sm:right-0 sm:translate-x-0'
  }[align];

  const sideClasses = side === 'top'
    ? 'bottom-full mb-3'
    : 'top-full mt-3';

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex items-center align-middle', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onFocus={handleMouseEnter}
        className={cn(
          'inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer select-none',
          'bg-white/80 hover:bg-[#243324] text-[#243324]/75 hover:text-[#FBF9F5] border border-[#243324]/15 shadow-sm hover:shadow-md hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-[#3B4D36]/40',
          isOpen && 'bg-[#243324] text-[#FBF9F5] ring-2 ring-[#3B4D36]/30',
          iconClassName
        )}
        aria-label={`View data source details for ${source.title}`}
        aria-expanded={isOpen}
      >
        <Database className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={`Data source for ${source.title}`}
          className={cn(
            'absolute z-50 w-[90vw] sm:w-[420px] max-w-[440px] p-5 bg-[#1F2B1D] text-[#FBF9F5] rounded-2xl shadow-2xl border border-[#E8DCC4]/20 text-xs font-sans text-left normal-case tracking-normal animate-in fade-in-0 zoom-in-95 duration-150',
            sideClasses,
            alignClasses
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-[#FBF9F5] tracking-tight">
                    Data Source &amp; Methodology
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-[#E8DCC4]/80 font-medium">
                  {source.agency}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Close popover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dataset Title & Frequency */}
          <div className="mb-3.5 bg-white/5 rounded-xl p-2.5 border border-white/5">
            <div className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold mb-0.5">
              Primary Open Dataset
            </div>
            <div className="font-medium text-white text-xs leading-snug">
              {source.datasetName}
            </div>
            {source.frequency && (
              <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-[#E8DCC4]/70 bg-white/5 px-2 py-0.5 rounded-md">
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Update cadence: {source.frequency}</span>
              </div>
            )}
          </div>

          {/* Summaries */}
          <div className="space-y-2.5 mb-4 text-[#FBF9F5]/90 leading-relaxed text-[11.5px]">
            <div>
              <span className="font-semibold text-[#E8DCC4] block mb-0.5">
                How data is retrieved:
              </span>
              <p className="text-white/80 font-light">
                {source.retrievalSummary}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#E8DCC4] block mb-0.5">
                How insights are generated:
              </span>
              <p className="text-white/80 font-light">
                {source.generationSummary}
              </p>
            </div>
          </div>

          {/* Secondary / Related Datasets if any */}
          {source.additionalSources && source.additionalSources.length > 0 && (
            <div className="mb-4 pt-2.5 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-[#E8DCC4]/70 font-semibold mb-1.5">
                <Layers className="w-3 h-3" />
                <span>Related data.gov.sg tables</span>
              </div>
              <div className="space-y-1">
                {source.additionalSources.map((sec, idx) => (
                  <a
                    key={idx}
                    href={sec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/85 hover:text-white transition-colors text-[11px] group"
                  >
                    <span className="truncate">{sec.name}</span>
                    <ExternalLink className="w-3 h-3 text-white/50 group-hover:text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Footer Link to data.gov.sg */}
          <div className="pt-2 border-t border-white/10">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-medium transition-all shadow-sm group hover:shadow-emerald-900/40"
            >
              <div className="flex items-center gap-2 truncate">
                <span>View source on data.gov.sg</span>
                {source.datasetId && (
                  <span className="font-mono text-[10px] text-emerald-200/80 truncate">
                    ({source.datasetId})
                  </span>
                )}
              </div>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
