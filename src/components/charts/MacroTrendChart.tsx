import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4',
  '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff',
  '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1',
  '#000075', '#808080'
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MacroTrendChart({ data, isAggregated }: { data: any[], isAggregated?: boolean }) {
  const chartData = useMemo(() => {
    if (isAggregated) return data;

    const grouped = data.reduce((acc, curr) => {
      if (!acc[curr.month]) {
        acc[curr.month] = { month: curr.month, volume: 0, sum: 0 };
      }
      acc[curr.month].volume += 1;
      acc[curr.month].sum += curr.resalePrice;

      const townKey = curr.town;
      if (!acc[curr.month][`${townKey}_count`]) {
         acc[curr.month][`${townKey}_count`] = 0;
         acc[curr.month][`${townKey}_sum`] = 0;
      }
      acc[curr.month][`${townKey}_count`] += 1;
      acc[curr.month][`${townKey}_sum`] += curr.resalePrice;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((group: any) => {
         const item: any = { month: group.month, medianPrice: Math.round(group.sum / group.volume), volume: group.volume };
         for (const key of Object.keys(group)) {
            if (key.endsWith('_count')) {
               const townName = key.replace('_count', '');
               item[townName] = Math.round(group[`${townName}_sum`] / group[key]);
            }
         }
         return item;
      })
      .sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [data, isAggregated]);

  const towns = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    // Extract all unique towns across all months just in case a town doesn't have sales in month 0
    const townSet = new Set<string>();
    chartData.forEach(row => {
      Object.keys(row).forEach(k => {
        if (k !== 'month' && k !== 'medianPrice' && k !== 'volume') townSet.add(k);
      });
    });
    return Array.from(townSet);
  }, [chartData]);

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DCC4" opacity={0.5} />
          <XAxis dataKey="month" tick={{ fill: '#243324', fontSize: 12 }} axisLine={{ stroke: '#243324' }} />
          <YAxis 
            yAxisId="left" 
            tickFormatter={(value) => {
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              return `$${value / 1000}k`;
            }} 
            tick={{ fill: '#243324', fontSize: 12 }} 
            axisLine={{ stroke: '#243324' }}
          />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#243324', fontSize: 12 }} axisLine={{ stroke: '#243324' }} />
          <Tooltip 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              if (name === 'Transaction Volume') return [value, name];
              return [`$${value.toLocaleString()}`, name];
            }}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#E8DCC4', borderRadius: '8px' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {towns.length === 0 && (
            <Line yAxisId="left" type="monotone" dataKey="medianPrice" name="Overall Avg Price" stroke="#243324" strokeWidth={3} dot={false} />
          )}

          {towns.map((town, idx) => (
             <Line 
               key={town}
               yAxisId="left" 
               type="monotone" 
               dataKey={town} 
               name={town} 
               stroke={COLORS[idx % COLORS.length]} 
               strokeWidth={2} 
               dot={false} 
             />
          ))}

          {/* Optional: Add volume back if you want, but it might clutter with multiple towns */}
          {/* <Line yAxisId="right" type="monotone" dataKey="volume" name="Transaction Volume" stroke="#243324" strokeOpacity={0.2} strokeWidth={1} dot={false} /> */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
