'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, TrendingUp, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, BarChart, Bar, LabelList
} from 'recharts';

export default function GESDashboard({ initialData }: { initialData: any[] }) {
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const y = Array.from(new Set(initialData.map(d => String(d.year)))).sort().reverse();
    return y.length > 0 ? y[0] : '2024';
  });

  const years = useMemo(() => {
    const y = new Set(initialData.map(d => String(d.year)));
    return Array.from(y).sort().reverse();
  }, [initialData]);

  const yearData = useMemo(() => {
    return initialData.filter(d => String(d.year) === selectedYear);
  }, [initialData, selectedYear]);

  const getUniShort = (name: string) => {
    if (name.includes('National University of Singapore')) return 'NUS';
    if (name.includes('Nanyang Technological University')) return 'NTU';
    if (name.includes('Singapore Management University')) return 'SMU';
    if (name.includes('Singapore Institute of Technology')) return 'SIT';
    if (name.includes('Singapore University of Technology and Design')) return 'SUTD';
    if (name.includes('Singapore University of Social Sciences')) return 'SUSS';
    return name.split(' ')[0];
  };

  // Top Metrics
  const topMetrics = useMemo(() => {
    if (yearData.length === 0) return null;
    const withSalary = yearData.filter(d => d.gross_monthly_median !== null);
    
    // Sort to find top degree
    const sortedBySalary = [...withSalary].sort((a, b) => b.gross_monthly_median - a.gross_monthly_median);
    const topDegree = sortedBySalary[0];

    // Overall median across all degrees in that year
    const medianSalaries = withSalary.map(d => d.gross_monthly_median).sort((a, b) => a - b);
    const overallMedian = medianSalaries.length > 0 
      ? medianSalaries[Math.floor(medianSalaries.length / 2)] 
      : 0;

    const withEmp = yearData.filter(d => d.employment_rate_ft_perm !== null);
    const avgEmp = withEmp.length > 0 
      ? withEmp.reduce((sum, d) => sum + d.employment_rate_ft_perm, 0) / withEmp.length 
      : 0;

    return {
      topDegree,
      overallMedian,
      avgEmp
    };
  }, [yearData]);

  // Scatter Data: Emp Rate vs Salary
  const scatterData = useMemo(() => {
    return yearData
      .filter(d => d.employment_rate_ft_perm !== null && d.gross_monthly_median !== null)
      .map(d => ({
        ...d,
        id: `${d.university} - ${d.degree}`,
      }));
  }, [yearData]);

  // Trend Data: Avg Median Salary by Uni over years
  const trendData = useMemo(() => {
    const trendMap = new Map();
    // Pre-fill years
    years.slice().reverse().forEach(y => {
      trendMap.set(y, { year: y });
    });

    const unis = ['NUS', 'NTU', 'SMU', 'SIT', 'SUTD', 'SUSS'];
    
    // We group by year and university
    initialData.forEach(d => {
      if (d.gross_monthly_median === null) return;
      
      const yr = trendMap.get(String(d.year));
      if (!yr) return;

      const uniShort = getUniShort(d.university);

      if (!yr[uniShort]) yr[uniShort] = { sum: 0, count: 0 };
      yr[uniShort].sum += d.gross_monthly_median;
      yr[uniShort].count += 1;
    });

    const result = Array.from(trendMap.values()).map(yr => {
      const row: any = { year: yr.year };
      unis.forEach(u => {
        if (yr[u] && yr[u].count > 0) {
          row[u] = Math.round(yr[u].sum / yr[u].count);
        } else {
          row[u] = null;
        }
      });
      return row;
    });

    return result;
  }, [initialData, years]);

  // Top 10 High Paying
  const top10Data = useMemo(() => {
    if (yearData.length === 0) return [];
    return yearData
      .filter(d => d.gross_monthly_median !== null)
      .sort((a, b) => b.gross_monthly_median - a.gross_monthly_median)
      .slice(0, 10)
      .map(d => ({
        name: d.degree.length > 35 ? d.degree.substring(0, 35) + '...' : d.degree,
        fullDegree: d.degree,
        salary: d.gross_monthly_median,
        university: d.university
      }));
  }, [yearData]);

  // Salary Spread (25th to 75th Percentile) for top degrees
  const salarySpreadData = useMemo(() => {
    if (yearData.length === 0) return [];
    return yearData
      .filter(d => d.gross_mthly_25_percentile !== null && d.gross_mthly_75_percentile !== null && d.gross_monthly_median !== null)
      .sort((a, b) => b.gross_monthly_median - a.gross_monthly_median)
      .slice(0, 10)
      .map(d => ({
        name: d.degree.length > 35 ? d.degree.substring(0, 35) + '...' : d.degree,
        fullDegree: d.degree,
        min: d.gross_mthly_25_percentile,
        diff: d.gross_mthly_75_percentile - d.gross_mthly_25_percentile,
        median: d.gross_monthly_median
      }));
  }, [yearData]);

  // Degree Cluster Analysis
  const clusterData = useMemo(() => {
    if (yearData.length === 0) return [];
    
    const clusterDefs = [
      { name: 'Healthcare / Med', keywords: ['medicine', 'nursing', 'health', 'dental', 'pharmacy', 'therapy'] },
      { name: 'Law', keywords: ['law', 'jurisprudence', 'legal'] },
      { name: 'Computing / IT', keywords: ['computer science', 'computing', 'software', 'information', 'data', 'security'] },
      { name: 'Engineering', keywords: ['engineering', 'mechanical', 'electrical', 'civil', 'aerospace', 'mechatronics'] },
      { name: 'Business / Fin', keywords: ['business', 'finance', 'accountancy', 'accounting', 'economics', 'commerce', 'marketing'] },
      { name: 'Arts / Humanities', keywords: ['arts', 'humanities', 'sociology', 'psychology', 'history', 'communication', 'literature'] }
    ];
    
    const results = clusterDefs.map(c => ({ name: c.name, count: 0, sumSalary: 0, sumEmp: 0, median: 0, emp: 0 }));
    
    yearData.forEach(d => {
       const deg = d.degree.toLowerCase();
       for (const def of clusterDefs) {
          if (def.keywords.some(kw => deg.includes(kw))) {
             const idx = results.findIndex(r => r.name === def.name);
             if (d.gross_monthly_median) {
                results[idx].count++;
                results[idx].sumSalary += d.gross_monthly_median;
                results[idx].sumEmp += (d.employment_rate_ft_perm || 0);
             }
             break;
          }
       }
    });
    
    return results.filter(r => r.count > 0).map(r => ({
       name: r.name,
       median: Math.round(r.sumSalary / r.count),
       emp: Math.round(r.sumEmp / r.count)
    })).sort((a,b) => b.median - a.median);
  }, [yearData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (payload[0].payload.university && payload[0].payload.school) { // Scatter
        const d = payload[0].payload;
        return (
          <div className="bg-white/95 p-3 rounded-xl shadow-lg border border-[#243324]/10 text-sm max-w-xs">
            <div className="font-semibold text-[#243324]">{d.degree}</div>
            <div className="text-xs text-[#243324]/60 mb-2">{d.university}</div>
            <div>Salary: <span className="font-bold">${d.gross_monthly_median}</span></div>
            <div>FT Perm Rate: <span className="font-bold">{d.employment_rate_ft_perm}%</span></div>
          </div>
        );
      }
      return (
        <div className="bg-white/95 p-3 rounded-xl shadow-lg border border-[#243324]/10 text-sm">
          <div className="font-semibold text-[#243324]">{label}</div>
          {payload.map((p: any, i: number) => (
            <div key={i} style={{ color: p.color }}>
              {p.name}: ${p.value?.toLocaleString()}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen text-[#243324] font-sans pb-12">
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
                <GraduationCap className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-serif tracking-tight text-[#243324] hidden md:block">
                Education & Careers
              </h1>
            </div>
          </div>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        
        {/* Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-[#1F2B1D] mb-4">
              Graduate Employment Analysis
            </h1>
            <p className="text-lg text-[#243324]/70 max-w-2xl font-light">
              Explore starting salaries and employment rates of graduates from Singapore's autonomous universities. 
              Find the most lucrative degrees and analyze the "golden quadrant" of employability.
            </p>
          </div>
          
          <div className="w-full md:w-48 shrink-0">
            <label className="text-xs font-semibold text-[#243324]/60 uppercase tracking-wider mb-1.5 block">
              Survey Year
            </label>
            <Select value={selectedYear} onValueChange={(v) => v && setSelectedYear(v)}>
              <SelectTrigger className="w-full bg-white border-[#243324]/10 shadow-sm focus:ring-[#243324]/20">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Top Metrics Cards */}
        {topMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <Card className="bg-white border-[#243324]/5 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-medium text-sm uppercase tracking-wider">Median Salary</h3>
                </div>
                <div className="text-4xl font-serif text-[#1F2B1D]">${topMetrics.overallMedian.toLocaleString()}</div>
                <p className="text-sm text-[#243324]/50 mt-1">Unweighted across all degree programmes in {selectedYear}</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#243324]/5 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-sm uppercase tracking-wider">FT Employment Rate</h3>
                </div>
                <div className="text-4xl font-serif text-[#1F2B1D]">{topMetrics.avgEmp.toFixed(1)}%</div>
                <p className="text-sm text-[#243324]/50 mt-1">Unweighted average full-time permanent rate</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#243324]/5 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2 text-[#243324]/60">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-sm uppercase tracking-wider">Highest Paying Degree</h3>
                </div>
                <div className="text-2xl font-serif text-[#1F2B1D] leading-tight line-clamp-1" title={topMetrics.topDegree.degree}>
                  {topMetrics.topDegree.degree}
                </div>
                <p className="text-sm text-[#243324]/50 mt-1">
                  ${topMetrics.topDegree.gross_monthly_median.toLocaleString()} • {getUniShort(topMetrics.topDegree.university)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
          
          {/* Trend Chart */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4">
              <CardTitle className="font-serif text-xl">The Salary Race</CardTitle>
              <CardDescription>Average median starting salary by university over time</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                    <Line type="monotone" dataKey="SMU" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" dataKey="NUS" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" dataKey="NTU" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" dataKey="SUTD" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" dataKey="SIT" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                    <Line type="monotone" dataKey="SUSS" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Scatter Chart (Golden Quadrant) */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4">
              <CardTitle className="font-serif text-xl">The Golden Quadrant ({selectedYear})</CardTitle>
              <CardDescription>Employment Rate vs Median Salary by Degree</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Employment Rate" 
                      domain={['auto', 100]} 
                      tickFormatter={(v) => `${v}%`}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                      dy={10} 
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Median Salary" 
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => `$${v}`}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#24332480' }} 
                    />
                    <ZAxis range={[60, 60]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Scatter name="Degrees" data={scatterData.map(d => ({...d, x: Number(d.employment_rate_ft_perm), y: Number(d.gross_monthly_median)}))} fill="#10b981" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-[#243324]/50 mt-2">
                Top right quadrant = High Pay, High Employability (The Golden Quadrant)
              </div>
            </CardContent>
          </Card>

          {/* Top 10 Bar Chart */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col lg:col-span-2">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4">
              <CardTitle className="font-serif text-xl">Top 10 Highest Paying Degrees ({selectedYear})</CardTitle>
              <CardDescription>By gross monthly median salary</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10Data.map(d => ({ ...d, salary: Number(d.salary) }))} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#24332410" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#243324' }} width={250} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#24332405' }} />
                    <Bar dataKey="salary" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24}>
                      <LabelList dataKey="salary" position="right" formatter={(v: number) => `$${v}`} style={{ fontSize: 11, fill: '#243324' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Salary Spread */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4">
              <CardTitle className="font-serif text-xl">Salary Range Volatility</CardTitle>
              <CardDescription>25th to 75th percentile for top paying degrees</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salarySpreadData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#24332410" />
                    <XAxis type="number" domain={['dataMin - 1000', 'dataMax + 1000']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#243324' }} width={250} />
                    <Tooltip cursor={{ fill: '#24332405' }} />
                    <Bar dataKey="min" stackId="a" fill="transparent" barSize={16} />
                    <Bar dataKey="diff" stackId="a" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-[#243324]/50 mt-2">
                Bar shows the gap between bottom 25% and top 25% earners in the same degree.
              </div>
            </CardContent>
          </Card>

          {/* Degree Clusters */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4">
              <CardTitle className="font-serif text-xl">Faculty / Cluster Analysis</CardTitle>
              <CardDescription>Average median pay across discipline clusters</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clusterData} margin={{ top: 30, right: 10, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} angle={-45} textAnchor="end" />
                    <YAxis yAxisId="left" type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `$${v}`} />
                    <YAxis yAxisId="right" orientation="right" type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="median" name="Median Salary" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32}>
                      <LabelList dataKey="median" position="top" formatter={(v: number) => `$${v}`} style={{ fontSize: 11, fill: '#243324' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-[#243324]/50 mt-2">
                Grouped by keywords (e.g. Computing includes Computer Science, Information Systems, etc.)
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
      
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-center text-sm text-[#243324]/50">
        Data sourced from <a href="https://data.gov.sg" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#243324]">data.gov.sg</a>
      </footer>
    </div>
  );
}
