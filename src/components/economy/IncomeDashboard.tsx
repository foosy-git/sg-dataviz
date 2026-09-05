'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';
import { TrendingUp, TrendingDown, DollarSign, Users, Wallet, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardNav from '@/components/ui/DashboardNav';
import DataSourcePopover from '@/components/ui/DataSourcePopover';
import { DATA_SOURCES } from '@/lib/dataSourceConfig';

export interface IncomeRecord {
  year: string;
  median: number | null;
  realMedian?: number | null;
  average: number | null;
  unemployment?: number | null;
  hdb1_2?: number | null;
  hdb3?: number | null;
  hdb4?: number | null;
  hdb5_exec?: number | null;
  condo?: number | null;
  landed?: number | null;
  decile1?: number | null;
  decile2?: number | null;
  decile3?: number | null;
  decile4?: number | null;
  decile5?: number | null;
  decile6?: number | null;
  decile7?: number | null;
  decile8?: number | null;
  decile9?: number | null;
  decile10?: number | null;
  [key: string]: string | number | null | undefined;
}

interface TooltipEntry {
  name: string;
  value?: number | string | null;
  color?: string;
  [key: string]: unknown;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

interface IncomeDashboardProps {
  initialData: IncomeRecord[];
}

export default function IncomeDashboard({ initialData }: IncomeDashboardProps) {
  const [timeRange, setTimeRange] = useState('all');

  const filteredData = useMemo(() => {
    let result = [...initialData];
    if (timeRange === 'last10') {
      result = result.slice(-10);
    } else if (timeRange === 'last20') {
      result = result.slice(-20);
    }
    return result;
  }, [initialData, timeRange]);

  const latestData = initialData[initialData.length - 1] || {};
  const previousData = initialData.length > 1 ? initialData[initialData.length - 2] : null;

  // Calc growth rates vs previous year
  const medianGrowthNum = latestData.median && previousData?.median 
    ? ((latestData.median - previousData.median) / previousData.median * 100) 
    : 0;
  const isMedianGrowing = medianGrowthNum >= 0;
  const medianGrowth = Math.abs(medianGrowthNum).toFixed(1);

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#FBF9F5] border border-[#243324]/10 p-3 rounded-lg shadow-md">
          <p className="font-serif font-medium text-[#243324] mb-2">{label}</p>
          {payload.map((entry: TooltipEntry, index: number) => {
            const numVal = entry.value !== null && entry.value !== undefined ? Number(entry.value) : null;
            const valueStr = numVal !== null && !isNaN(numVal) ? `$${numVal.toLocaleString()}` : 'N/A';
            return (
              <p key={index} className="text-sm font-sans flex items-center gap-2" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}: {valueStr}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const latestDeciles = [
    { name: '1st (Lowest)', value: latestData.decile1 },
    { name: '2nd', value: latestData.decile2 },
    { name: '3rd', value: latestData.decile3 },
    { name: '4th', value: latestData.decile4 },
    { name: '5th', value: latestData.decile5 },
    { name: '6th', value: latestData.decile6 },
    { name: '7th', value: latestData.decile7 },
    { name: '8th', value: latestData.decile8 },
    { name: '9th', value: latestData.decile9 },
    { name: '10th (Highest)', value: latestData.decile10 },
  ];

  return (
    <div className="min-h-screen font-sans pb-12 bg-[#FBF9F5]">
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
              <Wallet className="w-5 h-5 text-[#3B4D36]" />
              <h1 className="font-serif text-lg font-medium text-[#243324] tracking-tight">
                Household Income
              </h1>
            </div>
          </div>
          <DashboardNav />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3.5 mb-4 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#243324] tracking-tight">
                Household Income &amp; Distribution
              </h1>
              <DataSourcePopover source={DATA_SOURCES.income} />
            </div>
            <p className="text-lg md:text-xl text-[#243324]/70 max-w-3xl font-sans leading-relaxed">
              Analyze Singapore&apos;s household earnings, compare median vs average income, and observe the income gap across different deciles over the past 20+ years.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Select value={timeRange} onValueChange={(val) => val && setTimeRange(val)}>
              <SelectTrigger className="w-[180px] bg-white border-[#243324]/20">
                <SelectValue placeholder="Select timeframe">
                  {timeRange === 'all' ? '2000 - Present' : timeRange === 'last20' ? 'Last 20 Years' : timeRange === 'last10' ? 'Last 10 Years' : 'Select timeframe'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">2000 - Present</SelectItem>
                <SelectItem value="last20">Last 20 Years</SelectItem>
                <SelectItem value="last10">Last 10 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white border-[#243324]/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Users className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Latest Median Income ({latestData.year})</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">${latestData.median?.toLocaleString()}</div>
              <p className={`text-sm font-medium flex items-center gap-1 ${isMedianGrowing ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isMedianGrowing ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {previousData ? `${isMedianGrowing ? '+' : '-'}${medianGrowth}% vs previous year` : 'No prior year data'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-[#243324]/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Latest Average Income</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">${latestData.average?.toLocaleString()}</div>
              <p className="text-sm text-[#243324]/60">Skewed by high earners</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Top 10% (Highest Decile)</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">${latestData.decile10?.toLocaleString()}</div>
              <p className="text-sm text-[#243324]/60">Average of the top 10%</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <TrendingUp className="w-4 h-4 rotate-180" />
                <span className="text-xs font-semibold uppercase tracking-wider">Bottom 10% (Lowest Decile)</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">${latestData.decile1?.toLocaleString()}</div>
              <p className="text-sm text-[#243324]/60">Average of the bottom 10%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white border-[#243324]/10 shadow-sm col-span-1 lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-2xl text-[#243324]">The Inflation Gap: Real vs. Nominal Income</CardTitle>
              <CardDescription className="text-base text-[#243324]/70 font-sans">
                Nominal income is what&apos;s on your payslip. Real income is actual purchasing power adjusted against SingStat CPI (pegged to 2008 prices; official CPI series covers 2008 onwards).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243324" opacity={0.1} vertical={false} />
                    <XAxis dataKey="year" stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }} tickLine={false} axisLine={false} dy={10} minTickGap={30} />
                    <YAxis stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} tickFormatter={(v) => `$${v}`} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" name="Nominal Median Income" dataKey="median" stroke="#f43f5e" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Real Median Income (Purchasing Power)" dataKey="realMedian" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 0 }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/10 shadow-sm col-span-1 lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-2xl text-[#243324]">Income by Housing Type</CardTitle>
              <CardDescription className="text-base text-[#243324]/70 font-sans">
                Median household income categorized by the type of dwelling they reside in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243324" opacity={0.1} vertical={false} />
                    <XAxis dataKey="year" stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }} tickLine={false} axisLine={false} dy={10} minTickGap={30} />
                    <YAxis stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }} tickLine={false} axisLine={false} dx={-5} tickFormatter={(v) => `$${v}`} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" name="1-2 Room HDB" dataKey="hdb1_2" stroke="#94a3b8" strokeWidth={2} dot={{ r: 0 }} />
                    <Line type="monotone" name="3-Room HDB" dataKey="hdb3" stroke="#64748b" strokeWidth={2} dot={{ r: 0 }} />
                    <Line type="monotone" name="4-Room HDB" dataKey="hdb4" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
                    <Line type="monotone" name="5-Room/Exec HDB" dataKey="hdb5_exec" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
                    <Line type="monotone" name="Condominium" dataKey="condo" stroke="#f59e0b" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
                    <Line type="monotone" name="Landed Property" dataKey="landed" stroke="#10b981" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-2xl text-[#243324]">The Income Gap</CardTitle>
              <CardDescription className="text-base text-[#243324]/70 font-sans">
                Comparing the earnings of the Top 10% vs the Bottom 10% over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243324" opacity={0.1} vertical={false} />
                    <XAxis dataKey="year" stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }} tickLine={false} axisLine={false} dy={10} minTickGap={30} />
                    <YAxis stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} tickFormatter={(v) => `$${v}`} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" name="Top 10%" dataKey="decile10" stroke="#f43f5e" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Bottom 10%" dataKey="decile1" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/10 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-2xl text-[#243324]">Latest Decile Distribution ({latestData.year})</CardTitle>
              <CardDescription className="text-base text-[#243324]/70 font-sans">
                Where does your household stand compared to the rest of the nation?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={latestDeciles} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243324" opacity={0.1} vertical={false} />
                    <XAxis dataKey="name" stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 10 }} tickLine={false} axisLine={false} dy={10} angle={-45} textAnchor="end" height={60} />
                    <YAxis stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} tickFormatter={(v) => `$${v}`} />
                    <RechartsTooltip 
                      content={<CustomTooltip />} 
                      cursor={{ fill: 'rgba(36, 51, 36, 0.05)' }} 
                    />
                    <Bar dataKey="value" name="Average Income" fill="#3B4D36" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>


        </div>

      </div>
    </div>
  );
}
