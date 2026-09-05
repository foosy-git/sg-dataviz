'use client';

import { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { LayoutList, BarChart3 } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TownHeatmap({ data, isAggregated }: { data: any[], isAggregated?: boolean }) {
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'ranking' | 'chart'>('chart');

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      setViewMode(mobile ? 'ranking' : 'chart');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const chartData = useMemo(() => {
    if (isAggregated) {
      return data;
    }

    const grouped = data.reduce((acc, curr) => {
      if (!acc[curr.town]) {
        acc[curr.town] = { town: curr.town, count: 0, sum: 0 };
      }
      acc[curr.town].count += 1;
      acc[curr.town].sum += curr.resalePrice;
      return acc;
    }, {} as Record<string, { town: string; count: number; sum: number }>);

    return Object.values(grouped)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((group: any) => ({
        town: group.town.length > 10 ? group.town.substring(0, 10) + '...' : group.town,
        fullTown: group.town,
        medianPrice: Math.round(group.sum / group.count)
      }))
      .sort((a, b) => b.medianPrice - a.medianPrice);
  }, [data, isAggregated]);

  return (
    <div className="w-full">
      {/* View Toggle Bar */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#243324]/5">
        <span className="text-xs font-semibold text-[#243324]/60 uppercase tracking-wider">
          Estate Price Ranking ({chartData.length} Towns)
        </span>
        <div className="inline-flex bg-[#FBF9F5] border border-[#243324]/15 p-0.5 rounded-lg text-xs font-medium shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('ranking')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'ranking'
                ? 'bg-[#243324] text-[#FBF9F5] shadow-xs font-semibold'
                : 'text-[#243324]/70 hover:text-[#243324]'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Ranked List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'chart'
                ? 'bg-[#243324] text-[#FBF9F5] shadow-xs font-semibold'
                : 'text-[#243324]/70 hover:text-[#243324]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Column Chart</span>
          </button>
        </div>
      </div>

      {viewMode === 'ranking' ? (
        /* Mobile-Friendly Ranked Horizontal Bar View with Smooth Scroll */
        <div className="max-h-[460px] overflow-y-auto pr-1 scrollbar-thin rounded-lg border border-[#243324]/10 bg-white/40 p-2 sm:p-4">
          <div style={{ height: Math.max(400, chartData.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 65, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                <XAxis type="number" hide domain={[0, 'auto']} />
                <YAxis
                  type="category"
                  dataKey="fullTown"
                  width={120}
                  tick={{ fontSize: 11, fill: '#243324', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Median Price']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullTown || label}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(36, 51, 36, 0.15)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="medianPrice" fill="#f97316" radius={[0, 4, 4, 0]} barSize={18}>
                  <LabelList
                    dataKey="medianPrice"
                    position="right"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) =>
                      value >= 1000000
                        ? `$${(value / 1000000).toFixed(2)}M`
                        : `$${Math.round(value / 1000)}k`
                    }
                    fill="#243324"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Standard Column Chart (Desktop-optimized or wide view) */
        <div className="h-[400px] w-full overflow-x-auto">
          <div style={{ minWidth: isMobile ? '600px' : '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="town"
                  angle={-45}
                  textAnchor="end"
                  tick={{ fontSize: 10 }}
                  height={80}
                  interval={0}
                />
                <YAxis
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                    return `$${value / 1000}k`;
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Avg Price']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullTown || label}
                />
                <Bar dataKey="medianPrice" fill="#f97316" radius={[4, 4, 0, 0]}>
                  {(!isMobile || chartData.length < 12) && (
                    <LabelList
                      dataKey="medianPrice"
                      position="top"
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) =>
                        value >= 1000000
                          ? `${(value / 1000000).toFixed(1)}M`
                          : `${Math.round(value / 1000)}k`
                      }
                      fill="#243324"
                      fontSize={10}
                    />
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
