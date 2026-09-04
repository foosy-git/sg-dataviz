'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Sparkles } from 'lucide-react';
import { BaselineInfoTooltip } from '@/components/ui/BaselineInfoTooltip';
import { HdbResaleIndexPoint, HdbAnnualTrendPoint } from '@/types/hdb';

interface OverallMarketTrendChartProps {
  resaleIndexData: HdbResaleIndexPoint[];
  annualTrendData?: HdbAnnualTrendPoint[];
}

export default function OverallMarketTrendChart({
  resaleIndexData = [],
  annualTrendData = []
}: OverallMarketTrendChartProps) {
  const [metric, setMetric] = useState<'index' | 'price'>('index');
  const [timeframe, setTimeframe] = useState<'5Y' | '10Y' | '20Y' | 'ALL'>('10Y');
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [showAllMilestones, setShowAllMilestones] = useState<boolean>(false);

  // Filtered dataset based on timeframe
  const filteredQuarterlyData = useMemo(() => {
    if (!resaleIndexData || resaleIndexData.length === 0) return [];
    const count = resaleIndexData.length;

    switch (timeframe) {
      case '5Y':
        return resaleIndexData.slice(Math.max(0, count - 20)); // ~5 years (20 quarters)
      case '10Y':
        return resaleIndexData.slice(Math.max(0, count - 40)); // ~10 years (40 quarters)
      case '20Y':
        return resaleIndexData.slice(Math.max(0, count - 80)); // ~20 years (80 quarters)
      case 'ALL':
      default:
        return resaleIndexData;
    }
  }, [resaleIndexData, timeframe]);

  const filteredAnnualData = useMemo(() => {
    if (!annualTrendData || annualTrendData.length === 0) return [];
    const count = annualTrendData.length;

    switch (timeframe) {
      case '5Y':
        return annualTrendData.slice(Math.max(0, count - 5));
      case '10Y':
        return annualTrendData.slice(Math.max(0, count - 10));
      case '20Y':
        return annualTrendData.slice(Math.max(0, count - 20));
      case 'ALL':
      default:
        return annualTrendData;
    }
  }, [annualTrendData, timeframe]);

  // Latest metrics
  const latestQuarter = resaleIndexData[resaleIndexData.length - 1];
  const latestAnnual = annualTrendData[annualTrendData.length - 1];

  // Latest YoY and status
  const latestYoY = latestQuarter?.yoy ?? 0;
  const isYoYPositive = latestYoY >= 0;

  // Active chart data
  const chartData = metric === 'index' ? filteredQuarterlyData : filteredAnnualData;

  // Key historical milestones list with context and stats
  const keyMilestones = [
    {
      label: '1996 Peak',
      quarter: '1996-Q4',
      note: 'Pre-Asian Crisis Peak',
      description: 'Historical all-time peak before the 1997 Asian Financial Crisis. Speculative demand and credit expansion drove rapid capital appreciation.',
      index: 136.9,
      yoy: '+18.6%'
    },
    {
      label: '2013 TDSR/MSR',
      quarter: '2013-Q2',
      note: 'Cooling Measures Peak',
      description: 'Post-GFC peak prior to introduction of Total Debt Servicing Ratio (TDSR) and Mortgage Servicing Ratio (MSR) curbs, establishing a 6-year plateau.',
      index: 149.4,
      yoy: '+2.7%'
    },
    {
      label: '2020 COVID-19',
      quarter: '2020-Q2',
      note: 'Pandemic Onset',
      description: 'Circuit Breaker period with physical flat viewings suspended. Resale activity briefly halted before triggering a major flight-to-space demand surge.',
      index: 131.9,
      yoy: '+0.3%'
    },
    {
      label: '2021 Boom',
      quarter: '2021-Q4',
      note: '+12.7% YoY Surge',
      description: 'Work-from-home demand surge and pandemic BTO construction delays squeezed market supply, resulting in the fastest annual growth in over a decade.',
      index: 155.7,
      yoy: '+12.7%'
    },
    {
      label: '2024 High',
      quarter: '2024-Q4',
      note: '+9.7% YoY Peak',
      description: 'Continued post-pandemic momentum and record million-dollar transactions in mature estates, met by additional cooling measures and increased BTO launches.',
      index: 196.2,
      yoy: '+9.7%'
    },
    {
      label: '2026 Cooling',
      quarter: '2026-Q2',
      note: '-0.05% YoY Stabilization',
      description: 'Prices stabilize as extensive post-pandemic BTO completions catch up with accumulated buyer demand, returning annual growth to flat equilibrium.',
      index: 202.8,
      yoy: '-0.05%'
    }
  ];

  const activeMilestoneObj = keyMilestones.find(k => k.quarter === selectedMilestone);

  const handleMilestonesToggle = () => {
    if (showAllMilestones || selectedMilestone) {
      setShowAllMilestones(false);
      setSelectedMilestone(null);
    } else {
      setShowAllMilestones(true);
      setSelectedMilestone(null);
      setTimeframe('ALL');
      if (metric !== 'index') {
        setMetric('index');
      }
    }
  };

  const handleMilestoneClick = (quarter: string) => {
    if (selectedMilestone === quarter) {
      setSelectedMilestone(null);
      return;
    }
    setSelectedMilestone(quarter);
    setShowAllMilestones(false);
    if (quarter < '2016-Q1') {
      setTimeframe('ALL');
    } else if (quarter < '2021-Q1' && timeframe === '5Y') {
      setTimeframe('10Y');
    }
    if (metric !== 'index') {
      setMetric('index');
    }
  };

  const handleNextMilestone = () => {
    const currentIndex = keyMilestones.findIndex(k => k.quarter === selectedMilestone);
    const nextIndex = (currentIndex + 1) % keyMilestones.length;
    handleMilestoneClick(keyMilestones[nextIndex].quarter);
  };

  // Custom tooltip component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      const isIndexMetric = metric === 'index';
      const mainVal = isIndexMetric ? dataPoint?.index : dataPoint?.averagePrice;
      const yoyVal = isIndexMetric ? dataPoint?.yoy : dataPoint?.yoyChangePercent;
      const isPositive = yoyVal !== null && yoyVal !== undefined && yoyVal >= 0;

      return (
        <div className="bg-[#FBF9F5] border border-[#243324]/20 p-4 rounded-xl shadow-lg backdrop-blur-md max-w-xs font-sans">
          <div className="flex items-center justify-between gap-3 border-b border-[#243324]/10 pb-2 mb-2.5">
            <span className="font-serif font-bold text-base text-[#243324]">{label}</span>
            {dataPoint?.milestone && (
              <Badge variant="outline" className="bg-[#E8DCC4]/60 border-[#243324]/20 text-[#243324] text-[10px] font-medium px-2">
                Event
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#243324]/70 font-medium">
                {isIndexMetric ? 'Resale Price Index (2009-Q1=100):' : 'Average Price:'}
              </span>
              <span className="font-bold text-[#243324]">
                {isIndexMetric ? (mainVal !== undefined ? `${mainVal.toFixed(1)} pts` : 'N/A') : (mainVal !== undefined ? `$${mainVal?.toLocaleString()}` : 'N/A')}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#243324]/70 font-medium">YoY Change:</span>
              <span className={`font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
                {isPositive ? '+' : ''}{yoyVal !== null && yoyVal !== undefined ? `${yoyVal.toFixed(2)}%` : 'N/A'}
              </span>
            </div>

            {isIndexMetric && dataPoint?.qoq !== null && dataPoint?.qoq !== undefined && (
              <div className="flex items-center justify-between text-xs text-[#243324]/60">
                <span>QoQ Change:</span>
                <span className="font-semibold text-[#243324]">
                  {dataPoint.qoq >= 0 ? '+' : ''}{dataPoint.qoq.toFixed(2)}%
                </span>
              </div>
            )}

            {dataPoint?.milestone && (
              <div className="mt-2.5 pt-2 border-t border-[#243324]/10 text-xs text-[#3B4D36] font-medium bg-[#E8DCC4]/30 p-2 rounded">
                📌 {dataPoint.milestone}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-sm border-[#243324]/10 bg-white/70 backdrop-blur-md overflow-visible">
      <CardHeader className="border-b border-[#243324]/5 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="bg-[#3B4D36] text-[#FBF9F5] p-2.5 rounded-lg shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-2xl font-serif text-[#243324] tracking-tight">
                  Overall HDB Resale Market &amp; YoY Change
                </CardTitle>
                <CardDescription className="text-sm text-[#243324]/70 mt-0.5">
                  Official macro price index benchmark and Year-on-Year percentage growth cycle across Singapore.
                </CardDescription>
              </div>
            </div>
          </div>

          {/* Controls: Metric Switcher & Timeframe Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Metric Toggle */}
            <div className="inline-flex bg-[#FBF9F5] border border-[#243324]/15 p-0.5 rounded-lg text-xs font-medium shadow-xs">
              <button
                type="button"
                onClick={() => setMetric('index')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  metric === 'index'
                    ? 'bg-[#243324] text-[#FBF9F5] shadow-xs font-semibold'
                    : 'text-[#243324]/70 hover:text-[#243324]'
                }`}
              >
                Resale Price Index (Official)
              </button>
              <button
                type="button"
                onClick={() => setMetric('price')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  metric === 'price'
                    ? 'bg-[#243324] text-[#FBF9F5] shadow-xs font-semibold'
                    : 'text-[#243324]/70 hover:text-[#243324]'
                }`}
              >
                Avg Resale Price ($)
              </button>
            </div>

            {/* Timeframe Buttons */}
            <div className="inline-flex bg-[#FBF9F5] border border-[#243324]/15 p-0.5 rounded-lg text-xs font-medium shadow-xs">
              {(['5Y', '10Y', '20Y', 'ALL'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    timeframe === tf
                      ? 'bg-[#3B4D36] text-[#FBF9F5] shadow-xs font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Macro KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 mt-4 border-t border-[#243324]/5">
          <div className="bg-[#FBF9F5]/70 border border-[#243324]/10 rounded-lg p-3">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#243324]/60 block mb-1">
              Latest Index ({latestQuarter?.quarter || '2Q 2026'})
            </span>
            <div className="text-2xl font-serif font-bold text-[#243324] flex items-center flex-wrap gap-1">
              <span>{latestQuarter?.index !== undefined ? latestQuarter.index.toFixed(1) : '202.8'}</span>
              <span className="text-xs font-normal text-[#243324]/60 font-sans inline-flex items-center gap-1">
                <span>(2009-Q1=100)</span>
                <BaselineInfoTooltip align="left" />
              </span>
            </div>
          </div>

          <div className="bg-[#FBF9F5]/70 border border-[#243324]/10 rounded-lg p-3">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#243324]/60 block mb-1">
              Latest YoY Change
            </span>
            <div className={`text-2xl font-serif font-bold flex items-center gap-1.5 ${isYoYPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
              {isYoYPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {isYoYPositive ? '+' : ''}{latestYoY !== undefined ? latestYoY.toFixed(2) : '0.00'}%
              <span className="text-xs font-normal text-[#243324]/60 font-sans ml-1">YoY</span>
            </div>
          </div>

          <div className="bg-[#FBF9F5]/70 border border-[#243324]/10 rounded-lg p-3">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#243324]/60 block mb-1">
              Overall Avg Price ({latestAnnual?.year || '2026'})
            </span>
            <div className="text-2xl font-serif font-bold text-[#243324]">
              {latestAnnual?.averagePrice ? `$${latestAnnual.averagePrice.toLocaleString()}` : '$661,035'}
            </div>
          </div>

          <div className="bg-[#FBF9F5]/70 border border-[#243324]/10 rounded-lg p-3">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#243324]/60 block mb-1">
              Market Cycle Status
            </span>
            <div className="text-sm font-semibold text-[#3B4D36] flex items-center gap-1.5 mt-1">
              <Badge variant="secondary" className="bg-[#E8DCC4]/50 text-[#243324] border-[#243324]/10 font-medium text-xs">
                {latestYoY < 0 ? 'Stabilizing / Plateau' : latestYoY < 3 ? 'Moderate Growth' : 'Expansion'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Milestone Quick Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 text-xs scrollbar-thin">
          <button
            type="button"
            onClick={handleMilestonesToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              showAllMilestones
                ? 'bg-[#243324] text-[#FBF9F5] border-[#243324] shadow-xs'
                : 'bg-[#243324]/5 hover:bg-[#243324]/10 border-[#243324]/15 text-[#243324]'
            }`}
            title="Click to view all 6 key historical milestones on the macro timeline"
            aria-pressed={showAllMilestones}
          >
            <Sparkles className={`w-3.5 h-3.5 ${showAllMilestones ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>Milestones{showAllMilestones ? ' (All)' : ':'}</span>
          </button>
          {keyMilestones.map((m) => (
            <button
              key={m.quarter}
              type="button"
              onClick={() => handleMilestoneClick(m.quarter)}
              className={`px-2.5 py-1 rounded-full border transition-all shrink-0 text-[11px] font-medium cursor-pointer ${
                selectedMilestone === m.quarter
                  ? 'bg-[#3B4D36] text-[#FBF9F5] border-[#3B4D36] shadow-xs'
                  : 'bg-white/80 border-[#243324]/15 text-[#243324]/80 hover:bg-[#E8DCC4]/40 hover:text-[#243324]'
              }`}
              title={m.note}
            >
              {m.label}
            </button>
          ))}
          {(selectedMilestone || showAllMilestones) && (
            <button
              type="button"
              onClick={() => {
                setSelectedMilestone(null);
                setShowAllMilestones(false);
              }}
              className="text-[11px] text-[#243324]/60 hover:text-[#243324] underline ml-1 shrink-0 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Milestone Detail Callout Banner */}
        {activeMilestoneObj && (
          <div className="mb-3 p-3.5 bg-[#FAF6F0] border border-amber-600/25 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-800 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif font-bold text-sm text-[#243324]">{activeMilestoneObj.label}</span>
                  <Badge variant="outline" className="bg-white border-amber-600/30 text-amber-900 text-[10px] font-semibold px-2">
                    {activeMilestoneObj.quarter}
                  </Badge>
                  <span className="text-[#243324]/40">·</span>
                  <span className="font-medium text-[#243324]">Index: <strong>{activeMilestoneObj.index} pts</strong></span>
                  <span className="text-[#243324]/40">·</span>
                  <span className="font-semibold text-emerald-800">YoY Change: {activeMilestoneObj.yoy}</span>
                </div>
                <p className="text-[#243324]/80 mt-1 leading-relaxed text-xs">
                  {activeMilestoneObj.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleNextMilestone}
                className="px-2.5 py-1 bg-white border border-[#243324]/15 hover:bg-[#E8DCC4]/40 text-[#243324] rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              >
                Next Milestone →
              </button>
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="p-1 text-[#243324]/50 hover:text-[#243324] transition-colors cursor-pointer text-sm font-bold"
                aria-label="Dismiss milestone"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {showAllMilestones && !activeMilestoneObj && (
          <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs flex items-center justify-between gap-3 text-amber-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Showing all 6 key historical market milestones</strong> across the full 1990–Present macro timeline. Click any milestone pill to inspect its policy and market details.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllMilestones(false)}
              className="text-xs font-medium underline hover:text-amber-950 shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* The Main Composed Dual-Axis Chart */}
        <div className="h-[420px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 35, left: 15, bottom: 25 }}
            >
              <defs>
                <linearGradient id="indexGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B4D36" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B4D36" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DCC4" opacity={0.6} />

              <XAxis
                dataKey={metric === 'index' ? 'quarter' : 'year'}
                tick={{ fill: '#243324', fontSize: 12 }}
                axisLine={{ stroke: '#243324', strokeOpacity: 0.2 }}
                tickLine={false}
                minTickGap={timeframe === 'ALL' ? 35 : 20}
              />

              {/* Left Y-Axis: Price Index or Average Price */}
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fill: '#243324', fontSize: 12 }}
                axisLine={{ stroke: '#243324', strokeOpacity: 0.2 }}
                tickLine={false}
                tickFormatter={(value) => {
                  if (metric === 'index') return `${value}`;
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  return `$${Math.round(value / 1000)}k`;
                }}
                domain={['auto', 'auto']}
              />

              {/* Right Y-Axis: YoY % Change */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#243324', fontSize: 12 }}
                axisLine={{ stroke: '#243324', strokeOpacity: 0.2 }}
                tickLine={false}
                tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
                domain={[-15, 35]}
              />

              {/* Zero baseline for YoY % */}
              <ReferenceLine
                y={0}
                yAxisId="right"
                stroke="#243324"
                strokeDasharray="4 4"
                strokeOpacity={0.35}
                label={{
                  value: '0% YoY',
                  position: 'insideBottomRight',
                  fill: '#243324',
                  fontSize: 10,
                  opacity: 0.5
                }}
              />

              {/* Highlight all milestones if showAllMilestones is active */}
              {showAllMilestones && keyMilestones.map((m, idx) => (
                <ReferenceLine
                  key={m.quarter}
                  x={m.quarter}
                  yAxisId="left"
                  stroke="#d97706"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  isFront={true}
                  label={{
                    value: m.label,
                    position: 'top',
                    dy: idx % 2 === 1 ? 14 : 0,
                    fill: '#92400e',
                    fontSize: 10,
                    fontWeight: 600
                  }}
                />
              ))}

              {/* Highlight single milestone if selected */}
              {selectedMilestone && (
                <ReferenceLine
                  x={selectedMilestone}
                  yAxisId="left"
                  stroke="#b45309"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  isFront={true}
                  label={{
                    value: activeMilestoneObj?.label || 'Milestone',
                    position: 'top',
                    fill: '#78350f',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                />
              )}

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: '16px' }}
                formatter={(val) => <span className="text-xs font-semibold text-[#243324]">{val}</span>}
              />

              {/* YoY % Change Bar Chart */}
              <Bar
                yAxisId="right"
                dataKey={metric === 'index' ? 'yoy' : 'yoyChangePercent'}
                name="YoY Change (%)"
                radius={[3, 3, 0, 0]}
                barSize={timeframe === '5Y' ? 14 : timeframe === '10Y' ? 8 : 4}
              >
                {chartData.map((entry, index) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const yoy = metric === 'index' ? (entry as any).yoy : (entry as any).yoyChangePercent;
                  const isPos = yoy !== null && yoy !== undefined && yoy >= 0;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isPos ? '#10b981' : '#f43f5e'}
                      fillOpacity={0.75}
                      stroke={isPos ? '#059669' : '#e11d48'}
                      strokeWidth={1}
                    />
                  );
                })}
              </Bar>

              {/* Trend Line (Resale Price Index or Average Price) */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey={metric === 'index' ? 'index' : 'averagePrice'}
                name={metric === 'index' ? 'Resale Price Index (2009-Q1=100)' : 'Average Resale Price ($)'}
                stroke="#243324"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#3B4D36', stroke: '#FBF9F5', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Note and Legend Clarification */}
        <div className="mt-4 pt-3 border-t border-[#243324]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#243324]/60">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/80 border border-emerald-600"></span>
            <span>Positive YoY Growth</span>
            <span className="inline-block w-3 h-3 rounded-sm bg-rose-500/80 border border-rose-600 ml-2"></span>
            <span>Negative YoY Contraction</span>
            <span className="inline-block w-4 h-0.5 bg-[#243324] ml-2"></span>
            <span>Price Index Trajectory</span>
          </div>
          <div className="text-[11px] text-[#243324]/50">
            Source: Housing &amp; Development Board (HDB) &amp; SingStat via data.gov.sg
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
