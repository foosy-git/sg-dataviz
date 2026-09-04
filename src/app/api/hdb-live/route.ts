import { NextResponse } from 'next/server';
import { normalizeHdbData, getHistoricalData, getHdbResaleIndexData, getHdbAnnualTrendData } from '@/lib/hdb';

const API_URL = 'https://data.gov.sg/api/action/datastore_search';
const RESOURCE_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';

export const dynamic = 'force-dynamic';

let cachedCombinedRecords: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in-memory cache

const ALLOWED_SORT_KEYS = ['month', 'resalePrice', 'floorAreaSqm', 'pricePerSqft', 'remainingLeaseYears', 'town', 'flatType'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  try {
    const now = Date.now();
    let allRecords: any[] = [];

    if (cachedCombinedRecords && (now - lastCacheTime < CACHE_TTL_MS)) {
      allRecords = [...cachedCombinedRecords];
    } else {
      const historicalRecords = await getHistoricalData();
      let recentLiveRecords: any[] = [];

      try {
        const apiUrl = `${API_URL}?resource_id=${RESOURCE_ID}&sort=month%20desc&limit=5000`;
        const headers: Record<string, string> = {};
        if (process.env.DATAGOV_API_KEY) {
          headers['api-key'] = process.env.DATAGOV_API_KEY.trim();
        }

        const response = await fetch(apiUrl, { 
          headers, 
          signal: AbortSignal.timeout(8000),
          next: { revalidate: 86400 } 
        });

        if (response.ok) {
          const data = await response.json();
          const allLiveRecords = normalizeHdbData(data.result?.records || []);
          recentLiveRecords = historicalRecords.length > 0 
            ? allLiveRecords.filter(r => r.month >= '2026-09')
            : allLiveRecords;
        } else {
          console.warn(`Data.gov.sg returned ${response.status}. Falling back to historical data.`);
        }
      } catch (fetchErr) {
        console.warn('Live HDB fetch failed or timed out. Falling back to historical data:', fetchErr);
      }

      cachedCombinedRecords = [...recentLiveRecords, ...historicalRecords];
      lastCacheTime = now;
      allRecords = [...cachedCombinedRecords];
    }

    // Filter Logic & Parameter Sanitization
    const townsParam = searchParams.get('towns');
    const flatTypesParam = searchParams.get('flatTypes');
    const minLease = Math.max(0, Number(searchParams.get('minLease')) || 0);
    const maxLease = Math.min(99, Number(searchParams.get('maxLease')) || 99);
    const startMonth = searchParams.get('startMonth') || '2017-01';
    const endMonth = searchParams.get('endMonth') || '2030-12';
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0);
    const rawSortKey = searchParams.get('sortKey') || 'month';
    const sortKey = ALLOWED_SORT_KEYS.includes(rawSortKey) ? rawSortKey : 'month';
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
    const search = (searchParams.get('search') || '').slice(0, 100).toLowerCase();

    const selectedTowns = townsParam ? townsParam.split(',').filter(Boolean) : [];
    const selectedFlatTypes = flatTypesParam ? flatTypesParam.split(',').filter(Boolean) : [];

    allRecords = allRecords.filter(record => {
      if (selectedTowns.length > 0 && !selectedTowns.includes(record.town)) return false;
      if (selectedFlatTypes.length > 0 && !selectedFlatTypes.includes(record.flatType)) return false;
      if (record.remainingLeaseYears < minLease || record.remainingLeaseYears > maxLease) return false;
      if (record.month < startMonth || record.month > endMonth) return false;
      if (search) {
         if (!record.streetName.toLowerCase().includes(search) &&
             !record.town.toLowerCase().includes(search) &&
             !record.flatModel.toLowerCase().includes(search) &&
             !record.flatType.toLowerCase().includes(search) &&
             !record.block.toLowerCase().includes(search)) {
            return false;
         }
      }
      return true;
    });

    // Aggregations
    const totalTransactions = allRecords.length;
    let totalPrice = 0;
    let totalPsf = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trendMap: Record<string, any> = {};
    const townMap: Record<string, { town: string; count: number; sum: number }> = {};
    const millionDollar = [];

    for (const r of allRecords) {
      totalPrice += r.resalePrice;
      totalPsf += r.pricePerSqft;
      
      if (!trendMap[r.month]) trendMap[r.month] = { month: r.month, volume: 0, sum: 0 };
      trendMap[r.month].volume += 1;
      trendMap[r.month].sum += r.resalePrice;

      if (!trendMap[r.month][`${r.town}_count`]) {
         trendMap[r.month][`${r.town}_count`] = 0;
         trendMap[r.month][`${r.town}_sum`] = 0;
      }
      trendMap[r.month][`${r.town}_count`] += 1;
      trendMap[r.month][`${r.town}_sum`] += r.resalePrice;

      if (!trendMap[r.month][`${r.flatType}_count`]) {
         trendMap[r.month][`${r.flatType}_count`] = 0;
         trendMap[r.month][`${r.flatType}_sum`] = 0;
      }
      trendMap[r.month][`${r.flatType}_count`] += 1;
      trendMap[r.month][`${r.flatType}_sum`] += r.resalePrice;

      if (!townMap[r.town]) townMap[r.town] = { town: r.town, count: 0, sum: 0 };
      townMap[r.town].count += 1;
      townMap[r.town].sum += r.resalePrice;

      if (r.resalePrice >= 1000000) millionDollar.push(r);
    }

    const medianPrice = totalTransactions ? Math.round(totalPrice / totalTransactions) : 0;
    const avgPsf = totalTransactions ? Math.round(totalPsf / totalTransactions) : 0;

    const macroTrend = Object.values(trendMap)
      .map(g => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const item: any = { month: g.month, medianPrice: Math.round(g.sum / g.volume), volume: g.volume };
         for (const key of Object.keys(g)) {
            if (key.endsWith('_count')) {
               const townName = key.replace('_count', '');
               item[townName] = Math.round(g[`${townName}_sum`] / g[key]);
            }
         }
         return item;
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    const townHeatmap = Object.values(townMap)
      .map(g => ({ 
        town: g.town.length > 10 ? g.town.substring(0,10)+'...' : g.town, 
        fullTown: g.town, 
        medianPrice: Math.round(g.sum / g.count),
        volume: g.count 
      }))
      .sort((a, b) => b.medianPrice - a.medianPrice);

    millionDollar.sort((a, b) => b.resalePrice - a.resalePrice);
    
    const step = Math.ceil(allRecords.length / 2000) || 1;
    const leaseDecay = allRecords.filter((_, i) => i % step === 0).map(d => ({
      remainingLease: Math.round(d.remainingLeaseYears), price: d.resalePrice, town: d.town, details: `${d.block} ${d.streetName}`
    }));

    // Sorting & Pagination for Table
    allRecords.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aVal = (a as any)[sortKey];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bVal = (b as any)[sortKey];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const tableData = allRecords.slice(page * 50, (page + 1) * 50);

    const [resaleIndex, annualTrend] = await Promise.all([
      getHdbResaleIndexData(),
      Promise.resolve(getHdbAnnualTrendData())
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalTransactions,
        medianPrice,
        avgPsf,
        macroTrend,
        townHeatmap,
        millionDollar: millionDollar.slice(0, 15),
        leaseDecay,
        tableData,
        resaleIndex,
        annualTrend
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600'
      }
    });
  } catch (error) {
    console.error('Error fetching live HDB data:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch HDB data' }, { status: 500 });
  }
}
