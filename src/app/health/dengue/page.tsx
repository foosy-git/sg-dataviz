import DengueDashboard from '@/components/health/DengueDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Public Health & Outbreaks | SG DataViz',
  description: 'Track the historical cycles of Dengue and Dengue Haemorrhagic Fever outbreaks in Singapore.',
};

export const dynamic = 'force-dynamic';

export default async function DenguePage() {
  // Historical Dengue cases dataset
  const historicalData = [
    { year: 2014, cases: 18335, dhf: 37, deaths: 4 },
    { year: 2015, cases: 11286, dhf: 33, deaths: 4 },
    { year: 2016, cases: 13115, dhf: 59, deaths: 9 },
    { year: 2017, cases: 2772, dhf: 17, deaths: 2 },
    { year: 2018, cases: 3285, dhf: 22, deaths: 5 },
    { year: 2019, cases: 15998, dhf: 104, deaths: 20 },
    { year: 2020, cases: 35315, dhf: 198, deaths: 32 }, 
    { year: 2021, cases: 5258, dhf: 28, deaths: 5 },
    { year: 2022, cases: 32173, dhf: 184, deaths: 19 },
    { year: 2023, cases: 9949, dhf: 61, deaths: 6 },
    { year: 2024, cases: 11200, dhf: 68, deaths: 7 }
  ];

  let liveClusters = [];
  try {
    // 1. Poll the new Data.gov.sg API for the Dengue Clusters GEOJSON download URL
    const pollRes = await fetch('https://api-open.data.gov.sg/v1/public/api/datasets/d_dbfabf16158d1b0e1c420627c0819168/poll-download', { next: { revalidate: 3600 } });
    if (pollRes.ok) {
      const pollData = await pollRes.json();
      if (pollData?.code === 0 && pollData?.data?.url) {
        // 2. Fetch the actual GEOJSON file
        const geoRes = await fetch(pollData.data.url, { next: { revalidate: 3600 } });
        if (geoRes.ok) {
          const geoJson = await geoRes.json();
          if (geoJson?.features) {
            // 3. Extract the properties and sort by severity
            liveClusters = geoJson.features.map((f: any) => f.properties).sort((a: any, b: any) => b.CASE_SIZE - a.CASE_SIZE);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error fetching live Dengue clusters:', e);
  }

  return (
    <main className="min-h-screen bg-[#FBF9F5]">
      <DengueDashboard data={historicalData} liveClusters={liveClusters} />
    </main>
  );
}
