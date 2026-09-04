import EmploymentDashboard from '@/components/economy/EmploymentDashboard';
import { Metadata } from 'next';
import ErrorState from '@/components/ui/ErrorState';
import { buildEmploymentDataset } from '@/lib/employmentData';

export const metadata: Metadata = {
  title: 'Economy & Employment | SG DataViz',
  description: 'Analyze Singapore\'s overall and resident unemployment rates over time.',
};

export const dynamic = 'force-dynamic';

export default async function EmploymentPage() {
  try {
    const unempRes = await fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_285a079d823a1cc22dffb9cac325f81a&limit=100', { next: { revalidate: 86400 } });
    if (!unempRes.ok) throw new Error('Failed to fetch employment data');
    
    const unempData = await unempRes.json();
    const rawUnemp = unempData.result?.records || [];
    
    const totalSeries = rawUnemp.find((r: any) => r.DataSeries && r.DataSeries.includes('Total Unemployment Rate'));
    const residentSeries = rawUnemp.find((r: any) => r.DataSeries && r.DataSeries.includes('Resident Unemployment Rate'));
    
    if (!totalSeries || !residentSeries) throw new Error('Missing DataSeries in payload');

    const years = Object.keys(totalSeries)
      .filter(k => !isNaN(Number(k)) && Number(k) > 1990)
      .sort((a, b) => Number(a) - Number(b));

    const rawSeriesData = years.map(year => {
      const total = totalSeries[year];
      const resident = residentSeries[year];
      return {
        year,
        total: (total === 'na' || total === '-' || !total) ? null : parseFloat(total),
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
