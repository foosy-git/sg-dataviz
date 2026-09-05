'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, TrendingUp, Briefcase, LayoutList, BarChart3 } from 'lucide-react';
import DashboardNav from '@/components/ui/DashboardNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, BarChart, Bar, LabelList
} from 'recharts';

export default function GESDashboard({ initialData }: { initialData: any[] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [top10ViewMode, setTop10ViewMode] = useState<'chart' | 'list'>('chart');
  const [salarySpreadViewMode, setSalarySpreadViewMode] = useState<'chart' | 'list'>('chart');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Trend Data: Avg Median Salary and FT Employment by Uni over years
  const trendData = useMemo(() => {
    const trendMap = new Map();
    // Pre-fill years
    years.slice().reverse().forEach(y => {
      trendMap.set(y, { year: y });
    });

    const unis = ['NUS', 'NTU', 'SMU', 'SIT', 'SUTD', 'SUSS'];
    
    // We group by year and university
    initialData.forEach(d => {
      const yr = trendMap.get(String(d.year));
      if (!yr) return;

      const uniShort = getUniShort(d.university);
      if (!yr[`${uniShort}_raw`]) yr[`${uniShort}_raw`] = { sum: 0, count: 0, empSum: 0, empCount: 0 };

      if (d.gross_monthly_median !== null) {
        yr[`${uniShort}_raw`].sum += d.gross_monthly_median;
        yr[`${uniShort}_raw`].count += 1;
      }
      
      if (d.employment_rate_ft_perm !== null) {
        yr[`${uniShort}_raw`].empSum += d.employment_rate_ft_perm;
        yr[`${uniShort}_raw`].empCount += 1;
      }
    });

    return Array.from(trendMap.values()).map(yr => {
      unis.forEach(u => {
        if (yr[`${u}_raw`]) {
          if (yr[`${u}_raw`].count > 0) yr[u] = Math.round(yr[`${u}_raw`].sum / yr[`${u}_raw`].count);
          if (yr[`${u}_raw`].empCount > 0) yr[`${u}_emp`] = Number((yr[`${u}_raw`].empSum / yr[`${u}_raw`].empCount).toFixed(1));
          delete yr[`${u}_raw`];
        }
      });
      return yr;
    });
  }, [initialData, years]);

  // Helper to clean degree titles (strip footnote symbols like #, ^, *)
  const cleanDegreeTitle = (deg: string) => {
    if (!deg) return '';
    return deg
      .replace(/[#*^]+$/g, '')
      .replace(/\s*#\s*$/g, '')
      .replace(/\s*\^\s*$/g, '')
      .trim();
  };

  // Helper to wrap long degree titles cleanly across lines for SVG YAxis
  const wrapDegreeTitle = (text: string, maxChars = 32, maxLines = 2): string[] => {
    if (!text) return [''];
    if (text.length <= maxChars) return [text];

    // Check for natural split at parenthesis e.g. "Bachelor of Computing (Computer Science)"
    const parenIdx = text.indexOf(' (');
    if (parenIdx !== -1 && maxLines >= 2) {
      const part1 = text.substring(0, parenIdx).trim();
      const part2 = text.substring(parenIdx).trim();
      if (part1.length <= maxChars + 6 && part2.length <= maxChars + 6) {
        return [part1, part2];
      }
    }

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!current) {
        current = word;
      } else if ((current + ' ' + word).length <= maxChars) {
        current += ' ' + word;
      } else {
        lines.push(current);
        current = word;
        if (lines.length === maxLines - 1) {
          const rest = words.slice(i).join(' ');
          lines.push(rest);
          return lines;
        }
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  // Top 10 High Paying
  const top10Data = useMemo(() => {
    if (yearData.length === 0) return [];
    return yearData
      .filter(d => d.gross_monthly_median !== null)
      .sort((a, b) => Number(b.gross_monthly_median) - Number(a.gross_monthly_median))
      .slice(0, 10)
      .map((d, index) => {
        const cleanTitle = cleanDegreeTitle(d.degree);
        const uni = d.university;
        const uniShort = getUniShort(uni);
        const salary = Number(d.gross_monthly_median);
        const empRate = d.employment_rate_ft_perm !== null ? Number(d.employment_rate_ft_perm) : null;
        return {
          rank: index + 1,
          name: cleanTitle,
          fullDegree: cleanTitle,
          rawDegree: d.degree,
          chartKey: `${cleanTitle} (${uniShort})`,
          salary,
          university: uni,
          uniShort,
          empRate
        };
      });
  }, [yearData]);

  // Salary Spread (25th to 75th Percentile) for top degrees
  const salarySpreadData = useMemo(() => {
    if (yearData.length === 0) return [];
    return yearData
      .filter(d => d.gross_mthly_25_percentile !== null && d.gross_mthly_75_percentile !== null && d.gross_monthly_median !== null)
      .sort((a, b) => Number(b.gross_monthly_median) - Number(a.gross_monthly_median))
      .slice(0, 10)
      .map((d, index) => {
        const cleanTitle = cleanDegreeTitle(d.degree);
        const uni = d.university;
        const uniShort = getUniShort(uni);
        const p25 = Number(d.gross_mthly_25_percentile);
        const p75 = Number(d.gross_mthly_75_percentile);
        const median = Number(d.gross_monthly_median);
        const diff = Math.max(0, p75 - p25);
        return {
          rank: index + 1,
          name: cleanTitle,
          fullDegree: cleanTitle,
          rawDegree: d.degree,
          chartKey: `${cleanTitle} (${uniShort})`,
          university: uni,
          uniShort,
          min: p25,
          diff,
          p25,
          p75,
          median
        };
      });
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

  // Custom multi-line SVG YAxis Tick component for degrees
  const DegreeYAxisTick = (props: any) => {
    const { x, y, payload, isMobile, data, tagColor = '#6366f1' } = props;
    const item = data && data[payload.index] ? data[payload.index] : null;
    const rawValue = payload.value || '';
    const title = item ? item.fullDegree : cleanDegreeTitle(rawValue.replace(/\s*\([A-Z]+\)$/, ''));
    const uni = item ? item.uniShort : '';

    const maxChars = isMobile ? 20 : 34;
    const maxLines = isMobile ? 3 : 2;
    const lines = wrapDegreeTitle(title, maxChars, maxLines);

    const totalLines = lines.length + (uni ? 1 : 0);
    const lineHeight = isMobile ? 11.5 : 13;
    const initialY = totalLines === 1 ? 4 : -((totalLines - 1) * lineHeight) / 2 + 3;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-8}
          y={initialY}
          textAnchor="end"
          className="select-none font-medium"
          style={{ fontSize: isMobile ? 9.5 : 11 }}
        >
          {lines.map((line: string, idx: number) => (
            <tspan
              key={idx}
              x={-8}
              dy={idx === 0 ? 0 : lineHeight}
              fill={idx === 0 ? '#1F2B1D' : '#243324E0'}
            >
              {line}
            </tspan>
          ))}
          {uni && (
            <tspan
              x={-8}
              dy={lineHeight}
              fill={tagColor}
              fontWeight={600}
              fontSize={isMobile ? 8.5 : 9.5}
            >
              {`[${uni}]`}
            </tspan>
          )}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      if (d.university && d.school) { // Scatter
        return (
          <div className="bg-white/95 p-3 rounded-xl shadow-lg border border-[#243324]/10 text-sm max-w-xs">
            <div className="font-semibold text-[#243324]">{d.degree}</div>
            <div className="text-xs text-[#243324]/60 mb-2">{d.university}</div>
            <div>Salary: <span className="font-bold">${d.gross_monthly_median}</span></div>
            <div>FT Perm Rate: <span className="font-bold">{d.employment_rate_ft_perm}%</span></div>
          </div>
        );
      }
      if (d.university && d.salary !== undefined) { // Top 10 Bar
        return (
          <div className="bg-white/95 p-3 rounded-xl shadow-lg border border-[#243324]/10 text-xs sm:text-sm max-w-xs space-y-1">
            <div className="font-semibold text-[#1F2B1D]">{d.fullDegree || d.name}</div>
            <div className="text-xs text-[#243324]/60 flex items-center gap-1.5 pb-1 border-b border-[#243324]/10">
              <span className="font-semibold text-[#6366f1]">[{d.uniShort}]</span>
              <span>{d.university}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[#243324]/80">Gross Monthly Median:</span>
              <span className="font-bold text-[#6366f1] text-sm">${d.salary?.toLocaleString()}</span>
            </div>
            {d.empRate !== null && d.empRate !== undefined && (
              <div className="flex justify-between items-center text-xs text-[#243324]/70">
                <span>FT Perm Employment:</span>
                <span className="font-semibold">{d.empRate}%</span>
              </div>
            )}
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

  const SalarySpreadTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white/95 p-3 rounded-xl shadow-lg border border-[#243324]/10 text-xs sm:text-sm max-w-xs space-y-1.5">
          <div className="font-semibold text-[#1F2B1D] leading-snug">{d.fullDegree || d.name}</div>
          <div className="text-[11px] text-[#243324]/70 flex items-center gap-1.5 pb-1 border-b border-[#243324]/10">
            <span className="font-semibold text-[#a855f7]">[{d.uniShort}]</span>
            <span className="truncate">{d.university}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[#243324]/80">
              <span>25th Percentile:</span>
              <span className="font-semibold text-[#243324]">${d.p25?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#243324]">
              <span>Median Starting:</span>
              <span className="font-bold text-[#a855f7]">${d.median?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#243324]/80">
              <span>75th Percentile:</span>
              <span className="font-semibold text-[#243324]">${d.p75?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-[#243324]/60 pt-1 border-t border-dashed border-[#243324]/10">
              <span>Interquartile Spread:</span>
              <span className="font-semibold text-[#243324]">${d.diff?.toLocaleString()}</span>
            </div>
          </div>
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
          <DashboardNav />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        
        {/* Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-[#1F2B1D] mb-4">
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

          {/* Employment Trend */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4">
              <CardTitle className="font-serif text-xl">Employment Stability</CardTitle>
              <CardDescription>Average Full-Time Permanent Employment Rate (%) over time</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#24332480' }} tickFormatter={(v) => `${v}%`} domain={['dataMin - 5', 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#FBF9F5', borderColor: 'rgba(36, 51, 36, 0.1)' }} formatter={(value: any, name: any) => [`${value}%`, (name || '').replace('_emp', '')]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} formatter={(value: string) => value.replace('_emp', '')} />
                    <Line type="monotone" dataKey="SMU_emp" name="SMU" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" dataKey="NUS_emp" name="NUS" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" dataKey="NTU_emp" name="NTU" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" dataKey="SUTD_emp" name="SUTD" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" dataKey="SIT_emp" name="SIT" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                    <Line type="monotone" dataKey="SUSS_emp" name="SUSS" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Scatter Chart (Golden Quadrant) */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col lg:col-span-2">
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
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="font-serif text-xl">Top 10 Highest Paying Degrees ({selectedYear})</CardTitle>
                <CardDescription>Ranked by gross monthly median salary</CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-[#243324]/5 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTop10ViewMode('chart')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    top10ViewMode === 'chart'
                      ? 'bg-[#243324] text-[#FBF9F5] shadow-xs font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Bar Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTop10ViewMode('list')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    top10ViewMode === 'list'
                      ? 'bg-[#243324] text-[#FBF9F5] shadow-xs font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Ranked List</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {top10ViewMode === 'chart' ? (
                <div style={{ height: isMobile ? 480 : 520, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={top10Data}
                      layout="vertical"
                      margin={{
                        top: 10,
                        right: isMobile ? 55 : 75,
                        left: isMobile ? 6 : 12,
                        bottom: 10
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#24332410" />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: isMobile ? 10 : 12, fill: '#24332480' }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="chartKey"
                        axisLine={false}
                        tickLine={false}
                        width={isMobile ? 140 : 280}
                        tick={(props) => (
                          <DegreeYAxisTick
                            {...props}
                            isMobile={isMobile}
                            data={top10Data}
                            tagColor="#6366f1"
                          />
                        )}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#24332405' }} />
                      <Bar dataKey="salary" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={isMobile ? 18 : 24}>
                        <LabelList
                          dataKey="salary"
                          position="right"
                          formatter={(v: any) => `$${Number(v)?.toLocaleString()}`}
                          style={{ fontSize: isMobile ? 10 : 11, fill: '#243324', fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="space-y-3">
                  {top10Data.map((item) => {
                    const maxSalary = top10Data[0]?.salary || 7000;
                    const pct = Math.round((item.salary / maxSalary) * 100);
                    return (
                      <div
                        key={item.rank}
                        className="p-3.5 rounded-xl border border-[#243324]/10 bg-white/70 hover:bg-white transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-[#243324]/10 text-xs font-bold text-[#1F2B1D]">
                              #{item.rank}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm sm:text-base text-[#1F2B1D] leading-snug">
                                {item.fullDegree}
                              </div>
                              <div className="text-xs text-[#243324]/60 flex items-center gap-1.5 mt-0.5">
                                <span className="font-semibold text-[#6366f1]">[{item.uniShort}]</span>
                                <span className="truncate">{item.university}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-base sm:text-lg font-bold text-[#6366f1]">
                              ${item.salary.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-[#243324]/60">median / mo</div>
                          </div>
                        </div>
                        <div className="w-full bg-[#243324]/5 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#6366f1] h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Salary Spread */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col lg:col-span-2">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="font-serif text-xl">Salary Range Volatility</CardTitle>
                <CardDescription>25th to 75th percentile spread for top paying degrees ({selectedYear})</CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-[#243324]/5 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSalarySpreadViewMode('chart')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    salarySpreadViewMode === 'chart'
                      ? 'bg-[#243324] text-[#FBF9F5] shadow-xs font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Bar Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSalarySpreadViewMode('list')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    salarySpreadViewMode === 'list'
                      ? 'bg-[#243324] text-[#FBF9F5] shadow-xs font-semibold'
                      : 'text-[#243324]/70 hover:text-[#243324]'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Ranked List</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {salarySpreadViewMode === 'chart' ? (
                <div>
                  <div style={{ height: isMobile ? 480 : 520, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salarySpreadData}
                        layout="vertical"
                        margin={{
                          top: 10,
                          right: isMobile ? 25 : 45,
                          left: isMobile ? 6 : 12,
                          bottom: 10
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#24332410" />
                        <XAxis
                          type="number"
                          domain={['dataMin - 500', 'dataMax + 500']}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: isMobile ? 10 : 12, fill: '#24332480' }}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <YAxis
                          type="category"
                          dataKey="chartKey"
                          axisLine={false}
                          tickLine={false}
                          width={isMobile ? 140 : 280}
                          tick={(props) => (
                            <DegreeYAxisTick
                              {...props}
                              isMobile={isMobile}
                              data={salarySpreadData}
                              tagColor="#a855f7"
                            />
                          )}
                        />
                        <Tooltip content={<SalarySpreadTooltip />} cursor={{ fill: '#24332405' }} />
                        <Bar dataKey="min" stackId="a" fill="transparent" barSize={isMobile ? 14 : 18} />
                        <Bar dataKey="diff" stackId="a" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={isMobile ? 14 : 18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center text-xs text-[#243324]/60 mt-3">
                    Purple floating bar shows the interquartile salary spread (25th to 75th percentile) for the top-paying degrees.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {salarySpreadData.map((item) => {
                    return (
                      <div
                        key={item.rank}
                        className="p-3.5 rounded-xl border border-[#243324]/10 bg-white/70 hover:bg-white transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-[#243324]/10 text-xs font-bold text-[#1F2B1D]">
                              #{item.rank}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm sm:text-base text-[#1F2B1D] leading-snug">
                                {item.fullDegree}
                              </div>
                              <div className="text-xs text-[#243324]/60 flex items-center gap-1.5 mt-0.5">
                                <span className="font-semibold text-[#a855f7]">[{item.uniShort}]</span>
                                <span className="truncate">{item.university}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm sm:text-base font-bold text-[#a855f7]">
                              ${item.median.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-[#243324]/60">median salary</div>
                          </div>
                        </div>

                        {/* Range metrics row */}
                        <div className="grid grid-cols-3 gap-2 bg-[#243324]/5 p-2.5 rounded-lg text-xs">
                          <div>
                            <div className="text-[#243324]/60 text-[11px]">25th %ile</div>
                            <div className="font-semibold text-[#243324]">${item.p25.toLocaleString()}</div>
                          </div>
                          <div className="text-center border-x border-[#243324]/10">
                            <div className="text-[#243324]/60 text-[11px]">Spread Range</div>
                            <div className="font-bold text-[#a855f7]">+${item.diff.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#243324]/60 text-[11px]">75th %ile</div>
                            <div className="font-semibold text-[#243324]">${item.p75.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Degree Clusters */}
          <Card className="bg-white border-[#243324]/5 shadow-sm overflow-hidden flex flex-col lg:col-span-2">
            <CardHeader className="border-b border-[#243324]/5 bg-gray-50/50 pb-4">
              <CardTitle className="font-serif text-xl">Faculty / Cluster Analysis</CardTitle>
              <CardDescription>Average median pay across discipline clusters</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clusterData} margin={isMobile ? { top: 25, right: 0, left: -20, bottom: 45 } : { top: 30, right: 10, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#24332410" />
                    <XAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12, fill: '#24332480' }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis yAxisId="left" type="number" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12, fill: '#24332480' }} tickFormatter={(v) => `$${v}`} />
                    <YAxis yAxisId="right" orientation="right" type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12, fill: '#24332480' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="median" name="Median Salary" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={isMobile ? 20 : 32}>
                      <LabelList dataKey="median" position="top" formatter={(v: any) => `$${v}`} style={{ fontSize: isMobile ? 9 : 11, fill: '#243324' }} />
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
    </div>
  );
}
