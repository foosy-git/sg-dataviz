import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

interface DashboardFiltersProps {
  townsList: string[];
  flatTypesList: string[];
  selectedTowns: string[];
  setSelectedTowns: React.Dispatch<React.SetStateAction<string[]>>;
  selectedFlatTypes: string[];
  setSelectedFlatTypes: React.Dispatch<React.SetStateAction<string[]>>;
  minLease: number;
  setMinLease: React.Dispatch<React.SetStateAction<number>>;
  maxLease: number;
  setMaxLease: React.Dispatch<React.SetStateAction<number>>;
  startMonth: string;
  setStartMonth: React.Dispatch<React.SetStateAction<string>>;
  endMonth: string;
  setEndMonth: React.Dispatch<React.SetStateAction<string>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  minAvailableMonth?: string;
  maxAvailableMonth?: string;
}

function formatMonthLabel(monthStr: string) {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mIndex = parseInt(month, 10) - 1;
  return `${monthNames[mIndex] || month} ${year}`;
}

export default function DashboardFilters({
  townsList,
  flatTypesList,
  selectedTowns,
  setSelectedTowns,
  selectedFlatTypes,
  setSelectedFlatTypes,
  minLease,
  setMinLease,
  maxLease,
  setMaxLease,
  startMonth,
  setStartMonth,
  endMonth,
  setEndMonth,
  search,
  setSearch,
  minAvailableMonth = '2017-01',
  maxAvailableMonth = '2026-09'
}: DashboardFiltersProps) {

  const [localSearch, setLocalSearch] = useState(search);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [localSearch, search, setSearch]);

  const toggleTown = (town: string) => {
    setSelectedTowns(prev => prev.includes(town) ? prev.filter(t => t !== town) : [...prev, town]);
  };

  const toggleFlatType = (type: string) => {
    setSelectedFlatTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const clearFilters = () => {
    setSelectedTowns([]);
    setSelectedFlatTypes([]);
    setMinLease(0);
    setMaxLease(99);
    setStartMonth('');
    setEndMonth('');
    setLocalSearch('');
    setSearch('');
  };

  const handleMinLeaseChange = (val: number) => {
    setMinLease(val);
    if (val > maxLease) setMaxLease(val);
  };

  const handleMaxLeaseChange = (val: number) => {
    setMaxLease(val);
    if (val < minLease) setMinLease(val);
  };

  const handleStartMonthChange = (val: string) => {
    if (!val) {
      setStartMonth('');
      return;
    }
    let clamped = val;
    if (clamped < minAvailableMonth) clamped = minAvailableMonth;
    if (clamped > maxAvailableMonth) clamped = maxAvailableMonth;
    setStartMonth(clamped);
    if (endMonth && clamped > endMonth) setEndMonth(clamped);
  };

  const handleEndMonthChange = (val: string) => {
    if (!val) {
      setEndMonth('');
      return;
    }
    let clamped = val;
    if (clamped > maxAvailableMonth) clamped = maxAvailableMonth;
    if (clamped < minAvailableMonth) clamped = minAvailableMonth;
    setEndMonth(clamped);
    if (startMonth && clamped < startMonth) setStartMonth(clamped);
  };

  const hasFilters = selectedTowns.length > 0 || selectedFlatTypes.length > 0 || minLease > 0 || maxLease < 99 || startMonth !== '' || endMonth !== '' || search !== '';

  return (
    <Card className="shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-[#3B4D36]" />
              <h2 className="font-serif text-xl text-[#243324]">Parameters</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden p-2 text-[#243324]" 
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 px-3 text-xs font-sans font-medium border-[#243324]/20 text-[#243324] hover:bg-[#243324] hover:text-[#FBF9F5] hidden lg:block">Clear All</Button>
          )}
        </div>
        
        <div className={`space-y-8 ${isMobileOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="w-full max-w-xl">
            <Input 
              placeholder="Search block, street, model, town..." 
              value={localSearch} 
              onChange={(e) => setLocalSearch(e.target.value)} 
              className="border-[#243324]/20 focus-visible:ring-[#3B4D36] bg-white/50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <p className="text-sm font-sans font-semibold text-[#243324]">Date Range (Month-Year)</p>
                  <span className="text-[11px] text-[#243324]/60 font-medium">
                    Available: {formatMonthLabel(minAvailableMonth)} – {formatMonthLabel(maxAvailableMonth)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="w-full sm:w-44">
                    <Input 
                      type="month" 
                      min={minAvailableMonth}
                      max={endMonth || maxAvailableMonth}
                      value={startMonth} 
                      onChange={(e) => handleStartMonthChange(e.target.value)} 
                      className="w-full border-[#243324]/20 focus-visible:ring-[#3B4D36]"
                      title={`Select start month (${minAvailableMonth} to ${endMonth || maxAvailableMonth})`}
                    />
                  </div>
                  <span className="text-[#243324]/60 text-sm hidden sm:inline">to</span>
                  <span className="text-[#243324]/60 text-xs sm:hidden font-medium">to:</span>
                  <div className="w-full sm:w-44">
                    <Input 
                      type="month" 
                      min={startMonth || minAvailableMonth}
                      max={maxAvailableMonth}
                      value={endMonth} 
                      onChange={(e) => handleEndMonthChange(e.target.value)} 
                      className="w-full border-[#243324]/20 focus-visible:ring-[#3B4D36]"
                      title={`Select end month (${startMonth || minAvailableMonth} to ${maxAvailableMonth})`}
                    />
                  </div>
                </div>
                {/* Quick Presets within Available Bounds */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="text-[11px] text-[#243324]/50">Presets:</span>
                  <button
                    type="button"
                    onClick={() => { setStartMonth('2025-09'); setEndMonth(maxAvailableMonth); }}
                    className="text-[11px] px-2 py-0.5 rounded border border-[#243324]/15 bg-white/70 hover:bg-[#E8DCC4]/40 text-[#243324] transition-colors cursor-pointer"
                  >
                    Past 1Y
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStartMonth('2023-09'); setEndMonth(maxAvailableMonth); }}
                    className="text-[11px] px-2 py-0.5 rounded border border-[#243324]/15 bg-white/70 hover:bg-[#E8DCC4]/40 text-[#243324] transition-colors cursor-pointer"
                  >
                    Past 3Y
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStartMonth('2021-09'); setEndMonth(maxAvailableMonth); }}
                    className="text-[11px] px-2 py-0.5 rounded border border-[#243324]/15 bg-white/70 hover:bg-[#E8DCC4]/40 text-[#243324] transition-colors cursor-pointer"
                  >
                    Past 5Y
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStartMonth(minAvailableMonth); setEndMonth(maxAvailableMonth); }}
                    className="text-[11px] px-2 py-0.5 rounded border border-[#243324]/15 bg-white/70 hover:bg-[#E8DCC4]/40 text-[#243324] transition-colors cursor-pointer"
                  >
                    All Available
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-sans font-semibold text-[#243324]">Remaining Lease (Years)</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <Input type="number" min={0} max={99} value={minLease} onChange={(e) => handleMinLeaseChange(Number(e.target.value) || 0)} className="w-24 border-[#243324]/20 focus-visible:ring-[#3B4D36]" placeholder="Min" />
                  <span className="text-[#243324]/60 text-sm">to</span>
                  <Input type="number" min={0} max={99} value={maxLease} onChange={(e) => handleMaxLeaseChange(Number(e.target.value) || 99)} className="w-24 border-[#243324]/20 focus-visible:ring-[#3B4D36]" placeholder="Max" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-3">
                <p className="text-sm font-sans font-semibold text-[#243324]">Flat Types</p>
                <div className="flex flex-wrap gap-2">
                  {flatTypesList.map(type => (
                    <Badge 
                      key={type} 
                      className={`cursor-pointer transition-colors ${selectedFlatTypes.includes(type) ? "bg-[#243324] text-[#FBF9F5] hover:bg-[#3B4D36]" : "bg-[#E8DCC4]/40 text-[#243324] hover:bg-[#E8DCC4] border-transparent"}`}
                      onClick={() => toggleFlatType(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-sans font-semibold text-[#243324]">Towns / Estates</p>
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1 scrollbar-thin">
                  {townsList.map(town => (
                    <Badge 
                      key={town} 
                      variant="outline"
                      className={`cursor-pointer transition-colors ${selectedTowns.includes(town) ? "bg-[#243324] text-[#FBF9F5] border-[#243324] hover:bg-[#3B4D36]" : "border-[#243324]/20 text-[#243324] hover:bg-[#E8DCC4]/50"}`}
                      onClick={() => toggleTown(town)}
                    >
                      {town}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="w-full mt-6 h-8 text-xs font-sans font-medium border-[#243324]/20 text-[#243324] hover:bg-[#243324] hover:text-[#FBF9F5] lg:hidden">Clear All</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
