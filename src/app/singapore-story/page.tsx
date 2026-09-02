import SingaporeStoryDashboard from '@/components/story/SingaporeStoryDashboard';
import { getHistoricalData } from '@/lib/hdb';
import ErrorState from '@/components/ui/ErrorState';

export const revalidate = 86400; // Cache for 24 hours

export default async function SingaporeStoryPage() {
  try {
    const headers: Record<string, string> = {};
    if (process.env.DATAGOV_API_KEY) {
      headers['api-key'] = process.env.DATAGOV_API_KEY.trim();
    }

    const [birthRes, incomeRes, coeRes, climateRes] = await Promise.all([
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_e39eeaeadb571c0d0725ef1eec48d166&limit=100', { headers }),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_c74ebe613db891d25e4836aaf98d7a47&limit=100', { headers }),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_69b3380ad7e51aff3a7dcc84eba52b8a&limit=50000', { headers }),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_755290a24afe70c8f9e8bcbf9f251573&limit=10000', { headers })
    ]);

    if (!birthRes.ok || !incomeRes.ok || !coeRes.ok || !climateRes.ok) {
      console.error('API Error Status:', birthRes.status, incomeRes.status, coeRes.status, climateRes.status);
      throw new Error('Failed to fetch data from data.gov.sg');
    }

    const birthData = (await birthRes.json()).result?.records || [];
    const incomeData = (await incomeRes.json()).result?.records || [];
    const coeData = (await coeRes.json()).result?.records || [];
    const climateData = (await climateRes.json()).result?.records || [];

    const hdbData = await getHistoricalData();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yearsMap: Record<number, any> = {};

    const initYear = (y: number) => {
      if (!yearsMap[y]) yearsMap[y] = { 
        year: y, birthRate: null, medianIncome: null, 
        coeSum: 0, coeCount: 0, hdbSum: 0, hdbCount: 0, 
        tempSum: 0, tempCount: 0 
      };
    };

    // 1. Birth Rates (Wide format: DataSeries, 1960, 1961...)
    if (birthData.length > 0) {
      const yearKeys = Object.keys(birthData[0]).filter(k => !isNaN(Number(k)));
      for (const year of yearKeys) {
        initYear(Number(year));
        const series = birthData.find((r: any) => r.DataSeries.includes('Total Fertility Rate'));
        if (series) {
          const value = series[year];
          yearsMap[Number(year)].birthRate = (value === 'na' || value === 'n.a.' || value === '-' || !value) ? null : parseFloat(value);
        }
      }
    }

    // 2. Median Income
    for (const row of incomeData) {
      if (row.Dollar) {
        const y = parseInt(row.Dollar);
        initYear(y);
        yearsMap[y].medianIncome = Number(row.ResidentEmployedHouseholds_Median1);
      }
    }

    // 3. COE (Category A average)
    for (const row of coeData) {
      if (row.vehicle_class === 'Category A' || row.vehicle_class === 'Category A (Cars up to 1600cc and 97kW)' || row.vehicle_class === 'Category A (Cars up to 1600cc & 97kW)') {
        const y = parseInt(row.month.split('-')[0]);
        initYear(y);
        yearsMap[y].coeSum += Number(row.premium);
        yearsMap[y].coeCount += 1;
      }
    }

    // 4. Climate (Mean Surface Temp)
    for (const row of climateData) {
      if (row.month) {
        const y = parseInt(row.month.split('-')[0]);
        initYear(y);
        yearsMap[y].tempSum += Number(row.mean_temp);
        yearsMap[y].tempCount += 1;
      }
    }

    // 5. HDB Resale
    for (const row of hdbData) {
      initYear(row.year);
      yearsMap[row.year].hdbSum += row.resalePrice;
      yearsMap[row.year].hdbCount += 1;
    }

    // Finalize aggregations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timelineData = Object.values(yearsMap).map((d: any) => ({
      year: d.year,
      birthRate: d.birthRate,
      medianIncome: d.medianIncome,
      coePremium: d.coeCount > 0 ? Math.round(d.coeSum / d.coeCount) : null,
      hdbPrice: d.hdbCount > 0 ? Math.round(d.hdbSum / d.hdbCount) : null,
      temperature: d.tempCount > 0 ? Number((d.tempSum / d.tempCount).toFixed(2)) : null,
    })).sort((a, b) => a.year - b.year);

    // Limit to 2010-2024 since COE only starts from 2010
    const filteredTimeline = timelineData.filter(d => d.year >= 2010 && d.year <= 2024);

    return (
      <main className="min-h-screen bg-[#FBF9F5] text-[#243324] font-sans selection:bg-[#E8DCC4] selection:text-[#1F2B1D]">
        <SingaporeStoryDashboard initialData={filteredTimeline} />
      </main>
    );

  } catch (error) {
    console.error('Error fetching data for Singapore Story:', error);
    return <ErrorState />;
  }
}
