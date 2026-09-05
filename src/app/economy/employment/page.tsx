import EmploymentDashboard from '@/components/economy/EmploymentDashboard';
import { Metadata } from 'next';
import ErrorState from '@/components/ui/ErrorState';
import { buildEmploymentDataset } from '@/lib/employmentData';

export const metadata: Metadata = {
  title: 'Resident Employment & Labour | SG DataViz',
  description: 'Analyze Singapore\'s resident unemployment rate over time sourced from data.gov.sg.',
};

export const dynamic = 'force-dynamic';

export default async function EmploymentPage() {
  try {
    const unempRes = await fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_285a079d823a1cc22dffb9cac325f81a&limit=100', { next: { revalidate: 86400 } });
    if (!unempRes.ok) throw new Error('Failed to fetch employment data');
    
    const unempData = await unempRes.json();
    const rawUnemp = unempData.result?.records || [];
    
    const residentSeries = rawUnemp.find((r: any) => r.DataSeries && r.DataSeries.includes('Resident Unemployment Rate'));
    
    if (!residentSeries) throw new Error('Missing Resident Unemployment Rate DataSeries in payload');

    const years = Object.keys(residentSeries)
      .filter(k => !isNaN(Number(k)) && Number(k) > 1990)
      .sort((a, b) => Number(a) - Number(b));

    const rawSeriesData = years.map(year => {
      const resident = residentSeries[year];
      return {
        year,
        resident: (resident === 'na' || resident === '-' || !resident) ? null : parseFloat(resident),
      };
    });

    const dataset = buildEmploymentDataset(rawSeriesData);

    return (
      <main className="min-h-screen bg-[#FBF9F5]">
        <EmploymentDashboard data={dataset} />
      </main>
    );
  } catch (error) {
    console.error('Employment fetch error:', error);
    return <ErrorState />;
  }
}
