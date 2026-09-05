'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaselineInfoTooltipProps {
  className?: string;
  iconClassName?: string;
  align?: 'center' | 'left' | 'right';
  side?: 'top' | 'bottom';
}

export function BaselineInfoTooltip({
  className,
  iconClassName,
  align = 'center',
  side = 'top'
}: BaselineInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isTouchRef = useRef(false);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        isTouchRef.current = false;
      }
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

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
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
      onMouseEnter={() => {
        if (isTouchRef.current) return;
        if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;
        setIsOpen(true);
      }}
      onMouseLeave={() => {
        if (isTouchRef.current) return;
        if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;
        setIsOpen(false);
      }}
    >
      <button
        type="button"
        onPointerDown={(e) => {
          if (e.pointerType === 'touch') {
            isTouchRef.current = true;
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          'inline-flex items-center justify-center w-4 h-4 rounded-full text-[#243324]/50 hover:text-[#243324] hover:bg-[#243324]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B4D36]/40 cursor-pointer',
          iconClassName
        )}
        aria-label="Information: Why is 2009-Q1 used as the baseline 100?"
        aria-expanded={isOpen}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 w-72 sm:w-80 p-3.5 bg-[#1F2B1F] text-[#FBF9F5] rounded-xl shadow-2xl border border-[#E8DCC4]/20 text-xs font-sans text-left normal-case tracking-normal',
            sideClasses,
            alignClasses
          )}
        >
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Why is 2009-Q1 the Baseline (100)?</span>
          </div>

          <p className="text-[#FBF9F5]/90 leading-relaxed font-normal mb-2">
            Adopted jointly by <strong>HDB &amp; URA</strong> when transitioning to the stratified hedonic regression method. 
            <strong> 2009-Q1</strong> marks the trough of the Global Financial Crisis (GFC), establishing a synchronized baseline across both public and private residential housing markets.
          </p>

          <p className="text-[#FBF9F5]/80 text-[11px] leading-normal border-t border-white/10 pt-2">
            💡 <em>Rule of thumb:</em> Because 2009-Q1 = 100, an index of 200 indicates that HDB resale prices have effectively doubled (+100%) since this post-GFC baseline.
          </p>

          {/* Caret pointing towards trigger icon */}
          <div
            className={cn(
              'absolute border-4 border-transparent',
              side === 'top'
                ? 'top-full border-t-[#1F2B1F]'
                : 'bottom-full border-b-[#1F2B1F]',
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
export default BaselineInfoTooltip;
