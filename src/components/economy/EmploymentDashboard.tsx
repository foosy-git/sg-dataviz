'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Search,
  ArrowUpDown,
  BarChart2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DashboardNav from '@/components/ui/DashboardNav';
import DataSourcePopover from '@/components/ui/DataSourcePopover';
import { DATA_SOURCES } from '@/lib/dataSourceConfig';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { EmploymentRecord } from '@/lib/employmentData';

interface EmploymentDashboardProps {
  data: EmploymentRecord[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export default function EmploymentDashboard({ data }: EmploymentDashboardProps) {
  const [tableSearch, setTableSearch] = useState('');
  const [sortDescending, setSortDescending] = useState(true);

  // Latest and previous records
  const latestData = data[data.length - 1] || { year: '2026', resident: 2.9 };
  const previousData = data.length > 1 ? data[data.length - 2] : null;

  // Rate YoY Calculations
  const residentDiff = latestData.resident !== null && previousData?.resident !== null && previousData?.resident !== undefined
    ? Number((latestData.resident - previousData.resident).toFixed(1))
    : null;

  // Historical Highs and Lows
  const stats = useMemo(() => {
    let residentMax = -Infinity;
    let residentMaxYears: string[] = [];
    let residentMin = Infinity;
    let residentMinYears: string[] = [];
    let sum = 0;
    let validCount = 0;

    data.forEach(d => {
      if (d.resident !== null) {
        sum += d.resident;
        validCount++;
        if (d.resident > residentMax) {
          residentMax = d.resident;
          residentMaxYears = [d.year];
        } else if (d.resident === residentMax) {
          residentMaxYears.push(d.year);
        }
        if (d.resident < residentMin) {
          residentMin = d.resident;
          residentMinYears = [d.year];
        } else if (d.resident === residentMin) {
          residentMinYears.push(d.year);
        }
      }
    });

    const seriesAvg = validCount > 0 ? Number((sum / validCount).toFixed(1)) : null;

    return {
      residentMax: { val: residentMax, years: residentMaxYears.join(', ') },
      residentMin: { val: residentMin, years: residentMinYears.join(', ') },
      seriesAvg,
      count: data.length,
      startYear: data[0]?.year ?? '1992',
      endYear: data[data.length - 1]?.year ?? '2026',
    };
  }, [data]);

  /**
   * Format rate difference with economic polarity for unemployment:
   * - Rise in unemployment (> 0) is undesirable/unfavorable -> Rose/Red
   * - Drop in unemployment (< 0) is desirable/favorable -> Emerald/Green
   * - Zero change (=== 0) -> Neutral Slate
   */
  const formatRateDiff = (diff: number | null) => {
    if (diff === null || isNaN(diff)) {
      return {
        text: 'N/A',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        isIncrease: false,
        isDecrease: false,
      };
    }
    if (Math.abs(diff) < 0.001) {
      return {
        text: '0.0% pts YoY (Unchanged)',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        isIncrease: false,
        isDecrease: false,
      };
    }
    if (diff > 0) {
      // Rise in unemployment is undesirable (Red)
      return {
        text: `+${diff.toFixed(1)}% pts YoY`,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/70',
        isIncrease: true,
        isDecrease: false,
      };
    }
    // Drop in unemployment is desirable (Green)
    return {
      text: `${diff.toFixed(1)}% pts YoY`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
      isIncrease: false,
      isDecrease: true,
    };
  };

  // Derived dataset with YoY differences for charts and table
  const dataWithYoY = useMemo(() => {
    return data.map((item, idx) => {
      const prev = idx > 0 ? data[idx - 1] : null;
      const residentYoY = prev && prev.resident !== null && item.resident !== null
        ? Number((item.resident - prev.resident).toFixed(1))
        : null;
      return {
        ...item,
        residentYoY,
      };
    });
  }, [data]);

  // Table rows with search and sort
  const tableRows = useMemo(() => {
    let rows = [...dataWithYoY];
    if (tableSearch.trim()) {
      rows = rows.filter(r => r.year.includes(tableSearch.trim()));
    }
    if (sortDescending) {
      rows.reverse();
    }
    return rows;
  }, [dataWithYoY, tableSearch, sortDescending]);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Year',
      'Resident Unemployment Rate (SA %)',
      'Resident YoY Change (% pts)',
    ];
    const rows = dataWithYoY.map(r => [
      r.year,
      r.resident !== null ? r.resident : '',
      r.residentYoY !== null ? r.residentYoY : '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `singapore_resident_unemployment_rates_${stats.startYear}_${stats.endYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Tooltip for the primary resident line chart
  const PrimaryTrendTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const record = payload[0].payload as EmploymentRecord;
      const residentVal = record.resident;
      const matchingRow = dataWithYoY.find(r => r.year === record.year);
      const yoyVal = matchingRow?.residentYoY;

      return (
        <div className="bg-white/95 backdrop-blur-md border border-[#243324]/15 p-3.5 rounded-xl shadow-xl min-w-[220px]">
          <div className="flex items-center justify-between border-b border-[#243324]/10 pb-2 mb-2">
            <span className="font-serif font-semibold text-sm text-[#243324]">{label}</span>
            <span className="text-[11px] font-mono text-[#243324]/60 uppercase">End June (SA)</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#0284c7] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
                Resident Unemployment Rate
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {residentVal !== null ? `${residentVal.toFixed(1)}%` : 'N/A'}
              </span>
            </div>

            {yoyVal !== undefined && yoyVal !== null && (
              <div className="pt-2 mt-1 border-t border-[#243324]/10 flex items-center justify-between text-[#243324]/70">
                <span>Annual Change:</span>
                <span
                  className={`font-mono font-medium px-1.5 py-0.5 rounded ${
                    yoyVal > 0
                      ? 'text-rose-700 bg-rose-50 border border-rose-200/60'
                      : yoyVal < 0
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                      : 'text-slate-700 bg-slate-100'
                  }`}
                >
                  {yoyVal > 0 ? `+${yoyVal.toFixed(1)}% pts` : `${yoyVal.toFixed(1)}% pts`}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const residentDiffFormatted = formatRateDiff(residentDiff);

  return (
    <div className="min-h-screen bg-[#FBF9F5] pb-24 font-sans selection:bg-[#243324]/10">
      {/* Standardized Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#243324]/10 bg-[#FBF9F5]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#243324]/70 hover:text-[#243324] transition-colors py-1.5 px-3 rounded-md shadow-sm border border-[#243324]/10 bg-white/70 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Portal</span>
            </Link>
            <div className="h-6 w-px bg-[#243324]/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#3B4D36]" />
              <h1 className="font-serif text-lg font-medium text-[#243324] tracking-tight hidden md:block">
                Resident Employment
              </h1>
            </div>
          </div>
          <DashboardNav />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Page Header with Standard DataSourcePopover */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#243324]/10">
          <div>
            <div className="flex items-center gap-3.5 mb-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#243324] tracking-tight">
                Employment &amp; Job Market
              </h1>
              <DataSourcePopover source={DATA_SOURCES.employment} />
            </div>
            <p className="text-base md:text-lg text-[#243324]/75 max-w-3xl font-light leading-relaxed">
              Official resident unemployment rates (Singapore Citizens &amp; Permanent Residents, seasonally adjusted, end June) from {stats.startYear} to {stats.endYear}, sourced directly from data.gov.sg.
            </p>
          </div>
        </div>

        {/* PRIMARY FEATURE VISUAL TREND CHART: Resident Unemployment Rate */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-10 overflow-hidden">
          <CardHeader className="border-b border-[#243324]/10 pb-4">
            <div>
              <CardTitle className="font-serif text-2xl md:text-3xl text-[#243324]">
                Visual Trend: Resident Unemployment Rate
              </CardTitle>
              <CardDescription className="text-sm md:text-base text-[#243324]/75 mt-1">
                Annual resident (Singapore Citizens &amp; Permanent Residents) unemployment rate from {stats.startYear} to {stats.endYear} (End June, Seasonally Adjusted).
              </CardDescription>
            </div>

            {/* Factual Quick Stat Pill Bar - Latest Card includes YoY change */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-2 border-t border-[#243324]/5">
              {/* Latest (2026) Card with YoY Change Included */}
              <div className="p-3 rounded-lg bg-[#0284c7]/5 border border-[#0284c7]/10 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-[#0284c7] uppercase tracking-wider block">
                  Latest ({latestData.year})
                </span>
                <div className="flex items-baseline gap-2 my-1">
                  <span className="text-2xl font-serif font-semibold text-[#243324]">
                    {latestData.resident !== null ? `${latestData.resident.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${residentDiffFormatted.badgeClass}`}
                  >
                    {residentDiffFormatted.isIncrease && <TrendingUp className="w-3 h-3" />}
                    {residentDiffFormatted.isDecrease && <TrendingDown className="w-3 h-3" />}
                    {residentDiffFormatted.text}
                  </span>
                </div>
              </div>

              {/* Previous Year Comparison */}
              <div className="p-3 rounded-lg bg-slate-500/5 border border-slate-500/10 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Previous Year ({previousData?.year})
                </span>
                <div className="my-1">
                  <span className="text-2xl font-serif font-semibold text-slate-900">
                    {previousData?.resident !== null ? `${previousData?.resident.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <span className="text-[11px] text-[#243324]/60 block">End June (SA)</span>
              </div>

              {/* Historical Peak */}
              <div className="p-3 rounded-lg bg-slate-500/5 border border-slate-500/10 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Historical Peak
                </span>
                <div className="my-1">
                  <span className="text-2xl font-serif font-semibold text-slate-900">
                    {stats.residentMax.val}%
                  </span>
                </div>
                <span className="text-[11px] text-[#243324]/60 block">Years: {stats.residentMax.years}</span>
              </div>

              {/* Historical Low */}
              <div className="p-3 rounded-lg bg-slate-500/5 border border-slate-500/10 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Historical Low
                </span>
                <div className="my-1">
                  <span className="text-2xl font-serif font-semibold text-slate-900">
                    {stats.residentMin.val}%
                  </span>
                </div>
                <span className="text-[11px] text-[#243324]/60 block">Year: {stats.residentMin.years}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="residentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332415" />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#24332490' }}
                    minTickGap={20}
                    dy={5}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#24332490' }}
                    tickFormatter={v => `${v}%`}
                    dx={-10}
                    domain={[0, 6]}
                  />
                  <RechartsTooltip content={<PrimaryTrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="resident"
                    name="Resident Unemployment Rate"
                    stroke="#0284c7"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#residentGrad)"
                    dot={{ r: 2.5, fill: '#0284c7', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Factual Annual YoY Rate Changes Chart */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-10">
          <CardHeader className="border-b border-[#243324]/10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-xl text-[#243324]">
                  Annual Rate Changes (YoY)
                </CardTitle>
                <CardDescription className="text-sm text-[#243324]/75 mt-0.5">
                  Year-on-year change in resident unemployment rate in percentage points.
                </CardDescription>
              </div>
              <span className="text-xs font-mono text-[#243324]/60 bg-[#243324]/5 px-2 py-1 rounded">
                YoY Δ (% pts)
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataWithYoY.filter(d => d.residentYoY !== null)}
                  margin={{ top: 20, right: 10, left: 5, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332415" />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#24332490' }}
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#24332490' }}
                    tickFormatter={v => `${v > 0 ? `+${v}` : v}%`}
                    dx={-10}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid rgba(36, 51, 36, 0.15)',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: any) => [
                      `${value !== null ? (value > 0 ? `+${value}` : value) : 'N/A'}% pts`,
                      value > 0 ? 'Rate Increased (Unfavorable)' : 'Rate Decreased (Favorable)',
                    ]}
                  />
                  <Bar dataKey="residentYoY" name="Resident YoY Δ" radius={[2, 2, 0, 0]}>
                    {dataWithYoY
                      .filter(d => d.residentYoY !== null)
                      .map((entry, index) => {
                        // In unemployment: rate increase (> 0) is unfavorable (Rose), rate decrease (< 0) is favorable (Emerald)
                        const isIncrease = entry.residentYoY !== null && entry.residentYoY > 0;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isIncrease ? '#ef4444' : '#10b981'}
                            fillOpacity={0.85}
                          />
                        );
                      })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Factual Economic Direction Legend */}
            <div className="flex items-center gap-6 text-xs font-sans text-[#243324]/70 pt-3 mt-2 border-t border-[#243324]/5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-[#ef4444]" />
                <span>Rate Increased (+% pts, Unfavorable)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs bg-[#10b981]" />
                <span>Rate Decreased (-% pts, Favorable)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complete Factual Data Table from data.gov.sg */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-10 overflow-hidden">
          <CardHeader className="border-b border-[#243324]/10 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-serif text-xl text-[#243324]">
                  Factual Records Table
                </CardTitle>
                <CardDescription className="text-sm text-[#243324]/75 mt-0.5">
                  Complete annual resident records as published on data.gov.sg ({stats.startYear}–{stats.endYear}).
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#243324]/40 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search year..."
                    value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#FBF9F5] border border-[#243324]/15 rounded-md focus:outline-none focus:ring-1 focus:ring-[#243324]/30 w-32 sm:w-40"
                  />
                </div>

                <button
                  onClick={() => setSortDescending(!sortDescending)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-[#243324]/15 rounded-md hover:bg-[#243324]/5 text-[#243324]/70 transition-colors cursor-pointer"
                  title="Toggle sort order"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>{sortDescending ? 'Newest First' : 'Oldest First'}</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#243324] text-[#FBF9F5] rounded-md hover:bg-[#243324]/90 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#FBF9F5] border-b border-[#243324]/10 text-[#243324]/70 font-semibold uppercase tracking-wider z-10">
                  <tr>
                    <th className="py-3 px-4">Year</th>
                    <th className="py-3 px-4">Resident Unemployment Rate (SA)</th>
                    <th className="py-3 px-4">Annual YoY Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243324]/5">
                  {tableRows.map(row => (
                    <tr key={row.year} className="hover:bg-[#243324]/[0.02] transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-[#243324]">
                        {row.year}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-800 font-semibold">
                        {row.resident !== null ? `${row.resident.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        {row.residentYoY !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              row.residentYoY > 0
                                ? 'text-rose-700'
                                : row.residentYoY < 0
                                ? 'text-emerald-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {row.residentYoY > 0 && <TrendingUp className="w-3 h-3" />}
                            {row.residentYoY < 0 && <TrendingDown className="w-3 h-3" />}
                            {row.residentYoY > 0
                              ? `+${row.residentYoY.toFixed(1)}% pts`
                              : `${row.residentYoY.toFixed(1)}% pts`}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                  {tableRows.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-[#243324]/60">
                        No records matching &quot;{tableSearch}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
