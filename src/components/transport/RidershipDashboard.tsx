'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Train,
  Bus,
  Users,
  TrendingUp,
  Clock,
  Compass,
  Sparkles,
  Info,
  Activity,
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3
} from 'lucide-react';
import DashboardNav from '@/components/ui/DashboardNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
  Cell
} from 'recharts';

interface RidershipRecord {
  year: string;
  mode: string;
  ridership: number;
}

interface YearAggregate {
  year: string;
  MRT: number;
  LRT: number;
  Bus: number;
  railTotal: number;
  total: number;
  mrtPct: number;
  lrtPct: number;
  busPct: number;
  railPct: number;
  yoyTotalChange: number;
  yoyTotalPct: number;
  mrtIndex: number;
  busIndex: number;
  railIndex: number;
  totalIndex: number;
  milestone?: string;
}

// Major historical transit milestones in Singapore
const MILESTONES: Record<string, { title: string; desc: string; tag: string; type: 'rail' | 'bus' | 'event' }> = {
  '1995': {
    title: 'Baseline System (NSL & EWL)',
    desc: 'Singapore transit is predominantly bus-driven (>80% of journeys). MRT operates along original North-South and East-West corridors.',
    tag: 'Baseline Era',
    type: 'rail'
  },
  '1996': {
    title: 'Woodlands Extension Opens',
    desc: 'The Woodlands line extension links Yishun and Choa Chu Kang, forming the North-South Line continuous loop.',
    tag: 'NSL Expansion',
    type: 'rail'
  },
  '1999': {
    title: 'Bukit Panjang LRT Opens',
    desc: "Singapore's first automated driverless light rail transit opens (6 Nov 1999) as a feeder for residential estates.",
    tag: 'LRT Debut',
    type: 'rail'
  },
  '2002': {
    title: 'Changi Airport Line Launches',
    desc: 'Direct train branch line connects Tanah Merah to Changi Airport terminal stations.',
    tag: 'Airport Link',
    type: 'rail'
  },
  '2003': {
    title: 'North East Line (NEL) Launch',
    desc: "World's first fully automated underground driverless heavy rail line (16 stations, 20km). Sengkang LRT also opens.",
    tag: 'NEL Milestone',
    type: 'rail'
  },
  '2005': {
    title: 'Punggol LRT Opens',
    desc: 'Automated feeder network begins operations to serve rapid public housing developments in Punggol.',
    tag: 'Punggol LRT',
    type: 'rail'
  },
  '2009': {
    title: 'Circle Line (Stage 3) Opens',
    desc: 'First phase of the orbital Circle Line begins passenger service between Bartley and Marymount.',
    tag: 'Circle Line',
    type: 'rail'
  },
  '2011': {
    title: 'Circle Line Fully Connects',
    desc: 'Circle Line Stages 4 & 5 open, connecting Buona Vista, Kent Ridge, and HarbourFront into a continuous orbital transit ring.',
    tag: 'CCL Complete',
    type: 'rail'
  },
  '2013': {
    title: 'Downtown Line (DTL 1) Opens',
    desc: 'Downtown Line Stage 1 (Bugis to Chinatown) introduces high-capacity cross-downtown transit.',
    tag: 'DTL Launch',
    type: 'rail'
  },
  '2015': {
    title: 'Downtown Line 2 Opens',
    desc: 'Major western rail spine opens from Bukit Panjang through Bukit Timah down to Rochor.',
    tag: 'DTL2 Expansion',
    type: 'rail'
  },
  '2016': {
    title: 'Bus Contracting Model (BCM)',
    desc: 'LTA restructures public buses into competitive packages with iconic unified Lush Green livery and improved service standards.',
    tag: 'Lush Green Buses',
    type: 'bus'
  },
  '2017': {
    title: 'Downtown Line 3 Opens',
    desc: 'Extends from Fort Canning through the eastern heartlands to Expo, making DTL a 42km line with 35 stations.',
    tag: 'DTL3 Complete',
    type: 'rail'
  },
  '2020': {
    title: 'COVID-19 Circuit Breaker & TEL 1',
    desc: 'Stay-home lockdowns lead to a dramatic ~34.5% ridership plunge. Thomson-East Coast Line Stage 1 opens in Woodlands.',
    tag: 'COVID Shock & TEL1',
    type: 'event'
  },
  '2021': {
    title: 'TEL Stage 2 Opens',
    desc: 'Six stations open from Springleaf to Caldecott interchange as commuting gradually resumes.',
    tag: 'TEL2 Expansion',
    type: 'rail'
  },
  '2022': {
    title: 'TEL Stage 3 (City Stretch) Opens',
    desc: 'Direct connections into Orchard, Shenton Way, and Maxwell open, expanding central rail capacity.',
    tag: 'TEL3 to CBD',
    type: 'rail'
  },
  '2023': {
    title: 'Post-Pandemic Resurgence',
    desc: 'Public transport ridership surpasses 7.19M daily journeys as economic activity and international tourism rebound.',
    tag: 'V-Recovery',
    type: 'event'
  },
  '2024': {
    title: 'TEL Stage 4 & All-Time Record',
    desc: 'Seven East Coast stations open up to Bayshore. MRT and total transit ridership break historical records (7.46M/day).',
    tag: 'Historic Record',
    type: 'rail'
  }
};

const COLOR_MRT = '#2563eb'; // Royal Blue
const COLOR_BUS = '#10b981'; // Emerald / SG Lush Green
const COLOR_LRT = '#8b5cf6'; // Violet
const COLOR_TOTAL = '#1F2B1D'; // Deep Forest

export default function RidershipDashboard({ data }: { data: RidershipRecord[] }) {
  const [selectedTab, setSelectedTab] = useState<'volume' | 'share' | 'growth' | 'change'>('volume');
  const [timeFilter, setTimeFilter] = useState<'all' | '10y' | 'postcovid'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2024');

  // 1. Process & Aggregate data by year
  const fullChartData: YearAggregate[] = useMemo(() => {
    const yearMap = new Map<string, { year: string; MRT: number; LRT: number; Bus: number }>();

    data.forEach(d => {
      if (!yearMap.has(d.year)) {
        yearMap.set(d.year, { year: d.year, MRT: 0, LRT: 0, Bus: 0 });
      }
      const entry = yearMap.get(d.year)!;
      if (d.mode === 'MRT') entry.MRT = d.ridership;
      else if (d.mode === 'LRT') entry.LRT = d.ridership;
      else if (d.mode === 'Bus') entry.Bus = d.ridership;
    });

    const sortedYears = Array.from(yearMap.values()).sort((a, b) => parseInt(a.year) - parseInt(b.year));
    if (sortedYears.length === 0) return [];

    const baseline = sortedYears[0];
    const baseMRT = baseline.MRT || 740000;
    const baseBus = baseline.Bus || 3009000;
    const baseRail = (baseline.MRT || 740000) + (baseline.LRT || 0);
    const baseTotal = baseRail + baseBus;

    return sortedYears.map((d, index) => {
      const railTotal = d.MRT + d.LRT;
      const total = railTotal + d.Bus;
      const prev = index > 0 ? sortedYears[index - 1] : null;
      const prevTotal = prev ? prev.MRT + prev.LRT + prev.Bus : total;
      const yoyTotalChange = index > 0 ? total - prevTotal : 0;
      const yoyTotalPct = index > 0 ? Number(((yoyTotalChange / prevTotal) * 100).toFixed(1)) : 0;

      return {
        year: d.year,
        MRT: d.MRT,
        LRT: d.LRT,
        Bus: d.Bus,
        railTotal,
        total,
        mrtPct: Number(((d.MRT / total) * 100).toFixed(1)),
        lrtPct: Number(((d.LRT / total) * 100).toFixed(1)),
        busPct: Number(((d.Bus / total) * 100).toFixed(1)),
        railPct: Number(((railTotal / total) * 100).toFixed(1)),
        yoyTotalChange,
        yoyTotalPct,
        mrtIndex: Number(((d.MRT / baseMRT) * 100).toFixed(1)),
        busIndex: Number(((d.Bus / baseBus) * 100).toFixed(1)),
        railIndex: Number(((railTotal / baseRail) * 100).toFixed(1)),
        totalIndex: Number(((total / baseTotal) * 100).toFixed(1)),
        milestone: MILESTONES[d.year]?.tag
      };
    });
  }, [data]);

  // 2. Filtered data based on selected time horizon
  const displayChartData = useMemo(() => {
    if (timeFilter === '10y') {
      return fullChartData.filter(d => parseInt(d.year) >= 2014);
    }
    if (timeFilter === 'postcovid') {
      return fullChartData.filter(d => parseInt(d.year) >= 2020);
    }
    return fullChartData;
  }, [fullChartData, timeFilter]);

  // 3. Derived Summary Metrics
  const latestData = fullChartData[fullChartData.length - 1] || {
    year: '2024',
    total: 7459000,
    MRT: 3412000,
    LRT: 210000,
    Bus: 3837000,
    railTotal: 3622000,
    railPct: 48.6,
    busPct: 51.4,
    yoyTotalPct: 3.7
  };
  const firstData = fullChartData[0] || latestData;

  const totalGrowth30Yr = (((latestData.total - firstData.total) / firstData.total) * 100).toFixed(1);
  const mrtGrowth30Yr = (((latestData.MRT - firstData.MRT) / firstData.MRT) * 100).toFixed(1);
  const busGrowth30Yr = (((latestData.Bus - firstData.Bus) / firstData.Bus) * 100).toFixed(1);

  // Selected year object for the Time Machine explorer
  const selectedYearData = useMemo(() => {
    return fullChartData.find(d => d.year === selectedYear) || latestData;
  }, [fullChartData, selectedYear, latestData]);

  // Annual journeys (365 days)
  const annualJourneysBillions = ((latestData.total * 365) / 1000000000).toFixed(2);
  // Journeys per second (24 * 3600 = 86,400)
  const journeysPerSecond = Math.round(latestData.total / 86400);

  // Custom Chart Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const yearStr = String(label);
      const entry = fullChartData.find(d => d.year === yearStr);
      const milestone = MILESTONES[yearStr];

      return (
        <div className="bg-[#1F2B1D] text-white p-3.5 rounded-xl shadow-2xl border border-white/10 text-xs min-w-[240px]">
          <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-2">
            <span className="font-semibold text-sm tracking-wide text-[#E8DCC4]">Year {yearStr}</span>
            {entry && (
              <span className="font-mono text-[11px] text-white/70">
                {(entry.total / 1000000).toFixed(2)}M / day
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-sans">
            {payload.map((p: any, i: number) => {
              const val = Number(p.value);
              const isPct = selectedTab === 'share' || p.dataKey?.includes('Pct');
              const isIndex = selectedTab === 'growth' || p.dataKey?.includes('Index');
              const isChange = selectedTab === 'change';

              let formattedVal = '';
              if (isPct) formattedVal = `${val.toFixed(1)}%`;
              else if (isIndex) formattedVal = `${val.toFixed(1)} (base 100)`;
              else if (isChange) formattedVal = `${val > 0 ? '+' : ''}${(val / 1000).toFixed(0)}k/day`;
              else formattedVal = `${(val / 1000000).toFixed(2)}M / day`;

              return (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.stroke || p.fill }} />
                    <span className="text-white/80">{p.name}</span>
                  </div>
                  <span className="font-mono font-medium text-white">{formattedVal}</span>
                </div>
              );
            })}
          </div>

          {milestone && (
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-start gap-1.5 text-[11px] text-amber-200">
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-semibold text-amber-300">{milestone.title}:</span>{' '}
                <span className="text-white/80 leading-tight">{milestone.desc}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#243324] pb-24 font-sans selection:bg-[#E8DCC4] selection:text-[#1F2B1D]">
      {/* 1. Standardized Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#243324]/10 bg-[#FBF9F5]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#243324]/70 hover:text-[#243324] transition-colors py-1.5 px-3 rounded-lg shadow-sm border border-[#243324]/10 bg-white/70 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Portal</span>
            </Link>
            <div className="h-5 w-px bg-[#243324]/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <div className="bg-[#243324] text-[#FBF9F5] p-1.5 rounded-lg shadow-sm">
                <Train className="w-4 h-4" />
              </div>
              <span className="text-base font-serif font-medium tracking-tight text-[#243324] hidden md:block">
                Singapore Transport
              </span>
            </div>
          </div>
          <DashboardNav />
        </div>
      </header>

      {/* 2. Hero Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b border-[#243324]/10 pb-8">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#243324]/5 border border-[#243324]/10 text-xs font-medium text-[#243324]/80">
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Official Data.gov.sg • 1995–2024 (30-Year Record)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1F2B1D] tracking-tight leading-tight">
              Public Transport Ridership
            </h1>
            <p className="text-base sm:text-lg text-[#243324]/75 font-light leading-relaxed">
              Explore 30 years of daily passenger journeys across Singapore&apos;s MRT, LRT, and Public Bus networks.
              Track how the nation transitioned from bus reliance into an integrated, world-class rail powerhouse.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-start lg:self-end">
            <span className="text-xs font-medium text-[#243324]/60 uppercase tracking-wider mr-1">Time Horizon:</span>
            {(
              [
                { id: 'all', label: 'All 30 Years' },
                { id: '10y', label: 'Past 10 Years' },
                { id: 'postcovid', label: 'Post-COVID (2020+)' }
              ] as const
            ).map(f => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  timeFilter === f.id
                    ? 'bg-[#243324] text-[#FBF9F5] shadow-sm'
                    : 'bg-white/80 text-[#243324]/70 hover:text-[#243324] hover:bg-white border border-[#243324]/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Hero KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {/* Total Daily Journeys */}
          <Card className="bg-white/90 border-[#243324]/10 shadow-sm relative overflow-hidden group hover:border-[#243324]/20 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-purple-600" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#243324]/60">
                  <Users className="w-4 h-4 text-[#243324]" />
                  <span>Total Daily Journeys</span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  +{latestData.yoyTotalPct}% YoY
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-serif text-[#1F2B1D] tracking-tight mb-1">
                {(latestData.total / 1000000).toFixed(2)}M
              </div>
              <div className="text-xs text-[#243324]/70 font-medium mb-3">
                Average daily passenger boardings ({latestData.year})
              </div>
              <div className="pt-2.5 border-t border-[#243324]/5 flex items-center justify-between text-[11px] text-[#243324]/60">
                <span>Annual volume:</span>
                <span className="font-semibold text-[#1F2B1D]">{annualJourneysBillions}B / year</span>
              </div>
            </CardContent>
          </Card>

          {/* Rail (MRT + LRT) */}
          <Card className="bg-white/90 border-[#243324]/10 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                  <Train className="w-4 h-4" />
                  <span>Rail (MRT & LRT)</span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {latestData.railPct}% share
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-serif text-[#1F2B1D] tracking-tight mb-1">
                {(latestData.railTotal / 1000000).toFixed(2)}M
              </div>
              <div className="text-xs text-[#243324]/70 font-medium mb-3">
                MRT: {(latestData.MRT / 1000000).toFixed(2)}M • LRT: {(latestData.LRT / 1000).toFixed(0)}k
              </div>
              <div className="pt-2.5 border-t border-[#243324]/5 flex items-center justify-between text-[11px] text-[#243324]/60">
                <span>30-Year Surge:</span>
                <span className="font-semibold text-blue-700">+{mrtGrowth30Yr}% (4.6x)</span>
              </div>
            </CardContent>
          </Card>

          {/* Public Bus */}
          <Card className="bg-white/90 border-[#243324]/10 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  <Bus className="w-4 h-4" />
                  <span>Public Bus Fleet</span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {latestData.busPct}% share
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-serif text-[#1F2B1D] tracking-tight mb-1">
                {(latestData.Bus / 1000000).toFixed(2)}M
              </div>
              <div className="text-xs text-[#243324]/70 font-medium mb-3">
                300+ routes • High-density island feeder
              </div>
              <div className="pt-2.5 border-t border-[#243324]/5 flex items-center justify-between text-[11px] text-[#243324]/60">
                <span>Volume since 1995:</span>
                <span className="font-semibold text-emerald-700">+{busGrowth30Yr}% growth</span>
              </div>
            </CardContent>
          </Card>

          {/* 30-Year Modal Flip */}
          <Card className="bg-[#1F2B1D] text-white border-none shadow-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3 text-white/70">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E8DCC4]">
                  <Compass className="w-4 h-4" />
                  <span>The 30-Yr Shift</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-white/80">
                  1995 ➔ 2024
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-2xl font-serif text-[#E8DCC4]">20% ➔ 49%</div>
                <span className="text-xs text-white/60">rail share</span>
              </div>
              <p className="text-xs text-white/75 font-light leading-relaxed mb-3">
                From 4-in-5 taking buses in 1995 to an almost 1:1 balance today as rail coverage expanded.
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/70">
                <span>Total System Volume:</span>
                <span className="font-semibold text-white">+{totalGrowth30Yr}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Real-World Transit Pulse Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 mb-10 rounded-2xl bg-white border border-[#243324]/10 shadow-sm">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1F2B1D]">~{journeysPerSecond} Trips Every Second</div>
              <div className="text-[11px] text-[#243324]/60">Around-the-clock boarding rate across SG</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center shrink-0">
              <Train className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1F2B1D]">All-Time MRT Peak: 3.41M</div>
              <div className="text-[11px] text-[#243324]/60">Surpassed pre-COVID high (3.38M in 2019)</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1F2B1D]">+48.0% Post-COVID Rebound</div>
              <div className="text-[11px] text-[#243324]/60">V-shaped surge from 2020 low (5.04M)</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1F2B1D]">~1.24 Daily Trips / Resident</div>
              <div className="text-[11px] text-[#243324]/60">Among highest transit usage globally</div>
            </div>
          </div>
        </div>

        {/* 5. Interactive Transit Time Machine (Year Explorer) */}
        <Card className="bg-gradient-to-br from-white via-white to-[#F6F2EA] border-[#243324]/10 shadow-sm mb-12 overflow-hidden">
          <CardHeader className="border-b border-[#243324]/10 pb-4 bg-white/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#243324]/60 mb-1">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Transit Time Machine</span>
                </div>
                <CardTitle className="font-serif text-2xl text-[#1F2B1D]">
                  Singapore Commuting in {selectedYear}
                </CardTitle>
                <CardDescription>
                  Drag the slider or click a landmark year to travel through three decades of Singapore&apos;s commuting landscape.
                </CardDescription>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { yr: '1995', label: '1995 (Baseline)' },
                  { yr: '2003', label: '2003 (NEL)' },
                  { yr: '2011', label: '2011 (Circle Line)' },
                  { yr: '2017', label: '2017 (DTL 3)' },
                  { yr: '2020', label: '2020 (COVID)' },
                  { yr: '2024', label: '2024 (Record)' }
                ].map(item => (
                  <button
                    key={item.yr}
                    onClick={() => setSelectedYear(item.yr)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-medium ${
                      selectedYear === item.yr
                        ? 'bg-[#243324] text-white shadow-sm'
                        : 'bg-white/80 hover:bg-white text-[#243324]/70 border border-[#243324]/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            {/* Year Slider */}
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center text-xs font-medium text-[#243324]/70">
                <span>1995 (Launch Era)</span>
                <span className="text-base font-serif font-semibold text-[#1F2B1D] px-3 py-0.5 rounded-full bg-[#E8DCC4]/50 border border-[#243324]/10">
                  Year {selectedYear}
                </span>
                <span>2024 (Present Day)</span>
              </div>
              <input
                type="range"
                min="1995"
                max="2024"
                step="1"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full h-2 bg-[#243324]/10 rounded-lg appearance-none cursor-pointer accent-[#243324]"
              />
              <div className="flex justify-between text-[10px] text-[#243324]/40 font-mono">
                <span>90s Rail Beginnings</span>
                <span>NEL & Circle Line</span>
                <span>Downtown Line & BCM</span>
                <span>TEL & Post-Pandemic</span>
              </div>
            </div>

            {/* Time Machine Snapshot Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Snapshot Metrics */}
              <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-[#243324]/10 shadow-xs space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#243324]/60 mb-1">
                    <span className="font-semibold uppercase tracking-wider">Daily Passenger Volume</span>
                    <span className="font-mono">
                      {selectedYear === '2024'
                        ? 'All-time peak volume'
                        : `${(((selectedYearData.total - latestData.total) / latestData.total) * 100).toFixed(1)}% vs 2024`}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-serif text-[#1F2B1D] tracking-tight">
                    {(selectedYearData.total / 1000000).toFixed(2)} Million <span className="text-lg font-sans text-[#243324]/60">journeys / day</span>
                  </div>
                </div>

                {/* Mode Breakdown Visualizer */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#243324]/60">
                    Mode Share Breakdown ({selectedYear})
                  </div>

                  {/* Proportional Stack Bar */}
                  <div className="h-6 w-full rounded-full overflow-hidden flex shadow-inner bg-gray-100">
                    <div
                      style={{ width: `${selectedYearData.mrtPct}%` }}
                      className="bg-blue-600 transition-all duration-300 flex items-center justify-center text-[10px] font-semibold text-white truncate px-1"
                      title={`MRT: ${selectedYearData.mrtPct}%`}
                    >
                      {selectedYearData.mrtPct > 10 ? `MRT ${selectedYearData.mrtPct}%` : ''}
                    </div>
                    {selectedYearData.lrtPct > 0 && (
                      <div
                        style={{ width: `${selectedYearData.lrtPct}%` }}
                        className="bg-purple-600 transition-all duration-300 flex items-center justify-center text-[10px] font-semibold text-white truncate px-1"
                        title={`LRT: ${selectedYearData.lrtPct}%`}
                      >
                        {selectedYearData.lrtPct > 3 ? `${selectedYearData.lrtPct}%` : ''}
                      </div>
                    )}
                    <div
                      style={{ width: `${selectedYearData.busPct}%` }}
                      className="bg-emerald-600 transition-all duration-300 flex items-center justify-center text-[10px] font-semibold text-white truncate px-1"
                      title={`Bus: ${selectedYearData.busPct}%`}
                    >
                      {selectedYearData.busPct > 10 ? `Bus ${selectedYearData.busPct}%` : ''}
                    </div>
                  </div>

                  {/* Mode details row */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                      <div className="flex items-center gap-1.5 text-xs text-blue-800 font-medium">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>MRT</span>
                      </div>
                      <div className="text-base font-semibold text-[#1F2B1D] mt-0.5">
                        {(selectedYearData.MRT / 1000000).toFixed(2)}M
                      </div>
                      <div className="text-[11px] text-blue-700">{selectedYearData.mrtPct}% share</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100">
                      <div className="flex items-center gap-1.5 text-xs text-purple-800 font-medium">
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                        <span>LRT</span>
                      </div>
                      <div className="text-base font-semibold text-[#1F2B1D] mt-0.5">
                        {(selectedYearData.LRT / 1000).toFixed(0)}k
                      </div>
                      <div className="text-[11px] text-purple-700">{selectedYearData.lrtPct}% share</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>Bus</span>
                      </div>
                      <div className="text-base font-semibold text-[#1F2B1D] mt-0.5">
                        {(selectedYearData.Bus / 1000000).toFixed(2)}M
                      </div>
                      <div className="text-[11px] text-emerald-700">{selectedYearData.busPct}% share</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestone & Era Context Card */}
              <div className="lg:col-span-5 bg-[#1F2B1D] text-white p-6 rounded-xl shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#E8DCC4] text-[#1F2B1D]">
                      Era Snapshot
                    </span>
                    <span className="text-xs text-white/60 font-mono">Singapore Transit History</span>
                  </div>

                  {MILESTONES[selectedYear] ? (
                    <div className="space-y-3">
                      <h3 className="text-xl font-serif text-[#E8DCC4] font-medium leading-snug">
                        {MILESTONES[selectedYear].title}
                      </h3>
                      <p className="text-sm text-white/80 font-light leading-relaxed">
                        {MILESTONES[selectedYear].desc}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-lg font-serif text-[#E8DCC4] font-medium">
                        Steady Network Expansion
                      </h3>
                      <p className="text-sm text-white/80 font-light leading-relaxed">
                        In {selectedYear}, Singapore public transit carried{' '}
                        <strong className="text-white font-medium">
                          {(selectedYearData.total / 1000000).toFixed(2)} million
                        </strong>{' '}
                        daily journeys, reflecting continuous population density growth and feeder integration between bus and rail corridors.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
                  <span>Rail vs Bus Balance:</span>
                  <span className="font-semibold text-[#E8DCC4]">
                    {selectedYearData.railPct}% Rail / {selectedYearData.busPct}% Bus
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Multi-Perspective Interactive Chart Suite */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-12">
          <CardHeader className="border-b border-[#243324]/10 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#243324]/60 mb-1">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Visual Perspectives</span>
                </div>
                <CardTitle className="font-serif text-2xl text-[#1F2B1D]">
                  {selectedTab === 'volume' && 'Historical Ridership Volume & Milestones'}
                  {selectedTab === 'share' && '30-Year Mode Share Transition (Rail vs Bus)'}
                  {selectedTab === 'growth' && 'Growth Multiplier (Indexed to 1995 = 100)'}
                  {selectedTab === 'change' && 'Year-on-Year Passenger Volume Dynamics'}
                </CardTitle>
                <CardDescription>
                  {selectedTab === 'volume' && 'Stacked volume showing the steady rise of rail transit alongside resilient bus capacity.'}
                  {selectedTab === 'share' && '100% normalized view showing how Singapore evolved from an 80% bus system to a balanced multi-modal grid.'}
                  {selectedTab === 'growth' && 'MRT grew +361% (4.6x), driving national transit adoption while buses expanded +28%.'}
                  {selectedTab === 'change' && 'Annual net passenger additions, highlighting the 2020 COVID contraction and the swift post-pandemic rebound.'}
                </CardDescription>
              </div>

              {/* View Mode Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#243324]/5 rounded-xl border border-[#243324]/10 self-start md:self-auto">
                <button
                  onClick={() => setSelectedTab('volume')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTab === 'volume'
                      ? 'bg-white text-[#1F2B1D] shadow-sm font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  Volume Trend
                </button>
                <button
                  onClick={() => setSelectedTab('share')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTab === 'share'
                      ? 'bg-white text-[#1F2B1D] shadow-sm font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  Mode Share %
                </button>
                <button
                  onClick={() => setSelectedTab('growth')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTab === 'growth'
                      ? 'bg-white text-[#1F2B1D] shadow-sm font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  Growth Index
                </button>
                <button
                  onClick={() => setSelectedTab('change')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTab === 'change'
                      ? 'bg-white text-[#1F2B1D] shadow-sm font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  YoY Change
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Chart Area */}
            <div className="h-[460px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {/* 1. VOLUME TREND (Stacked Area) */}
                {selectedTab === 'volume' ? (
                  <AreaChart data={displayChartData} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="gradientMRT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR_MRT} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLOR_MRT} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gradientBus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR_BUS} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLOR_BUS} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gradientLRT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR_LRT} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={COLOR_LRT} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332415" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#24332490' }}
                      minTickGap={18}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#24332490' }}
                      tickFormatter={v => `${(v / 1000000).toFixed(1)}M`}
                      dx={-5}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                      formatter={value => <span className="text-[#1F2B1D] mr-3">{value}</span>}
                    />
                    {/* Key Reference Milestone Lines */}
                    <ReferenceLine x="2003" stroke="#2563eb" strokeDasharray="3 3" label={{ value: 'NEL (2003)', fill: '#2563eb', fontSize: 11, position: 'top' }} />
                    <ReferenceLine x="2011" stroke="#0284c7" strokeDasharray="3 3" label={{ value: 'CCL (2011)', fill: '#0284c7', fontSize: 11, position: 'top' }} />
                    <ReferenceLine x="2017" stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'DTL (2017)', fill: '#3b82f6', fontSize: 11, position: 'top' }} />
                    <ReferenceLine x="2020" stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'COVID-19', fill: '#ef4444', fontSize: 11, position: 'top' }} />
                    <Area
                      type="monotone"
                      dataKey="Bus"
                      name="Public Bus"
                      stackId="1"
                      stroke={COLOR_BUS}
                      fill="url(#gradientBus)"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="MRT"
                      name="MRT Trains"
                      stackId="1"
                      stroke={COLOR_MRT}
                      fill="url(#gradientMRT)"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="LRT"
                      name="LRT Feeders"
                      stackId="1"
                      stroke={COLOR_LRT}
                      fill="url(#gradientLRT)"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                ) : selectedTab === 'share' ? (
                  /* 2. MODE SHARE TRANSITION (100% Stacked Area) */
                  <AreaChart data={displayChartData} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332415" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#24332490' }}
                      minTickGap={18}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#24332490' }}
                      tickFormatter={v => `${v}%`}
                      domain={[0, 100]}
                      dx={-5}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                      formatter={value => <span className="text-[#1F2B1D] mr-3">{value}</span>}
                    />
                    <ReferenceLine y={50} stroke="#24332440" strokeDasharray="4 4" label={{ value: '50% Equal Share', fill: '#24332480', fontSize: 11, position: 'insideTopLeft' }} />
                    <Area
                      type="monotone"
                      dataKey="busPct"
                      name="Public Bus Share (%)"
                      stackId="share"
                      stroke={COLOR_BUS}
                      fill={COLOR_BUS}
                      fillOpacity={0.8}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="mrtPct"
                      name="MRT Share (%)"
                      stackId="share"
                      stroke={COLOR_MRT}
                      fill={COLOR_MRT}
                      fillOpacity={0.8}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="lrtPct"
                      name="LRT Share (%)"
                      stackId="share"
                      stroke={COLOR_LRT}
                      fill={COLOR_LRT}
                      fillOpacity={0.8}
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : selectedTab === 'growth' ? (
                  /* 3. GROWTH INDEX (1995 = 100) */
                  <LineChart data={displayChartData} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332415" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#24332490' }}
                      minTickGap={18}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#24332490' }}
                      tickFormatter={v => `${v}`}
                      dx={-5}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                      formatter={value => <span className="text-[#1F2B1D] mr-3">{value}</span>}
                    />
                    <ReferenceLine y={100} stroke="#24332440" strokeDasharray="4 4" label={{ value: '1995 Baseline (100)', fill: '#24332480', fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="mrtIndex"
                      name="MRT Growth Index"
                      stroke={COLOR_MRT}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalIndex"
                      name="Total Network Index"
                      stroke={COLOR_TOTAL}
                      strokeWidth={2.5}
                      strokeDasharray="4 2"
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="busIndex"
                      name="Public Bus Index"
                      stroke={COLOR_BUS}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : (
                  /* 4. ANNUAL NET CHANGE (YoY Dynamics Bar Chart) */
                  <BarChart data={displayChartData.slice(1)} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332415" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#24332490' }}
                      minTickGap={18}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#24332490' }}
                      tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                      dx={-5}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                      formatter={value => <span className="text-[#1F2B1D] mr-3">{value}</span>}
                    />
                    <ReferenceLine y={0} stroke="#24332440" />
                    <Bar dataKey="yoyTotalChange" name="Net Annual Change (Journeys/day)" radius={[4, 4, 0, 0]}>
                      {displayChartData.slice(1).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.year === '2020'
                              ? '#ef4444' // Red for COVID shock
                              : entry.yoyTotalChange >= 0
                              ? '#10b981' // Green for expansion
                              : '#f59e0b' // Amber for minor contractions
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Context footnote for the charts */}
            <div className="mt-4 pt-3 border-t border-[#243324]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#243324]/60 gap-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#243324]/60" />
                <span>Hover over any data point to inspect exact volume breakdowns and transit milestone notes.</span>
              </div>
              <div className="font-mono text-[11px] text-[#243324]/50">
                Source: Land Transport Authority (LTA)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Historical Milestone Journey Highlights */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-serif text-[#1F2B1D]">Defining Eras of Singapore Commuting</h2>
              <p className="text-xs text-[#243324]/60">Key infrastructure milestones that revolutionized how residents move across the island.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-[#243324]/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  1995–2003
                </span>
                <span className="text-[11px] font-mono text-[#243324]/50">Early Era</span>
              </div>
              <div className="text-base font-serif font-medium text-[#1F2B1D]">The Bus Hegemony</div>
              <p className="text-xs text-[#243324]/75 font-light leading-relaxed">
                Over 80% of all commutes were made by public bus. The opening of the Woodlands extension (1996) and North East Line (2003) seeded Singapore&apos;s underground rail spine.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#243324]/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  2009–2011
                </span>
                <span className="text-[11px] font-mono text-[#243324]/50">Orbital Rail</span>
              </div>
              <div className="text-base font-serif font-medium text-[#1F2B1D]">The Circle Line Loop</div>
              <p className="text-xs text-[#243324]/75 font-light leading-relaxed">
                The full opening of the Circle Line allowed commuters to bypass busy central interchanges, fundamentally altering travel times between north, west, and south Singapore.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#243324]/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  2013–2017
                </span>
                <span className="text-[11px] font-mono text-[#243324]/50">The Great Expansion</span>
              </div>
              <div className="text-base font-serif font-medium text-[#1F2B1D]">Downtown Line & Lush Green</div>
              <p className="text-xs text-[#243324]/75 font-light leading-relaxed">
                Downtown Line&apos;s three stages connected Bukit Panjang and Expo. Concurrently, the Bus Contracting Model (BCM) introduced unified lush green buses with higher frequency guarantees.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#243324]/10 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded">
                  2020–2024
                </span>
                <span className="text-[11px] font-mono text-[#243324]/50">Resilience & Peak</span>
              </div>
              <div className="text-base font-serif font-medium text-[#1F2B1D]">COVID Shock to Record Highs</div>
              <p className="text-xs text-[#243324]/75 font-light leading-relaxed">
                Ridership plunged to 5.04M during 2020 lockdowns, before making an unprecedented V-shaped comeback. By 2024, TEL Stage 4 drove MRT volume to an all-time record of 3.41M.
              </p>
            </div>
          </div>
        </div>

        {/* 8. Editorial Insights & "Did You Know?" Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: Rail Revolution */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Train className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif text-[#1F2B1D]">
                The Rail Revolution: 4.6x Growth in 30 Years
              </h3>
              <p className="text-xs sm:text-sm text-[#243324]/75 font-light leading-relaxed">
                In 1995, Singapore had just two rail lines carrying 740,000 passenger trips per day.
                Today, with six comprehensive lines (NSL, EWL, NEL, CCL, DTL, TEL) and two LRT networks,
                rail ridership has multiplied by <strong>4.6 times</strong>, surpassing <strong>3.62 million</strong> daily boardings.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-blue-700">
                <span>By the 2030s, Jurong Region Line (JRL) & Cross Island Line (CRL) will add 100+ km</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: The Bus Backbone */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif text-[#1F2B1D]">
                The Resilient Public Bus: Singapore&apos;s Workhorse
              </h3>
              <p className="text-xs sm:text-sm text-[#243324]/75 font-light leading-relaxed">
                Despite rapid rail expansion, buses continue to carry the highest individual share of commuters
                — over <strong>3.83 million</strong> trips every single day.
                Serving as vital first-mile and last-mile connectors, Singapore&apos;s 5,800+ bus fleet touches virtually every neighborhood.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
                <span>Transitioning toward 100% cleaner-energy electric bus fleet by 2040</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: The COVID Anomaly */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif text-[#1F2B1D]">
                The 2020 Pandemic Anomaly & V-Shaped Recovery
              </h3>
              <p className="text-xs sm:text-sm text-[#243324]/75 font-light leading-relaxed">
                The COVID-19 pandemic represented the most severe disruption in Singapore transport history.
                In 2020, daily boardings dropped from 7.69M to 5.04M (-34.5% net decline).
                Over the next four years, commuting surged back by +48%, fully overcoming pandemic declines to reach 7.46M trips/day.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-amber-700">
                <span>Flexible and hybrid working arrangements have permanently smoothed morning peak spikes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Car-Lite Vision */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif text-[#1F2B1D]">
                Building a Walk-Cycle-Ride Car-Lite Nation
              </h3>
              <p className="text-xs sm:text-sm text-[#243324]/75 font-light leading-relaxed">
                Under the Land Transport Master Plan 2040, Singapore targets <strong>9 in 10 peak-period journeys</strong> to be made via Walk-Cycle-Ride modes.
                With 8 in 10 households projected to live within a 10-minute walk of a train station, public transit is the cornerstone of sustainable urban living.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-purple-700">
                <span>Target: 20-minute towns and 45-minute city connections</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 9. Methodology & Attribution Card */}
        <div className="p-6 rounded-xl bg-white/60 border border-[#243324]/10 text-xs text-[#243324]/70 space-y-2">
          <div className="font-semibold text-[#1F2B1D] uppercase tracking-wider text-[11px]">
            Data Source & Counting Methodology
          </div>
          <p className="leading-relaxed">
            Data is sourced directly from the Land Transport Authority (LTA) via the Singapore Government Open Data API (Dataset ID:{' '}
            <code className="text-[#1F2B1D] font-mono bg-[#243324]/5 px-1 py-0.5 rounded">d_75248cf2fbf340de6a746dc91ec9223c</code>).
            Ridership figures represent the average daily passenger journeys across all operating days (weekdays, weekends, and public holidays) in each calendar year.
            A journey is counted whenever a passenger boards a bus, or taps into an MRT/LRT station.
          </p>
        </div>
      </div>
    </div>
  );
}
