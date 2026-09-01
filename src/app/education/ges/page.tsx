import GESDashboard from '@/components/education/GESDashboard';
import fs from 'fs';
import path from 'path';

export default function GESPage() {
  // Read the JSON file directly on the server
  const filePath = path.join(process.cwd(), 'public', 'graduate-employment.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  let rawData = [];
  try {
    rawData = JSON.parse(fileContents);
  } catch(e) {}

  // Parse numeric fields
  const data = rawData.map((d: any) => {
    const parseNum = (val: string) => {
      if (!val) return null;
      const clean = val.toString().toLowerCase().trim();
      if (clean === 'na' || clean === 'n.a.' || clean === '-') return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    return {
      ...d,
      employment_rate_overall: parseNum(d.employment_rate_overall),
      employment_rate_ft_perm: parseNum(d.employment_rate_ft_perm),
      basic_monthly_mean: parseNum(d.basic_monthly_mean),
      basic_monthly_median: parseNum(d.basic_monthly_median),
      gross_monthly_mean: parseNum(d.gross_monthly_mean),
      gross_monthly_median: parseNum(d.gross_monthly_median),
      gross_mthly_25_percentile: parseNum(d.gross_mthly_25_percentile),
      gross_mthly_75_percentile: parseNum(d.gross_mthly_75_percentile),
    };
  });

  return (
    <main className="min-h-screen bg-[#FBF9F5]">
      <GESDashboard initialData={data} />
    </main>
  );
}
