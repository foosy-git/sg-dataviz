"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Baby, Wallet, Building2, Car, Leaf, LineChart as LineChartIcon, Play, Pause } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ReferenceLine } from 'recharts';
import Link from 'next/link';

export interface TimelineYearData {
  year: number;
  birthRate: number | null;
  medianIncome: number | null;
  coePremium: number | null;
  hdbPrice: number | null;
  temperature: number | null;
  employment: number | null;
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
  
  const [currentYear, setCurrentYear] = useState<number>(maxYear);
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
  const fCurrency = (val: number | null) => val ? `$${val.toLocaleString()}` : 'N.A.';
  const fNum = (val: number | null) => val ? val.toLocaleString() : 'N.A.';
  const fTemp = (val: number | null) => val ? `${val}°C` : 'N.A.';
  const fPct = (val: number | null) => val ? `${val}%` : 'N.A.';

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#FBF9F5]/90 backdrop-blur-xl border-b border-[#243324]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity bg-[#243324] text-[#FBF9F5] px-4 py-2 rounded-full text-sm font-medium">
            <LineChartIcon className="w-4 h-4" />
            <span>Back to Portal</span>
          </Link>
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
          <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-amber-700/80 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Economy</span>
              </div>
              <CardTitle className="font-serif text-xl text-amber-900">Median Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl md:text-5xl font-serif text-amber-950 font-medium">
                {fCurrency(currentData.medianIncome)}
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card className="bg-rose-500/5 border-rose-500/20 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-rose-700/80 mb-2">
                <Baby className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Demographics</span>
              </div>
              <CardTitle className="font-serif text-xl text-rose-900">Total Fertility Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl md:text-5xl font-serif text-rose-950 font-medium">
                {fNum(currentData.birthRate)}
              </div>
            </CardContent>
          </Card>

          {/* Housing */}
          <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-emerald-700/80 mb-2">
                <Building2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Housing</span>
              </div>
              <CardTitle className="font-serif text-xl text-emerald-900">Average HDB Resale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl md:text-5xl font-serif text-emerald-950 font-medium">
                {fCurrency(currentData.hdbPrice)}
              </div>
            </CardContent>
          </Card>

          {/* Transport */}
          <Card className="bg-blue-500/5 border-blue-500/20 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-blue-700/80 mb-2">
                <Car className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Transport</span>
              </div>
              <CardTitle className="font-serif text-xl text-blue-900">Average COE (Cat A)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl md:text-5xl font-serif text-blue-950 font-medium">
                {fCurrency(currentData.coePremium)}
              </div>
            </CardContent>
          </Card>

          {/* Environment */}
          <Card className="bg-green-500/5 border-green-500/20 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-green-700/80 mb-2">
                <Leaf className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Environment</span>
              </div>
              <CardTitle className="font-serif text-xl text-green-900">Mean Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl md:text-5xl font-serif text-green-950 font-medium">
                {fTemp(currentData.temperature)}
              </div>
            </CardContent>
          </Card>

          {/* Employment */}
          <Card className="bg-purple-500/5 border-purple-500/20 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-purple-700/80 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Careers</span>
              </div>
              <CardTitle className="font-serif text-xl text-purple-900">Graduate Employment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl md:text-5xl font-serif text-purple-950 font-medium">
                {fPct(currentData.employment)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Master Chart */}
        <Card className="bg-white border-[#243324]/10 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-[#243324]">Macro Convergence Index</CardTitle>
            <CardDescription className="text-base text-[#243324]/70">
              Visualizing the wider upward/downward trends. Each statistic uses its own proportional axis to maximize visibility of its relative movement over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={initialData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243324" opacity={0.1} vertical={false} />
                  <XAxis dataKey="year" stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }} tickLine={false} axisLine={false} />
                  
                  {/* Independent Y-Axes for maximum trend visibility */}
                  <YAxis yAxisId="income" hide domain={['dataMin - 500', 'dataMax + 500']} />
                  <YAxis yAxisId="tfr" hide domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                  <YAxis yAxisId="coe" hide domain={['dataMin - 5000', 'dataMax + 5000']} />
                  <YAxis yAxisId="hdb" hide domain={['dataMin - 20000', 'dataMax + 20000']} />
                  <YAxis yAxisId="temp" hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                  <YAxis yAxisId="emp" hide domain={['dataMin - 2', 'dataMax + 2']} />

                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#FBF9F5', borderColor: 'rgba(36, 51, 36, 0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#243324', fontWeight: 'bold', marginBottom: '8px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'Median Income' || name === 'COE Premium' || name === 'HDB Resale') return [fCurrency(value), name];
                      if (name === 'Temperature') return [fTemp(value), name];
                      if (name === 'Graduate Employment') return [fPct(value), name];
                      return [value, name];
                    }}
                  />
                  <ReferenceLine x={currentYear} stroke="#1F2B1D" strokeWidth={1} strokeDasharray="3 3" yAxisId="income" />
                  
                  {/* Lines for each metric with connectNulls=false */}
                  <Line yAxisId="income" type="monotone" dataKey="medianIncome" name="Median Income" stroke="#d97706" strokeWidth={3} dot={false} activeDot={{ r: 6 }} connectNulls={false} />
                  <Line yAxisId="tfr" type="monotone" dataKey="birthRate" name="Fertility Rate" stroke="#e11d48" strokeWidth={3} dot={false} activeDot={{ r: 6 }} connectNulls={false} />
                  <Line yAxisId="coe" type="monotone" dataKey="coePremium" name="COE Premium" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6 }} connectNulls={false} />
                  <Line yAxisId="hdb" type="monotone" dataKey="hdbPrice" name="HDB Resale" stroke="#059669" strokeWidth={3} dot={false} activeDot={{ r: 6 }} connectNulls={false} />
                  <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Temperature" stroke="#16a34a" strokeWidth={3} dot={false} strokeOpacity={0.4} activeDot={{ r: 4 }} connectNulls={false} />
                  <Line yAxisId="emp" type="monotone" dataKey="employment" name="Graduate Employment" stroke="#9333ea" strokeWidth={3} dot={false} activeDot={{ r: 6 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
              
              {/* Custom Legend */}
              <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-[#243324]/5">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-sm font-medium text-amber-900">Income</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /><span className="text-sm font-medium text-rose-900">Fertility</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600" /><span className="text-sm font-medium text-blue-900">COE</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-600" /><span className="text-sm font-medium text-emerald-900">HDB</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600 opacity-50" /><span className="text-sm font-medium text-green-900">Climate</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-600" /><span className="text-sm font-medium text-purple-900">Careers</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
