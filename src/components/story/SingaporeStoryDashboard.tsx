"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Baby, Wallet, Building2, Car, Leaf, LineChart as LineChartIcon, Play, Pause } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ReferenceLine } from 'recharts';
import Link from 'next/link';

type TimelineYearData = {
  year: number;
  birthRate: number | null;
  medianIncome: number | null;
  coePremium: number | null;
  hdbPrice: number | null;
  temperature: number | null;
};

interface Props {
  initialData: TimelineYearData[];
}

export default function SingaporeStoryDashboard({ initialData }: Props) {
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
      }, 800); // 800ms per year
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

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#FBF9F5]/90 backdrop-blur-xl border-b border-[#243324]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <LineChartIcon className="w-6 h-6 text-[#243324]" />
            <span className="font-serif font-medium text-xl tracking-tight text-[#243324]">SG DataViz</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16 text-center">
        <h1 className="font-serif text-5xl md:text-6xl tracking-tight text-[#1F2B1D] mb-4">The Singapore Story</h1>
        <p className="text-lg text-[#243324]/70 max-w-2xl mx-auto font-light">
          Drag the timeline to explore how Singapore's macroeconomic indicators have evolved together over the last two decades.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Timeline Control */}
        <Card className="bg-white border-[#243324]/10 shadow-sm mb-12 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('/merlion-bg.jpg')] bg-center bg-contain bg-no-repeat mix-blend-multiply" />
          <CardContent className="p-8 md:p-12 relative z-10">
            <div className="flex flex-col items-center gap-8">
              <motion.div 
                key={currentYear}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl md:text-9xl font-serif text-[#1F2B1D] tracking-tighter font-bold"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
          <Card className="bg-green-500/5 border-green-500/20 shadow-sm md:col-span-2 lg:col-span-1">
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
        </div>

        {/* Master Chart */}
        <Card className="bg-white border-[#243324]/10 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-[#243324]">Historical Context</CardTitle>
            <CardDescription className="text-base">Median Household Income over time, highlighting the currently selected year.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={initialData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243324" opacity={0.1} vertical={false} />
                  <XAxis dataKey="year" stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#243324" opacity={0.5} tick={{ fill: '#243324', opacity: 0.7, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} width={80} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#FBF9F5', borderColor: 'rgba(36, 51, 36, 0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#243324', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <ReferenceLine x={currentYear} stroke="#1F2B1D" strokeWidth={2} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="medianIncome" name="Median Income" stroke="#d97706" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
