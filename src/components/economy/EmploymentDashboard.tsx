'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  TrendingUp,
  Users,
  AlertTriangle,
  Scale,
  Info,
  Calendar,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DashboardNav from '@/components/ui/DashboardNav';
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
  ComposedChart,
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
    <div className="h-14 w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={validData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <XAxis hide dataKey="year" />
          <YAxis hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
          <RechartsTooltip
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '2 2' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as EmploymentRecord;
                const val = item[dataKey];
                return (
                  <div className="bg-[#243324] text-[#FBF9F5] text-[11px] px-2.5 py-1 rounded-md shadow-md font-sans border border-white/10 pointer-events-none">
                    <span className="font-semibold text-emerald-300">{item.year}:</span>{' '}
                    {typeof val === 'number' ? (unit === 'k' ? `${(val / 1000).toFixed(1)}k` : `${val}${unit}`) : 'N/A'}
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
            strokeWidth={2.2}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function EmploymentDashboard({ data }: EmploymentDashboardProps) {
  const [timeRange, setTimeRange] = useState<'all' | 'last20' | 'last10'>('all');
  const [showCrises, setShowCrises] = useState<boolean>(true);

  // Latest and previous records
  const latestData = data[data.length - 1] || { year: '2026', total: 2.0, resident: 2.9 };
  const previousData = data.length > 1 ? data[data.length - 2] : null;

  // Accurate Rate YoY Calculations
  const totalDiff = latestData.total !== null && previousData?.total !== null && previousData?.total !== undefined
    ? Number((latestData.total - previousData.total).toFixed(1))
    : null;

  const residentDiff = latestData.resident !== null && previousData?.resident !== null && previousData?.resident !== undefined
    ? Number((latestData.resident - previousData.resident).toFixed(1))
    : null;

  const structuralGap = latestData.resident !== null && latestData.total !== null
    ? Number((latestData.resident - latestData.total).toFixed(1))
    : 0.9;

  // Format rate difference with correct economic polarity and neutral 0-change handling
  const formatRateDiff = (diff: number | null) => {
    if (diff === null || isNaN(diff)) {
      return { text: 'N/A', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    if (Math.abs(diff) < 0.001) {
      return {
        text: '0.0% pts YoY (Unchanged)',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
        isNeutral: true,
      };
    }
    if (diff > 0) {
      // Rise in unemployment is unfavorable (red)
      return {
        text: `+${diff.toFixed(1)}% pts YoY`,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/70',
        isUnfavorable: true,
      };
    }
    // Drop in unemployment is favorable (emerald)
    return {
      text: `${diff.toFixed(1)}% pts YoY`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
      isFavorable: true,
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

  // Verified retrenchment metrics (2025 Full Year: 14,490 vs 2024: 13,020; 2026 1H YTD: 8,330)
  const fullYearRetrenchments = 14490; // 2025
  const retrenchmentYoY = '+11.3% YoY';
  const latestJVR = latestData.jvr ?? 1.50;

  // Custom Tooltip for the primary Overall vs Resident trend chart
  const PrimaryTrendTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const record = payload[0].payload as EmploymentRecord;
      const residentVal = record.resident;
      const totalVal = record.total;
      const gapVal = residentVal !== null && totalVal !== null ? (residentVal - totalVal).toFixed(1) : null;

      return (
        <div className="bg-white/95 backdrop-blur-md border border-[#243324]/15 p-4 rounded-xl shadow-xl min-w-[240px]">
          <div className="flex items-center justify-between border-b border-[#243324]/10 pb-2 mb-2.5">
            <span className="font-serif font-semibold text-base text-[#243324]">{label}</span>
            <span className="text-[11px] font-mono text-[#243324]/60 uppercase tracking-wider">End June (SA)</span>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#0284c7] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                Resident Unemp.
              </span>
              <span className="font-semibold text-slate-800">
                {residentVal !== null ? `${residentVal.toFixed(1)}%` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#16a34a] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
                Overall Unemp.
              </span>
              <span className="font-semibold text-slate-800">
                {totalVal !== null ? `${totalVal.toFixed(1)}%` : 'N/A'}
              </span>
            </div>

            {gapVal !== null && (
              <div className="pt-2 mt-1 border-t border-dashed border-[#243324]/10 flex items-center justify-between text-xs text-[#243324]/70">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  Resident-Overall Gap:
                </span>
                <span className="font-mono font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                  +{gapVal}% pts
                </span>
              </div>
            )}

            {record.crisis && (
              <div className="mt-2.5 pt-2 border-t border-[#243324]/10 bg-rose-50/70 p-2 rounded-lg border border-rose-200/60">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  {record.crisis}
                </div>
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
                Economy & Employment
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Official Data
            </span>
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
              Singapore Labour Market Monitor
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#243324] tracking-tight mb-3">
              Employment & Job Market
            </h1>
            <p className="text-base md:text-lg text-[#243324]/75 max-w-3xl font-light leading-relaxed">
              Official analysis of Singapore&apos;s overall and resident unemployment rates, structural citizen-foreigner divergence, retrenchment cycles, and job vacancy ratios from 1992 to present.
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
                { key: 'all', label: 'All (1992–Present)' },
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

        {/* Top 4 KPI Metrics Cards with Sparkline Visual Trends */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Overall Unemployment */}
          <Card className="bg-white border-[#243324]/10 shadow-sm hover:shadow-md transition-shadow">
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

              {/* Mini Sparkline for Overall Unemployment */}
              <div className="pt-2 border-t border-[#243324]/5 mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#243324]/60 mb-0.5">
                  <span>Overall Trend</span>
                  <span>1992–{latestData.year}</span>
                </div>
                <MetricSparkline data={data} dataKey="total" color="#16a34a" unit="%" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Resident Unemployment */}
          <Card className="bg-white border-[#243324]/10 shadow-sm hover:shadow-md transition-shadow">
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

              {/* Mini Sparkline for Resident Unemployment */}
              <div className="pt-2 border-t border-[#243324]/5 mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#243324]/60 mb-0.5">
                  <span>Resident Trend</span>
                  <span>1992–{latestData.year}</span>
                </div>
                <MetricSparkline data={data} dataKey="resident" color="#0284c7" unit="%" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Retrenchments */}
          <Card className="bg-white border-[#243324]/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#243324]/70">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Retrenchments</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#243324]/5 text-[#243324]/70">
                    Full-Year 2025
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-3xl md:text-4xl font-serif text-[#243324] font-medium tracking-tight">
                    {fullYearRetrenchments.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#243324]/70">
                  <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border bg-rose-50 text-rose-700 border-rose-200/70">
                    {retrenchmentYoY}
                  </span>
                  <span className="text-[11px] text-[#243324]/60">8,330 in 1H 2026 YTD</span>
                </div>
              </div>

              {/* Mini Sparkline for Retrenchments */}
              <div className="pt-2 border-t border-[#243324]/5 mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#243324]/60 mb-0.5">
                  <span>Layoffs Trend</span>
                  <span>1998–2025</span>
                </div>
                <MetricSparkline data={data} dataKey="retrenchments" color="#dc2626" unit="" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Job Vacancy Ratio */}
          <Card className="bg-white border-[#243324]/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#243324]/70">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Job Vacancy Ratio</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#243324]/5 text-[#243324]/70">
                    1Q 2026 (SA)
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-3xl md:text-4xl font-serif text-[#243324] font-medium tracking-tight">
                    {latestJVR.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border ${
                      latestJVR >= 1.0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                        : 'bg-rose-50 text-rose-700 border-rose-200/70'
                    }`}
                  >
                    {latestJVR >= 1.0 ? '1.50 openings / seeker' : 'More seekers than jobs'}
                  </span>
                </div>
              </div>

              {/* Mini Sparkline for JVR */}
              <div className="pt-2 border-t border-[#243324]/5 mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#243324]/60 mb-0.5">
                  <span>Openings/Seeker</span>
                  <span>1994–2026</span>
                </div>
                <MetricSparkline data={data} dataKey="jvr" color="#10b981" unit="" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PRIMARY FEATURE VISUAL TREND CHART: Overall vs. Resident Unemployment Rate */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-12 overflow-hidden">
          <CardHeader className="border-b border-[#243324]/10 pb-4 bg-gradient-to-r from-white via-white to-emerald-50/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0284c7] uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Primary Unemployment Metric
                </div>
                <CardTitle className="font-serif text-2xl md:text-3xl text-[#243324]">
                  Visual Trend: Overall vs. Resident Unemployment Rate
                </CardTitle>
                <CardDescription className="text-sm md:text-base text-[#243324]/75 mt-1">
                  Comparing Singapore&apos;s total workforce unemployment rate against resident (citizen &amp; PR) rates from 1992 to present (End June, Seasonally Adjusted).
                </CardDescription>
              </div>

              {/* Toggle Crisis Markers */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => setShowCrises(!showCrises)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    showCrises
                      ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  {showCrises ? 'Hide Crisis Events' : 'Show Crisis Events'}
                </button>
              </div>
            </div>

            {/* Quick Stat Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-2 border-t border-[#243324]/5">
              <div className="p-2.5 rounded-lg bg-[#0284c7]/5 border border-[#0284c7]/10">
                <span className="text-[11px] font-semibold text-[#0284c7] uppercase tracking-wider block">
                  Latest Resident
                </span>
                <span className="text-lg font-serif font-semibold text-[#243324]">
                  {latestData.resident !== null ? `${latestData.resident.toFixed(1)}%` : 'N/A'}
                </span>
                <span className="text-[11px] text-[#243324]/60 block">Citizens &amp; PRs</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#16a34a]/5 border border-[#16a34a]/10">
                <span className="text-[11px] font-semibold text-[#16a34a] uppercase tracking-wider block">
                  Latest Overall
                </span>
                <span className="text-lg font-serif font-semibold text-[#243324]">
                  {latestData.total !== null ? `${latestData.total.toFixed(1)}%` : 'N/A'}
                </span>
                <span className="text-[11px] text-[#243324]/60 block">Total Workforce</span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                  Citizen-Buffer Gap
                </span>
                <span className="text-lg font-serif font-semibold text-amber-900">
                  +{structuralGap}% pts
                </span>
                <span className="text-[11px] text-[#243324]/60 block">Resident - Overall</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-500/5 border border-slate-500/10">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                  Historical Peak
                </span>
                <span className="text-lg font-serif font-semibold text-slate-900">
                  4.7% Resident
                </span>
                <span className="text-[11px] text-[#243324]/60 block">SARS (2003)</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="h-[430px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332415" />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#24332490' }}
                    minTickGap={24}
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

                  {/* Crisis Markers */}
                  {showCrises && (
                    <>
                      <ReferenceLine
                        x="1998"
                        stroke="#dc2626"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: 'Asian Fin. Crisis (1998)',
                          position: 'insideTopLeft',
                          fill: '#dc2626',
                          fontSize: 10,
                        }}
                      />
                      <ReferenceLine
                        x="2003"
                        stroke="#dc2626"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: 'SARS Peak 4.7% (2003)',
                          position: 'insideTopLeft',
                          fill: '#dc2626',
                          fontSize: 10,
                        }}
                      />
                      <ReferenceLine
                        x="2009"
                        stroke="#dc2626"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: 'GFC Peak 4.5% (2009)',
                          position: 'insideTopLeft',
                          fill: '#dc2626',
                          fontSize: 10,
                        }}
                      />
                      <ReferenceLine
                        x="2020"
                        stroke="#dc2626"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: 'COVID-19 4.1% (2020)',
                          position: 'insideTopLeft',
                          fill: '#dc2626',
                          fontSize: 10,
                        }}
                      />
                    </>
                  )}

                  {/* Lines for Resident and Overall */}
                  <Line
                    type="monotone"
                    dataKey="resident"
                    name="Resident Unemployment Rate"
                    stroke="#0284c7"
                    strokeWidth={3.5}
                    dot={{ r: 2.5, fill: '#0284c7', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Overall Unemployment Rate"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ r: 2.5, fill: '#16a34a', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 bg-[#FBF9F5] rounded-lg border border-[#243324]/10 text-xs text-[#243324]/75 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
              <span>
                <strong>Understanding the Gap:</strong> Resident unemployment is consistently 0.7% to 1.1% points higher than the overall rate. This is because non-resident work pass holders (WP, S-Pass, EP) must hold valid employment to stay in Singapore. If laid off, their passes are revoked, which keeps non-resident unemployment near zero and acts as an employment shock absorber for the wider economy.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 3 Secondary Detailed Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Demographic Age Group Unemployment */}
          <Card className="bg-white border-[#243324]/10 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-[#243324]/10 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="font-serif text-2xl text-[#243324]">
                    Resident Unemployment by Demographic Age Group
                  </CardTitle>
                  <CardDescription className="text-sm text-[#243324]/75 mt-0.5">
                    Official SingStat Table M183401: Youth jobseekers (15–24) transition into entry-level roles, leading to higher frictional unemployment compared to mid-career and senior workers (50+).
                  </CardDescription>
                </div>
                <span className="text-xs font-mono text-[#243324]/60 bg-[#243324]/5 px-2 py-1 rounded">
                  SingStat M183401
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
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
                      tickFormatter={v => `${v}%`}
                      dx={-10}
                      domain={[0, 12]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid rgba(36, 51, 36, 0.15)',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: any) => [`${value}%`, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '15px' }} iconType="circle" />
                    <Line
                      type="monotone"
                      dataKey="youthUnemp"
                      name="Youth (15–24 Years)"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="resident"
                      name="Average Resident (All Ages)"
                      stroke="#0284c7"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="olderUnemp"
                      name="Seniors (50 & Over)"
                      stroke="#16a34a"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Historical Retrenchments Chart */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardHeader className="border-b border-[#243324]/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl text-[#243324]">
                    Historical Retrenchments (Layoffs)
                  </CardTitle>
                  <CardDescription className="text-sm text-[#243324]/75 mt-0.5">
                    Ministry of Manpower annual retrenchment records (1998–2025).
                  </CardDescription>
                </div>
                <span className="text-xs font-mono text-[#243324]/60 bg-[#243324]/5 px-2 py-1 rounded">
                  MOM MRSD
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredData.filter(d => d.retrenchments !== null)}
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
                      tickFormatter={v => `${v / 1000}k`}
                      dx={-10}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid rgba(36, 51, 36, 0.15)',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: any) => [value?.toLocaleString(), 'Retrenchments']}
                    />
                    <Bar
                      dataKey="retrenchments"
                      name="Retrenched Employees"
                      fill="#dc2626"
                      fillOpacity={0.85}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Job Vacancy to Unemployed Ratio Chart */}
          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardHeader className="border-b border-[#243324]/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl text-[#243324]">
                    Job Vacancy to Unemployed Ratio (JVR)
                  </CardTitle>
                  <CardDescription className="text-sm text-[#243324]/75 mt-0.5">
                    SingStat Table M181641: Ratio &gt; 1.0 indicates more vacancies than jobseekers.
                  </CardDescription>
                </div>
                <span className="text-xs font-mono text-[#243324]/60 bg-[#243324]/5 px-2 py-1 rounded">
                  SingStat M181641
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={filteredData.filter(d => d.jvr !== null)}
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
                      dx={-10}
                      domain={[0, 3]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid rgba(36, 51, 36, 0.15)',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: any) => [`${value} openings / seeker`, 'JVR']}
                    />
                    {/* Parity Reference Line at 1.0 */}
                    <ReferenceLine
                      y={1.0}
                      stroke="#64748b"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'Parity (1.0)',
                        position: 'insideTopRight',
                        fill: '#64748b',
                        fontSize: 11,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="jvr"
                      name="Job Vacancy Ratio"
                      fill="#10b981"
                      fillOpacity={0.15}
                      stroke="#10b981"
                      strokeWidth={3}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Citations & Methodology Footer */}
        <div className="p-6 rounded-xl bg-white border border-[#243324]/10 shadow-sm text-sm text-[#243324]/80">
          <h3 className="font-serif text-lg text-[#243324] font-semibold mb-2">
            Data Sources &amp; Statistical Methodology
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-[#243324]/75">
            <div>
              <p className="mb-1.5">
                <strong>Unemployment Rates (SA):</strong> Sourced from Ministry of Manpower &amp; Singapore Department of Statistics (Table M182332 / data.gov.sg). Seasonally adjusted end-June figures eliminate seasonal holiday/graduate hiring distortions.
              </p>
              <p>
                <strong>Resident vs Overall:</strong> Total workforce covers Singapore Residents (Citizens &amp; PRs) and non-residents holding work passes. Because work passes are contingent on active employment, non-resident unemployment is minimal.
              </p>
            </div>
            <div>
              <p className="mb-1.5">
                <strong>Retrenchment Series:</strong> Published by MOM Manpower Research &amp; Statistics Department (MRSD) tracking permanent and term-contract employee layoffs due to redundancy across private and public sectors.
              </p>
              <p>
                <strong>Job Vacancy to Unemployed Ratio (JVR):</strong> SingStat Table M181641 measuring labour market tightness. A ratio above 1.0 signifies more job openings than unemployed persons.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
