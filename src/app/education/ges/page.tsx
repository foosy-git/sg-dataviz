import GESDashboard from '@/components/education/GESDashboard';


 // Cache for 24 hours

export const dynamic = 'force-dynamic';

export default async function GESPage() {
  const GES_API_URL = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_3c55210de27fcccda2ed0c63fdd2b352&limit=5000';
  let rawData = [];
  
  try {
    const res = await fetch(GES_API_URL, { next: { revalidate: 86400 } });
    const json = await res.json();
    if (json.success && json.result && json.result.records) {
      rawData = json.result.records;
    }
  } catch (e) {
    console.error('Failed to fetch GES data:', e);
  }

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
