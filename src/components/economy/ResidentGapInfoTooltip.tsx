'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResidentGapInfoTooltipProps {
  className?: string;
  iconClassName?: string;
  align?: 'center' | 'left' | 'right';
  side?: 'top' | 'bottom';
  iconType?: 'info' | 'help';
}

export function ResidentGapInfoTooltip({
  className,
  iconClassName,
  align = 'center',
  side = 'top',
  iconType = 'info'
}: ResidentGapInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    };
  }, []);

  // Alignment classes for tooltip positioning
  const alignClasses = {
    center: 'left-1/2 -translate-x-1/2',
    left: 'left-0',
    right: 'right-0'
  }[align];

  const sideClasses = side === 'top'
    ? 'bottom-full mb-2.5'
    : 'top-full mt-2.5';

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex items-center select-none', className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onFocus={() => setIsOpen(true)}
        className={cn(
          'inline-flex items-center justify-center w-4 h-4 rounded-full text-amber-700/60 hover:text-amber-800 hover:bg-amber-100/60 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-600/40 cursor-pointer',
          iconClassName
        )}
        aria-label="Why is Resident unemployment higher than Overall unemployment?"
        aria-expanded={isOpen}
      >
        {iconType === 'help' ? (
          <HelpCircle className="w-3.5 h-3.5" />
        ) : (
          <Info className="w-3.5 h-3.5" />
        )}
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 w-72 sm:w-84 p-3.5 bg-[#1F2B1D] text-[#FBF9F5] rounded-xl shadow-2xl border border-white/10 text-xs font-sans text-left normal-case tracking-normal',
            sideClasses,
            alignClasses
          )}
        >
          <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Why is Resident Unemployment Higher?</span>
          </div>

          <p className="text-[#FBF9F5]/90 leading-relaxed font-normal mb-2">
            In Singapore, non-resident work passes (Work Permits, S Passes, Employment Passes) are strictly tied to active employment. When non-residents are retrenched, their passes are cancelled and they must repatriate within a short grace period unless they secure a new sponsoring employer.
          </p>

          <p className="text-[#FBF9F5]/90 leading-relaxed font-normal mb-2">
            Consequently, <strong>non-resident unemployment is structurally near zero</strong> by regulatory definition.
          </p>

          <p className="text-[#FBF9F5]/80 text-[11px] leading-normal border-t border-white/10 pt-2">
            💡 <em>Statistical Context:</em> Total (overall) unemployment is a weighted average of both residents and non-residents. Because the non-resident rate is mathematically close to zero, the Total rate is consistently lower than the Resident rate.
          </p>

          {/* Caret pointing towards trigger icon */}
          <div
            className={cn(
              'absolute border-4 border-transparent',
              side === 'top'
                ? 'top-full border-t-[#1F2B1D]'
                : 'bottom-full border-b-[#1F2B1D]',
              align === 'center'
                ? 'left-1/2 -translate-x-1/2'
                : align === 'left'
                ? 'left-3'
                : 'right-3'
            )}
          />
        </div>
      )}
    </div>
  );
}

export default ResidentGapInfoTooltip;
