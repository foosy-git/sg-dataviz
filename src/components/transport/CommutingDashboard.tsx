'use client';

import Link from 'next/link';
import { ArrowLeft, Train, Bus, Car, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#64748b', '#06b6d4', '#d946ef'];

export default function CommutingDashboard({ data }: { data: any[] }) {
  // Total working population
  const totalCommuters = data.reduce((acc, curr) => acc + curr.total, 0);

  // Group into Public Transport vs Private vs Others
  let publicTransport = 0;
  let privateTransport = 0;
  
  data.forEach(d => {
    const mode = d.mode.toLowerCase();
    if (mode.includes('mrt') || mode.includes('bus') && !mode.includes('chartered')) {
      publicTransport += d.total;
    } else if (mode.includes('car') || mode.includes('taxi') || mode.includes('motorcycle')) {
      privateTransport += d.total;
    }
  });

  const publicPct = ((publicTransport / totalCommuters) * 100).toFixed(1);
  const privatePct = ((privateTransport / totalCommuters) * 100).toFixed(1);

  // Sort data for the bar chart
  const sortedData = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen bg-[#FBF9F5] pb-20">
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
                <Train className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif tracking-tight text-[#243324] hidden md:block">
                Transport
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-[#243324] tracking-tight mb-4">
            Commuting to Work
          </h1>
          <p className="text-lg text-[#243324]/70 max-w-2xl font-light">
            An analysis of how Singapore resident working persons (aged 15+) travel to work, broken down by transport mode and sex.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Navigation className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Commuters</span>
              </div>
              <div className="text-5xl font-serif text-[#243324] mb-2">
                {(totalCommuters / 1000).toFixed(1)}M
              </div>
              <div className="text-sm font-medium text-[#243324]/60">
                Working residents
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Train className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Public Transport</span>
              </div>
              <div className="text-5xl font-serif text-[#243324] mb-2">
                {publicPct}%
              </div>
              <div className="text-sm font-medium text-emerald-600">
                Mass Rapid Transit & Public Bus
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Car className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Private Transport</span>
              </div>
              <div className="text-5xl font-serif text-[#243324] mb-2">
                {privatePct}%
              </div>
              <div className="text-sm font-medium text-blue-600">
                Cars, Taxis & Motorcycles
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          
          <Card className="bg-white border-[#243324]/5 shadow-sm xl:col-span-2">
            <CardHeader className="border-b border-[#243324]/5 pb-4">
              <CardTitle className="font-serif text-2xl text-[#243324]">Primary Modes of Transport</CardTitle>
              <CardDescription>Breakdown of commuters by their usual mode of transport (in thousands)</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedData} layout="vertical" margin={{ top: 20, right: 30, left: 150, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#24332410" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `${v}k`} />
                    <YAxis type="category" dataKey="mode" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#243324' }} width={140} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number, name: string) => [`${value}k`, name === 'males' ? 'Males' : name === 'females' ? 'Females' : 'Total']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="males" name="Males" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="females" name="Females" stackId="a" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm xl:col-span-1">
            <CardHeader className="border-b border-[#243324]/5 pb-4">
              <CardTitle className="font-serif text-xl text-[#243324]">Mode Distribution</CardTitle>
              <CardDescription>Share of transport modes</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sortedData.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="total"
                      nameKey="mode"
                    >
                      {sortedData.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value}k`, 'Commuters']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', marginTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
