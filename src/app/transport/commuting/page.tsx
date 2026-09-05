import RidershipDashboard from '@/components/transport/RidershipDashboard';
import { Metadata } from 'next';
import ErrorState from '@/components/ui/ErrorState';
import fallbackRidershipData from '@/data/ridershipFallback.json';

export const metadata: Metadata = {
  title: 'Public Transport Ridership | SG DataViz',
  description: 'Analyze average daily public transport ridership in Singapore across MRT, LRT, and Buses.',
};

export const dynamic = 'force-dynamic';

const RIDERSHIP_API_URL = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_75248cf2fbf340de6a746dc91ec9223c&limit=1000';

interface RidershipRecord {
  year: string;
  mode: string;
  ridership: number;
}

let cachedRidershipData: RidershipRecord[] | null = null;
let lastRidershipFetch = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour

async function getRidershipData(): Promise<RidershipRecord[]> {
  const now = Date.now();
  if (cachedRidershipData && now - lastRidershipFetch < CACHE_TTL) {
    return cachedRidershipData;
  }

  try {
    const headers: Record<string, string> = {};
    if (process.env.DATAGOV_API_KEY) {
      headers['api-key'] = process.env.DATAGOV_API_KEY.trim();
    }

    const res = await fetch(RIDERSHIP_API_URL, {
      headers,
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 }
    });

    if (!res.ok) throw new Error(`Failed to fetch ridership dataset: HTTP ${res.status}`);
    const json = await res.json();

    if (!json.success || !Array.isArray(json.result?.records) || json.result.records.length === 0) {
      throw new Error('Invalid or empty records from ridership Datastore API');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedData: RidershipRecord[] = json.result.records.map((r: any) => ({
      year: String(r.year),
      mode: String(r.mode),
      ridership: parseFloat(r.ridership) || 0
    }));

    cachedRidershipData = parsedData;
    lastRidershipFetch = now;
    return parsedData;
  } catch (error) {
    console.error('Ridership data fetch error, falling back to static dataset:', error);
    if (cachedRidershipData && cachedRidershipData.length > 0) {
      return cachedRidershipData;
    }
    return fallbackRidershipData as RidershipRecord[];
  }
}

export default async function RidershipPage() {
  try {
    const data = await getRidershipData();
    if (!data || data.length === 0) {
      return <ErrorState />;
    }

    return (
      <main className="min-h-screen bg-[#FBF9F5]">
        <RidershipDashboard data={data} />
      </main>
    );
  } catch (error) {
    console.error('Ridership page error:', error);
    return <ErrorState />;
  }
}
