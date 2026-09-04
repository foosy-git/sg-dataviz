'use client';

import Link from 'next/link';
import { ArrowLeft, Briefcase, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function EmploymentDashboard({ data }: { data: any[] }) {
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];

  const totalDiff = latestData.total - previousData.total;
  const residentDiff = latestData.resident - previousData.resident;

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
                <Briefcase className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif tracking-tight text-[#243324] hidden md:block">
                Economy
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-[#243324] tracking-tight mb-4">
            Employment & Job Market
          </h1>
          <p className="text-lg text-[#243324]/70 max-w-2xl font-light">
            Tracking Singapore's overall and resident unemployment rates, illustrating the impact of economic cycles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Overall Unemployment ({latestData.year})</span>
                  </div>
                  <div className="text-5xl font-serif text-[#243324] mb-2">
                    {latestData.total}%
                  </div>
                  <div className={"text-sm font-medium " + (totalDiff > 0 ? "text-red-600" : "text-emerald-600")}>
                    {totalDiff > 0 ? '+' : ''}{totalDiff.toFixed(1)}% from previous year
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Resident Unemployment ({latestData.year})</span>
                  </div>
                  <div className="text-5xl font-serif text-[#243324] mb-2">
                    {latestData.resident}%
                  </div>
                  <div className={"text-sm font-medium " + (residentDiff > 0 ? "text-red-600" : "text-emerald-600")}>
                    {residentDiff > 0 ? '+' : ''}{residentDiff.toFixed(1)}% from previous year
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-[#243324]/5 shadow-sm mb-12">
          <CardHeader className="border-b border-[#243324]/5 pb-4">
            <CardTitle className="font-serif text-2xl text-[#243324]">Unemployment Rate Trend (1992 - {latestData.year})</CardTitle>
            <CardDescription>Comparing overall national unemployment vs Singapore Residents</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `${v}%`} dx={-10} domain={[0, 6]} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="total" name="Total Unemployment Rate" stroke="#94a3b8" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="resident" name="Resident Unemployment Rate" stroke="#0284c7" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
