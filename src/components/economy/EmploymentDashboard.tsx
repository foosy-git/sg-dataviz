'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  TrendingUp,
  Users,
  Calendar,
  Activity,
  Layers,
  Download,
  Search,
  ArrowUpDown,
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
  Legend,
  BarChart,
  Bar,
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
                    <span className="font-semibold text-emerald-300">{item.year}:</span>{' '}
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
  const latestData = data[data.length - 1] || { year: '2026', total: 2.0, resident: 2.9, gap: 0.9 };
  const previousData = data.length > 1 ? data[data.length - 2] : null;

  // Rate YoY Calculations
  const totalDiff = latestData.total !== null && previousData?.total !== null && previousData?.total !== undefined
    ? Number((latestData.total - previousData.total).toFixed(1))
    : null;

  const residentDiff = latestData.resident !== null && previousData?.resident !== null && previousData?.resident !== undefined
    ? Number((latestData.resident - previousData.resident).toFixed(1))
    : null;

  const latestGap = latestData.gap ?? (latestData.resident !== null && latestData.total !== null
    ? Number((latestData.resident - latestData.total).toFixed(1))
    : null);

  // Historical Highs and Lows
  const stats = useMemo(() => {
    let residentMax = -Infinity;
    let residentMaxYears: string[] = [];
    let residentMin = Infinity;
    let residentMinYears: string[] = [];

    let totalMax = -Infinity;
    let totalMaxYears: string[] = [];
    let totalMin = Infinity;
    let totalMinYears: string[] = [];

    data.forEach(d => {
      if (d.resident !== null) {
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

      if (d.total !== null) {
        if (d.total > totalMax) {
          totalMax = d.total;
          totalMaxYears = [d.year];
        } else if (d.total === totalMax) {
          totalMaxYears.push(d.year);
        }
        if (d.total < totalMin) {
          totalMin = d.total;
          totalMinYears = [d.year];
        } else if (d.total === totalMin) {
          totalMinYears.push(d.year);
        }
      }
    });

    return {
      residentMax: { val: residentMax, years: residentMaxYears.join(', ') },
      residentMin: { val: residentMin, years: residentMinYears.join(', ') },
      totalMax: { val: totalMax, years: totalMaxYears.join(', ') },
      totalMin: { val: totalMin, years: totalMinYears.join(', ') },
      count: data.length,
      startYear: data[0]?.year ?? '1992',
      endYear: data[data.length - 1]?.year ?? '2026',
    };
  }, [data]);

  // Format rate difference objectively
  const formatRateDiff = (diff: number | null) => {
    if (diff === null || isNaN(diff)) {
      return { text: 'N/A', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    if (Math.abs(diff) < 0.001) {
      return {
        text: '0.0% pts YoY (Unchanged)',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
    }
    if (diff > 0) {
      return {
        text: `+${diff.toFixed(1)}% pts YoY`,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    return {
      text: `${diff.toFixed(1)}% pts YoY`,
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
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
      const totalYoY = prev && prev.total !== null && item.total !== null
        ? Number((item.total - prev.total).toFixed(1))
        : null;
      const residentYoY = prev && prev.resident !== null && item.resident !== null
        ? Number((item.resident - prev.resident).toFixed(1))
        : null;
      return {
        ...item,
        totalYoY,
        residentYoY,
      };
    });
  }, [data]);

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
      'Total Unemployment Rate (SA %)',
      'Resident Unemployment Rate (SA %)',
      'Difference (Resident - Total % pts)',
      'Total YoY Change (% pts)',
      'Resident YoY Change (% pts)',
    ];
    const rows = dataWithYoY.map(r => [
      r.year,
      r.total !== null ? r.total : '',
      r.resident !== null ? r.resident : '',
      r.gap !== null ? r.gap : '',
      r.totalYoY !== null ? r.totalYoY : '',
      r.residentYoY !== null ? r.residentYoY : '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `singapore_unemployment_rates_${stats.startYear}_${stats.endYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Tooltip for the primary line chart
  const PrimaryTrendTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const record = payload[0].payload as EmploymentRecord;
      const residentVal = record.resident;
      const totalVal = record.total;
      const gapVal = residentVal !== null && totalVal !== null ? (residentVal - totalVal).toFixed(1) : null;

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
                Resident Unemp.
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {residentVal !== null ? `${residentVal.toFixed(1)}%` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#16a34a] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                Overall Unemp.
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {totalVal !== null ? `${totalVal.toFixed(1)}%` : 'N/A'}
              </span>
            </div>

            {gapVal !== null && (
              <div className="pt-2 mt-1 border-t border-[#243324]/10 flex items-center justify-between text-[#243324]/70">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-600" />
                  Difference:
                </span>
                <span className="font-mono font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                  +{gapVal}% pts
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const totalDiffFormatted = formatRateDiff(totalDiff);
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
              <div className="bg-[#243324] text-[#FBF9F5] p-1.5 rounded-lg shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif tracking-tight text-[#243324] hidden md:block">
                Employment &amp; Job Market
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DashboardNav />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#243324]/10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#243324]/60 uppercase tracking-widest mb-2">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Singapore Labour Market Data
            </div>
            <div className="flex items-center gap-3.5 mb-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#243324] tracking-tight">
                Employment &amp; Job Market
              </h1>
              <DataSourcePopover source={DATA_SOURCES.employment} />
            </div>
            <p className="text-base md:text-lg text-[#243324]/75 max-w-3xl font-light leading-relaxed">
              Official overall and resident unemployment rates (seasonally adjusted, end June) from 1992 to {stats.endYear}.
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

        {/* 4 Factual KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Overall Unemployment Rate */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#243324]/70">
                    <Users className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Overall Unemp.</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#243324]/5 text-[#243324]/70">
                    {latestData.year} (SA)
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-3xl md:text-4xl font-serif text-[#243324] font-medium tracking-tight">
                    {latestData.total !== null ? `${latestData.total.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border ${totalDiffFormatted.badgeClass}`}
                  >
                    {totalDiffFormatted.text}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#243324]/5 mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#243324]/60 mb-0.5">
                  <span>Overall Trend</span>
                  <span>{stats.startYear}–{stats.endYear}</span>
                </div>
                <MetricSparkline data={data} dataKey="total" color="#16a34a" unit="%" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Resident Unemployment Rate */}
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
                    className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border ${residentDiffFormatted.badgeClass}`}
                  >
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

          {/* Card 3: Resident - Overall Difference */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#243324]/70">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Difference</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#243324]/5 text-[#243324]/70">
                    Resident − Total
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-3xl md:text-4xl font-serif text-[#243324] font-medium tracking-tight">
                    {latestGap !== null ? `+${latestGap.toFixed(1)}% pts` : 'N/A'}
                  </span>
                </div>
                <div className="text-xs text-[#243324]/70">
                  <span>In {latestData.year}: Resident {latestData.resident}% vs Total {latestData.total}%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#243324]/5 mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#243324]/60 mb-0.5">
                  <span>Difference Trend</span>
                  <span>{stats.startYear}–{stats.endYear}</span>
                </div>
                <MetricSparkline data={data} dataKey="gap" color="#d97706" unit="% pts" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Historical Series Summary */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#243324]/70">
                    <Calendar className="w-4 h-4 text-[#243324]" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Series Range</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#243324]/5 text-[#243324]/70">
                    {stats.count} Years
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-3xl md:text-4xl font-serif text-[#243324] font-medium tracking-tight">
                    {stats.startYear}–{stats.endYear}
                  </span>
                </div>
                <div className="text-xs text-[#243324]/70 space-y-0.5">
                  <div>Resident Peak: <strong className="text-slate-800">{stats.residentMax.val}%</strong> ({stats.residentMax.years})</div>
                  <div>Overall Peak: <strong className="text-slate-800">{stats.totalMax.val}%</strong> ({stats.totalMax.years})</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#243324]/5 mt-3 text-[11px] text-[#243324]/60 flex items-center justify-between">
                <span>Lowest Resident: {stats.residentMin.val}% ({stats.residentMin.years})</span>
                <span>Lowest Total: {stats.totalMin.val}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PRIMARY FEATURE VISUAL TREND CHART: Overall vs. Resident Unemployment Rate */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-10 overflow-hidden">
          <CardHeader className="border-b border-[#243324]/10 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-serif text-2xl md:text-3xl text-[#243324]">
                  Visual Trend: Overall vs. Resident Unemployment Rate
                </CardTitle>
                <CardDescription className="text-sm md:text-base text-[#243324]/75 mt-1">
                  Comparison of Singapore&apos;s total workforce unemployment rate against resident (citizen &amp; PR) rates from {stats.startYear} to {stats.endYear} (End June, Seasonally Adjusted).
                </CardDescription>
              </div>
            </div>

            {/* Factual Quick Stat Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-2 border-t border-[#243324]/5">
              <div className="p-2.5 rounded-lg bg-[#0284c7]/5 border border-[#0284c7]/10">
                <span className="text-[11px] font-semibold text-[#0284c7] uppercase tracking-wider block">
                  Latest Resident ({latestData.year})
                </span>
                <span className="text-lg font-serif font-semibold text-[#243324]">
                  {latestData.resident !== null ? `${latestData.resident.toFixed(1)}%` : 'N/A'}
                </span>
                <span className="text-[11px] text-[#243324]/60 block">Citizens &amp; PRs</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#16a34a]/5 border border-[#16a34a]/10">
                <span className="text-[11px] font-semibold text-[#16a34a] uppercase tracking-wider block">
                  Latest Overall ({latestData.year})
                </span>
                <span className="text-lg font-serif font-semibold text-[#243324]">
                  {latestData.total !== null ? `${latestData.total.toFixed(1)}%` : 'N/A'}
                </span>
                <span className="text-[11px] text-[#243324]/60 block">Total Workforce</span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                  Resident − Overall Difference
                </span>
                <span className="text-lg font-serif font-semibold text-amber-900">
                  {latestGap !== null ? `+${latestGap.toFixed(1)}% pts` : 'N/A'}
                </span>
                <span className="text-[11px] text-[#243324]/60 block">Arithmetic Gap</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-500/5 border border-slate-500/10">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Historical Peak (Resident)
                </span>
                <span className="text-lg font-serif font-semibold text-slate-900">
                  {stats.residentMax.val}%
                </span>
                <span className="text-[11px] text-[#243324]/60 block">Years: {stats.residentMax.years}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
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
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '20px' }}
                    iconType="circle"
                  />

                  {/* Factual Lines for Resident and Overall */}
                  <Line
                    type="monotone"
                    dataKey="resident"
                    name="Resident Unemployment Rate"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 2.5, fill: '#0284c7', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Overall Unemployment Rate"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#16a34a', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2 Factual Secondary Charts: Gap Trend & YoY Changes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Chart 1: Annual Resident - Overall Difference */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardHeader className="border-b border-[#243324]/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl text-[#243324]">
                    Resident − Overall Rate Difference
                  </CardTitle>
                  <CardDescription className="text-sm text-[#243324]/75 mt-0.5">
                    Annual difference in percentage points (Resident Rate minus Total Rate).
                  </CardDescription>
                </div>
                <span className="text-xs font-mono text-[#243324]/60 bg-[#243324]/5 px-2 py-1 rounded">
                  Percentage Points (% pts)
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={filteredData.filter(d => d.gap !== null)}
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
                      tickFormatter={v => `+${v}%`}
                      dx={-10}
                      domain={[0, 2]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid rgba(36, 51, 36, 0.15)',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: any) => [`+${value}% pts`, 'Resident − Total Difference']}
                    />
                    <Area
                      type="monotone"
                      dataKey="gap"
                      name="Rate Difference"
                      fill="#d97706"
                      fillOpacity={0.2}
                      stroke="#d97706"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Year-over-Year Rate Changes */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardHeader className="border-b border-[#243324]/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl text-[#243324]">
                    Annual Year-over-Year Changes
                  </CardTitle>
                  <CardDescription className="text-sm text-[#243324]/75 mt-0.5">
                    Year-on-year change in percentage points for Total and Resident unemployment.
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
                    data={filteredDataWithYoY.filter(d => d.totalYoY !== null || d.residentYoY !== null)}
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
                      formatter={(value: any) => [`${value !== null ? (value > 0 ? `+${value}` : value) : 'N/A'}% pts`, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                    <Bar
                      dataKey="residentYoY"
                      name="Resident YoY Δ"
                      fill="#0284c7"
                      fillOpacity={0.85}
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="totalYoY"
                      name="Overall YoY Δ"
                      fill="#16a34a"
                      fillOpacity={0.85}
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Complete Factual Data Table */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-10 overflow-hidden">
          <CardHeader className="border-b border-[#243324]/10 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-serif text-xl text-[#243324]">
                  Factual Records Table
                </CardTitle>
                <CardDescription className="text-sm text-[#243324]/75 mt-0.5">
                  Complete annual records ({stats.startYear}–{stats.endYear}).
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
                    className="pl-8 pr-3 py-1.5 bg-[#243324]/5 border border-[#243324]/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#243324]/20 w-32 sm:w-40"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSortDescending(!sortDescending)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#243324]/5 hover:bg-[#243324]/10 text-xs font-medium text-[#243324] rounded-lg transition-colors cursor-pointer"
                  title="Toggle Chronological Order"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span className="hidden sm:inline">{sortDescending ? 'Newest First' : 'Oldest First'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#243324] hover:bg-[#3B4D36] text-xs font-medium text-[#FBF9F5] rounded-lg transition-colors cursor-pointer shadow-xs"
                  title="Download CSV"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead className="sticky top-0 bg-[#FBF9F5] border-b border-[#243324]/10 text-[#243324]/70 uppercase tracking-wider font-semibold text-[10.5px]">
                  <tr>
                    <th className="py-2.5 px-4">Year (End June)</th>
                    <th className="py-2.5 px-4 text-right">Total Unemp. (SA %)</th>
                    <th className="py-2.5 px-4 text-right">Resident Unemp. (SA %)</th>
                    <th className="py-2.5 px-4 text-right">Resident - Total Gap</th>
                    <th className="py-2.5 px-4 text-right">Total YoY</th>
                    <th className="py-2.5 px-4 text-right">Resident YoY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243324]/5 font-mono">
                  {tableRows.length > 0 ? (
                    tableRows.map((r, idx) => {
                      const isEven = idx % 2 === 0;
                      return (
                        <tr key={r.year} className={`hover:bg-[#243324]/[0.02] transition-colors ${isEven ? 'bg-white' : 'bg-[#FBF9F5]/30'}`}>
                          <td className="py-2.5 px-4 font-sans font-medium text-[#243324]">{r.year}</td>
                          <td className="py-2.5 px-4 text-right text-[#0284c7] font-semibold">
                            {r.total !== null ? `${r.total.toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#10b981] font-semibold">
                            {r.resident !== null ? `${r.resident.toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#243324]/80">
                            {r.gap !== null ? `+${r.gap.toFixed(1)}% pt` : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {r.totalYoY !== null ? (
                              <span className={r.totalYoY > 0 ? 'text-amber-700 font-medium' : r.totalYoY < 0 ? 'text-emerald-700 font-medium' : 'text-[#243324]/60'}>
                                {r.totalYoY > 0 ? `+${r.totalYoY.toFixed(1)}` : r.totalYoY < 0 ? `${r.totalYoY.toFixed(1)}` : '0.0'}% pt
                              </span>
                            ) : (
                              <span className="text-[#243324]/30">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {r.residentYoY !== null ? (
                              <span className={r.residentYoY > 0 ? 'text-amber-700 font-medium' : r.residentYoY < 0 ? 'text-emerald-700 font-medium' : 'text-[#243324]/60'}>
                                {r.residentYoY > 0 ? `+${r.residentYoY.toFixed(1)}` : r.residentYoY < 0 ? `${r.residentYoY.toFixed(1)}` : '0.0'}% pt
                              </span>
                            ) : (
                              <span className="text-[#243324]/30">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#243324]/50 font-sans">
                        No records matching &quot;{tableSearch}&quot;
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
