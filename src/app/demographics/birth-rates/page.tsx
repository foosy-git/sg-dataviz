import BirthRatesDashboard from '@/components/demographics/BirthRatesDashboard';

 // Cache for 24 hours

export const dynamic = 'force-dynamic';

export default async function BirthRatesPage() {
  let fertilityRaw = [];
  let marriageAgeRaw = [];

  try {
    const [res1, res2] = await Promise.all([
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_e39eeaeadb571c0d0725ef1eec48d166&limit=50', { next: { revalidate: 86400 } }),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_48bab86448603efe0a6f0fcd6aa545b6&limit=10', { next: { revalidate: 86400 } })
    ]);
    const j1 = await res1.json();
    const j2 = await res2.json();
    
    fertilityRaw = j1?.result?.records || [];
    marriageAgeRaw = j2?.result?.records || [];
  } catch(e) {
    console.error('Failed to fetch demographic data', e);
  }

  const yearDataMap = new Map();

  const getYearData = (year: string) => {
    if (!yearDataMap.has(year)) yearDataMap.set(year, { year });
    return yearDataMap.get(year);
  };

  if (fertilityRaw.length > 0) {
    const yearKeys = Object.keys(fertilityRaw[0]).filter(k => !isNaN(Number(k)));
    for (const year of yearKeys) {
      const yd = getYearData(year);
      for (const series of fertilityRaw) {
        const seriesName = series.DataSeries.trim();
        const value = series[year];
        yd[seriesName] = (value === 'na' || value === 'n.a.' || value === '-' || !value) ? null : parseFloat(value);
      }
    }
  }

  if (marriageAgeRaw.length > 0) {
    const yearKeys = Object.keys(marriageAgeRaw[0]).filter(k => !isNaN(Number(k)));
    for (const year of yearKeys) {
      const yd = getYearData(year);
      for (const series of marriageAgeRaw) {
        const seriesName = "Marriage Age - " + series.DataSeries.trim();
        const value = series[year];
        yd[seriesName] = (value === 'na' || value === 'n.a.' || value === '-' || !value) ? null : parseFloat(value);
      }
    }
  }



  const data = Array.from(yearDataMap.values()).sort((a, b) => parseInt(a.year) - parseInt(b.year));

  return (
    <BirthRatesDashboard data={data} />
  );
}
