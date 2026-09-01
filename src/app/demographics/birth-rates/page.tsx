import BirthRatesDashboard from '@/components/demographics/BirthRatesDashboard';

export const revalidate = 86400; // Cache for 24 hours

export default async function BirthRatesPage() {
  let rawData = [];
  try {
    const res = await fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_e39eeaeadb571c0d0725ef1eec48d166&limit=50', {
      next: { revalidate: 86400 }
    });
    const json = await res.json();
    rawData = json.result.records;
  } catch(e) {
    console.error('Failed to fetch birth rates data', e);
  }

  // Transform data: Currently it's an array of DataSeries (e.g. TFR, 15-19 Years) where columns are Years.
  // We want to transform this into an array of Years, where keys are DataSeries.
  const years = [];
  
  if (rawData.length > 0) {
    // Find all year keys (which are numbers like "1960")
    const yearKeys = Object.keys(rawData[0]).filter(k => !isNaN(Number(k)));
    
    for (const year of yearKeys.sort()) {
      const yearData: any = { year };
      for (const series of rawData) {
        const seriesName = series.DataSeries.trim();
        const value = series[year];
        yearData[seriesName] = value === 'na' || value === 'n.a.' || value === '-' || !value ? null : parseFloat(value);
      }
      years.push(yearData);
    }
  }

  return (
    <main className="min-h-screen bg-[#FBF9F5]">
      <BirthRatesDashboard data={years} />
    </main>
  );
}
