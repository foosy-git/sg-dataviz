import ClimateDashboard from '@/components/environment/ClimateDashboard';
import { Suspense } from 'react';

const TEMP_API = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_755290a24afe70c8f9e8bcbf9f251573&limit=2000';
const RAIN_API = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_b16d06b83473fdfcc92ed9d37b66ba58&limit=2000';

async function getClimateData() {
  const [tempRes, rainRes] = await Promise.all([
    fetch(TEMP_API, { next: { revalidate: 3600 } }),
    fetch(RAIN_API, { next: { revalidate: 3600 } })
  ]);
  
  if (!tempRes.ok || !rainRes.ok) throw new Error('Failed to fetch Climate data');
  
  const tempData = await tempRes.json();
  const rainData = await rainRes.json();
  
  // Merge the two datasets by 'month'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = new Map<string, any>();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tempData.result.records.forEach((d: any) => {
    map.set(d.month, { 
      month: d.month, 
      year: d.month.substring(0, 4),
      mean_temp: Number(d.mean_temp) 
    });
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rainData.result.records.forEach((d: any) => {
    if (map.has(d.month)) {
      map.get(d.month).total_rainfall = Number(d.total_rainfall);
    } else {
      map.set(d.month, { 
        month: d.month, 
        year: d.month.substring(0, 4),
        total_rainfall: Number(d.total_rainfall) 
      });
    }
  });

  const merged = Array.from(map.values())
    .sort((a, b) => a.month.localeCompare(b.month)); // Oldest first
    
  return merged;
}

export const dynamic = 'force-dynamic';

export default async function ClimatePage() {
  const data = await getClimateData();
  
  return (
    <main className="min-h-screen bg-[#FBF9F5]">
      <Suspense fallback={<div className="p-20 text-center">Loading Climate data...</div>}>
        <ClimateDashboard initialData={data} />
      </Suspense>
    </main>
  );
}
