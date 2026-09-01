import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';
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
  setSearch
}: DashboardFiltersProps) {

  const [localSearch, setLocalSearch] = useState(search);

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
    setStartMonth('2017-01');
    setEndMonth('2030-12');
    setLocalSearch('');
    setSearch('');
  };

  const hasFilters = selectedTowns.length > 0 || selectedFlatTypes.length > 0 || minLease > 0 || maxLease < 99 || startMonth !== '2017-01' || endMonth !== '2030-12' || search !== '';

  return (
    <Card className="shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-[#3B4D36]" />
            <h2 className="font-serif text-xl text-[#243324]">Parameters</h2>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 px-3 text-xs font-sans font-medium border-[#243324]/20 text-[#243324] hover:bg-[#243324] hover:text-[#FBF9F5]">Clear All</Button>
          )}
        </div>
        
        <div className="mb-8 w-full max-w-xl">
          <Input 
            placeholder="Search block, street, model, town..." 
            value={localSearch} 
            onChange={(e) => setLocalSearch(e.target.value)} 
            className="border-[#243324]/20 focus-visible:ring-[#3B4D36] bg-white/50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-sans font-semibold text-[#243324]">Remaining Lease (Years)</p>
              </div>
              <div className="flex items-center gap-4">
                <Input type="number" min={0} max={99} value={minLease} onChange={(e) => setMinLease(Number(e.target.value) || 0)} className="w-24 border-[#243324]/20 focus-visible:ring-[#3B4D36]" placeholder="Min" />
                <span className="text-[#243324]/60 text-sm">to</span>
                <Input type="number" min={0} max={99} value={maxLease} onChange={(e) => setMaxLease(Number(e.target.value) || 99)} className="w-24 border-[#243324]/20 focus-visible:ring-[#3B4D36]" placeholder="Max" />
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
      </CardContent>
    </Card>
  );
}
