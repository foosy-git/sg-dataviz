import AirQualityDashboard from '@/components/environment/AirQualityDashboard';
import { Suspense } from 'react';

const PSI_API = 'https://api.data.gov.sg/v1/environment/psi';

async function getAirQualityData() {
  const res = await fetch(PSI_API, { next: { revalidate: 60 } });
  
  if (!res.ok) throw new Error('Failed to fetch PSI data');
  
  const psiJson = await res.json();
  return psiJson.items?.[0] || null;
}

export const dynamic = 'force-dynamic';

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
