import AirQualityDashboard from '@/components/environment/AirQualityDashboard';
import { Suspense } from 'react';

const PSI_API = 'https://api.data.gov.sg/v1/environment/psi';
const PM25_API = 'https://api.data.gov.sg/v1/environment/pm25';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAirQualityData() {
  const fetchOpts = { 
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SGDataViz' }, 
    cache: 'no-store' as const
  };

  const now = new Date();
  const sgTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const dateStrs: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(sgTime.getTime() - i * 24 * 60 * 60 * 1000);
    dateStrs.push(d.toISOString().split('T')[0]);
  }
  
  try {
    const psiPromises = dateStrs.map(ds => 
      fetch(`${PSI_API}?date=${ds}`, fetchOpts).then(r => r.ok ? r.json() : null).catch(() => null)
    );
    const pm25Promises = dateStrs.map(ds => 
      fetch(`${PM25_API}?date=${ds}`, fetchOpts).then(r => r.ok ? r.json() : null).catch(() => null)
    );

    const [psiResults, pm25Results] = await Promise.all([
      Promise.all(psiPromises),
      Promise.all(pm25Promises)
    ]);

    const allPsiItems = psiResults.flatMap(r => r?.items || []);
    const allPm25Items = pm25Results.flatMap(r => r?.items || []);

    return {
      psi: allPsiItems[allPsiItems.length - 1] || null,
      pm25: allPm25Items[allPm25Items.length - 1] || null,
      psiHistory: allPsiItems,
      pm25History: allPm25Items
    };
  } catch (e) {
    console.error('Failed to fetch Air Quality data:', e);
    return { psi: null, pm25: null, psiHistory: [], pm25History: [] };
  }
}

export default async function AirQualityPage() {
  const psiData = await getAirQualityData();
  
  return (
    <main className="min-h-screen bg-[#FBF9F5]">
      <Suspense fallback={<div className="p-20 text-center">Loading Air Quality data...</div>}>
        <AirQualityDashboard psiData={psiData} />
      </Suspense>
    </main>
  );
}
