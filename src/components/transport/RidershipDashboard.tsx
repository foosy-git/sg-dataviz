'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Train,
  Bus,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Download,
  Search,
  ArrowUpDown,
  Table as TableIcon,
  BarChart3,
  Layers,
  Info
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
}

const COLOR_MRT = '#2563eb'; // Blue
const COLOR_BUS = '#10b981'; // Green
const COLOR_LRT = '#8b5cf6'; // Violet
const COLOR_TOTAL = '#1F2B1D'; // Dark Green

export default function RidershipDashboard({ data }: { data: RidershipRecord[] }) {
  const [selectedTab, setSelectedTab] = useState<'volume' | 'share' | 'change' | 'lines'>('volume');
  const [timeFilter, setTimeFilter] = useState<'all' | '10y' | 'since2000'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tableSortDirection, setTableSortDirection] = useState<'desc' | 'asc'>('desc');

  // Aggregate raw dataset records by year
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

    return sortedYears.map((d, index) => {
      const railTotal = d.MRT + d.LRT;
      const total = railTotal + d.Bus;
      const prev = index > 0 ? sortedYears[index - 1] : null;
      const prevTotal = prev ? prev.MRT + prev.LRT + prev.Bus : total;
      const yoyTotalChange = index > 0 ? total - prevTotal : 0;
      const yoyTotalPct = index > 0 && prevTotal > 0 ? Number(((yoyTotalChange / prevTotal) * 100).toFixed(1)) : 0;

      return {
        year: d.year,
        MRT: d.MRT,
        LRT: d.LRT,
        Bus: d.Bus,
        railTotal,
        total,
        mrtPct: total > 0 ? Number(((d.MRT / total) * 100).toFixed(1)) : 0,
        lrtPct: total > 0 ? Number(((d.LRT / total) * 100).toFixed(1)) : 0,
        busPct: total > 0 ? Number(((d.Bus / total) * 100).toFixed(1)) : 0,
        railPct: total > 0 ? Number(((railTotal / total) * 100).toFixed(1)) : 0,
        yoyTotalChange,
        yoyTotalPct
      };
    });
  }, [data]);

  // Filter dataset by selected time horizon
  const displayChartData = useMemo(() => {
    if (timeFilter === '10y') {
      return fullChartData.filter(d => parseInt(d.year) >= 2014);
    }
    if (timeFilter === 'since2000') {
      return fullChartData.filter(d => parseInt(d.year) >= 2000);
    }
    return fullChartData;
  }, [fullChartData, timeFilter]);

  // Derived baseline and latest summary figures
  const latestData = fullChartData[fullChartData.length - 1] || {
    year: '2024',
    total: 0,
    MRT: 0,
    LRT: 0,
    Bus: 0,
    railTotal: 0,
    railPct: 0,
    busPct: 0,
    yoyTotalChange: 0,
    yoyTotalPct: 0
  };
  const prevData = fullChartData[fullChartData.length - 2] || latestData;
  const firstData = fullChartData[0] || latestData;

  const totalNetGrowth = firstData.total > 0 ? (((latestData.total - firstData.total) / firstData.total) * 100).toFixed(1) : '0';
  const mrtNetGrowth = firstData.MRT > 0 ? (((latestData.MRT - firstData.MRT) / firstData.MRT) * 100).toFixed(1) : '0';
  const busNetGrowth = firstData.Bus > 0 ? (((latestData.Bus - firstData.Bus) / firstData.Bus) * 100).toFixed(1) : '0';

  // Selected year data for explorer
  const selectedYearData = useMemo(() => {
    return fullChartData.find(d => d.year === selectedYear) || latestData;
  }, [fullChartData, selectedYear, latestData]);

  // Filtered and sorted data for tabular view
  const tableData = useMemo(() => {
    let list = [...fullChartData];
    if (searchQuery.trim()) {
      list = list.filter(d => d.year.includes(searchQuery.trim()));
    }
    list.sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      return tableSortDirection === 'desc' ? yearB - yearA : yearA - yearB;
    });
    return list;
  }, [fullChartData, searchQuery, tableSortDirection]);

  // Export raw data to CSV
  const handleExportCSV = () => {
    const headers = ['Year', 'MRT Average Daily', 'LRT Average Daily', 'Rail Total', 'Bus Average Daily', 'Total Average Daily', 'MRT Share (%)', 'Bus Share (%)', 'YoY Total Change'];
    const rows = fullChartData.map(d => [
      d.year,
      d.MRT,
      d.LRT,
      d.railTotal,
      d.Bus,
      d.total,
      d.mrtPct,
      d.busPct,
      d.yoyTotalChange
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'singapore_public_transport_ridership_data_gov_sg.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Chart Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const yearStr = String(label);
      const entry = fullChartData.find(d => d.year === yearStr);

      return (
        <div className="bg-[#1F2B1D] text-white p-3.5 rounded-xl shadow-2xl border border-white/10 text-xs min-w-[220px]">
          <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-2">
            <span className="font-semibold text-sm tracking-wide text-[#E8DCC4]">Year {yearStr}</span>
            {entry && (
              <span className="font-mono text-[11px] text-white/70">
                Total: {(entry.total / 1000000).toFixed(2)}M / day
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-sans">
            {payload.map((p: any, i: number) => {
              const val = Number(p.value);
              const isPct = selectedTab === 'share' || p.dataKey?.includes('Pct');
              const isChange = selectedTab === 'change';

              let formattedVal = '';
              if (isPct) formattedVal = `${val.toFixed(1)}%`;
              else if (isChange) formattedVal = `${val > 0 ? '+' : ''}${(val / 1000).toFixed(0)}k / day`;
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
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#243324] pb-24 font-sans selection:bg-[#E8DCC4] selection:text-[#1F2B1D]">
      {/* 1. Header Bar */}
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
                Transport
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
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Dataset: d_75248cf2fbf340de6a746dc91ec9223c • data.gov.sg</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1F2B1D] tracking-tight leading-tight">
              Public Transport Ridership
            </h1>
            <p className="text-base sm:text-lg text-[#243324]/75 font-light leading-relaxed">
              Official annual records of average daily passenger trips across Singapore&apos;s Mass Rapid Transit (MRT),
              Light Rail Transit (LRT), and Public Bus services from 1995 to 2024.
            </p>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:self-start lg:self-end">
            <span className="text-xs font-medium text-[#243324]/60 uppercase tracking-wider mr-1">Time Range:</span>
            {(
              [
                { id: 'all', label: 'All Years (1995–2024)' },
                { id: 'since2000', label: '2000–2024' },
                { id: '10y', label: 'Past 10 Years' }
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

        {/* 3. Factual KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {/* Total Average Daily Ridership */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#243324]/60">
                  <Users className="w-4 h-4 text-[#243324]" />
                  <span>Total Daily Journeys</span>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  latestData.yoyTotalPct >= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {latestData.yoyTotalPct >= 0 ? '+' : ''}{latestData.yoyTotalPct}% YoY
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-serif text-[#1F2B1D] tracking-tight mb-1">
                {(latestData.total / 1000000).toFixed(2)}M
              </div>
              <div className="text-xs text-[#243324]/70 font-medium mb-3">
                Average daily journeys in {latestData.year}
              </div>
              <div className="pt-2.5 border-t border-[#243324]/5 flex items-center justify-between text-[11px] text-[#243324]/60">
                <span>Net change vs {prevData.year}:</span>
                <span className="font-semibold text-[#1F2B1D]">
                  {latestData.yoyTotalChange >= 0 ? '+' : ''}{(latestData.yoyTotalChange / 1000).toFixed(0)}k / day
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Rail (MRT + LRT) */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                  <Train className="w-4 h-4" />
                  <span>Rail (MRT & LRT)</span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {latestData.railPct}% of total
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-serif text-[#1F2B1D] tracking-tight mb-1">
                {(latestData.railTotal / 1000000).toFixed(2)}M
              </div>
              <div className="text-xs text-[#243324]/70 font-medium mb-3">
                MRT: {(latestData.MRT / 1000000).toFixed(2)}M • LRT: {(latestData.LRT / 1000).toFixed(0)}k
              </div>
              <div className="pt-2.5 border-t border-[#243324]/5 flex items-center justify-between text-[11px] text-[#243324]/60">
                <span>MRT change since 1995:</span>
                <span className="font-semibold text-blue-700">+{mrtNetGrowth}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Public Bus */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  <Bus className="w-4 h-4" />
                  <span>Public Bus</span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {latestData.busPct}% of total
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-serif text-[#1F2B1D] tracking-tight mb-1">
                {(latestData.Bus / 1000000).toFixed(2)}M
              </div>
              <div className="text-xs text-[#243324]/70 font-medium mb-3">
                Average daily bus passenger volume
              </div>
              <div className="pt-2.5 border-t border-[#243324]/5 flex items-center justify-between text-[11px] text-[#243324]/60">
                <span>Bus change since 1995:</span>
                <span className="font-semibold text-emerald-700">+{busNetGrowth}%</span>
              </div>
            </CardContent>
          </Card>

          {/* 30-Year Net Change */}
          <Card className="bg-[#1F2B1D] text-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3 text-white/70">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E8DCC4]">
                  <Calendar className="w-4 h-4" />
                  <span>1995 to {latestData.year}</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-white/80">
                  30 Years
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-serif text-[#E8DCC4] tracking-tight mb-1">
                +{totalNetGrowth}%
              </div>
              <div className="text-xs text-white/75 font-light leading-relaxed mb-3">
                Total daily ridership increased from {(firstData.total / 1000000).toFixed(2)}M (1995) to {(latestData.total / 1000000).toFixed(2)}M ({latestData.year})
              </div>
              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/70">
                <span>Rail Share Shift:</span>
                <span className="font-semibold text-white">
                  {firstData.railPct}% (1995) ➔ {latestData.railPct}% ({latestData.year})
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Interactive Year Data Explorer */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-12">
          <CardHeader className="border-b border-[#243324]/10 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="font-serif text-xl text-[#1F2B1D]">
                  Annual Breakdown Explorer ({selectedYear})
                </CardTitle>
                <CardDescription>
                  Select any calendar year from the dataset to view exact daily ridership numbers and mode shares.
                </CardDescription>
              </div>

              {/* Quick Year Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="yearSelect" className="text-xs font-medium text-[#243324]/60">Select Year:</label>
                <select
                  id="yearSelect"
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  aria-label="Select year to inspect"
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-[#243324]/15 bg-white text-[#243324] font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-[#243324]"
                >
                  {fullChartData.map(d => (
                    <option key={d.year} value={d.year}>{d.year}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-3 mb-6">
              <input
                type="range"
                min="1995"
                max="2024"
                step="1"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                aria-label="Year slider from 1995 to 2024"
                className="w-full h-2 bg-[#243324]/10 rounded-lg appearance-none cursor-pointer accent-[#243324]"
              />
              <div className="flex justify-between text-[11px] text-[#243324]/50 font-mono">
                <span>1995</span>
                <span>2000</span>
                <span>2005</span>
                <span>2010</span>
                <span>2015</span>
                <span>2020</span>
                <span>2024</span>
              </div>
            </div>

            {/* Proportional Mode Stack Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-[#243324]/70">
                <span className="font-semibold uppercase tracking-wider">Mode Distribution ({selectedYear})</span>
                <span className="font-mono font-medium text-[#1F2B1D]">
                  Total: {(selectedYearData.total / 1000000).toFixed(2)}M journeys / day
                </span>
              </div>
              <div className="h-5 w-full rounded-full overflow-hidden flex bg-gray-100 shadow-inner">
                <div
                  style={{ width: `${selectedYearData.mrtPct}%` }}
                  className="bg-blue-600 transition-all duration-200 flex items-center justify-center text-[10px] font-semibold text-white px-1 truncate"
                >
                  {selectedYearData.mrtPct > 8 ? `MRT ${selectedYearData.mrtPct}%` : ''}
                </div>
                {selectedYearData.lrtPct > 0 && (
                  <div
                    style={{ width: `${selectedYearData.lrtPct}%` }}
                    className="bg-purple-600 transition-all duration-200 flex items-center justify-center text-[10px] font-semibold text-white px-1 truncate"
                  >
                    {selectedYearData.lrtPct > 2 ? `${selectedYearData.lrtPct}%` : ''}
                  </div>
                )}
                <div
                  style={{ width: `${selectedYearData.busPct}%` }}
                  className="bg-emerald-600 transition-all duration-200 flex items-center justify-center text-[10px] font-semibold text-white px-1 truncate"
                >
                  {selectedYearData.busPct > 8 ? `Bus ${selectedYearData.busPct}%` : ''}
                </div>
              </div>
            </div>

            {/* Mode Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
                <div className="flex items-center justify-between text-xs text-blue-900 font-medium mb-1">
                  <span>Mass Rapid Transit (MRT)</span>
                  <span className="font-semibold">{selectedYearData.mrtPct}%</span>
                </div>
                <div className="text-2xl font-serif text-[#1F2B1D]">
                  {(selectedYearData.MRT / 1000000).toFixed(2)}M
                </div>
                <div className="text-[11px] text-blue-700 mt-0.5">
                  {selectedYearData.MRT.toLocaleString()} journeys / day
                </div>
              </div>

              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40">
                <div className="flex items-center justify-between text-xs text-purple-900 font-medium mb-1">
                  <span>Light Rail Transit (LRT)</span>
                  <span className="font-semibold">{selectedYearData.lrtPct}%</span>
                </div>
                <div className="text-2xl font-serif text-[#1F2B1D]">
                  {(selectedYearData.LRT / 1000).toFixed(0)}k
                </div>
                <div className="text-[11px] text-purple-700 mt-0.5">
                  {selectedYearData.LRT.toLocaleString()} journeys / day
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40">
                <div className="flex items-center justify-between text-xs text-emerald-900 font-medium mb-1">
                  <span>Public Bus</span>
                  <span className="font-semibold">{selectedYearData.busPct}%</span>
                </div>
                <div className="text-2xl font-serif text-[#1F2B1D]">
                  {(selectedYearData.Bus / 1000000).toFixed(2)}M
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  {selectedYearData.Bus.toLocaleString()} journeys / day
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Chart Suite */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-12">
          <CardHeader className="border-b border-[#243324]/10 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-serif text-2xl text-[#1F2B1D]">
                  {selectedTab === 'volume' && 'Historical Ridership Volume (1995–2024)'}
                  {selectedTab === 'share' && 'Mode Share Percentage (100% Stacked)'}
                  {selectedTab === 'change' && 'Annual Net Change in Daily Journeys'}
                  {selectedTab === 'lines' && 'Individual Mode Comparison'}
                </CardTitle>
                <CardDescription>
                  {selectedTab === 'volume' && 'Stacked volume showing daily average passenger journeys across Bus, MRT, and LRT.'}
                  {selectedTab === 'share' && 'Proportion of total public transit journeys by mode for each calendar year.'}
                  {selectedTab === 'change' && 'Net change in total daily ridership compared to the preceding year.'}
                  {selectedTab === 'lines' && 'Direct comparison of daily passenger volume trends by transport mode.'}
                </CardDescription>
              </div>

              {/* Perspective Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#243324]/5 rounded-xl border border-[#243324]/10 self-start md:self-auto">
                <button
                  onClick={() => setSelectedTab('volume')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTab === 'volume'
                      ? 'bg-white text-[#1F2B1D] shadow-sm font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  Stacked Volume
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
                  onClick={() => setSelectedTab('change')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTab === 'change'
                      ? 'bg-white text-[#1F2B1D] shadow-sm font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  YoY Net Change
                </button>
                <button
                  onClick={() => setSelectedTab('lines')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedTab === 'lines'
                      ? 'bg-white text-[#1F2B1D] shadow-sm font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  Mode Comparison
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="h-[440px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {/* 1. STACKED VOLUME */}
                {selectedTab === 'volume' ? (
                  <AreaChart data={displayChartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="gMRT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR_MRT} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLOR_MRT} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gBus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR_BUS} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLOR_BUS} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gLRT" x1="0" y1="0" x2="0" y2="1">
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
                    <Area
                      type="monotone"
                      dataKey="Bus"
                      name="Public Bus"
                      stackId="1"
                      stroke={COLOR_BUS}
                      fill="url(#gBus)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="MRT"
                      name="Mass Rapid Transit (MRT)"
                      stackId="1"
                      stroke={COLOR_MRT}
                      fill="url(#gMRT)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="LRT"
                      name="Light Rail Transit (LRT)"
                      stackId="1"
                      stroke={COLOR_LRT}
                      fill="url(#gLRT)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : selectedTab === 'share' ? (
                  /* 2. 100% STACKED SHARE */
                  <AreaChart data={displayChartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
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
                ) : selectedTab === 'change' ? (
                  /* 3. NET CHANGE BAR */
                  <BarChart data={displayChartData.slice(1)} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
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
                    <Bar dataKey="yoyTotalChange" name="Net YoY Change (Journeys/day)" radius={[3, 3, 0, 0]}>
                      {displayChartData.slice(1).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.yoyTotalChange >= 0 ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  /* 4. MODE COMPARISON LINES */
                  <LineChart data={displayChartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
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
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total Public Transport"
                      stroke={COLOR_TOTAL}
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Bus"
                      name="Public Bus"
                      stroke={COLOR_BUS}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="MRT"
                      name="Mass Rapid Transit (MRT)"
                      stroke={COLOR_MRT}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="LRT"
                      name="Light Rail Transit (LRT)"
                      stroke={COLOR_LRT}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 6. Raw Data Table */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-12">
          <CardHeader className="border-b border-[#243324]/10 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#243324]/60 mb-1">
                  <TableIcon className="w-4 h-4 text-[#243324]" />
                  <span>Tabular Dataset</span>
                </div>
                <CardTitle className="font-serif text-xl text-[#1F2B1D]">
                  Annual Ridership Records
                </CardTitle>
                <CardDescription>
                  Exact numerical figures from data.gov.sg across all recorded calendar years.
                </CardDescription>
              </div>

              {/* Search & Export */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#243324]/40" />
                  <input
                    type="text"
                    placeholder="Search year..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    aria-label="Filter rows by year"
                    className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#243324]/15 bg-white text-[#243324] placeholder:text-[#243324]/40 focus:outline-none focus:ring-1 focus:ring-[#243324]"
                  />
                </div>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#243324]/15 bg-white hover:bg-[#243324]/5 text-[#243324] font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#243324]/10 bg-[#243324]/5 text-[#243324]/70 uppercase tracking-wider font-semibold">
                  <th
                    className="p-3.5 cursor-pointer hover:text-[#243324]"
                    onClick={() => setTableSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                  >
                    <div className="flex items-center gap-1">
                      <span>Year</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right">MRT (Daily)</th>
                  <th className="p-3.5 text-right">LRT (Daily)</th>
                  <th className="p-3.5 text-right">Rail Total</th>
                  <th className="p-3.5 text-right">Bus (Daily)</th>
                  <th className="p-3.5 text-right">Total Ridership</th>
                  <th className="p-3.5 text-right">Rail Share</th>
                  <th className="p-3.5 text-right">Bus Share</th>
                  <th className="p-3.5 text-right">YoY Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243324]/5 font-sans">
                {tableData.map(row => (
                  <tr key={row.year} className="hover:bg-[#243324]/[0.02] transition-colors">
                    <td className="p-3.5 font-semibold text-[#1F2B1D]">{row.year}</td>
                    <td className="p-3.5 text-right font-mono">{row.MRT.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono">{row.LRT.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono text-blue-700 font-medium">
                      {row.railTotal.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-700 font-medium">
                      {row.Bus.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-[#1F2B1D]">
                      {row.total.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono text-[#243324]/70">{row.railPct}%</td>
                    <td className="p-3.5 text-right font-mono text-[#243324]/70">{row.busPct}%</td>
                    <td className={`p-3.5 text-right font-mono font-medium ${
                      row.yoyTotalChange > 0
                        ? 'text-emerald-700'
                        : row.yoyTotalChange < 0
                        ? 'text-red-600'
                        : 'text-[#243324]/50'
                    }`}>
                      {row.yoyTotalChange > 0 ? '+' : ''}{row.yoyTotalChange.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 7. Dataset Attribution and Methodology */}
        <div className="p-6 rounded-xl bg-white/70 border border-[#243324]/10 text-xs text-[#243324]/70 space-y-2">
          <div className="font-semibold text-[#1F2B1D] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Dataset Information</span>
          </div>
          <p className="leading-relaxed">
            <strong>Source:</strong> Land Transport Authority (LTA) via data.gov.sg (Dataset ID:{' '}
            <code className="text-[#1F2B1D] font-mono bg-[#243324]/5 px-1 py-0.5 rounded">d_75248cf2fbf340de6a746dc91ec9223c</code>).
          </p>
          <p className="leading-relaxed">
            <strong>Metric Definition:</strong> Public transport utilisation figures represent the average daily passenger trips across all operating days in each calendar year. Rail journeys are counted based on station fare gate tap-ins; bus journeys are counted based on passenger boardings.
          </p>
        </div>
      </div>
    </div>
  );
}
