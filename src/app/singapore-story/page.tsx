import SingaporeStoryDashboard from '@/components/story/SingaporeStoryDashboard';
import fs from 'fs';
import path from 'path';
import ErrorState from '@/components/ui/ErrorState';

const HISTORICAL_COE: Record<number, number> = {
  2000: 38981, 2001: 27099, 2002: 30948, 2003: 28755, 2004: 25181,
  2005: 16551, 2006: 11187, 2007: 14101, 2008: 12330, 2009: 11600
};

export const dynamic = 'force-dynamic'; // Prevent build-time rendering which fails without API keys

export default async function SingaporeStoryPage() {
  try {
    const headers: Record<string, string> = {};
    if (process.env.DATAGOV_API_KEY) {
      headers['api-key'] = process.env.DATAGOV_API_KEY.trim();
    }

    const fetchOpts = { headers, next: { revalidate: 86400 } };
    const [birthRes, incomeRes, coeRes, climateRes, unempRes, hdbLiveRes] = await Promise.all([
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_e39eeaeadb571c0d0725ef1eec48d166&limit=100', fetchOpts),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_c74ebe613db891d25e4836aaf98d7a47&limit=100', fetchOpts),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_69b3380ad7e51aff3a7dcc84eba52b8a&limit=50000', fetchOpts),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_755290a24afe70c8f9e8bcbf9f251573&limit=10000', fetchOpts),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_285a079d823a1cc22dffb9cac325f81a&limit=10', fetchOpts),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&sort=month%20desc&limit=10000', fetchOpts)
    ]);

    if (!birthRes.ok || !incomeRes.ok || !coeRes.ok || !climateRes.ok || !unempRes.ok || !hdbLiveRes.ok) {
      console.error('API Error Status:', birthRes.status, incomeRes.status, coeRes.status, climateRes.status, unempRes.status, hdbLiveRes.status);
      throw new Error('Failed to fetch data from data.gov.sg');
    }

    const birthData = (await birthRes.json()).result?.records || [];
    const incomeData = (await incomeRes.json()).result?.records || [];
    const coeData = (await coeRes.json()).result?.records || [];
    const climateData = (await climateRes.json()).result?.records || [];
    const unempData = (await unempRes.json()).result?.records || [];
    const hdbLiveData = (await hdbLiveRes.json()).result?.records || [];

    const hdbAvgDataPath = path.join(process.cwd(), 'public', 'hdb_historical_avg.json');
    let hdbAvgData: Record<string, number> = {};
    if (fs.existsSync(hdbAvgDataPath)) {
      hdbAvgData = JSON.parse(fs.readFileSync(hdbAvgDataPath, 'utf8'));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yearsMap: Record<number, any> = {};

    const initYear = (y: number) => {
      if (!yearsMap[y]) yearsMap[y] = { 
        year: y, birthRate: null, medianIncome: null, 
        coeSum: 0, coeCount: 0, hdbSum: 0, hdbCount: 0, 
        tempSum: 0, tempCount: 0, unemployment: null
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
    for (const [yStr, price] of Object.entries(HISTORICAL_COE)) {
      const y = parseInt(yStr);
      initYear(y);
      yearsMap[y].coeSum += price;
      yearsMap[y].coeCount += 1;
    }
    for (const row of coeData) {
      if (row.vehicle_class === 'Category A' || row.vehicle_class === 'Category A (Cars up to 1600cc and 97kW)' || row.vehicle_class === 'Category A (Cars up to 1600cc & 97kW)') {
        const y = parseInt(row.month.split('-')[0]);
        if (y < 2010) continue; // Deduplicate
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
    for (const [yStr, avgPrice] of Object.entries(hdbAvgData)) {
      const y = parseInt(yStr);
      initYear(y);
      yearsMap[y].hdbSum += avgPrice;
      yearsMap[y].hdbCount += 1;
    }
    for (const row of hdbLiveData) {
      if (row.month) {
        if (row.month < '2026-09') continue; // Use live API strictly for Sep 2026 onwards
        const y = parseInt(row.month.split('-')[0]);
        initYear(y);
        yearsMap[y].hdbSum += Number(row.resale_price);
        yearsMap[y].hdbCount += 1;
      }
    }

    // 6. Unemployment Rate
    if (unempData.length > 0) {
      const yearKeys = Object.keys(unempData[0]).filter(k => !isNaN(Number(k)));
      for (const year of yearKeys) {
        initYear(Number(year));
        const series = unempData.find((r: any) => r.DataSeries.includes('Resident Unemployment Rate'));
        if (series) {
          const value = series[year];
          yearsMap[Number(year)].unemployment = (value === 'na' || value === 'n.a.' || value === '-' || !value) ? null : parseFloat(value);
        }
      }
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
      unemployment: d.unemployment,
    })).sort((a, b) => a.year - b.year);

    // Limit to 2000-2026
    const filteredTimeline = timelineData.filter(d => d.year >= 2000 && d.year <= 2026);

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
