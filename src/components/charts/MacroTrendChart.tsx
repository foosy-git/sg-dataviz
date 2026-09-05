'use client';

import { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const FLAT_TYPES_ORDER = ["1 ROOM", "2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM", "EXECUTIVE", "MULTI-GENERATION"];
const FLAT_TYPES_SET = new Set(FLAT_TYPES_ORDER);

const FLAT_TYPE_COLORS: Record<string, string> = {
  '1 ROOM': '#64748b',       // Slate
  '2 ROOM': '#06b6d4',       // Cyan
  '3 ROOM': '#3b82f6',       // Blue
  '4 ROOM': '#10b981',       // Emerald
  '5 ROOM': '#f59e0b',       // Amber
  'EXECUTIVE': '#8b5cf6',    // Violet
  'MULTI-GENERATION': '#f43f5e' // Rose
};

const TOWN_COLORS = [
  '#0284c7', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0d9488',
  '#ca8a04', '#e11d48', '#4f46e5', '#059669', '#ea580c', '#7c3aed',
  '#0891b2', '#65a30d', '#c026d3', '#2563eb', '#15803d', '#b45309',
  '#475569', '#be123c', '#0369a1', '#15803d', '#b45309', '#6d28d9',
  '#0f766e', '#854d0e'
];

export interface MacroTrendChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  isAggregated?: boolean;
  splitBy?: 'town' | 'flatType';
  onSplitChange?: (split: 'town' | 'flatType') => void;
}

export default function MacroTrendChart({
  data = [],
  isAggregated,
  splitBy,
  onSplitChange
}: MacroTrendChartProps) {
  const [internalSplit, setInternalSplit] = useState<'town' | 'flatType'>('town');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile && splitBy === undefined) {
        setInternalSplit('flatType');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [splitBy]);

  const currentSplit = splitBy !== undefined ? splitBy : internalSplit;

  const handleSplitChange = (mode: 'town' | 'flatType') => {
    if (onSplitChange) {
      onSplitChange(mode);
    }
    setInternalSplit(mode);
  };

  const chartData = useMemo(() => {
    if (isAggregated) return data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grouped = data.reduce((acc, curr) => {
      if (!acc[curr.month]) {
        acc[curr.month] = { month: curr.month, volume: 0, sum: 0 };
      }
      acc[curr.month].volume += 1;
      acc[curr.month].sum += curr.resalePrice;

      if (curr.town) {
        const townKey = curr.town;
        if (!acc[curr.month][`${townKey}_count`]) {
          acc[curr.month][`${townKey}_count`] = 0;
          acc[curr.month][`${townKey}_sum`] = 0;
        }
        acc[curr.month][`${townKey}_count`] += 1;
        acc[curr.month][`${townKey}_sum`] += curr.resalePrice;
      }

      if (curr.flatType) {
        const flatKey = curr.flatType;
        if (!acc[curr.month][`${flatKey}_count`]) {
          acc[curr.month][`${flatKey}_count`] = 0;
          acc[curr.month][`${flatKey}_sum`] = 0;
        }
        acc[curr.month][`${flatKey}_count`] += 1;
        acc[curr.month][`${flatKey}_sum`] += curr.resalePrice;
      }

      return acc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, any>);

    return Object.values(grouped)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((group: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item: any = { month: group.month, medianPrice: Math.round(group.sum / group.volume), volume: group.volume };
        for (const key of Object.keys(group)) {
          if (key.endsWith('_count')) {
            const entityName = key.replace('_count', '');
            item[entityName] = Math.round(group[`${entityName}_sum`] / group[key]);
          }
        }
        return item;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [data, isAggregated]);

  const towns = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const townSet = new Set<string>();
    chartData.forEach(row => {
      Object.keys(row).forEach(k => {
        if (
          k !== 'month' &&
          k !== 'medianPrice' &&
          k !== 'volume' &&
          !FLAT_TYPES_SET.has(k) &&
          !k.endsWith('_count') &&
          !k.endsWith('_sum')
        ) {
          townSet.add(k);
        }
      });
    });
    return Array.from(townSet).sort();
  }, [chartData]);

  const flatTypes = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const flatSet = new Set<string>();
    chartData.forEach(row => {
      Object.keys(row).forEach(k => {
        if (FLAT_TYPES_SET.has(k)) {
          flatSet.add(k);
        }
      });
    });
    return FLAT_TYPES_ORDER.filter(ft => flatSet.has(ft));
  }, [chartData]);

  const activeSeries = useMemo(() => {
    if (currentSplit === 'town') {
      return towns.map((t, idx) => ({
        key: t,
        name: t,
        color: TOWN_COLORS[idx % TOWN_COLORS.length]
      }));
    } else {
      return flatTypes.map((ft) => ({
        key: ft,
        name: ft,
        color: FLAT_TYPE_COLORS[ft] || '#3B4D36'
      }));
    }
  }, [currentSplit, towns, flatTypes]);

  return (
    <div className="w-full">
      {/* Toolbar: Split Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-[#243324]/5">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#243324]/60">
            Trend Split:
          </span>
          <div className="inline-flex bg-[#FBF9F5] border border-[#243324]/15 p-0.5 rounded-lg text-xs font-medium shadow-xs">
            <button
              type="button"
              onClick={() => handleSplitChange('town')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                currentSplit === 'town'
                  ? 'bg-[#243324] text-[#FBF9F5] shadow-xs font-semibold'
                  : 'text-[#243324]/70 hover:text-[#243324]'
              }`}
            >
              By Towns ({towns.length})
            </button>
            <button
              type="button"
              onClick={() => handleSplitChange('flatType')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                currentSplit === 'flatType'
                  ? 'bg-[#243324] text-[#FBF9F5] shadow-xs font-semibold'
                  : 'text-[#243324]/70 hover:text-[#243324]'
              }`}
            >
              By Flat Types ({flatTypes.length})
            </button>
          </div>
        </div>

        <div className="text-xs text-[#243324]/60 font-medium">
          Showing {currentSplit === 'town' ? `${towns.length} towns` : `${flatTypes.length} flat types`}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[380px] w-full">
        {activeSeries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-[#243324]/60">
            No transaction trend data available for current filters.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={isMobile ? { top: 10, right: 10, left: -10, bottom: 5 } : { top: 10, right: 30, left: 15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DCC4" opacity={0.5} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#243324', fontSize: isMobile ? 10 : 12 }}
                axisLine={{ stroke: '#243324', strokeOpacity: 0.2 }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(value) => {
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  return `$${Math.round(value / 1000)}k`;
                }}
                tick={{ fill: '#243324', fontSize: isMobile ? 10 : 12 }}
                axisLine={{ stroke: '#243324', strokeOpacity: 0.2 }}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => {
                  if (typeof value === 'number') {
                    return [`$${value.toLocaleString()}`, name];
                  }
                  return [value, name];
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderColor: '#E8DCC4',
                  borderRadius: '10px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                  fontSize: '12px'
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '12px', maxHeight: isMobile ? '65px' : '90px', overflowY: 'auto' }}
                formatter={(val) => <span className="text-xs font-semibold text-[#243324]">{val}</span>}
              />

              {activeSeries.map(({ key, name, color }) => (
                <Line
                  key={key}
                  yAxisId="left"
                  type="monotone"
                  dataKey={key}
                  name={name}
                  stroke={color}
                  strokeWidth={currentSplit === 'flatType' ? 2.5 : 1.75}
                  strokeOpacity={0.85}
                  connectNulls={true}
                  dot={false}
                  activeDot={{ r: 5, stroke: '#FBF9F5', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
