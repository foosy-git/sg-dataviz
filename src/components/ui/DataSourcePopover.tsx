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
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

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

  // Compute safe position preventing any horizontal viewport truncation
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const targetWidth = Math.min(440, viewportWidth - 24); // 12px padding on each side

      let leftOffset = 0;
      if (align === 'center') {
        leftOffset = rect.width / 2 - targetWidth / 2;
      } else if (align === 'right') {
        leftOffset = rect.width - targetWidth;
      } else {
        leftOffset = 0;
      }

      // Check overflow on right edge of window
      const absoluteRight = rect.left + leftOffset + targetWidth;
      if (absoluteRight > viewportWidth - 12) {
        leftOffset -= (absoluteRight - (viewportWidth - 12));
      }

      // Check overflow on left edge of window
      const absoluteLeft = rect.left + leftOffset;
      if (absoluteLeft < 12) {
        leftOffset += (12 - absoluteLeft);
      }

      setPopoverStyle({
        left: `${leftOffset}px`,
        width: `${targetWidth}px`,
        maxWidth: `calc(100vw - 24px)`
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, align]);

  // Combine primary dataset and additional sources into unified references list
  const references: { name: string; url: string; id?: string; isPrimary?: boolean }[] = [];
  references.push({
    name: source.datasetName,
    url: source.url,
    id: source.datasetId,
    isPrimary: true
  });

  if (source.additionalSources) {
    for (const item of source.additionalSources) {
      if (!references.some((r) => r.url === item.url && r.name === item.name)) {
        references.push({
          name: item.name,
          url: item.url,
          id: item.id,
          isPrimary: false
        });
      }
    }
  }

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
          ref={popoverRef}
          role="dialog"
          aria-label={`Data source for ${source.title}`}
          style={popoverStyle}
          className={cn(
            'absolute z-50 p-5 bg-[#1F2B1D] text-[#FBF9F5] rounded-2xl shadow-2xl border border-[#E8DCC4]/20 text-xs font-sans text-left normal-case tracking-normal max-h-[82vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150',
            sideClasses
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-[#FBF9F5] tracking-tight">
                    Data Source &amp; Methodology
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <div className="text-[11px] text-[#E8DCC4]/80 font-medium">
                  {source.agency}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white p-1 rounded-md transition-colors shrink-0"
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
            <div className="font-medium text-white text-xs leading-snug break-words">
              {source.datasetName}
            </div>
            {source.frequency && (
              <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-[#E8DCC4]/70 bg-white/5 px-2 py-0.5 rounded-md">
                <RefreshCw className="w-2.5 h-2.5 shrink-0" />
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
              <p className="text-white/80 font-light break-words">
                {source.retrievalSummary}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#E8DCC4] block mb-0.5">
                How insights are generated:
              </span>
              <p className="text-white/80 font-light break-words">
                {source.generationSummary}
              </p>
            </div>
          </div>

          {/* All References under 'Related data.gov.sg tables' Section */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-[#E8DCC4]/70 font-semibold mb-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Related data.gov.sg tables</span>
            </div>
            <div className="space-y-1.5">
              {references.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-all text-xs group border border-white/5 hover:border-emerald-500/30"
                >
                  <div className="flex flex-col min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-[11.5px] text-[#FBF9F5] leading-snug group-hover:text-emerald-300 transition-colors break-words">
                        {ref.name}
                      </span>
                      {ref.isPrimary && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold tracking-wider">
                          Primary
                        </span>
                      )}
                    </div>
                    {ref.id && (
                      <span className="font-mono text-[10px] text-white/40 mt-0.5">
                        ID: {ref.id}
                      </span>
                    )}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-emerald-400 shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
