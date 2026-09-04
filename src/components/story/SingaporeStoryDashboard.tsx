"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Baby, Wallet, Building2, Car, Leaf, LineChart as LineChartIcon, Play, Pause, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine, ReferenceDot } from 'recharts';
import Link from 'next/link';

export interface TimelineYearData {
  year: number;
  birthRate: number | null;
  medianIncome: number | null;
  coePremium: number | null;
  hdbPrice: number | null;
  temperature: number | null;
  unemployment: number | null;
}

interface Props {
  initialData: TimelineYearData[];
}

export default function SingaporeStoryDashboard({ initialData }: Props) {
  if (!initialData || initialData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#FBF9F5] p-4 text-center">
        <h2 className="text-2xl font-serif text-[#243324] mb-2">Data Unavailable</h2>
        <p className="text-[#243324]/70 font-sans">
          We could not load the timeline data. Please try again later.
        </p>
      </div>
    );
  }

  const years = initialData.map(d => d.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const initialYear = years.includes(2025) ? 2025 : maxYear;
  
  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentYear(prev => {
          if (prev >= maxYear) {
            setIsPlaying(false);
            return maxYear;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, maxYear]);

  const currentData = useMemo(() => {
    return initialData.find(d => d.year === currentYear) || initialData[initialData.length - 1];
  }, [currentYear, initialData]);

  // Formatters
  const fCurrency = (val: number | null) => val ? `$${val.toLocaleString()}` : 'Not Available';
  const fNum = (val: number | null) => val ? val.toLocaleString() : 'Not Available';
  const fTemp = (val: number | null) => val ? `${val}°C` : 'Not Available';
  const fPct = (val: number | null) => val ? `${val}%` : 'Not Available';

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#FBF9F5]/90 backdrop-blur-xl border-b border-[#243324]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#243324]/60 hover:text-[#243324] transition-colors py-1.5 px-3 rounded-md shadow-sm border border-[#243324]/5 bg-white/50">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Portal</span>
            </Link>
            <div className="h-6 w-px bg-[#243324]/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-[#3B4D36]" />
              <h1 className="font-serif text-lg font-medium text-[#243324] tracking-tight">The Singapore Story</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 text-center">
        <h1 className="font-serif text-5xl md:text-6xl tracking-tight text-[#1F2B1D] mb-4">The Singapore Story</h1>
        <p className="text-lg text-[#243324]/70 max-w-2xl mx-auto font-light">
          Drag the timeline to explore how Singapore's macroeconomic indicators have evolved together over the last two decades.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Timeline Control */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-8 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('/merlion-bg.jpg')] bg-center bg-contain bg-no-repeat mix-blend-multiply" />
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col items-center gap-6">
              <motion.div 
                key={currentYear}
                initial={{ scale: 0.95, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl md:text-7xl font-serif text-[#1F2B1D] tracking-tighter font-bold"
              >
                {currentYear}
              </motion.div>
              
              <div className="w-full max-w-3xl flex items-center gap-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 rounded-full bg-[#1F2B1D] text-[#FBF9F5] hover:bg-[#1F2B1D]/80 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div className="flex-1 relative flex items-center">
                  <input 
                    type="range" 
                    min={minYear} 
                    max={maxYear} 
                    value={currentYear}
                    onChange={(e) => {
                      setCurrentYear(Number(e.target.value));
                      setIsPlaying(false);
                    }}
                    className="w-full h-2 bg-[#243324]/20 rounded-lg appearance-none cursor-pointer accent-[#1F2B1D]"
                  />
                  <div className="absolute -bottom-6 w-full flex justify-between text-xs text-[#243324]/50 font-medium">
                    <span>{minYear}</span>
                    <span>{maxYear}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Economy */}
          <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-amber-700/80">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Economy</span>
                </div>
              </div>
              <CardTitle className="font-serif text-xl text-amber-900">Median Income</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-4xl md:text-5xl font-serif text-amber-950 font-medium">
                {fCurrency(currentData.medianIncome)}
              </div>
              <div className="h-16 mt-4 w-full opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={initialData}>
                    <XAxis hide dataKey="year" type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                    <RechartsTooltip cursor={false} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} labelStyle={{ display: 'none' }} formatter={(val: any) => [fCurrency(val), 'Income']} />
                    <Line type="monotone" dataKey="medianIncome" stroke="#d97706" strokeWidth={2.5} dot={false} connectNulls={false} />
                    {currentData.medianIncome !== null && <ReferenceDot x={currentYear} y={currentData.medianIncome} r={5} fill="#d97706" stroke="#fff" strokeWidth={2} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card className="bg-rose-500/5 border-rose-500/20 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-rose-700/80 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Demographics</span>
              </div>
              <CardTitle className="font-serif text-xl text-rose-900">Total Fertility Rate</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-4xl md:text-5xl font-serif text-rose-950 font-medium">
                {currentData.birthRate ? currentData.birthRate.toFixed(2) : 'Not Available'}
              </div>
              <div className="h-16 mt-4 w-full opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={initialData}>
                    <XAxis hide dataKey="year" type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis hide domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                    <RechartsTooltip cursor={false} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} labelStyle={{ display: 'none' }} formatter={(val: any) => [Number(val).toFixed(2), 'TFR']} />
                    <Line type="monotone" dataKey="birthRate" stroke="#e11d48" strokeWidth={2.5} dot={false} connectNulls={false} />
                    {currentData.birthRate !== null && <ReferenceDot x={currentYear} y={currentData.birthRate} r={5} fill="#e11d48" stroke="#fff" strokeWidth={2} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Housing */}
          <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-emerald-700/80 mb-2">
                <Building2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Housing</span>
              </div>
              <CardTitle className="font-serif text-xl text-emerald-900">Average HDB Resale</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-4xl md:text-5xl font-serif text-emerald-950 font-medium">
                {fCurrency(currentData.hdbPrice)}
              </div>
              <div className="h-16 mt-4 w-full opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={initialData}>
                    <XAxis hide dataKey="year" type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis hide domain={['dataMin - 10000', 'dataMax + 10000']} />
                    <RechartsTooltip cursor={false} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} labelStyle={{ display: 'none' }} formatter={(val: any) => [fCurrency(val), 'Price']} />
                    <Line type="monotone" dataKey="hdbPrice" stroke="#059669" strokeWidth={2.5} dot={false} connectNulls={false} />
                    {currentData.hdbPrice !== null && <ReferenceDot x={currentYear} y={currentData.hdbPrice} r={5} fill="#059669" stroke="#fff" strokeWidth={2} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Transport */}
          <Card className="bg-blue-500/5 border-blue-500/20 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-blue-700/80 mb-2">
                <Car className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Transport</span>
              </div>
              <CardTitle className="font-serif text-xl text-blue-900">Average COE (Cat A)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-4xl md:text-5xl font-serif text-blue-950 font-medium">
                {fCurrency(currentData.coePremium)}
              </div>
              <div className="h-16 mt-4 w-full opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={initialData}>
                    <XAxis hide dataKey="year" type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis hide domain={['dataMin - 2000', 'dataMax + 2000']} />
                    <RechartsTooltip cursor={false} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} labelStyle={{ display: 'none' }} formatter={(val: any) => [fCurrency(val), 'Premium']} />
                    <Line type="monotone" dataKey="coePremium" stroke="#2563eb" strokeWidth={2.5} dot={false} connectNulls={false} />
                    {currentData.coePremium !== null && <ReferenceDot x={currentYear} y={currentData.coePremium} r={5} fill="#2563eb" stroke="#fff" strokeWidth={2} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Environment */}
          <Card className="bg-green-500/5 border-green-500/20 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-green-700/80 mb-2">
                <Leaf className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Environment</span>
              </div>
              <CardTitle className="font-serif text-xl text-green-900">Mean Temperature</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-4xl md:text-5xl font-serif text-green-950 font-medium">
                {fTemp(currentData.temperature)}
              </div>
              <div className="h-16 mt-4 w-full opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={initialData}>
                    <XAxis hide dataKey="year" type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                    <RechartsTooltip cursor={false} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} labelStyle={{ display: 'none' }} formatter={(val: any) => [fTemp(val), 'Temp']} />
                    <Line type="monotone" dataKey="temperature" stroke="#16a34a" strokeWidth={2.5} dot={false} connectNulls={false} />
                    {currentData.temperature !== null && <ReferenceDot x={currentYear} y={currentData.temperature} r={5} fill="#16a34a" stroke="#fff" strokeWidth={2} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Unemployment */}
          <Card className="bg-purple-500/5 border-purple-500/20 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-purple-700/80 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Careers</span>
              </div>
              <CardTitle className="font-serif text-xl text-purple-900">Unemployment Rate</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-4xl md:text-5xl font-serif text-purple-950 font-medium">
                {currentData.unemployment ? `${currentData.unemployment.toFixed(1)}%` : 'Not Available'}
              </div>
              <div className="h-16 mt-4 w-full opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={initialData}>
                    <XAxis hide dataKey="year" type="number" domain={['dataMin', 'dataMax']} />
                    <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <RechartsTooltip cursor={false} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} labelStyle={{ display: 'none' }} formatter={(val: any) => [`${val.toFixed(1)}%`, 'Unemployed']} />
                    <Line type="monotone" dataKey="unemployment" stroke="#9333ea" strokeWidth={2.5} dot={false} connectNulls={false} />
                    {currentData.unemployment !== null && <ReferenceDot x={currentYear} y={currentData.unemployment} r={5} fill="#9333ea" stroke="#fff" strokeWidth={2} />}
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
