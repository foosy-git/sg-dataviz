import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Train, Users, Leaf, ArrowRight, LineChart, GraduationCap, Car, Activity, Baby, Wallet } from 'lucide-react';

import { fetchDatasetDates } from '@/lib/fetchDates';

export default async function Home() {
  const dates = await fetchDatasetDates();
  const dashboards = [
    {
      title: 'Household Income & Distribution',
      description: 'Analyze Singapore\'s household earnings, median vs average income, and observe the income gap across different deciles over the past 20+ years.',
      icon: Wallet,
      href: '/economy/income',
      status: dates.income,
      color: 'bg-amber-500/10 text-amber-700',
    },
    {
      title: 'Birth Rates & Fertility',
      description: 'Analyze Singapore\'s historical fertility trends and demographic shifts from 1960 onwards.',
      icon: Baby,
      href: '/demographics/birth-rates',
      status: dates.birth,
      color: 'bg-rose-500/10 text-rose-700',
    },
    {
      title: 'HDB Horizon',
      description: 'Interactive exploration of HDB resale data from 2017 onwards. Analyze market trends, estate values, and the impact of lease decay.',
      icon: Building2,
      href: '/hdb',
      status: dates.hdb,
      color: 'bg-emerald-500/10 text-emerald-700',
    },
    {
      title: 'COE Bidding Analytics',
      description: 'Track COE premium trends, quota supply, and bidding demand across all vehicle categories in Singapore from 2010 onwards.',
      icon: Car,
      href: '/transport/coe',
      status: dates.coe,
      color: 'bg-blue-500/10 text-blue-700',
    },
    {
      title: 'Education & Careers',
      description: 'Analyze graduate employment survey data, starting salaries, and employment rates across autonomous universities.',
      icon: GraduationCap,
      href: '/education/ges',
      status: dates.ges,
      color: 'bg-indigo-500/10 text-indigo-700',
    },
    {
      title: 'Climate Change & Weather',
      description: 'Track Singapore\'s rising surface temperatures, historical rainfall patterns, and long-term climate shifts.',
      icon: Leaf,
      href: '/environment/climate',
      status: dates.climate,
      color: 'bg-green-500/10 text-green-700',
    },

    {
      title: 'Economy & Employment',
      description: 'Tracking Singapore\'s overall and resident unemployment rates, illustrating the impact of economic cycles.',
      icon: LineChart,
      href: '/economy/employment',
      status: 'Data as of 2026',
      color: 'bg-purple-500/10 text-purple-700',
    },
    {
      title: 'Commuting to Work',
      description: 'Analyze how Singapore resident working persons (aged 15+) travel to work, broken down by transport mode and sex.',
      icon: Train,
      href: '/transport/commuting',
      status: 'Data as of 2020',
      color: 'bg-blue-500/10 text-blue-700',
    },
    {
      title: 'Air Quality & Haze',

      description: 'Real-time PSI & PM2.5 readings, regional air quality map, and historical haze crisis benchmarks.',
      icon: Activity,
      href: '/environment/air-quality',
      status: 'Live',
      color: 'bg-slate-500/10 text-slate-700',
    },
  ];

  return (
    <main className="min-h-screen bg-[#FBF9F5] text-[#243324] font-sans selection:bg-[#E8DCC4] selection:text-[#1F2B1D]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#FBF9F5]/90 backdrop-blur-xl border-b border-[#243324]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="w-6 h-6" />
            <span className="font-serif font-medium text-xl tracking-tight">SG DataViz</span>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Merlion Background - Constrained to top area */}
        <div 
          className="absolute inset-x-0 top-0 h-[400px] pointer-events-none z-0" 
          style={{
            backgroundImage: "url('/merlion-bg.jpg')",
            backgroundPosition: 'center top',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            opacity: 0.05,
            mixBlendMode: 'multiply'
          }}
        />
        <div className="relative z-10 space-y-6 mb-12 mt-8">
          <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-[#1F2B1D] max-w-4xl mx-auto leading-tight">
            Unlock the story of Singapore through open data.
          </h1>
          <p className="text-lg md:text-xl text-[#243324]/70 max-w-2xl mx-auto font-light leading-relaxed">
            A centralized portal for interactive, editorial-grade visualizations built on public datasets from data.gov.sg. 
            Explore trends, uncover insights, and understand the nation.
          </p>
        </div>


        
        {/* Featured Banner */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <Link href="/singapore-story">
            <Card className="bg-[#1F2B1D] text-[#FBF9F5] border-none shadow-xl hover:-translate-y-1 transition-transform overflow-hidden group">
              <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="text-left space-y-2">
                  <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">The Singapore Story</h2>
                  <p className="text-[#FBF9F5]/70 text-lg">A unified, interactive timeline of our nation's macroeconomic progression.</p>
                </div>
                <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-[#FBF9F5]/10 group-hover:bg-[#FBF9F5]/20 transition-colors">
                  <ArrowRight className="w-8 h-8" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Dashboard Grid */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {dashboards.map((dashboard, i) => (
            <Link key={i} href={dashboard.href} className={`group md:col-span-3 lg:col-span-2 ${dashboard.href === '#' ? 'pointer-events-none' : ''}`}>
              <Card className={`h-full transition-all duration-300 border-[#243324]/10 shadow-sm ${dashboard.href !== '#' ? 'hover:shadow-md hover:border-[#243324]/20 hover:-translate-y-1 bg-white' : 'bg-[#243324]/[0.02] opacity-80'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${dashboard.color}`}>
                      <dashboard.icon className="w-6 h-6" />
                    </div>
                    {dashboard.status && (
                      <Badge className="bg-[#243324] hover:bg-[#243324] text-white">
                        {dashboard.status}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="font-serif text-2xl group-hover:text-emerald-700 transition-colors">
                    {dashboard.title}
                  </CardTitle>
                  <CardDescription className="text-base text-[#243324]/70 leading-relaxed mt-2">
                    {dashboard.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`flex items-center gap-2 text-sm font-medium ${dashboard.href !== '#' ? 'text-[#243324]' : 'text-[#243324]/40'}`}>
                    {dashboard.href !== '#' ? 'Launch Dashboard' : 'In Development'}
                    <ArrowRight className={`w-4 h-4 ${dashboard.href !== '#' ? 'group-hover:translate-x-1 transition-transform' : ''}`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#243324]/5 py-12 text-center text-[#243324]/50 text-sm flex flex-col items-center justify-center gap-2">
        <p>© {new Date().getFullYear()} SG DataViz Portal. Not affiliated with the Singapore Government.</p>
        <p>Data sourced from <a href="https://data.gov.sg" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#243324]/80">data.gov.sg</a></p>
      </footer>
    </main>
  );
}
