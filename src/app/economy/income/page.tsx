import IncomeDashboard from '@/components/economy/IncomeDashboard';
import { Metadata } from 'next';
import ErrorState from '@/components/ui/ErrorState';

export const metadata: Metadata = {
  title: 'Household Income & Wealth | SG DataViz',
  description: 'Analyze Singapore\'s household income trends, median vs average earnings, and the wealth gap.',
};

export const revalidate = 86400; // Cache for 24 hours

export default async function HouseholdIncomePage() {
  try {
    const [medianRes, decileRes] = await Promise.all([
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_c74ebe613db891d25e4836aaf98d7a47&limit=100'),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_b37bc6f05c76337ad51aefddf0b7c888&limit=100')
    ]);

    if (!medianRes.ok || !decileRes.ok) {
      return <ErrorState />;
    }

    const medianData = await medianRes.json();
    const decileData = await decileRes.json();

    const rawMedians = medianData.result?.records || [];
    const rawDeciles = decileData.result?.records || [];

    const years = rawMedians.map((r: any) => r.Dollar).filter(Boolean).sort();

    const mergedData = years.map((year: string) => {
      const medRow = rawMedians.find((r: any) => r.Dollar === year);
      
      const d1 = rawDeciles.find((r: any) => r.Dollar === '1st (Lowest)')?.[year];
      const d2 = rawDeciles.find((r: any) => r.Dollar === '2nd')?.[year];
      const d3 = rawDeciles.find((r: any) => r.Dollar === '3rd')?.[year];
      const d4 = rawDeciles.find((r: any) => r.Dollar === '4th')?.[year];
      const d5 = rawDeciles.find((r: any) => r.Dollar === '5th')?.[year];
      const d6 = rawDeciles.find((r: any) => r.Dollar === '6th')?.[year];
      const d7 = rawDeciles.find((r: any) => r.Dollar === '7th')?.[year];
      const d8 = rawDeciles.find((r: any) => r.Dollar === '8th')?.[year];
      const d9 = rawDeciles.find((r: any) => r.Dollar === '9th')?.[year];
      const d10 = rawDeciles.find((r: any) => r.Dollar === '10th (Highest)')?.[year];

      return {
        year,
        median: medRow ? Number(medRow.ResidentEmployedHouseholds_Median1) : null,
        average: medRow ? Number(medRow.ResidentEmployedHouseholds_Average) : null,
        decile1: d1 ? Number(d1) : null,
        decile2: d2 ? Number(d2) : null,
        decile3: d3 ? Number(d3) : null,
        decile4: d4 ? Number(d4) : null,
        decile5: d5 ? Number(d5) : null,
        decile6: d6 ? Number(d6) : null,
        decile7: d7 ? Number(d7) : null,
        decile8: d8 ? Number(d8) : null,
        decile9: d9 ? Number(d9) : null,
        decile10: d10 ? Number(d10) : null,
      };
    });

    return <IncomeDashboard initialData={mergedData} />;
  } catch (error) {
    console.error('Income data fetch error:', error);
    return <ErrorState />;
  }
}
