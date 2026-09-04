import IncomeDashboard from '@/components/economy/IncomeDashboard';
import { Metadata } from 'next';
import ErrorState from '@/components/ui/ErrorState';

export const metadata: Metadata = {
  title: 'Household Income & Wealth | SG DataViz',
  description: 'Analyze Singapore\'s household income trends, median vs average earnings, and the wealth gap.',
};

 // Cache for 24 hours

export const dynamic = 'force-dynamic';

export default async function HouseholdIncomePage() {
  try {
    const [medianRes, decileRes, cpiRes, dwellingRes, unempRes] = await Promise.all([
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_c74ebe613db891d25e4836aaf98d7a47&limit=100'),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_b37bc6f05c76337ad51aefddf0b7c888&limit=100'),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_b7c2e74824c179995d15d73eac845ba1&limit=500'),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_ce5d8bb5c34f6b78b5b2f1fab09ccbce&limit=100'),
      null
    ]);

    if (!medianRes.ok || !decileRes.ok || !cpiRes.ok || !dwellingRes.ok || !unempRes.ok) {
      return <ErrorState />;
    }

    const medianData = await medianRes.json();
    const decileData = await decileRes.json();
    const cpiData = await cpiRes.json();
    const dwellingData = await dwellingRes.json();
    const unempData = await unempRes.json();

    const rawMedians = medianData.result?.records || [];
    const rawDeciles = decileData.result?.records || [];
    const rawCPI = cpiData.result?.records || [];
    const rawDwelling = dwellingData.result?.records || [];
    const rawUnemp = unempData.result?.records || [];

    const generalCPI = rawCPI.filter((r: any) => r.category === 'General');
    const baseCpiRecord = generalCPI.find((r: any) => r.year === '2008');
    const baseCpi = baseCpiRecord ? Number(baseCpiRecord.cpi) : 100;

    const years = rawMedians.map((r: any) => r.Dollar).filter(Boolean).sort();

    const mergedData = years.map((year: string) => {
      const medRow = rawMedians.find((r: any) => r.Dollar === year);
      const dwellRow = rawDwelling.find((r: any) => r.Dollar === year);
      const cpiRow = generalCPI.find((r: any) => r.year === year);
      
      const nominalMedian = medRow ? Number(medRow.ResidentEmployedHouseholds_Median1) : null;
      const currentCpi = cpiRow ? Number(cpiRow.cpi) : null;
      let realMedian = null;

      // Calculate Real Income (Base Year 2008)
      if (nominalMedian && currentCpi && currentCpi > 0) {
        realMedian = nominalMedian * (baseCpi / currentCpi);
      } else if (Number(year) < 2008) {
        // Fallback for years before 2008 where we don't have CPI data in this dataset
        realMedian = nominalMedian; 
      }
      
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

      // Unemployment Rate
      let unemployment = null;
      if (rawUnemp.length > 0) {
        const series = rawUnemp.find((r: any) => r.DataSeries && r.DataSeries.includes('Resident Unemployment Rate'));
        if (series && series[year]) {
          const val = series[year];
          unemployment = (val === 'na' || val === 'n.a.' || val === '-' || !val) ? null : parseFloat(val);
        }
      }

      return {
        year,
        median: nominalMedian,
        realMedian: realMedian ? Math.round(realMedian) : null,
        average: medRow ? Number(medRow.ResidentEmployedHouseholds_Average) : null,
        unemployment,
        
        // Housing
        hdb1_2: dwellRow ? Number(dwellRow.HDB1_and2_RoomFlats1) : null,
        hdb3: dwellRow ? Number(dwellRow.HDB3_RoomFlats) : null,
        hdb4: dwellRow ? Number(dwellRow.HDB4_RoomFlats) : null,
        hdb5_exec: dwellRow ? Number(dwellRow.HDB5_RoomandExecutiveFlats) : null,
        condo: dwellRow ? Number(dwellRow.CondominiumsandOtherApartments) : null,
        landed: dwellRow ? Number(dwellRow.LandedProperties) : null,

        // Deciles
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
