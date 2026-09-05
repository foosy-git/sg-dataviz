import { HdbRecord } from '@/types/hdb';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

type SortConfig = { key: string; direction: 'asc' | 'desc' };

export default function InvestorTable({ 
  data,
  totalCount,
  page,
  setPage,
  sortConfig,
  setSortConfig
}: { 
  data: HdbRecord[];
  totalCount: number;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  sortConfig: SortConfig;
  setSortConfig: (s: SortConfig) => void;
}) {
  const rowsPerPage = 50;

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setPage(0);
  };

  const sanitizeCSVCell = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    // Neutralize spreadsheet formula injection (=, +, -, @, tab, CR)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => Object.values(row).map(sanitizeCSVCell).join(','));
    const csvContent = [headers, ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hdb_resale_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SortableHead = ({ label, sortKey, alignRight }: { label: string, sortKey: string, alignRight?: boolean }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <TableHead className={alignRight ? "text-right" : ""}>
        <Button 
          variant="ghost" 
          onClick={() => requestSort(sortKey)} 
          className={`h-8 flex items-center gap-1 font-semibold hover:bg-muted/50 p-0 px-2 -ml-2 group ${alignRight ? 'ml-auto' : ''}`}
          title={`Sort by ${label}`}
        >
          {label}
          <ArrowUpDown className={`ml-1 h-3 w-3 transition-opacity ${isActive ? 'opacity-100 text-[#3B4D36]' : 'opacity-30 group-hover:opacity-100'}`} />
        </Button>
      </TableHead>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={exportCSV} className="font-sans font-medium border-[#243324]/20 text-[#243324] hover:bg-[#243324] hover:text-[#FBF9F5]">Export to CSV</Button>
      </div>
      <div className="rounded-md border h-[500px] overflow-auto shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
            <TableRow>
              <SortableHead label="Month" sortKey="month" />
              <SortableHead label="Town" sortKey="town" />
              <TableHead className="font-semibold">Block & Street</TableHead>
              <SortableHead label="Flat Type" sortKey="flatType" />
              <TableHead className="font-semibold">Storey</TableHead>
              <SortableHead label="Area (sqm)" sortKey="floorAreaSqm" />
              <SortableHead label="Lease Rem." sortKey="remainingLeaseYears" />
              <SortableHead label="Price" sortKey="resalePrice" alignRight />
              <SortableHead label="PSF" sortKey="pricePerSqft" alignRight />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.month}</TableCell>
                <TableCell>{row.town}</TableCell>
                <TableCell>{row.block} {row.streetName}</TableCell>
                <TableCell>{row.flatType}</TableCell>
                <TableCell>{row.storeyRange}</TableCell>
                <TableCell>{row.floorAreaSqm}</TableCell>
                <TableCell>{row.remainingLeaseYears.toFixed(1)}y</TableCell>
                <TableCell className="text-right font-medium">${row.resalePrice.toLocaleString()}</TableCell>
                <TableCell className="text-right">${Math.round(row.pricePerSqft).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#243324]/70">
        <div className="text-center sm:text-left text-xs sm:text-sm">
          Showing {totalCount > 0 ? page * rowsPerPage + 1 : 0} to {Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount.toLocaleString()} entries
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4 cursor-pointer" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
          <Button variant="outline" size="sm" className="h-9 px-4 cursor-pointer" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * rowsPerPage >= totalCount}>Next</Button>
        </div>
      </div>
    </div>
  );
}
