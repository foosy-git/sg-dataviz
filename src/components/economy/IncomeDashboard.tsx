'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import Link from 'next/link';
import { TrendingUp, DollarSign, Users, Wallet, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface IncomeDashboardProps {
  initialData: any[];
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
  const earliestData = initialData[0] || {};

  // Calc growth rates
  const medianGrowth = latestData.median && earliestData.median 
    ? ((latestData.median - earliestData.median) / earliestData.median * 100).toFixed(1) 
    : '0';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#FBF9F5] border border-[#243324]/10 p-3 rounded-lg shadow-md">
          <p className="font-serif font-medium text-[#243324] mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const isPercent = false;
            const valueStr = isPercent ? `${entry.value}%` : `$${entry.value?.toLocaleString()}`;
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-[#243324] tracking-tight mb-4">
              Household Income & Distribution
            </h1>
            <p className="text-lg md:text-xl text-[#243324]/70 max-w-3xl font-sans leading-relaxed">
              Analyze Singapore's household earnings, compare median vs average income, and observe the income gap across different deciles over the past 20+ years.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Select value={timeRange} onValueChange={setTimeRange}>
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
              <p className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +{medianGrowth}% since 2000
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
          
        </div>

      </div>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-center text-sm text-[#243324]/50">
        Data sourced from <a href="https://data.gov.sg" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#243324]">data.gov.sg</a>
      </footer>
    </div>
  );
}
