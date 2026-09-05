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
  
  try {
    const [psiRes, pm25Res] = await Promise.all([
      fetch(PSI_API, fetchOpts),
      fetch(PM25_API, fetchOpts)
    ]);
    
    const psiJson = psiRes.ok ? await psiRes.json() : null;
    const pm25Json = pm25Res.ok ? await pm25Res.json() : null;
    
    return {
      psi: psiJson?.items?.[0] || null,
      pm25: pm25Json?.items?.[0] || null
    };
  } catch (e) {
    console.error('Failed to fetch Air Quality data:', e);
    return { psi: null, pm25: null };
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
