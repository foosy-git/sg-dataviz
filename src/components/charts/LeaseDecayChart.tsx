import { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis } from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LeaseDecayChart({ data, isAggregated }: { data: any[], isAggregated?: boolean }) {
  const chartData = useMemo(() => {
    if (isAggregated) {
      return data;
    }

    // To prevent rendering 100k dots which kills performance, we can sample or aggregate
    const maxDataPoints = 2000;
    const step = Math.ceil(data.length / maxDataPoints) || 1;
    return data.filter((_, i) => i % step === 0).map(d => ({
      remainingLease: Math.round(d.remainingLeaseYears),
      price: d.resalePrice,
      town: d.town,
      details: `${d.block} ${d.streetName}`
    }));
  }, [data, isAggregated]);

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid opacity={0.3} />
          <XAxis 
            type="number" 
            dataKey="remainingLease" 
            name="Remaining Lease" 
            domain={['dataMin', 99]} 
            tick={{ fontSize: 12 }}
            minTickGap={30}
            label={{ value: "Remaining Lease (Years)", position: "bottom", offset: 0 }}
          />
          <YAxis 
            type="number" 
            dataKey="price" 
            name="Price" 
            tickFormatter={(value) => {
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              return `$${value / 1000}k`;
            }} 
            tick={{ fontSize: 12 }} 
          />
          <ZAxis type="category" dataKey="town" name="Town" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              if (name === 'Price') return [`$${value.toLocaleString()}`, name];
              return [value, name];
            }}
          />
          <Scatter name="Transactions" data={chartData} fill="#8884d8" opacity={0.5} activeShape={{ r: 6 }} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
