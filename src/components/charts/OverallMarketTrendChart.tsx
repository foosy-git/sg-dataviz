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

  // Key historical milestones list
  const keyMilestones = [
    { label: '1996 Peak', quarter: '1996-Q4', note: 'Pre-Asian Crisis Peak' },
    { label: '2013 TDSR/MSR', quarter: '2013-Q2', note: 'Cooling Measures Peak' },
    { label: '2020 COVID-19', quarter: '2020-Q2', note: 'Pandemic Onset' },
    { label: '2021 Boom', quarter: '2021-Q4', note: '+12.7% YoY High' },
    { label: '2024 High', quarter: '2024-Q4', note: '+9.7% YoY Peak' },
    { label: '2026 Cooling', quarter: '2026-Q2', note: '-0.05% YoY Stabilization' }
  ];

  const handleMilestoneClick = (quarter: string) => {
    if (selectedMilestone === quarter) {
      setSelectedMilestone(null);
      return;
    }
    setSelectedMilestone(quarter);
    if (quarter < '2016-Q1') {
      setTimeframe('ALL');
    } else if (quarter < '2021-Q1' && timeframe === '5Y') {
      setTimeframe('10Y');
    }
    if (metric !== 'index') {
      setMetric('index');
    }
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
          <span className="text-[#243324]/60 font-medium flex items-center gap-1 shrink-0 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-[#3B4D36]" /> Milestones:
          </span>
          {keyMilestones.map((m) => (
            <button
              key={m.quarter}
              type="button"
              onClick={() => handleMilestoneClick(m.quarter)}
              className={`px-2.5 py-1 rounded-full border transition-all shrink-0 text-[11px] font-medium ${
                selectedMilestone === m.quarter
                  ? 'bg-[#243324] text-[#FBF9F5] border-[#243324]'
                  : 'bg-white/80 border-[#243324]/15 text-[#243324]/80 hover:bg-[#E8DCC4]/30'
              }`}
              title={m.note}
            >
              {m.label}
            </button>
          ))}
          {selectedMilestone && (
            <button
              type="button"
              onClick={() => setSelectedMilestone(null)}
              className="text-[11px] text-[#243324]/50 hover:text-[#243324] underline ml-1"
            >
              Clear
            </button>
          )}
        </div>

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

              {/* Highlight milestone if selected */}
              {selectedMilestone && (
                <ReferenceLine
                  x={selectedMilestone}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: keyMilestones.find(k => k.quarter === selectedMilestone)?.note || 'Milestone',
                    position: 'top',
                    fill: '#b45309',
                    fontSize: 11,
                    fontWeight: 600
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
