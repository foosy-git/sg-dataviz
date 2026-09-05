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
  LineChart,
  Line,
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

// Sparkline Mini-Chart for KPI Cards
function MetricSparkline({
  data,
  dataKey,
  color,
  unit = '%',
}: {
  data: EmploymentRecord[];
  dataKey: keyof EmploymentRecord;
  color: string;
  unit?: string;
}) {
  const validData = useMemo(() => {
    return data.filter(d => d[dataKey] !== null && d[dataKey] !== undefined);
  }, [data, dataKey]);

  if (validData.length === 0) return null;

  return (
    <div className="h-12 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={validData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <XAxis hide dataKey="year" />
          <YAxis hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
          <RechartsTooltip
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '2 2' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as EmploymentRecord;
                const val = item[dataKey];
                return (
                  <div className="bg-[#243324] text-[#FBF9F5] text-[11px] px-2 py-0.5 rounded shadow font-sans border border-white/10 pointer-events-none">
                    <span className="font-semibold text-sky-300">{item.year}:</span>{' '}
                    {typeof val === 'number' ? `${val}${unit}` : 'N/A'}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function EmploymentDashboard({ data }: EmploymentDashboardProps) {
  const [timeRange, setTimeRange] = useState<'all' | 'last20' | 'last10'>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [sortDescending, setSortDescending] = useState(true);

  // Latest and previous records
  const latestData = data[data.length - 1] || { year: '2026', resident: 2.9 };
  const previousData = data.length > 1 ? data[data.length - 2] : null;

  // Rate YoY Calculations
  const residentDiff = latestData.resident !== null && previousData?.resident !== null && previousData?.resident !== undefined
    ? Number((latestData.resident - previousData.resident).toFixed(1))
    : null;

  // Historical Highs, Lows, and Average
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

  // Format rate difference consistent with other dashboards (Emerald for positive growth/up, Rose for negative/down)
  const formatRateDiff = (diff: number | null) => {
    if (diff === null || isNaN(diff)) {
      return {
        text: 'N/A',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        isPositive: false,
        isNegative: false,
      };
    }
    if (Math.abs(diff) < 0.001) {
      return {
        text: '0.0% pts YoY (Unchanged)',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        isPositive: false,
        isNegative: false,
      };
    }
    if (diff > 0) {
      return {
        text: `+${diff.toFixed(1)}% pts YoY`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
        isPositive: true,
        isNegative: false,
      };
    }
    return {
      text: `${diff.toFixed(1)}% pts YoY`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/70',
      isPositive: false,
      isNegative: true,
    };
  };

  // Filtered dataset for charts
  const filteredData = useMemo(() => {
    if (timeRange === 'last10') {
      return data.slice(-10);
    }
    if (timeRange === 'last20') {
      return data.slice(-20);
    }
    return data;
  }, [data, timeRange]);

  // Derived dataset with YoY differences for charts and table
  const dataWithYoY = useMemo(() => {
    return data.map((item, idx) => {
      const prev = idx > 0 ? data[idx - 1] : null;
      const residentYoY = prev && prev.resident !== null && item.resident !== null
        ? Number((item.resident - prev.resident).toFixed(1))
        : null;
      const diffFromAvg = item.resident !== null && stats.seriesAvg !== null
        ? Number((item.resident - stats.seriesAvg).toFixed(1))
        : null;
      return {
        ...item,
        residentYoY,
        diffFromAvg,
      };
    });
  }, [data, stats.seriesAvg]);

  // Filtered dataset with YoY for the selected time range
  const filteredDataWithYoY = useMemo(() => {
    if (timeRange === 'last10') {
      return dataWithYoY.slice(-10);
    }
    if (timeRange === 'last20') {
      return dataWithYoY.slice(-20);
    }
    return dataWithYoY;
  }, [dataWithYoY, timeRange]);

  // 5-Year Period Averages
  const periodAverages = useMemo(() => {
    const periods = [
      { label: '1992–1996', start: 1992, end: 1996 },
      { label: '1997–2001', start: 1997, end: 2001 },
      { label: '2002–2006', start: 2002, end: 2006 },
      { label: '2007–2011', start: 2007, end: 2011 },
      { label: '2012–2016', start: 2012, end: 2016 },
      { label: '2017–2021', start: 2017, end: 2021 },
      { label: '2022–2026', start: 2022, end: 2026 },
    ];

    return periods.map(p => {
      const cohort = data.filter(d => {
        const y = Number(d.year);
        return y >= p.start && y <= p.end && d.resident !== null;
      });
      const avg = cohort.length > 0
        ? Number((cohort.reduce((acc, curr) => acc + (curr.resident ?? 0), 0) / cohort.length).toFixed(1))
        : null;
      return {
        period: p.label,
        average: avg,
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
      'Diff from Series Average (3.2 % pts)',
    ];
    const rows = dataWithYoY.map(r => [
      r.year,
      r.resident !== null ? r.resident : '',
      r.residentYoY !== null ? r.residentYoY : '',
      r.diffFromAvg !== null ? r.diffFromAvg : '',
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
                <span className={`font-mono font-medium px-1.5 py-0.5 rounded ${
                  yoyVal > 0
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                    : yoyVal < 0
                    ? 'text-rose-700 bg-rose-50 border border-rose-200/60'
                    : 'text-slate-700 bg-slate-100'
                }`}>
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
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#243324]/10">
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

          {/* Time Range Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <span className="text-xs font-medium text-[#243324]/60 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Timeline:
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-white rounded-lg border border-[#243324]/15 shadow-sm max-w-full">
              {[
                { key: 'all', label: `All (${stats.startYear}–${stats.endYear})` },
                { key: 'last20', label: 'Last 20 Years' },
                { key: 'last10', label: 'Last 10 Years' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTimeRange(t.key as any)}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    timeRange === t.key
                      ? 'bg-[#243324] text-[#FBF9F5] shadow-xs'
                      : 'text-[#243324]/70 hover:text-[#243324] hover:bg-[#243324]/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Factual Resident KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Latest Resident Unemployment Rate */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#243324]/70">
                    <TrendingUp className="w-4 h-4 text-[#0284c7]" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Resident Unemp.</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#243324]/5 text-[#243324]/70">
                    {latestData.year} (SA)
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-3xl md:text-4xl font-serif text-[#243324] font-medium tracking-tight">
                    {latestData.resident !== null ? `${latestData.resident.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${residentDiffFormatted.badgeClass}`}
                  >
                    {residentDiffFormatted.isPositive && <TrendingUp className="w-3.5 h-3.5" />}
                    {residentDiffFormatted.isNegative && <TrendingDown className="w-3.5 h-3.5" />}
                    {residentDiffFormatted.text}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#243324]/5 mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#243324]/60 mb-0.5">
                  <span>Resident Trend</span>
                  <span>{stats.startYear}–{stats.endYear}</span>
                </div>
                <MetricSparkline data={data} dataKey="resident" color="#0284c7" unit="%" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Year-over-Year Change */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[#243324]/70">
                    {residentDiff !== null && residentDiff >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wider">Annual YoY Change</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#243324]/5 text-[#243324]/70">
                    {previousData?.year} → {latestData.year}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span
                    className={`text-3xl md:text-4xl font-serif font-medium tracking-tight ${
                      residentDiff === null
                        ? 'text-[#243324]'
                        : residentDiff > 0
                        ? 'text-emerald-700'
                        : residentDiff < 0
                        ? 'text-rose-700'
                        : 'text-[#243324]'
                    }`}
                  >
                    {residentDiff !== null ? (residentDiff > 0 ? `+${residentDiff.toFixed(1)}% pts` : `${residentDiff.toFixed(1)}% pts`) : 'N/A'}
                  </span>
                </div>
                <div className="text-xs text-[#243324]/70">
                  <span>Previous Rate: {previousData?.resident !== null ? `${previousData?.resident.toFixed(1)}%` : 'N/A'} ({previousData?.year})</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#243324]/5 mt-3 text-[11px] text-[#243324]/60 flex items-center justify-between">
                <span>35-Year Series Mean</span>
                <span className="font-mono font-semibold text-slate-800">{stats.seriesAvg}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Historical Peak */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#243324]/70">
                    <BarChart2 className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Historical Peak</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#243324]/5 text-[#243324]/70">
                    Highest
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-3xl md:text-4xl font-serif text-[#243324] font-medium tracking-tight">
                    {stats.residentMax.val}%
                  </span>
                </div>
                <div className="text-xs text-[#243324]/70">
                  <span>Recorded Years: <strong className="text-slate-800">{stats.residentMax.years}</strong></span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#243324]/5 mt-3 text-[11px] text-[#243324]/60 flex items-center justify-between">
                <span>Total Observations</span>
                <span className="font-mono font-medium">{stats.count} Years</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Historical Low */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#243324]/70">
                    <Calendar className="w-4 h-4 text-[#243324]" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Historical Low</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#243324]/5 text-[#243324]/70">
                    Lowest
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-3xl md:text-4xl font-serif text-[#243324] font-medium tracking-tight">
                    {stats.residentMin.val}%
                  </span>
                </div>
                <div className="text-xs text-[#243324]/70">
                  <span>Recorded Year: <strong className="text-slate-800">{stats.residentMin.years}</strong></span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#243324]/5 mt-3 text-[11px] text-[#243324]/60 flex items-center justify-between">
                <span>Historical Range</span>
                <span className="font-mono font-medium">{stats.residentMin.val}% – {stats.residentMax.val}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PRIMARY FEATURE VISUAL TREND CHART: Resident Unemployment Rate */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-10 overflow-hidden">
          <CardHeader className="border-b border-[#243324]/10 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-serif text-2xl md:text-3xl text-[#243324]">
                  Visual Trend: Resident Unemployment Rate
                </CardTitle>
                <CardDescription className="text-sm md:text-base text-[#243324]/75 mt-1">
                  Annual resident (Singapore Citizens &amp; Permanent Residents) unemployment rate from {stats.startYear} to {stats.endYear} (End June, Seasonally Adjusted).
                </CardDescription>
              </div>
            </div>

            {/* Factual Quick Stat Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-2 border-t border-[#243324]/5">
              <div className="p-2.5 rounded-lg bg-[#0284c7]/5 border border-[#0284c7]/10">
                <span className="text-[11px] font-semibold text-[#0284c7] uppercase tracking-wider block">
                  Latest ({latestData.year})
                </span>
                <span className="text-lg font-serif font-semibold text-[#243324]">
                  {latestData.resident !== null ? `${latestData.resident.toFixed(1)}%` : 'N/A'}
                </span>
                <span className="text-[11px] text-[#243324]/60 block">Citizens &amp; PRs</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-500/5 border border-slate-500/10">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Series Average
                </span>
                <span className="text-lg font-serif font-semibold text-slate-900">
                  {stats.seriesAvg}%
                </span>
                <span className="text-[11px] text-[#243324]/60 block">35-Year Mean</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-500/5 border border-slate-500/10">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Historical Peak
                </span>
                <span className="text-lg font-serif font-semibold text-slate-900">
                  {stats.residentMax.val}%
                </span>
                <span className="text-[11px] text-[#243324]/60 block">Years: {stats.residentMax.years}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-500/5 border border-slate-500/10">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Historical Low
                </span>
                <span className="text-lg font-serif font-semibold text-slate-900">
                  {stats.residentMin.val}%
                </span>
                <span className="text-[11px] text-[#243324]/60 block">Year: {stats.residentMin.years}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
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

        {/* 2 Factual Secondary Charts: Annual YoY Changes & 5-Year Cohort Averages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Chart 1: Annual Year-over-Year Rate Changes with Standard YoY Color Coding */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
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
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredDataWithYoY.filter(d => d.residentYoY !== null)}
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
                        'Annual Resident Change',
                      ]}
                    />
                    <Bar dataKey="residentYoY" name="Resident YoY Δ" radius={[2, 2, 0, 0]}>
                      {filteredDataWithYoY
                        .filter(d => d.residentYoY !== null)
                        .map((entry, index) => {
                          const isPos = entry.residentYoY !== null && entry.residentYoY >= 0;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={isPos ? '#10b981' : '#ef4444'}
                              fillOpacity={0.85}
                            />
                          );
                        })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Standard Positive/Negative YoY Legend */}
              <div className="flex items-center gap-4 text-xs font-sans text-[#243324]/70 pt-3 mt-2 border-t border-[#243324]/5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-[#10b981]" />
                  <span>Positive YoY Increase</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-[#ef4444]" />
                  <span>Negative YoY Decrease</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: 5-Year Period Averages */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardHeader className="border-b border-[#243324]/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl text-[#243324]">
                    5-Year Period Averages
                  </CardTitle>
                  <CardDescription className="text-sm text-[#243324]/75 mt-0.5">
                    Arithmetic mean resident unemployment rate across consecutive 5-year periods.
                  </CardDescription>
                </div>
                <span className="text-xs font-mono text-[#243324]/60 bg-[#243324]/5 px-2 py-1 rounded">
                  Mean Rate (% SA)
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodAverages} margin={{ top: 20, right: 10, left: 5, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332415" />
                    <XAxis
                      dataKey="period"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#24332490' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#24332490' }}
                      tickFormatter={v => `${v}%`}
                      dx={-10}
                      domain={[0, 5]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid rgba(36, 51, 36, 0.15)',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: any) => [`${value}%`, '5-Year Average']}
                    />
                    <Bar
                      dataKey="average"
                      name="Period Average"
                      fill="#0369a1"
                      fillOpacity={0.8}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Series Baseline Context */}
              <div className="flex items-center justify-between text-xs text-[#243324]/70 pt-3 mt-2 border-t border-[#243324]/5">
                <span>35-Year Series Average:</span>
                <span className="font-mono font-semibold text-slate-800">{stats.seriesAvg}% (SA)</span>
              </div>
            </CardContent>
          </Card>
        </div>

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
                    <th className="py-3 px-4">Difference vs 35-Year Mean ({stats.seriesAvg}%)</th>
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
                                ? 'text-emerald-700'
                                : row.residentYoY < 0
                                ? 'text-rose-700'
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
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {row.diffFromAvg !== null
                          ? row.diffFromAvg > 0
                            ? `+${row.diffFromAvg.toFixed(1)}% pts`
                            : `${row.diffFromAvg.toFixed(1)}% pts`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {tableRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#243324]/60">
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
