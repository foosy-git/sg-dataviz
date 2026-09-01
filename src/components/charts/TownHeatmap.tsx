import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TownHeatmap({ data, isAggregated }: { data: any[], isAggregated?: boolean }) {
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
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis 
            dataKey="town" 
            angle={-45} 
            textAnchor="end" 
            tick={{ fontSize: 10 }}
            height={80}
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
            <LabelList 
              dataKey="medianPrice" 
              position="top" 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${Math.round(value / 1000)}k`} 
              fill="#243324" 
              fontSize={10} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
