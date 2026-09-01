'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { ArrowLeft, Baby } from 'lucide-react';

interface BirthRatesDashboardProps {
  data: any[];
}

export default function BirthRatesDashboard({ data }: BirthRatesDashboardProps) {
  const [timeRange, setTimeRange] = useState<string>('all');
  
  // Filter data based on time range
  const filteredData = data.filter(d => {
    const year = parseInt(d.year);
    if (timeRange === 'all') return true;
    if (timeRange === 'last10') return year >= new Date().getFullYear() - 10;
    if (timeRange === 'last20') return year >= new Date().getFullYear() - 20;
    if (timeRange === 'since2000') return year >= 2000;
    return true;
  });

  const latestData = data[data.length - 1] || {};
  const tfr = latestData['Total Fertility Rate (TFR)'];

  return (
    <div className="min-h-screen bg-[#FBF9F5] pb-20">
      <header className="sticky top-0 z-50 bg-[#FBF9F5]/80 backdrop-blur-md border-b border-[#243324]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#243324]/60 hover:text-[#243324] transition-colors py-1.5 px-3 rounded-md shadow-sm border border-[#243324]/5 bg-white/50">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Portal</span>
              </Link>
              <div className="h-6 w-px bg-[#243324]/10 hidden md:block" />
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5" />
                <span className="font-serif text-xl font-medium">Birth Rates & Fertility</span>
              </div>
            </div>
            
            <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#E8DCC4]/30 text-[#243324]/60 border border-[#243324]/5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Data Sync
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-[#E8DCC4]/50 border border-[#243324]/10 text-sm font-sans font-medium text-[#243324]">
            Demographics
          </div>
          <h1 className="text-5xl md:text-7xl font-serif text-[#243324] mb-6 tracking-tight leading-tight">
            Birth Rates & Fertility
          </h1>
          <p className="text-lg md:text-xl text-[#243324]/70 max-w-2xl font-sans leading-relaxed">
            Analyze Singapore's Total Fertility Rate (TFR) and age-specific fertility trends from 1960 to present.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#E8DCC4]/30 border-none shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-[#243324]/60 uppercase tracking-wider mb-2 font-sans">Latest TFR ({latestData.year})</p>
              <p className="text-4xl font-serif text-[#243324]">{tfr ? tfr.toFixed(2) : 'N.A.'}</p>
              <p className="text-sm mt-2 text-[#243324]/70">Replacement level is 2.1</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#E8DCC4]/30 border-none shadow-sm md:col-span-2">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#243324]/60 uppercase tracking-wider mb-2 font-sans">Time Range Filter</p>
                  <p className="text-sm text-[#243324]/70">Adjust the timeline for the charts below</p>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">1960 - Present</SelectItem>
                    <SelectItem value="since2000">2000 - Present</SelectItem>
                    <SelectItem value="last20">Last 20 Years</SelectItem>
                    <SelectItem value="last10">Last 10 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-[#243324]">Total Fertility Rate (TFR)</CardTitle>
              <CardDescription className="text-base text-[#243324]/70 font-sans">
                The average number of live-births each female would have during her reproductive years.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243324" opacity={0.1} vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      stroke="#243324" 
                      opacity={0.5}
                      tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#243324" 
                      opacity={0.5}
                      tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                      domain={[0, 'auto']}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#FBF9F5', borderColor: 'rgba(36, 51, 36, 0.1)', borderRadius: '8px', color: '#243324', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#243324' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      name="Total Fertility Rate"
                      dataKey="Total Fertility Rate (TFR)" 
                      stroke="#3B4D36" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: "#E8DCC4", stroke: "#3B4D36", strokeWidth: 2 }}
                    />
                    <Line 
                      type="dashed" 
                      name="Replacement Level (2.1)"
                      dataKey={() => 2.1} 
                      stroke="#E85D04" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-[#243324]">Age-Specific Fertility Rates</CardTitle>
              <CardDescription className="text-base text-[#243324]/70 font-sans">
                Number of live-births per 1,000 females in the specific age group.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243324" opacity={0.1} vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      stroke="#243324" 
                      opacity={0.5}
                      tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#243324" 
                      opacity={0.5}
                      tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#FBF9F5', borderColor: 'rgba(36, 51, 36, 0.1)', borderRadius: '8px', color: '#243324', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#243324' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" name="20-24 Years" dataKey="20 - 24 Years" stroke="#8cb369" strokeWidth={2} dot={false} />
                    <Line type="monotone" name="25-29 Years" dataKey="25 - 29 Years" stroke="#f4e285" strokeWidth={2} dot={false} />
                    <Line type="monotone" name="30-34 Years" dataKey="30 - 34 Years" stroke="#f4a259" strokeWidth={2} dot={false} />
                    <Line type="monotone" name="35-39 Years" dataKey="35 - 39 Years" stroke="#bc4b51" strokeWidth={2} dot={false} />
                    <Line type="monotone" name="40-44 Years" dataKey="40 - 44 Years" stroke="#5b8e7d" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
