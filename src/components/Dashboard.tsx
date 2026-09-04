"use client";

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Building2, Map, LineChart, Activity, DollarSign, ChevronDown, ArrowLeft } from 'lucide-react';
import OverallMarketTrendChart from './charts/OverallMarketTrendChart';
import MacroTrendChart from './charts/MacroTrendChart';
import LeaseDecayChart from './charts/LeaseDecayChart';
import TownHeatmap from './charts/TownHeatmap';
import GeographicalMap from './charts/GeographicalMap';
import InvestorTable from './tables/InvestorTable';
import DashboardFilters from './DashboardFilters';
import ErrorState from './ui/ErrorState';
import { motion, useScroll, useSpring } from 'framer-motion';
import fallbackResaleIndex from '../../public/hdb_resale_index.json';
import fallbackAnnualAvg from '../../public/hdb_historical_avg.json';
import { HdbResaleIndexPoint, HdbAnnualTrendPoint } from '@/types/hdb';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const [selectedTowns, setSelectedTowns] = useState<string[]>([]);
  const [selectedFlatTypes, setSelectedFlatTypes] = useState<string[]>([]);
  const [minLease, setMinLease] = useState<number>(0);
  const [maxLease, setMaxLease] = useState<number>(99);
  const [startMonth, setStartMonth] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');
  const [page, setPage] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'month', direction: 'desc' });
  const [search, setSearch] = useState<string>('');
  
  const queryParams = new URLSearchParams({
    towns: selectedTowns.join(','),
    flatTypes: selectedFlatTypes.join(','),
    minLease: minLease.toString(),
    maxLease: maxLease.toString(),
    startMonth,
    endMonth,
    page: page.toString(),
    sortKey: sortConfig.key,
    sortDir: sortConfig.direction,
    search: search
  });

  const { data, error, isLoading, isValidating } = useSWR(`/api/hdb-live?${queryParams.toString()}`, fetcher, { keepPreviousData: true });
  const analytics = data?.data;
  
  const townsList = ["ANG MO KIO", "BEDOK", "BISHAN", "BUKIT BATOK", "BUKIT MERAH", "BUKIT PANJANG", "BUKIT TIMAH", "CENTRAL AREA", "CHOA CHU KANG", "CLEMENTI", "GEYLANG", "HOUGANG", "JURONG EAST", "JURONG WEST", "KALLANG/WHAMPOA", "MARINE PARADE", "PASIR RIS", "PUNGGOL", "QUEENSTOWN", "SEMBAWANG", "SENGKANG", "SERANGOON", "TAMPINES", "TOA PAYOH", "WOODLANDS", "YISHUN"];
  const flatTypesList = ["1 ROOM", "2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM", "EXECUTIVE", "MULTI-GENERATION"];

  const fallbackAnnualTrend: HdbAnnualTrendPoint[] = useMemo(() => {
    const raw = fallbackAnnualAvg as Record<string, number>;
    const sortedYears = Object.keys(raw).map(Number).sort((a, b) => a - b);
    return sortedYears.map((year, idx) => {
      const avg = raw[year.toString()];
      let yoyChangePercent: number | null = null;
      if (idx > 0) {
        const prev = raw[sortedYears[idx - 1].toString()];
        if (prev) {
          yoyChangePercent = parseFloat((((avg - prev) / prev) * 100).toFixed(2));
        }
      }
      return { year, averagePrice: avg, yoyChangePercent };
    });
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  if (error) return <ErrorState />;

  return (
    <div className="min-h-screen relative font-sans text-[#243324]">
      
      {/* Top Reading Progress Bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-1 bg-[#3B4D36] origin-left z-[60] pointer-events-none transition-colors duration-300"
      />

      {/* Navbar */}
      <div className="sticky top-0 z-50 w-full border-b border-[#243324]/10 bg-[#FBF9F5]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#243324]/60 hover:text-[#243324] transition-colors py-1.5 px-3 rounded-md shadow-sm border border-[#243324]/5 bg-white/50">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Portal</span>
            </Link>
            <div className="h-6 w-px bg-[#243324]/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <div className="bg-[#243324] text-[#FBF9F5] p-1.5 rounded-lg shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-serif tracking-tight text-[#243324] hidden md:block">
                HDB Horizon
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isValidating && (
              <Loader2 className="w-4 h-4 text-[#3B4D36] animate-spin" />
            )}
          </div>
        </div>
      </div>

      <main className="w-full overflow-x-hidden">
        
        {/* HERO SECTION */}
        <section className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center border-b border-[#243324]/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#E8DCC4]/20 via-[#FBF9F5] to-[#FBF9F5] -z-20" />
          
          {/* Faint HDB Skyline Outline */}
          <div className="absolute bottom-[10%] left-0 right-0 h-[50%] pointer-events-none -z-10 opacity-[0.04] overflow-hidden flex items-end">
             <svg className="w-full h-full object-cover object-bottom" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,300 L0,200 L50,200 L50,150 L120,150 L120,100 L180,100 L180,180 L220,180 L220,80 L290,80 L290,50 L350,50 L350,140 L400,140 L400,90 L480,90 L480,160 L540,160 L540,70 L620,70 L620,130 L680,130 L680,40 L760,40 L760,110 L810,110 L810,60 L890,60 L890,150 L950,150 L950,80 L1020,80 L1020,120 L1090,120 L1090,170 L1150,170 L1150,220 L1200,220 L1200,300 Z" fill="#243324" />
                <path d="M70,170 L100,170 M70,190 L100,190 M140,130 L160,130 M140,150 L160,150 M240,110 L270,110 M240,130 L270,130 M310,80 L330,80 M310,100 L330,100 M420,120 L460,120 M420,140 L460,140 M500,100 L520,100 M560,100 L600,100 M560,120 L600,120 M640,160 L660,160 M700,70 L740,70 M700,90 L740,90 M780,140 L790,140 M830,90 L870,90 M830,110 L870,110 M910,180 L930,180 M970,110 L1000,110 M970,130 L1000,130 M1040,150 L1070,150 M1110,190 L1130,190" stroke="#FBF9F5" strokeWidth="4" />
             </svg>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto z-10"
          >
            <h1 className="text-5xl md:text-7xl font-serif text-[#243324] mb-6 tracking-tight leading-tight">
              Singapore Public Housing Report
            </h1>
            <p className="text-lg md:text-xl text-[#243324]/75 max-w-3xl mx-auto font-sans mb-10 leading-relaxed">
              Comprehensive analysis of Singapore&apos;s public housing market — from national macro price cycles (1990–present) to granular estate and transaction exploration (2017–present).
            </p>

            {/* Quick Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
              <button
                type="button"
                onClick={() => document.getElementById('macro-benchmark')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#243324] text-[#FBF9F5] hover:bg-[#3B4D36] transition-colors text-sm font-medium shadow-sm cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>National Macro Benchmark (1990–Present)</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('transaction-explorer')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#243324]/15 text-[#243324] hover:bg-[#E8DCC4]/30 transition-colors text-sm font-medium shadow-sm cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#3B4D36]" />
                <span>Granular Transaction Explorer (2017–Present)</span>
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-8 animate-bounce opacity-50 flex flex-col items-center cursor-pointer"
            onClick={() => document.getElementById('macro-benchmark')?.scrollIntoView({ behavior: 'smooth' })}
          >
             <span className="text-xs font-sans uppercase tracking-widest text-[#243324]/60 mb-1">Explore Data</span>
             <ChevronDown className="w-5 h-5 text-[#243324]/60" />
          </motion.div>
        </section>

        {/* TIER 1: NATIONAL MACRO BENCHMARK (1990 - PRESENT) */}
        <section 
          id="macro-benchmark" 
          className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-b border-[#243324]/10 scroll-mt-20"
        >
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-[#243324]/5 border-[#243324]/20 text-[#243324] text-xs font-semibold uppercase tracking-wider px-3 py-1">
                National Macro Benchmark • 1990–Present • Unfiltered
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif text-[#243324] tracking-tight">
              Singapore HDB Macro Market Benchmark
            </h2>
            <p className="text-[#243324]/75 max-w-3xl text-base md:text-lg mt-2 font-sans leading-relaxed">
              Official constant-quality HDB Resale Price Index (1Q2009 = 100) and historical annual average resale values across 35+ years of policy and economic cycles. This macro benchmark reflects all of Singapore and is unaffected by localized estate filters.
            </p>
          </div>

          <OverallMarketTrendChart 
            resaleIndexData={analytics?.resaleIndex?.length ? analytics.resaleIndex : (fallbackResaleIndex as HdbResaleIndexPoint[])} 
            annualTrendData={analytics?.annualTrend?.length ? analytics.annualTrend : fallbackAnnualTrend} 
          />
        </section>

        {isLoading && !analytics ? (
          <div className="flex flex-col justify-center items-center h-[50vh] space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#E8DCC4] border-t-[#3B4D36] rounded-full animate-spin"></div>
            </div>
            <p className="text-[#243324]/70 font-medium animate-pulse tracking-wide text-sm uppercase">Aggregating records...</p>
          </div>
        ) : (
          <>
            {/* TIER 2: INTERACTIVE TRANSACTION EXPLORER (2017 - PRESENT) */}
            <motion.section 
              id="transaction-explorer"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-b border-[#243324]/10 scroll-mt-20"
            >
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-emerald-500/10 border-emerald-600/20 text-emerald-800 text-xs font-semibold uppercase tracking-wider px-3 py-1">
                    Interactive Explorer • 2017–Present • Dynamic Filters Active
                  </Badge>
                </div>
                <h2 className="text-3xl md:text-5xl font-serif text-[#243324] mb-3 tracking-tight">
                  Estate &amp; Transaction Explorer
                </h2>
                <p className="text-[#243324]/70 max-w-3xl mx-auto text-base md:text-lg font-sans leading-relaxed">
                  Drill down into individual property records across Singapore&apos;s 26 HDB towns. Adjust the parameters below to dynamically update market metrics, price trajectories, spatial heatmaps, and lease decay.
                </p>
              </div>

              {/* Filter Control Panel */}
              <div className="w-full max-w-5xl mx-auto mb-10">
                <DashboardFilters 
                  townsList={townsList}
                  flatTypesList={flatTypesList}
                  selectedTowns={selectedTowns}
                  setSelectedTowns={setSelectedTowns}
                  selectedFlatTypes={selectedFlatTypes}
                  setSelectedFlatTypes={setSelectedFlatTypes}
                  minLease={minLease}
                  setMinLease={setMinLease}
                  maxLease={maxLease}
                  setMaxLease={setMaxLease}
                  startMonth={startMonth}
                  setStartMonth={setStartMonth}
                  endMonth={endMonth}
                  setEndMonth={setEndMonth}
                  search={search}
                  setSearch={setSearch}
                />
              </div>

              {/* Active Filter Scope Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FBF9F5] border border-[#243324]/10 rounded-xl p-4 mb-10">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#243324]/75">
                  <span className="font-semibold text-[#243324] uppercase tracking-wider text-[11px]">Active Filter Scope:</span>
                  {selectedTowns.length > 0 ? (
                    <span className="bg-white px-2.5 py-1 rounded-md border border-[#243324]/15 shadow-2xs font-sans">
                      Towns: {selectedTowns.join(', ')}
                    </span>
                  ) : (
                    <span className="bg-white px-2.5 py-1 rounded-md border border-[#243324]/15 shadow-2xs">All 26 Towns</span>
                  )}
                  {selectedFlatTypes.length > 0 ? (
                    <span className="bg-white px-2.5 py-1 rounded-md border border-[#243324]/15 shadow-2xs">
                      Types: {selectedFlatTypes.join(', ')}
                    </span>
                  ) : (
                    <span className="bg-white px-2.5 py-1 rounded-md border border-[#243324]/15 shadow-2xs">All Flat Types</span>
                  )}
                  {(minLease > 0 || maxLease < 99) && (
                    <span className="bg-white px-2.5 py-1 rounded-md border border-[#243324]/15 shadow-2xs">
                      Lease: {minLease}–{maxLease} yrs
                    </span>
                  )}
                  {(startMonth || endMonth) && (
                    <span className="bg-white px-2.5 py-1 rounded-md border border-[#243324]/15 shadow-2xs">
                      Period: {startMonth || '2017-01'} to {endMonth || 'Latest'}
                    </span>
                  )}
                  {search && (
                    <span className="bg-white px-2.5 py-1 rounded-md border border-[#243324]/15 shadow-2xs">
                      Keyword: &quot;{search}&quot;
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-[#3B4D36]">
                  {analytics?.totalTransactions ? analytics.totalTransactions.toLocaleString() : 0} matching flats transacted
                </div>
              </div>

              {/* Filtered Overview Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                 <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-[#243324]/10 bg-white/60 backdrop-blur-md relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign className="w-24 h-24 text-[#243324] -mt-4 -mr-4"/></div>
                   <CardHeader className="pb-2 relative z-10">
                     <CardTitle className="text-sm font-sans font-semibold text-[#243324]/70 uppercase tracking-wider flex items-center gap-2" title="The middle point of all transaction prices.">
                       <TrendingUp className="w-4 h-4" /> Filtered Median Price
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="relative z-10">
                     <div className="text-5xl font-serif text-[#243324] tracking-tight">
                        {analytics?.medianPrice ? (analytics.medianPrice >= 1000000 ? `$${(analytics.medianPrice / 1000000).toFixed(2)}M` : `$${analytics.medianPrice.toLocaleString()}`) : '-'}
                     </div>
                     <p className="text-sm text-[#243324]/60 font-medium mt-2">Median price of matching transactions</p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-[#243324]/10 bg-white/60 backdrop-blur-md relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Map className="w-24 h-24 text-[#243324] -mt-4 -mr-4"/></div>
                   <CardHeader className="pb-2 relative z-10">
                     <CardTitle className="text-sm font-sans font-semibold text-[#243324]/70 uppercase tracking-wider flex items-center gap-2" title="Price per Square Foot.">
                       <Map className="w-4 h-4" /> Filtered Average PSF
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="relative z-10">
                     <div className="text-5xl font-serif text-[#243324] tracking-tight">
                        {analytics?.avgPsf ? `$${analytics.avgPsf.toLocaleString()}` : '-'}
                     </div>
                     <p className="text-sm text-[#243324]/60 font-medium mt-2">Price per Square Foot of matching flats</p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-[#243324]/10 bg-white/60 backdrop-blur-md relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity className="w-24 h-24 text-[#243324] -mt-4 -mr-4"/></div>
                   <CardHeader className="pb-2 relative z-10">
                     <CardTitle className="text-sm font-sans font-semibold text-[#243324]/70 uppercase tracking-wider flex items-center gap-2" title="Total transactions recorded.">
                       <Activity className="w-4 h-4" /> Filtered Volume
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="relative z-10">
                     <div className="text-5xl font-serif text-[#243324] tracking-tight">
                        {analytics?.totalTransactions ? analytics.totalTransactions.toLocaleString() : '-'}
                     </div>
                     <p className="text-sm text-[#243324]/60 font-medium mt-2">Flats sold matching selected filters</p>
                   </CardContent>
                 </Card>
              </div>

              {/* Filtered Price & Volume Trends */}
              <Card className="shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
                <CardHeader className="border-b border-[#243324]/5 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#E8DCC4]/50 p-3 rounded-lg border border-[#243324]/10"><LineChart className="w-6 h-6 text-[#3B4D36]"/></div>
                    <div>
                      <CardTitle className="text-2xl font-serif text-[#243324]">Filtered Market Trajectory &amp; Volume</CardTitle>
                      <CardDescription className="text-[#243324]/70 text-base mt-1">Monthly median prices and sales volume for the flats matching your active filter parameters (2017–Present).</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <MacroTrendChart data={analytics?.macroTrend || []} isAggregated={true} />
                </CardContent>
              </Card>
            </motion.section>

            {/* HEATMAP SECTION */}
            <motion.section 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-b border-[#243324]/10"
            >
              <div className="text-center mb-16">
                <h2 className="text-4xl font-serif text-[#243324] mb-4">Geographic Distribution</h2>
                <p className="text-[#243324]/70 max-w-2xl mx-auto text-lg">Compare median prices across different HDB towns and estates.</p>
              </div>
              <div className="space-y-8">
                <Card className="shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
                  <CardHeader className="border-b border-[#243324]/5 pb-6">
                      <div className="flex items-center gap-3">
                      <div className="bg-[#E8DCC4]/50 p-3 rounded-lg border border-[#243324]/10"><Map className="w-6 h-6 text-[#3B4D36]"/></div>
                      <div>
                        <CardTitle className="text-2xl font-serif text-[#243324]">Geographical Price Map</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <GeographicalMap data={analytics?.townHeatmap || []} />
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
                  <CardHeader className="border-b border-[#243324]/5 pb-6">
                      <div className="flex items-center gap-3">
                      <div className="bg-[#E8DCC4]/50 p-3 rounded-lg border border-[#243324]/10"><Activity className="w-6 h-6 text-[#3B4D36]"/></div>
                      <div>
                        <CardTitle className="text-2xl font-serif text-[#243324]">Price Ranking by Estate</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <TownHeatmap data={analytics?.townHeatmap || []} isAggregated={true} />
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            {/* DEEP ANALYTICS SECTION */}
            <motion.section 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-b border-[#243324]/10"
            >
              <div className="text-center mb-16">
                <h2 className="text-4xl font-serif text-[#243324] mb-4">Deep Analytics</h2>
                <p className="text-[#243324]/70 max-w-2xl mx-auto text-lg">Investigating lease decay and high-value flat transactions.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                 <Card className="shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
                  <CardHeader className="border-b border-[#243324]/5 pb-6">
                    <CardTitle className="text-xl font-serif text-[#243324] flex items-center gap-3"><Activity className="w-5 h-5 text-[#3B4D36]"/> Lease Decay (Age vs Price)</CardTitle>
                    <CardDescription className="text-[#243324]/70">See how a flat&apos;s price drops as its 99-year lease runs down</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <LeaseDecayChart data={analytics?.leaseDecay || []} isAggregated={true} />
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
                  <CardHeader className="border-b border-[#243324]/5 pb-6">
                    <CardTitle className="text-xl font-serif text-[#243324] flex items-center gap-3"><DollarSign className="w-5 h-5 text-[#3B4D36]"/> Million-Dollar Flats</CardTitle>
                    <CardDescription className="text-[#243324]/70">Transactions &gt;= $1,000,000</CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[400px] overflow-auto scrollbar-thin pr-4 pt-6">
                     <ul className="space-y-4">
                        {analytics?.millionDollar.map((r: { id: string; block: string; streetName: string; town: string; flatType: string; month: string; resalePrice: number }) => (
                          <li key={r.id} className="flex justify-between items-center text-sm border-b pb-4 border-[#243324]/5 last:border-0 hover:bg-[#E8DCC4]/30 p-2 -mx-2 rounded-lg transition-colors">
                            <div>
                              <p className="font-sans font-semibold text-[#243324] text-base">{r.block} {r.streetName}</p>
                              <p className="text-sm text-[#243324]/60 mt-0.5 font-medium">{r.town} • {r.flatType} • {r.month}</p>
                            </div>
                            <Badge variant="secondary" className="font-sans font-bold shadow-sm px-3 py-1 bg-[#243324] text-[#FBF9F5] border-transparent text-sm">${(r.resalePrice / 1000000).toFixed(2)}M</Badge>
                          </li>
                        ))}
                        {(!analytics?.millionDollar || analytics.millionDollar.length === 0) && (
                          <div className="flex flex-col items-center justify-center py-12 text-[#243324]/40">
                             <DollarSign className="w-10 h-10 mb-3 opacity-20" />
                             <p className="text-sm font-medium">No million dollar flats found in this filter.</p>
                          </div>
                        )}
                     </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            {/* GRANULAR DATA SECTION */}
            <motion.section 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="py-24 px-4 md:px-8 max-w-7xl mx-auto"
            >
              <div className="text-center mb-16">
                <h2 className="text-4xl font-serif text-[#243324] mb-4">Raw Transaction Explorer</h2>
                <p className="text-[#243324]/70 max-w-2xl mx-auto text-lg">Sort and export the granular property records that power this report.</p>
              </div>
              <Card className="shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
                <CardHeader className="border-b border-[#243324]/5 pb-6">
                  <CardTitle className="text-xl font-serif text-[#243324] flex items-center gap-3"><Activity className="w-5 h-5 text-[#3B4D36]"/> Granular Data</CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                  <InvestorTable 
                    data={analytics?.tableData || []} 
                    totalCount={analytics?.totalTransactions || 0}
                    sortConfig={sortConfig}
                    setSortConfig={setSortConfig}
                    page={page}
                    setPage={setPage}
                  />
                </CardContent>
              </Card>
            </motion.section>
          </>
        )}
      </main>
    </div>
  );
}
