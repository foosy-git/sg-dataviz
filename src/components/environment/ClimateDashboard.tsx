'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Leaf, Thermometer, CloudRain } from 'lucide-react';
import DashboardNav from '@/components/ui/DashboardNav';
import DataSourcePopover from '@/components/ui/DataSourcePopover';
import { DATA_SOURCES } from '@/lib/dataSourceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ClimateDashboard({ initialData }: { initialData: any[] }) {
  
  // Calculate Yearly Averages to smooth out the noise of seasonal months
  const yearlyData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, any>();
    
    initialData.forEach(d => {
      if (!d.year) return;
      if (!map.has(d.year)) {
        map.set(d.year, { year: d.year, sum_temp: 0, count_temp: 0, sum_rain: 0, count_rain: 0 });
      }
      const entry = map.get(d.year);
      if (d.mean_temp !== undefined && !isNaN(d.mean_temp)) {
        entry.sum_temp += d.mean_temp;
        entry.count_temp += 1;
      }
      if (d.total_rainfall !== undefined && !isNaN(d.total_rainfall)) {
        entry.sum_rain += d.total_rainfall;
        entry.count_rain += 1;
      }
    });
    
    return Array.from(map.values()).map(entry => ({
      year: entry.year,
      avg_temp: entry.count_temp > 0 ? Number((entry.sum_temp / entry.count_temp).toFixed(2)) : null,
      avg_rain: entry.count_rain > 0 ? Number((entry.sum_rain / entry.count_rain).toFixed(2)) : null,
      total_rain: entry.count_rain > 0 ? Number(entry.sum_rain.toFixed(2)) : null,
    })).filter(d => Number(d.year) >= 1980); // Filter from 1980 onwards for a modern view
  }, [initialData]);

  // Seasonal Reality Check (Averages by Month)
  const seasonalData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, any>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach((m, i) => {
      const monthNum = String(i + 1).padStart(2, '0');
      map.set(monthNum, { monthName: m, sum_temp: 0, count_temp: 0, sum_rain: 0, count_rain: 0 });
    });

    initialData.forEach(d => {
      if (!d.month) return;
      const monthNum = d.month.substring(5, 7);
      const entry = map.get(monthNum);
      if (!entry) return;
      
      if (d.mean_temp !== undefined && !isNaN(d.mean_temp)) {
        entry.sum_temp += d.mean_temp;
        entry.count_temp += 1;
      }
      if (d.total_rainfall !== undefined && !isNaN(d.total_rainfall)) {
        entry.sum_rain += d.total_rainfall;
        entry.count_rain += 1;
      }
    });

    return Array.from(map.values()).map(entry => ({
      monthName: entry.monthName,
      avg_temp: entry.count_temp > 0 ? Number((entry.sum_temp / entry.count_temp).toFixed(2)) : null,
      avg_rain: entry.count_rain > 0 ? Number((entry.sum_rain / entry.count_rain).toFixed(2)) : null,
    }));
  }, [initialData]);

  // Decadal Warming Shifts
  const decadalData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, any>();
    
    initialData.forEach(d => {
      if (!d.year) return;
      const yearNum = Number(d.year);
      if (yearNum < 1980) return; // Start from 1980s
      
      const decade = `${Math.floor(yearNum / 10) * 10}s`;
      
      if (!map.has(decade)) {
        map.set(decade, { decade, sum_temp: 0, count_temp: 0 });
      }
      const entry = map.get(decade);
      
      if (d.mean_temp !== undefined && !isNaN(d.mean_temp)) {
        entry.sum_temp += d.mean_temp;
        entry.count_temp += 1;
      }
    });

    return Array.from(map.values()).map(entry => ({
      decade: entry.decade,
      avg_temp: entry.count_temp > 0 ? Number((entry.sum_temp / entry.count_temp).toFixed(2)) : null,
    }));
  }, [initialData]);

  // Latest Year Data
  const latestYearData = yearlyData[yearlyData.length - 1] || {};
  const previousYearData = yearlyData[yearlyData.length - 2] || {};

  return (
    <div className="min-h-screen bg-[#FBF9F5] pb-20">
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
                <Leaf className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif tracking-tight text-[#243324] hidden md:block">
                Climate & Weather
              </h1>
            </div>
          </div>
          <DashboardNav />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">

        <div className="mb-8">
          <div className="flex items-center gap-3.5 mb-4 flex-wrap">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#243324] tracking-tight">
              Singapore Climate Change
            </h1>
            <DataSourcePopover source={DATA_SOURCES.climate} />
          </div>
          <p className="text-lg text-[#243324]/70 max-w-2xl font-light">
            Track decades of surface air temperature and rainfall records to visualize the impact of climate change in Singapore up to {latestYearData.year}.
          </p>
        </div>

        {/* Top Metrics Cards */}
        <h2 className="text-lg font-serif mb-4 text-[#243324] border-b border-[#243324]/10 pb-2">
          Current Year: {latestYearData.year} YTD
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <Thermometer className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Temperature</span>
              </div>
              <div className="text-3xl font-serif text-[#243324] mb-2 flex items-baseline gap-1">
                {latestYearData.avg_temp}°C
              </div>
              <div className="text-sm font-medium text-[#243324]/60">
                Change from previous year: {latestYearData.avg_temp && previousYearData.avg_temp ? (latestYearData.avg_temp - previousYearData.avg_temp).toFixed(2) : 0}°C
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                <CloudRain className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Rainfall {latestYearData.year === '2026' ? '(Year-to-Date)' : ''}</span>
              </div>
              <div className="text-3xl font-serif text-[#243324] mb-2 flex items-baseline gap-1">
                {latestYearData.total_rain} <span className="text-sm font-sans font-normal text-gray-500">mm</span>
              </div>
              <div className="text-sm font-medium text-[#243324]/60">
                Monthly average: {latestYearData.avg_rain} mm
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8">
          
          {/* Temperature Trend */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-orange-50/30 pb-4">
              <CardTitle className="font-serif text-xl text-orange-900">Rising Surface Temperatures</CardTitle>
              <CardDescription>Yearly average mean temperature (°C) since 1980</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis 
                      dataKey="year" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      minTickGap={3}
                    />
                    <YAxis 
                      domain={['dataMin - 0.2', 'dataMax + 0.2']}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      tickFormatter={(v) => `${v}°C`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value}°C`, 'Avg Temp']}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_temp" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#f97316' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Rainfall Trend */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-blue-50/30 pb-4">
              <CardTitle className="font-serif text-xl text-blue-900">Historical Rainfall Volume</CardTitle>
              <CardDescription>Total cumulative rainfall (mm) per year</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis 
                      dataKey="year" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      minTickGap={3}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      tickFormatter={(v) => `${v}mm`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value} mm`, 'Total Rainfall']}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Bar dataKey="total_rain" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Decadal Warming Shifts */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-red-50/30 pb-4">
              <CardTitle className="font-serif text-xl text-red-900">Decadal Warming Shifts</CardTitle>
              <CardDescription>Average baseline temperature grouped by decade</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={decadalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis 
                      dataKey="decade" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                    />
                    <YAxis 
                      domain={['dataMin - 0.2', 'dataMax + 0.2']}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      tickFormatter={(v) => `${Number(v).toFixed(2)}°C`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value}°C`, 'Avg Temp']}
                      labelFormatter={(label) => `Decade: ${label}`}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="avg_temp" fill="#ef4444" radius={[4, 4, 0, 0]} name="Average Temperature" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-[#243324]/50 mt-2">
                The data shows a clear long-term increase in Singapore's average surface temperature over the last 40 years.
              </div>
            </CardContent>
          </Card>

          {/* Seasonal Reality Check (Monthly Averages) */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-indigo-50/30 pb-4">
              <CardTitle className="font-serif text-xl text-indigo-900">The Seasonal Reality Check</CardTitle>
              <CardDescription>Average temperature vs average rainfall mapped across the 12 calendar months (1980 - present)</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={seasonalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis 
                      dataKey="monthName" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                    />
                    <YAxis 
                      yAxisId="left"
                      domain={['auto', 'auto']}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#f97316' }} 
                      tickFormatter={(v) => `${v}°C`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#3b82f6' }} 
                      tickFormatter={(v) => `${v}mm`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="avg_temp" 
                      name="Avg Temperature"
                      stroke="#f97316" 
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#f97316' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="avg_rain" 
                      name="Avg Rainfall"
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#3b82f6' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-[#243324]/50 mt-2">
                May and June tend to be among the warmest months, while November and December typically experience the highest rainfall.
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
