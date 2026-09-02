'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Car, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function COEDashboard({ initialData }: { initialData: any[] }) {
  
  // Pivot data for Line Chart (Premium over time)
  const premiumTrendData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, any>();
    
    initialData.forEach(d => {
      if (!map.has(d.formattedDate)) {
        map.set(d.formattedDate, { formattedDate: d.formattedDate, total_quota: 0, total_bids: 0 });
      }
      const entry = map.get(d.formattedDate);
      entry[d.vehicle_class] = d.premium;
      // For supply vs demand chart later
      entry[`${d.vehicle_class}_quota`] = d.quota;
      entry[`${d.vehicle_class}_bids`] = d.bids_received;
      
      entry.total_quota += d.quota;
      entry.total_bids += d.bids_received;
    });
    
    // Calculate Bidding Heat (oversubscription ratio)
    return Array.from(map.values()).map(entry => ({
      ...entry,
      bidding_heat: entry.total_quota > 0 ? Number((entry.total_bids / entry.total_quota).toFixed(2)) : 0
    }));
  }, [initialData]);

  // Yearly Supply Cycle
  const yearlySupplyData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, any>();
    initialData.forEach(d => {
      const year = d.month.substring(0, 4);
      if (!map.has(year)) map.set(year, { year, total_quota: 0 });
      map.get(year).total_quota += d.quota;
    });
    return Array.from(map.values());
  }, [initialData]);

  // Latest Bidding Data
  const latestBiddingDate = premiumTrendData[premiumTrendData.length - 1]?.formattedDate;
  const latestData = premiumTrendData[premiumTrendData.length - 1] || {};
  const previousData = premiumTrendData[premiumTrendData.length - 2] || {};

  const calculateChange = (current: number, previous: number) => {
    if (!current || !previous) return 0;
    return current - previous;
  };

  const categories = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
  const colors = {
    'Category A': '#3b82f6', // blue
    'Category B': '#ef4444', // red
    'Category C': '#f59e0b', // amber
    'Category D': '#10b981', // green
    'Category E': '#8b5cf6', // purple
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatCurrency = (val: any) => `$${val?.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-[#FBF9F5] pb-12">
      {/* Standardized Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#243324]/10 bg-[#FBF9F5]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#243324]/60 hover:text-[#243324] transition-colors py-1.5 px-3 rounded-md shadow-sm border border-[#243324]/5 bg-white/50">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Portal</span>
            </Link>
            <div className="h-6 w-px bg-[#243324]/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <div className="bg-[#243324] text-[#FBF9F5] p-1.5 rounded-lg shadow-sm">
                <Car className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif tracking-tight text-[#243324] hidden md:block">
                COE Bidding Analytics
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 bg-[#E8DCC4]/30 text-[#243324] shadow-sm font-sans whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B4D36] mr-2 animate-pulse"></span>
              Updated Daily
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-[#243324] tracking-tight mb-4">
            Certificate of Entitlement (COE)
          </h1>
          <p className="text-lg text-[#243324]/70 max-w-2xl font-light">
            Track COE premium trends, quota supply, and bidding demand across all vehicle categories in Singapore.
          </p>
        </div>

        {/* Top Metrics Cards */}
        <h2 className="text-lg font-serif mb-4 text-[#243324] border-b border-[#243324]/10 pb-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <span>Latest Results: {latestBiddingDate}</span>
          <span className="text-sm font-sans text-[#243324]/60 font-normal">Showing top categories. C & D have lower premiums.</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {['Category A', 'Category B', 'Category E'].map(cat => {
            const current = latestData[cat];
            const change = calculateChange(current, previousData[cat]);
            const isUp = change > 0;
            return (
              <Card key={cat} className="bg-white border-[#243324]/5 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">{cat} Premium</span>
                  </div>
                  <div className="text-3xl font-serif text-[#243324] mb-2">
                    {formatCurrency(current)}
                  </div>
                  <div className={`text-sm font-medium flex items-center gap-1 ${isUp ? 'text-red-600' : 'text-green-600'}`}>
                    {isUp ? '▲' : '▼'} {formatCurrency(Math.abs(change))} from previous bid
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* COE Premiums Trend */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4">
              <CardTitle className="font-serif text-xl">COE Premium Historical Trends</CardTitle>
              <CardDescription>Bidding prices across all vehicle categories over time</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 500, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={premiumTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis 
                      dataKey="formattedDate" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      minTickGap={50}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      tickFormatter={(v) => `$${(v/1000)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {categories.map(cat => (
                      <Line 
                        key={cat}
                        type="monotone" 
                        dataKey={cat} 
                        stroke={colors[cat as keyof typeof colors]} 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Bidding Heat */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4">
              <CardTitle className="font-serif text-xl">Bidding Heat (Oversubscription Rate)</CardTitle>
              <CardDescription>Ratio of Bids Received vs Quota Available per bidding exercise</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={premiumTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis 
                      dataKey="formattedDate" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      minTickGap={50}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      tickFormatter={(v) => `${v}x`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => `${value}x Oversubscribed`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bidding_heat" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      name="Oversubscription Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-[#243324]/50 mt-2">
                A value of 2.0x means there were twice as many bids as there were COEs available.
              </div>
            </CardContent>
          </Card>

          {/* 10-Year Supply Cycle */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4">
              <CardTitle className="font-serif text-xl">The 10-Year Supply Cycle</CardTitle>
              <CardDescription>Total COE quota volume released per year</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlySupplyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis 
                      dataKey="year" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Bar dataKey="total_quota" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Quota" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-[#243324]/50 mt-2">
                Notice the massive trough in supply in 2023, causing extreme price spikes, compared to the peak in 2017.
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-center text-sm text-[#243324]/50">
        Data sourced from <a href="https://data.gov.sg" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#243324]">data.gov.sg</a>
      </footer>
    </div>
  );
}
