'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Car,
  Train,
  TrendingUp,
  DollarSign,
  GraduationCap,
  Users,
  Sun,
  Wind,
  Sparkles,
  Home,
  ChevronDown,
  LayoutGrid,
  X
} from 'lucide-react';

export const DASHBOARD_LINKS = [
  { href: '/', label: 'Portal Home', icon: Home, desc: 'Centralized directory' },
  { href: '/singapore-story', label: 'The Singapore Story', icon: Sparkles, desc: 'Cross-decade indicator timeline' },
  { href: '/hdb', label: 'HDB Housing', icon: Building2, desc: 'Resale prices & lease decay' },
  { href: '/economy/income', label: 'Income & Wages', icon: DollarSign, desc: 'Household income & inequality' },
  { href: '/economy/employment', label: 'Employment & Labor', icon: TrendingUp, desc: 'Overall & resident unemployment rates' },
  { href: '/education/ges', label: 'Graduate Employment', icon: GraduationCap, desc: 'University degrees & starting pay' },
  { href: '/demographics/birth-rates', label: 'Birth Rates & TFR', icon: Users, desc: 'Demographics & fertility trends' },
  { href: '/transport/coe', label: 'COE Bidding', icon: Car, desc: 'Vehicle quota premiums & quotas' },
  { href: '/transport/commuting', label: 'Public Transport', icon: Train, desc: 'Bus & MRT ridership volumes' },
  { href: '/environment/climate', label: 'Climate & Weather', icon: Sun, desc: 'Temperatures & annual rainfall' },
  { href: '/environment/air-quality', label: 'Air Quality & Haze', icon: Wind, desc: 'Live PSI, PM2.5 & historical haze' },
];

export default function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const activeItem = DASHBOARD_LINKS.find(item => item.href === pathname);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#243324]/80 hover:text-[#243324] bg-white/70 hover:bg-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#243324]/10 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#3B4D36]/20"
        aria-expanded={isOpen}
        aria-label="Toggle dashboard menu"
      >
        <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3B4D36]" />
        <span className="max-w-[120px] sm:max-w-[180px] truncate font-sans">
          {activeItem ? activeItem.label : 'Dashboards'}
        </span>
        <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#243324]/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 sm:hidden" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="fixed sm:absolute top-16 sm:top-full left-2 right-2 sm:left-auto sm:right-0 sm:mt-2 z-50 bg-[#FBF9F5] border border-[#243324]/15 rounded-xl shadow-2xl overflow-hidden sm:w-80 max-h-[80vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="p-3 border-b border-[#243324]/10 bg-white/60 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#243324]/70">
                Singapore Data Portals
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#243324]/40 hover:text-[#243324] p-1 rounded-md"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-2 space-y-1 divide-y divide-[#243324]/5">
              {DASHBOARD_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors text-left ${
                      isActive 
                        ? 'bg-[#243324] text-[#FBF9F5]' 
                        : 'hover:bg-[#243324]/5 text-[#243324]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md mt-0.5 ${isActive ? 'bg-white/20 text-[#FBF9F5]' : 'bg-[#243324]/5 text-[#3B4D36]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight truncate">
                        {link.label}
                      </div>
                      <div className={`text-[11px] leading-tight truncate mt-0.5 ${isActive ? 'text-[#FBF9F5]/70' : 'text-[#243324]/60'}`}>
                        {link.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
