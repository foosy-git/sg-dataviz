import COEDashboard from '@/components/transport/COEDashboard';
import { Suspense } from 'react';

const COE_API_URL = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_69b3380ad7e51aff3a7dcc84eba52b8a&limit=10000';

let cachedCOEData: any[] | null = null;
let lastCOEFetch = 0;
const COE_CACHE_TTL = 3600 * 1000; // 1 hour cache

async function getCOEData() {
  const now = Date.now();
  if (cachedCOEData && (now - lastCOEFetch < COE_CACHE_TTL)) {
    return cachedCOEData;
  }

  try {
    const headers: Record<string, string> = {};
    if (process.env.DATAGOV_API_KEY) {
      headers['api-key'] = process.env.DATAGOV_API_KEY.trim();
    }

    const res = await fetch(COE_API_URL, { 
      headers,
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 } 
    });
    if (!res.ok) throw new Error('Failed to fetch COE data');
    const data = await res.json();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cachedCOEData = (data.result?.records || []).map((d: any) => {
      // Generate a sortable date string like "2024-05 Bidding 1"
      const formattedDate = `${d.month} (Bid ${d.bidding_no})`;
      return {
        month: d.month,
        bidding_no: Number(d.bidding_no),
        formattedDate,
        vehicle_class: d.vehicle_class,
        quota: Number(d.quota),
        bids_success: Number(d.bids_success),
        bids_received: Number(d.bids_received),
        premium: Number(d.premium)
      };
    }).sort((a: any, b: any) => {
      if (a.month === b.month) return a.bidding_no - b.bidding_no;
      return a.month.localeCompare(b.month);
    });

    lastCOEFetch = now;
    return cachedCOEData;
  } catch (err) {
    if (cachedCOEData) {
      console.warn('COE fetch failed, serving previous cached data:', err);
      return cachedCOEData;
    }
    throw err;
  }
}

export const dynamic = 'force-dynamic';

export default async function COEPage() {
  const data = (await getCOEData()) || [];
  
  return (
    <main className="min-h-screen bg-[#FBF9F5]">
      <Suspense fallback={<div className="p-20 text-center">Loading COE data...</div>}>
        <COEDashboard initialData={data} />
      </Suspense>
    </main>
  );
}
