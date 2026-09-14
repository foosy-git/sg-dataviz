
'use client';

import Link from 'next/link';
import { ArrowLeft, Activity, Wind, AlertCircle, Factory, RotateCw, TrendingUp, TrendingDown, Minus, Clock, Layers } from 'lucide-react';
import DashboardNav from '@/components/ui/DashboardNav';
import DataSourcePopover from '@/components/ui/DataSourcePopover';
import { DATA_SOURCES } from '@/lib/dataSourceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, ReferenceLine
} from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { useState, useEffect, useCallback, useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AirQualityDashboard({ psiData: initialPsiData }: { psiData: { psi: any, pm25: any, psiHistory?: any[], pm25History?: any[] } }) {
  const [psiData, setPsiData] = useState(initialPsiData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);
  const [mapMetric, setMapMetric] = useState<'psi' | 'pm25'>('pm25');
  const [trendMetric, setTrendMetric] = useState<'pm25' | 'psi'>('pm25');
  const [trendTimeframe, setTrendTimeframe] = useState<'24h' | '3d' | '7d'>('24h');
  const [visibleSeries, setVisibleSeries] = useState<{ [key: string]: boolean }>({
    north: true,
    south: true,
    east: true,
    west: true,
    central: true,
    avg: true,
  });
  
  const updateTimestamp = psiData?.psi?.update_timestamp;
  const formattedTime = updateTimestamp ? new Date(updateTimestamp).toLocaleString('en-SG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N.A.';

  // Keep state synced if server sends newer props
  useEffect(() => {
    if (initialPsiData) setPsiData(initialPsiData);
  }, [initialPsiData]);

  // Client-side refresh directly from data.gov.sg (which supports CORS)
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const now = new Date();
      const sgTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const dateStrs: string[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(sgTime.getTime() - i * 24 * 60 * 60 * 1000);
        dateStrs.push(d.toISOString().split('T')[0]);
      }

      const psiPromises = dateStrs.map(ds => 
        fetch(`https://api.data.gov.sg/v1/environment/psi?date=${ds}`, { cache: 'no-store' })
          .then(r => r.ok ? r.json() : null).catch(() => null)
      );
      const pm25Promises = dateStrs.map(ds => 
        fetch(`https://api.data.gov.sg/v1/environment/pm25?date=${ds}`, { cache: 'no-store' })
          .then(r => r.ok ? r.json() : null).catch(() => null)
      );

      const [psiResults, pm25Results] = await Promise.all([
        Promise.all(psiPromises),
        Promise.all(pm25Promises)
      ]);

      const allPsiItems = psiResults.flatMap(r => r?.items || []);
      const allPm25Items = pm25Results.flatMap(r => r?.items || []);

      if (allPsiItems.length > 0 || allPm25Items.length > 0) {
        setPsiData((prev: any) => ({
          psi: allPsiItems[allPsiItems.length - 1] || prev?.psi,
          pm25: allPm25Items[allPm25Items.length - 1] || prev?.pm25,
          psiHistory: allPsiItems.length > 0 ? allPsiItems : prev?.psiHistory,
          pm25History: allPm25Items.length > 0 ? allPm25Items : prev?.pm25History
        }));
      }
    } catch (e) {
      console.error('Failed to client-refresh air quality data:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetch('/sg.geojson')
      .then(r => r.json())
      .then(d => setGeoData(d));

    // Guarantee that visiting the page always checks for the latest data immediately on mount
    refreshData();

    // Auto-refresh when tab gains focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic poll every 60 seconds
    const interval = setInterval(refreshData, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [refreshData]);
  
  const getPsiData = (val: number | null) => {
    if (val === null || val === undefined) {
      return { status: 'N.A.', color: 'text-slate-600', bg: 'bg-slate-500', border: 'border-slate-500', hex: '#64748b', pulse: false };
    }
    if (val <= 50) return { status: 'Good', color: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-500', hex: '#479b02', pulse: false };
    if (val <= 100) return { status: 'Moderate', color: 'text-sky-600', bg: 'bg-sky-500', border: 'border-sky-500', hex: '#006fa1', pulse: false };
    if (val <= 200) return { status: 'Unhealthy', color: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-500', hex: '#f59e0b', pulse: true };
    if (val <= 300) return { status: 'Very Unhealthy', color: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-500', hex: '#f97316', pulse: true };
    return { status: 'Hazardous', color: 'text-red-600', bg: 'bg-red-500', border: 'border-red-500', hex: '#d60000', pulse: true };
  };

  const getPm25Data = (val: number | null) => {
    if (val === null || val === undefined) {
      return { status: 'N.A.', band: null, color: 'text-slate-600', bg: 'bg-slate-500', border: 'border-slate-500', hex: '#64748b', pulse: false };
    }
    if (val <= 55) return { status: 'Normal', band: 'Band 1', color: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-500', hex: '#10b981', pulse: false };
    if (val <= 150) return { status: 'Elevated', band: 'Band 2', color: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-500', hex: '#f59e0b', pulse: false };
    if (val <= 250) return { status: 'High', band: 'Band 3', color: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-500', hex: '#f97316', pulse: true };
    return { status: 'Very High', band: 'Band 4', color: 'text-red-600', bg: 'bg-red-500', border: 'border-red-500', hex: '#ef4444', pulse: true };
  };

  // Helper to extract comprehensive stats across Singapore's 5 regions
  const getRegionalStats = (readings: Record<string, number> | null | undefined) => {
    if (!readings) return null;
    const regionKeys = ['north', 'south', 'east', 'west', 'central'] as const;
    const entries: { region: string; val: number }[] = [];
    for (const r of regionKeys) {
      const v = readings[r];
      if (typeof v === 'number' && !isNaN(v)) {
        entries.push({ region: r, val: v });
      }
    }
    if (entries.length === 0) return null;

    const vals = entries.map(e => e.val);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / vals.length);
    const highestEntry = entries.find(e => e.val === max);
    const highestRegionName = highestEntry 
      ? highestEntry.region.charAt(0).toUpperCase() + highestEntry.region.slice(1) 
      : '';

    return {
      min,
      max,
      avg,
      range: min === max ? `${min}` : `${min} – ${max}`,
      highestRegion: highestRegionName,
    };
  };

  const getNationalMax = (readings: any) => {
    if (!readings) return null;
    const vals = [readings.north, readings.south, readings.east, readings.west, readings.central].filter(v => v !== undefined && v !== null);
    if (vals.length === 0) return null;
    return Math.max(...vals);
  };

  const psiStats = getRegionalStats(psiData?.psi?.readings?.psi_twenty_four_hourly);
  const pm25Stats = getRegionalStats(psiData?.pm25?.readings?.pm25_one_hourly);

  const nationalPsiPeak = psiStats?.max ?? null;
  const nationalPsiAvg = psiStats?.avg ?? null;
  const nationalPm25Avg = pm25Stats?.avg ?? null;

  // Severity classifications based on islandwide average as requested
  const nationalInfo = getPsiData(nationalPsiAvg);
  const pm25Info = getPm25Data(nationalPm25Avg);

  const historicalHaze = [
    { name: '1997 Haze', psi: 226, year: 1997 },
    { name: '2013 Crisis', psi: 401, year: 2013 },
    { name: '2015 Haze', psi: 321, year: 2015 },
    { name: '2019 Haze', psi: 154, year: 2019 },
    { name: 'Current (Peak)', psi: nationalPsiPeak ?? 0, year: new Date().getFullYear() },
  ].sort((a, b) => a.year - b.year);

  // Approximate longitude/latitude for the 5 regions
  const regions = [
    { id: 'north', label: 'North', coords: [103.82, 1.43] },
    { id: 'west', label: 'West', coords: [103.71, 1.36] },
    { id: 'central', label: 'Central', coords: [103.82, 1.35] },
    { id: 'east', label: 'East', coords: [103.94, 1.35] },
    { id: 'south', label: 'South', coords: [103.82, 1.28] },
  ];

  // Radar chart data for pollutants. We also must calculate the max for these if national is missing.
  const pollutantData = [
    { subject: 'PM2.5', A: getNationalMax(psiData?.psi?.readings?.pm25_sub_index) ?? 0, fullMark: 200 },
    { subject: 'PM10', A: getNationalMax(psiData?.psi?.readings?.pm10_sub_index) ?? 0, fullMark: 200 },
    { subject: 'Ozone', A: getNationalMax(psiData?.psi?.readings?.o3_sub_index) ?? 0, fullMark: 200 },
    { subject: 'SO2', A: getNationalMax(psiData?.psi?.readings?.so2_sub_index) ?? 0, fullMark: 200 },
    { subject: 'CO', A: getNationalMax(psiData?.psi?.readings?.co_sub_index) ?? 0, fullMark: 200 },
  ];

  // Historical Air Quality Trend calculations (24h, 3d, 7d)
  const isTrendPsi = trendMetric === 'psi';

  const trendData = useMemo(() => {
    const activeHistory = isTrendPsi ? (psiData?.psiHistory || []) : (psiData?.pm25History || []);
    if (!activeHistory || activeHistory.length === 0) return [];

    const pointCount = trendTimeframe === '24h' ? 24 : trendTimeframe === '3d' ? 72 : 168;
    const sliced = activeHistory.slice(-pointCount);

    return sliced.map((item: any) => {
      const d = new Date(item.timestamp);
      const hourStr = d.toLocaleTimeString('en-SG', { hour: 'numeric', hour12: true });
      const dateStr = d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
      const weekdayStr = d.toLocaleDateString('en-SG', { weekday: 'short' });
      const fullTimeStr = `${weekdayStr}, ${dateStr}, ${hourStr}`;
      const dayHourStr = `${weekdayStr} ${hourStr}`;

      const readings = isTrendPsi ? item.readings?.psi_twenty_four_hourly : item.readings?.pm25_one_hourly;
      const north = typeof readings?.north === 'number' ? readings.north : null;
      const south = typeof readings?.south === 'number' ? readings.south : null;
      const east = typeof readings?.east === 'number' ? readings.east : null;
      const west = typeof readings?.west === 'number' ? readings.west : null;
      const central = typeof readings?.central === 'number' ? readings.central : null;

      const validVals = [north, south, east, west, central].filter((v): v is number => v !== null);
      const avg = validVals.length > 0 ? Math.round(validVals.reduce((a, b) => a + b, 0) / validVals.length) : null;
      const max = validVals.length > 0 ? Math.max(...validVals) : null;
      const min = validVals.length > 0 ? Math.min(...validVals) : null;

      return {
        time: hourStr,
        dayHour: dayHourStr,
        date: dateStr,
        fullTime: fullTimeStr,
        timestamp: item.timestamp,
        north,
        south,
        east,
        west,
        central,
        avg,
        max,
        min,
      };
    });
  }, [psiData?.psiHistory, psiData?.pm25History, isTrendPsi, trendTimeframe]);

  const trendStats = useMemo(() => {
    if (!trendData || trendData.length === 0) return null;
    
    let peakVal = -Infinity;
    let peakRegion = '';
    let peakTime = '';
    
    let lowVal = Infinity;
    let lowRegion = '';
    let lowTime = '';

    let totalSum = 0;
    let totalCount = 0;

    const regionKeys = ['north', 'south', 'east', 'west', 'central'] as const;
    const regionNames: Record<string, string> = {
      north: 'North',
      south: 'South',
      east: 'East',
      west: 'West',
      central: 'Central',
    };

    trendData.forEach(pt => {
      regionKeys.forEach(rk => {
        const val = pt[rk];
        if (typeof val === 'number') {
          totalSum += val;
          totalCount += 1;
          if (val > peakVal) {
            peakVal = val;
            peakRegion = regionNames[rk];
            peakTime = pt.fullTime;
          }
          if (val < lowVal) {
            lowVal = val;
            lowRegion = regionNames[rk];
            lowTime = pt.fullTime;
          }
        }
      });
    });

    const overallAvg = totalCount > 0 ? Math.round(totalSum / totalCount) : null;

    let trajectory: { direction: 'down' | 'up' | 'steady'; diff: number; text: string } = {
      direction: 'steady',
      diff: 0,
      text: 'Stable'
    };

    const compareOffset = trendTimeframe === '24h' ? 3 : trendTimeframe === '3d' ? 24 : 48;
    const compareLabel = trendTimeframe === '24h' ? 'last 3h' : trendTimeframe === '3d' ? 'vs 24h ago' : 'vs 48h ago';

    if (trendData.length > compareOffset) {
      const latestAvg = trendData[trendData.length - 1].avg;
      const pastAvg = trendData[trendData.length - 1 - compareOffset].avg;
      if (latestAvg !== null && pastAvg !== null) {
        const diff = latestAvg - pastAvg;
        if (diff <= -2) {
          trajectory = { direction: 'down', diff: Math.abs(diff), text: `Improving (-${Math.abs(diff)} ${compareLabel})` };
        } else if (diff >= 2) {
          trajectory = { direction: 'up', diff, text: `Rising (+${diff} ${compareLabel})` };
        } else {
          trajectory = { direction: 'steady', diff: 0, text: `Stable (${compareLabel})` };
        }
      }
    }

    return {
      peakVal: peakVal === -Infinity ? null : peakVal,
      peakRegion,
      peakTime,
      lowVal: lowVal === Infinity ? null : lowVal,
      lowRegion,
      lowTime,
      overallAvg,
      trajectory
    };
  }, [trendData, trendTimeframe]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTrendTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    const seriesConfig: Record<string, { label: string; color: string }> = {
      avg: { label: 'Islandwide Avg', color: '#1E293B' },
      north: { label: 'North', color: '#2563EB' },
      south: { label: 'South', color: '#059669' },
      east: { label: 'East', color: '#7C3AED' },
      west: { label: 'West', color: '#D97706' },
      central: { label: 'Central', color: '#DC2626' },
    };

    return (
      <div className="bg-white/95 backdrop-blur-md border border-[#243324]/15 rounded-xl p-3 shadow-xl text-xs min-w-[210px]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
          <div className="flex items-center gap-1.5 font-bold text-[#243324]">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{dataPoint.fullTime}</span>
          </div>
          {dataPoint.avg !== null && (
            <span className="text-[10px] font-bold bg-[#243324]/5 text-[#243324] px-1.5 py-0.5 rounded">
              Avg: {dataPoint.avg} {isTrendPsi ? '' : 'µg/m³'}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {Object.entries(seriesConfig).map(([key, cfg]) => {
            const val = dataPoint[key];
            if (val === null || val === undefined || !visibleSeries[key]) return null;
            const info = isTrendPsi ? getPsiData(val) : getPm25Data(val);
            const isAvg = key === 'avg';
            return (
              <div key={key} className={`flex items-center justify-between gap-2 py-0.5 ${isAvg ? 'font-bold border-b border-slate-100 pb-1 mb-1' : ''}`}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span className="text-slate-700">{cfg.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[#243324]">{val} {isTrendPsi ? '' : 'µg/m³'}</span>
                  <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${info.color} bg-slate-50`}>
                    {info.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif tracking-tight text-[#243324] hidden md:block">
                Air Quality
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/70 hover:bg-white text-xs font-medium text-[#243324]/80 hover:text-[#243324] border border-[#243324]/10 shadow-xs transition-all active:scale-95 disabled:opacity-50"
              title="Click to check for newest readings"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Updating...' : 'Refresh'}</span>
            </button>
            <div className="text-sm font-medium text-[#243324]/60 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Live (hourly)</span>
            </div>
            <DashboardNav />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div className="flex items-center gap-3.5 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#243324] tracking-tight">
                Air Quality &amp; Haze
              </h1>
              <DataSourcePopover source={DATA_SOURCES.airQuality} />
            </div>
            <div className="inline-flex items-center gap-2 bg-[#243324]/5 px-3 py-1.5 rounded-full text-sm font-medium text-[#243324]/70 border border-[#243324]/10 shadow-sm self-start md:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Data as of {formattedTime}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                    <Wind className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">24-hr PSI (Islandwide Range)</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-serif text-[#243324] mb-2 tracking-tight">
                    {psiStats?.range ?? 'N.A.'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={"text-base font-semibold " + nationalInfo.color}>
                      {nationalInfo.status}
                    </span>
                    {psiStats && (
                      <span className="text-xs text-[#243324]/70 bg-[#243324]/5 px-2 py-0.5 rounded-full">
                        Peak: {psiStats.highestRegion} ({psiStats.max}) · Avg: {psiStats.avg}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#243324]/50 font-light">
                    Official NEA 24-hr PSI range across Singapore's 5 regions. Use for planning tomorrow's activities.
                  </p>
                </div>
                {nationalInfo.pulse && (
                  <div className={"p-3 rounded-full bg-opacity-10 " + nationalInfo.bg.replace('bg-', 'bg-') + "/10"}>
                    <AlertCircle className={"w-8 h-8 " + nationalInfo.color} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-[#243324]/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                    <Factory className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">1-hr PM2.5 Concentration</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-serif text-[#243324] mb-2 flex items-baseline gap-2 tracking-tight">
                    {pm25Stats?.range ?? 'N.A.'} <span className="text-lg font-sans font-normal text-gray-500">µg/m³</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={"text-base font-semibold " + pm25Info.color}>
                      {pm25Info.status}
                    </span>
                    {pm25Stats && (
                      <span className="text-xs text-[#243324]/70 bg-[#243324]/5 px-2 py-0.5 rounded-full">
                        Peak: {pm25Stats.highestRegion} ({pm25Stats.max} µg/m³) · Avg: {pm25Stats.avg} µg/m³
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#243324]/50 font-light">
                    Islandwide range across 5 regions. Immediate guide for outdoor exercise & real-time haze.
                  </p>
                </div>
                {pm25Info.pulse && (
                  <div className={"p-3 rounded-full bg-opacity-10 " + pm25Info.bg.replace('bg-', 'bg-') + "/10"}>
                    <AlertCircle className={"w-8 h-8 " + pm25Info.color} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col w-full">
            <CardHeader className="border-b border-[#243324]/5 bg-slate-50/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="font-serif text-xl text-[#243324]">Regional Air Quality Map</CardTitle>
                  <CardDescription>
                    {mapMetric === 'psi'
                      ? 'Live 24-hr PSI readings across Singapore (North, South, East, West, Central) classified per haze.gov.sg'
                      : 'Live 1-hr PM2.5 concentrations (µg/m³) across Singapore (North, South, East, West, Central) with 4-band health advisories'}
                  </CardDescription>
                </div>
                
                {/* Metric Switcher Toggle */}
                <div className="inline-flex rounded-lg bg-slate-200/80 p-1 text-xs font-medium self-start sm:self-auto shadow-inner">
                  <button
                    type="button"
                    onClick={() => setMapMetric('pm25')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      mapMetric === 'pm25'
                        ? 'bg-white text-[#243324] shadow font-semibold'
                        : 'text-[#243324]/70 hover:text-[#243324]'
                    }`}
                  >
                    1-hr PM2.5
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMetric('psi')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      mapMetric === 'psi'
                        ? 'bg-white text-[#243324] shadow font-semibold'
                        : 'text-[#243324]/70 hover:text-[#243324]'
                    }`}
                  >
                    24-hr PSI
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative bg-[#e0f2fe]/20">
              <div className="relative w-full h-[380px] sm:h-[480px] md:h-[600px] overflow-hidden flex items-center justify-center">
                {!geoData && <div className="animate-pulse text-[#243324]/50">Loading Map...</div>}
                {geoData && (
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: 130000, center: [103.8198, 1.3521] }}
                    width={800} height={500}
                    style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                  >
                    <Geographies geography={geoData}>
                      {({ geographies }) => geographies.map((geo) => (
                        <Geography key={geo.rsmKey} geography={geo} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={0.5} />
                      ))}
                    </Geographies>
                    {regions.map((region) => {
                      const isPsi = mapMetric === 'psi';
                      const val = isPsi ? psiData?.psi?.readings?.psi_twenty_four_hourly?.[region.id] ?? null : psiData?.pm25?.readings?.pm25_one_hourly?.[region.id] ?? null;
                      const info = isPsi ? getPsiData(val) : getPm25Data(val);
                      const tagText = !isPsi && 'band' in info && info.band ? `${info.band} · ${info.status}` : info.status;
                      const pillWidth = Math.max(62, tagText.length * 6.5 + 16);
                      const pillX = -pillWidth / 2;
                      return (
                        <Marker key={region.id} coordinates={region.coords as [number, number]}>
                          <g className="cursor-pointer select-none">
                            {/* Region Label Pill */}
                            <rect
                              x="-34"
                              y="-52"
                              width="68"
                              height="22"
                              rx="11"
                              fill="rgba(255,255,255,0.98)"
                              stroke="#cbd5e1"
                              strokeWidth="1"
                              filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.1))"
                            />
                            <text
                              textAnchor="middle"
                              y="-37"
                              fontSize="11"
                              fontWeight="800"
                              fill="#1F2B1D"
                              letterSpacing="0.5"
                            >
                              {region.label.toUpperCase()}
                            </text>

                            {/* Pulse Glow for Unhealthy / High */}
                            {info.pulse && <circle r="36" fill={info.hex} opacity="0.25" />}

                            {/* Main Value Circle - significantly enlarged */}
                            <circle
                              r="28"
                              fill="#ffffff"
                              stroke={info.hex}
                              strokeWidth="4"
                              filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.18))"
                            />

                            {/* Metric Value */}
                            <text
                              textAnchor="middle"
                              y={isPsi ? 7 : 4}
                              fontSize={isPsi ? "19" : "18"}
                              fontWeight="800"
                              fill="#1F2B1D"
                            >
                              {val ?? '-'}
                            </text>

                            {/* Unit (for PM2.5) */}
                            {!isPsi && val !== null && (
                              <text
                                textAnchor="middle"
                                y="18"
                                fontSize="9.5"
                                fontWeight="700"
                                fill="#64748b"
                              >
                                µg/m³
                              </text>
                            )}

                            {/* Status Tag Pill below circle */}
                            <rect
                              x={pillX}
                              y="34"
                              width={pillWidth}
                              height="18"
                              rx="9"
                              fill="rgba(255,255,255,0.95)"
                              stroke="#cbd5e1"
                              strokeWidth="0.8"
                              filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.06))"
                            />
                            <text
                              textAnchor="middle"
                              y="46"
                              fontSize="9.5"
                              fontWeight="700"
                              fill={info.hex}
                            >
                              {tagText}
                            </text>
                          </g>
                        </Marker>
                      );
                    })}
                  </ComposableMap>
                )}
                <div className="hidden sm:block absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm border border-[#243324]/10 rounded-lg p-2.5 shadow-sm text-xs text-[#243324]/80 max-w-xl">
                  <div className="font-semibold text-[11px] mb-1.5 text-[#243324]">{mapMetric === 'psi' ? '24-hr PSI Bands (haze.gov.sg)' : '1-hr PM2.5 Bands (haze.gov.sg)'}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                    {mapMetric === 'psi' ? (
                      <>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#479b02' }} /> Good (0–50)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#006fa1' }} /> Moderate (51–100)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} /> Unhealthy (101–200)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316' }} /> Very Unhealthy (201–300)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#d60000' }} /> Hazardous (&gt;300)</span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Band 1: Normal (0–55)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Band 2: Elevated (56–150)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Band 3: High (151–250)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Band 4: Very High (≥251)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="sm:hidden border-t border-[#243324]/10 bg-white p-3">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-[#243324]/80">Regional Readings ({mapMetric === 'psi' ? 'PSI' : 'PM2.5'})</span><span className="text-[10px] text-slate-400">NEA Live</span></div>
                <div className="grid grid-cols-2 gap-2">
                  {regions.map((region) => {
                    const isPsi = mapMetric === 'psi';
                    const val = isPsi ? psiData?.psi?.readings?.psi_twenty_four_hourly?.[region.id] ?? null : psiData?.pm25?.readings?.pm25_one_hourly?.[region.id] ?? null;
                    const info = isPsi ? getPsiData(val) : getPm25Data(val);
                    const tagText = !isPsi && 'band' in info && info.band ? `${info.band} · ${info.status}` : info.status;
                    return (
                      <div key={region.id} className={`p-2.5 rounded-lg border bg-slate-50/50 flex items-center justify-between ${region.id === 'central' ? 'col-span-2' : ''}`}>
                        <div><div className="text-xs font-bold text-[#243324]">{region.label}</div><div className={`text-[10px] font-semibold ${info.color}`}>{tagText}</div></div>
                        <div className="text-right"><div className="text-lg font-bold font-serif text-[#243324] leading-tight">{val ?? '-'}</div><div className="text-[9px] text-slate-400 leading-none">{isPsi ? 'PSI' : 'µg/m³'}</div></div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-[#243324]/80">
                  <div className="font-semibold text-[10px] mb-1.5 text-[#243324]">{mapMetric === 'psi' ? '24-hr PSI Bands (haze.gov.sg)' : '1-hr PM2.5 Bands (haze.gov.sg)'}</div>
                  <div className="flex flex-wrap gap-x-2.5 gap-y-1">
                    {mapMetric === 'psi' ? (
                      <>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#479b02' }} /> Good (0–50)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#006fa1' }} /> Moderate (51–100)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} /> Unhealthy (101–200)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f97316' }} /> Very Unhealthy (201–300)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#d60000' }} /> Hazardous (&gt;300)</span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Band 1: Normal (0–55)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Band 2: Elev (56–150)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Band 3: High (151–250)</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Band 4: Very High (≥251)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Air Quality Trend Analysis Card */}
        <div className="mb-12">
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col w-full">
            <CardHeader className="border-b border-[#243324]/5 bg-slate-50/50 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-serif text-xl text-[#243324]">Air Quality Historical Trend</CardTitle>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {trendTimeframe === '24h' ? 'Rolling 24h' : trendTimeframe === '3d' ? 'Past 3 Days' : 'Past 7 Days'}
                    </span>
                  </div>
                  <CardDescription className="mt-1">
                    Hourly {isTrendPsi ? '24-hr PSI readings' : '1-hr PM2.5 concentration (µg/m³)'} across all Singapore regions over the {trendTimeframe === '24h' ? 'past 24 hours' : trendTimeframe === '3d' ? 'past 3 days' : 'past 7 days'}.
                  </CardDescription>
                </div>

                {/* Selectors: Timeframe & Metric */}
                <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                  {/* Timeframe Selector */}
                  <div className="inline-flex rounded-lg bg-slate-200/80 p-1 text-xs font-medium shadow-inner">
                    <button
                      type="button"
                      onClick={() => setTrendTimeframe('24h')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        trendTimeframe === '24h'
                          ? 'bg-white text-[#243324] shadow font-semibold'
                          : 'text-[#243324]/70 hover:text-[#243324]'
                      }`}
                    >
                      24 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendTimeframe('3d')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        trendTimeframe === '3d'
                          ? 'bg-white text-[#243324] shadow font-semibold'
                          : 'text-[#243324]/70 hover:text-[#243324]'
                      }`}
                    >
                      3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendTimeframe('7d')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        trendTimeframe === '7d'
                          ? 'bg-white text-[#243324] shadow font-semibold'
                          : 'text-[#243324]/70 hover:text-[#243324]'
                      }`}
                    >
                      7 Days
                    </button>
                  </div>

                  {/* Metric Switcher Toggle */}
                  <div className="inline-flex rounded-lg bg-slate-200/80 p-1 text-xs font-medium shadow-inner">
                    <button
                      type="button"
                      onClick={() => setTrendMetric('pm25')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        trendMetric === 'pm25'
                          ? 'bg-white text-[#243324] shadow font-semibold'
                          : 'text-[#243324]/70 hover:text-[#243324]'
                      }`}
                    >
                      1-hr PM2.5
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendMetric('psi')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        trendMetric === 'psi'
                          ? 'bg-white text-[#243324] shadow font-semibold'
                          : 'text-[#243324]/70 hover:text-[#243324]'
                      }`}
                    >
                      24-hr PSI
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* KPI Summary Strip */}
              {trendStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  <div className="bg-[#243324]/[0.03] border border-[#243324]/10 rounded-xl p-3">
                    <div className="text-[11px] font-semibold text-[#243324]/60 uppercase tracking-wider mb-1">
                      {trendTimeframe === '24h' ? '24-hr' : trendTimeframe === '3d' ? '3-Day' : '7-Day'} Islandwide Avg
                    </div>
                    <div className="text-2xl font-serif font-bold text-[#243324] flex items-baseline gap-1">
                      {trendStats.overallAvg ?? 'N.A.'}
                      <span className="text-xs font-sans font-normal text-slate-500">
                        {isTrendPsi ? 'PSI' : 'µg/m³'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Mean across all 5 regions
                    </div>
                  </div>

                  <div className="bg-red-500/[0.04] border border-red-500/15 rounded-xl p-3">
                    <div className="text-[11px] font-semibold text-red-700/80 uppercase tracking-wider mb-1">
                      {trendTimeframe === '24h' ? '24-hr' : trendTimeframe === '3d' ? '3-Day' : '7-Day'} Peak Reading
                    </div>
                    <div className="text-2xl font-serif font-bold text-red-700 flex items-baseline gap-1">
                      {trendStats.peakVal ?? 'N.A.'}
                      <span className="text-xs font-sans font-normal text-red-500">
                        {isTrendPsi ? 'PSI' : 'µg/m³'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">
                      {trendStats.peakRegion ? `${trendStats.peakRegion} (${trendStats.peakTime})` : 'N.A.'}
                    </div>
                  </div>

                  <div className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl p-3">
                    <div className="text-[11px] font-semibold text-emerald-700/80 uppercase tracking-wider mb-1">
                      {trendTimeframe === '24h' ? '24-hr' : trendTimeframe === '3d' ? '3-Day' : '7-Day'} Cleanest Reading
                    </div>
                    <div className="text-2xl font-serif font-bold text-emerald-700 flex items-baseline gap-1">
                      {trendStats.lowVal ?? 'N.A.'}
                      <span className="text-xs font-sans font-normal text-emerald-500">
                        {isTrendPsi ? 'PSI' : 'µg/m³'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">
                      {trendStats.lowRegion ? `${trendStats.lowRegion} (${trendStats.lowTime})` : 'N.A.'}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                    <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      {trendTimeframe === '24h' ? 'Recent Trajectory' : trendTimeframe === '3d' ? '3-Day Trajectory' : '7-Day Trajectory'}
                    </div>
                    <div className="flex items-center gap-1.5 text-base font-bold text-[#243324] mt-1">
                      {trendStats.trajectory.direction === 'down' ? (
                        <TrendingDown className="w-5 h-5 text-emerald-600" />
                      ) : trendStats.trajectory.direction === 'up' ? (
                        <TrendingUp className="w-5 h-5 text-red-600" />
                      ) : (
                        <Minus className="w-5 h-5 text-slate-500" />
                      )}
                      <span className="text-sm font-semibold truncate">{trendStats.trajectory.text}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {trendTimeframe === '24h' ? 'Based on last 3 hours' : trendTimeframe === '3d' ? 'Compared to 24h ago' : 'Compared to 48h ago'}
                    </div>
                  </div>
                </div>
              )}

              {/* Region Filter Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#243324]/70 mr-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" /> Series:
                  </span>
                  {[
                    { key: 'avg', label: 'Islandwide (Avg)', color: '#1E293B' },
                    { key: 'north', label: 'North', color: '#2563EB' },
                    { key: 'south', label: 'South', color: '#059669' },
                    { key: 'east', label: 'East', color: '#7C3AED' },
                    { key: 'west', label: 'West', color: '#D97706' },
                    { key: 'central', label: 'Central', color: '#DC2626' },
                  ].map(s => {
                    const active = visibleSeries[s.key];
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setVisibleSeries(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                          active
                            ? 'bg-white shadow-xs border-slate-300 text-slate-900'
                            : 'bg-slate-100/70 border-transparent text-slate-400 hover:text-slate-600 line-through'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: active ? s.color : '#cbd5e1' }}
                        />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setVisibleSeries({ north: true, south: true, east: true, west: true, central: true, avg: true })}
                    className="text-xs text-[#243324]/60 hover:text-[#243324] underline underline-offset-2"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setVisibleSeries({ north: false, south: false, east: false, west: false, central: false, avg: true })}
                    className="text-xs text-[#243324]/60 hover:text-[#243324] underline underline-offset-2"
                  >
                    Avg Only
                  </button>
                </div>
              </div>

              {/* Chart Container */}
              <div style={{ height: 380, width: '100%' }}>
                {trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    Loading trend data...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                      <XAxis
                        dataKey={trendTimeframe === '24h' ? 'time' : trendTimeframe === '3d' ? 'dayHour' : 'date'}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={trendTimeframe === '24h' ? 'preserveStartEnd' : trendTimeframe === '3d' ? 8 : 23}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        domain={[0, 'auto']}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTrendTooltip />} />

                      {/* Reference lines for official thresholds from haze.gov.sg */}
                      {isTrendPsi ? (
                        <>
                          <ReferenceLine y={50} stroke="#479b02" strokeDasharray="4 4" strokeWidth={1.5} />
                          <ReferenceLine y={100} stroke="#006fa1" strokeDasharray="4 4" strokeWidth={1.5} />
                          <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
                        </>
                      ) : (
                        <>
                          <ReferenceLine y={55} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
                          <ReferenceLine y={150} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
                          <ReferenceLine y={250} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1.5} />
                        </>
                      )}

                      {/* Regional lines */}
                      {visibleSeries.north && (
                        <Line
                          type="monotone"
                          dataKey="north"
                          name="North"
                          stroke="#2563EB"
                          strokeWidth={2}
                          dot={trendTimeframe === '24h' ? { r: 2, fill: '#2563EB' } : false}
                          activeDot={{ r: 5 }}
                        />
                      )}
                      {visibleSeries.south && (
                        <Line
                          type="monotone"
                          dataKey="south"
                          name="South"
                          stroke="#059669"
                          strokeWidth={2}
                          dot={trendTimeframe === '24h' ? { r: 2, fill: '#059669' } : false}
                          activeDot={{ r: 5 }}
                        />
                      )}
                      {visibleSeries.east && (
                        <Line
                          type="monotone"
                          dataKey="east"
                          name="East"
                          stroke="#7C3AED"
                          strokeWidth={2}
                          dot={trendTimeframe === '24h' ? { r: 2, fill: '#7C3AED' } : false}
                          activeDot={{ r: 5 }}
                        />
                      )}
                      {visibleSeries.west && (
                        <Line
                          type="monotone"
                          dataKey="west"
                          name="West"
                          stroke="#D97706"
                          strokeWidth={2}
                          dot={trendTimeframe === '24h' ? { r: 2, fill: '#D97706' } : false}
                          activeDot={{ r: 5 }}
                        />
                      )}
                      {visibleSeries.central && (
                        <Line
                          type="monotone"
                          dataKey="central"
                          name="Central"
                          stroke="#DC2626"
                          strokeWidth={2}
                          dot={trendTimeframe === '24h' ? { r: 2, fill: '#DC2626' } : false}
                          activeDot={{ r: 5 }}
                        />
                      )}
                      {visibleSeries.avg && (
                        <Line
                          type="monotone"
                          dataKey="avg"
                          name="Islandwide Avg"
                          stroke="#1E293B"
                          strokeWidth={3}
                          strokeDasharray="4 4"
                          dot={trendTimeframe === '24h' ? { r: 3, fill: '#1E293B' } : false}
                          activeDot={{ r: 6 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Threshold indicator reference bar at bottom of chart */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-1 font-semibold text-[#243324]">
                  haze.gov.sg Banding:
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
                  {isTrendPsi ? (
                    <>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-[#479b02] inline-block rounded" /> Good (0–50)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-[#006fa1] inline-block rounded" /> Moderate (51–100)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-amber-500 inline-block rounded" /> Unhealthy (101–200)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-orange-500 inline-block rounded" /> Very Unhealthy (201–300)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-red-500 inline-block rounded" /> Hazardous (&gt;300)</span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-emerald-500 inline-block rounded" /> Normal (0–55 µg/m³)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-amber-500 inline-block rounded" /> Elevated (56–150 µg/m³)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-orange-500 inline-block rounded" /> High (151–250 µg/m³)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-red-500 inline-block rounded" /> Very High (≥251 µg/m³)</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col lg:col-span-1">
            <CardHeader className="border-b border-[#243324]/5 bg-purple-50/30 pb-4">
              <CardTitle className="font-serif text-xl text-purple-900">Pollutant Sub-Indices</CardTitle>
              <CardDescription>Breakdown of individual pollutant components driving the PSI</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={pollutantData}>
                    <PolarGrid stroke="#24332420" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#24332480', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 20']} tick={{ fill: '#24332440', fontSize: 10 }} />
                    <Radar name="Sub-Index" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col lg:col-span-1">
            <CardHeader className="border-b border-[#243324]/5 bg-orange-50/30 pb-4">
              <CardTitle className="font-serif text-xl text-orange-900">Historical Haze Benchmarks</CardTitle>
              <CardDescription>Comparing today's PSI against the worst crises</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalHaze} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#24332405' }}
                      formatter={(value: any) => [value, 'PSI']}
                    />
                    <Bar dataKey="psi" radius={[4, 4, 0, 0]}>
                      {
                        historicalHaze.map((entry, index) => {
                          if (entry.name === 'Current') {
                            return <Cell key={'cell-' + index} fill="#3b82f6" />;
                          }
                          return <Cell key={'cell-' + index} fill="#f97316" />;
                        })
                      }
                    </Bar>
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
