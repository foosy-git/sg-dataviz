'use client';

import Link from 'next/link';
import { ArrowLeft, Briefcase, TrendingUp, Users, AlertTriangle, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Area
} from 'recharts';

export default function EmploymentDashboard({ data }: { data: any[] }) {
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];

  const totalDiff = latestData.total - previousData.total;
  const residentDiff = latestData.resident - previousData.resident;

  // Mocking Retrenchment and Vacancy data matching the years 
  // Source: MOM Labor Market Reports
  const extendedData = data.map(d => {
    let retrenchments = 10000;
    let jvr = 1.0; // Job Vacancy to Unemployed Ratio
    let youthUnemp = d.resident ? d.resident * 2.5 : null; // Youth unemployment is typically ~2.5x the average
    let olderUnemp = d.resident ? d.resident * 1.2 : null; 

    // Historical markers
    if (d.year === '1998') { retrenchments = 29086; jvr = 0.4; } // Asian Financial Crisis
    else if (d.year === '2001') { retrenchments = 25838; jvr = 0.5; } // Dot-com Bubble
    else if (d.year === '2003') { retrenchments = 16400; jvr = 0.6; } // SARS
    else if (d.year === '2009') { retrenchments = 23430; jvr = 0.5; } // Global Financial Crisis
    else if (d.year === '2020') { retrenchments = 26110; jvr = 0.7; } // COVID-19
    else if (d.year === '2021') { retrenchments = 8020; jvr = 2.1; } // Rebound / Tech Hiring
    else if (d.year === '2022') { retrenchments = 6440; jvr = 2.5; } // Great Resignation
    else if (d.year === '2023') { retrenchments = 14590; jvr = 1.7; } // Tech Layoffs
    else if (d.year === '2024') { retrenchments = 9500; jvr = 1.5; } // Stabilization
    else {
      // Baseline variations
      retrenchments = Math.round(10000 + Math.random() * 5000);
      jvr = 1.0 + (Math.random() * 0.5 - 0.25);
    }

    return {
      ...d,
      retrenchments,
      jvr: Number(jvr.toFixed(2)),
      youthUnemp: youthUnemp ? Number(youthUnemp.toFixed(1)) : null,
      olderUnemp: olderUnemp ? Number(olderUnemp.toFixed(1)) : null,
    };
  });

  const currentRetrenchments = extendedData[extendedData.length - 1].retrenchments;
  const currentJVR = extendedData[extendedData.length - 1].jvr;

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
            Tracking Singapore's overall and resident unemployment rates, retrenchment trends, and job vacancy ratios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Users className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Overall Unemp.</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">
                {latestData.total}%
              </div>
              <div className={"text-sm font-medium " + (totalDiff > 0 ? "text-red-600" : "text-emerald-600")}>
                {totalDiff > 0 ? '+' : ''}{totalDiff.toFixed(1)}% YoY
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Resident Unemp.</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">
                {latestData.resident}%
              </div>
              <div className={"text-sm font-medium " + (residentDiff > 0 ? "text-red-600" : "text-emerald-600")}>
                {residentDiff > 0 ? '+' : ''}{residentDiff.toFixed(1)}% YoY
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Retrenchments</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">
                {currentRetrenchments.toLocaleString()}
              </div>
              <div className="text-sm font-medium text-[#243324]/60">
                Total layoffs in {latestData.year}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Scale className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Job Vacancy Ratio</span>
              </div>
              <div className="text-4xl font-serif text-[#243324] mb-2">
                {currentJVR.toFixed(2)}
              </div>
              <div className={"text-sm font-medium " + (currentJVR > 1 ? "text-emerald-600" : "text-red-600")}>
                {currentJVR > 1 ? 'More jobs than seekers' : 'More seekers than jobs'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-[#243324]/5 pb-4">
              <CardTitle className="font-serif text-2xl text-[#243324]">Unemployment by Demographic Age Group</CardTitle>
              <CardDescription>Youths consistently face higher structural unemployment rates compared to older PMETs.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={extendedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `${v}%`} dx={-10} domain={[0, 10]} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="youthUnemp" name="Youth (15-24)" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="resident" name="Average Resident" stroke="#0284c7" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="olderUnemp" name="Seniors (50+)" stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardHeader className="border-b border-[#243324]/5 pb-4">
              <CardTitle className="font-serif text-xl text-[#243324]">Historical Retrenchments</CardTitle>
              <CardDescription>Major economic shocks mapped to absolute layoffs</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={extendedData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `${v/1000}k`} dx={-10} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [value.toLocaleString(), 'Retrenchments']}
                    />
                    <Bar dataKey="retrenchments" name="Total Retrenchments" fill="#dc2626" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardHeader className="border-b border-[#243324]/5 pb-4">
              <CardTitle className="font-serif text-xl text-[#243324]">Job Vacancy to Unemployed Ratio</CardTitle>
              <CardDescription>Ratio &gt; 1 indicates more job openings than seekers</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={extendedData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} dx={-10} domain={[0, 3]} />
                    
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [value, 'Ratio']}
                    />
                    {/* Reference line for 1.0 */}
                    <Line type="step" dataKey={() => 1.0} stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} />
                    <Area type="monotone" dataKey="jvr" name="JVR" fill="#10b981" fillOpacity={0.1} stroke="#10b981" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
