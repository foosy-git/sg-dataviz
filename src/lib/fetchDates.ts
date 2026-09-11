import { format, parseISO } from 'date-fns';

// In-memory cache of the latest known dates for each dataset.
// Updated dynamically whenever fresh data is successfully retrieved from data.gov.sg.
const lastKnownDates: Record<string, string> = {
  income: 'Latest: 2025',
  birth: 'Latest: 2025',
  hdb: 'Latest: Sep 2026',
  coe: 'Latest: Sep 2026',
  ges: 'Latest: 2024',
  climate: 'Latest: Aug 2026',
  employment: 'Latest: 2026',
  transport: 'Latest: 2024'
};

// Revalidate every 15 minutes (900 seconds) in Next.js Data Cache
const REVALIDATE_INTERVAL = 900;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeFetchDatastore(resourceId: string, queryParams: string = ''): Promise<any> {
  const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${resourceId}&${queryParams}`;
  const headers: Record<string, string> = process.env.DATAGOV_API_KEY 
    ? { 'api-key': process.env.DATAGOV_API_KEY.trim() } 
    : {};

  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(6000),
      next: { revalidate: REVALIDATE_INTERVAL }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? json : null;
  } catch {
    return null;
  }
}

export async function fetchDatasetDates() {
  try {
    const [income, birth, coe, ges, climate, employment, transport, hdb] = await Promise.all([
      // 1. Household Income: Sort by Dollar (year) descending
      safeFetchDatastore('d_c74ebe613db891d25e4836aaf98d7a47', 'limit=1&sort=Dollar%20desc'),
      
      // 2. Birth Rates (TFR): Has year columns (e.g. 1960, ..., 2025)
      safeFetchDatastore('d_e39eeaeadb571c0d0725ef1eec48d166', 'limit=1'),
      
      // 3. COE Bidding: Sort by month descending
      safeFetchDatastore('d_69b3380ad7e51aff3a7dcc84eba52b8a', 'limit=1&sort=month%20desc'),
      
      // 4. Graduate Employment (GES): Sort by year descending
      safeFetchDatastore('d_3c55210de27fcccda2ed0c63fdd2b352', 'limit=1&sort=year%20desc'),
      
      // 5. Climate Surface Air Temperature: Sort by month descending
      safeFetchDatastore('d_755290a24afe70c8f9e8bcbf9f251573', 'limit=1&sort=month%20desc'),
      
      // 6. Resident Employment & Labour: Has year columns (e.g. 1992, ..., 2026)
      safeFetchDatastore('d_285a079d823a1cc22dffb9cac325f81a', 'limit=1'),
      
      // 7. Public Transport Ridership: Sort by year descending
      safeFetchDatastore('d_75248cf2fbf340de6a746dc91ec9223c', 'limit=1&sort=year%20desc'),
      
      // 8. HDB Resale Transactions: Sort by month descending
      safeFetchDatastore('d_8b84c4ee58e3cfc0ece0d773c8ca6abc', 'limit=1&sort=month%20desc')
    ]);

    // Format helpers
    const formatMonth = (str?: string) => {
      if (!str) return null;
      try {
        return 'Latest: ' + format(parseISO(str + '-01'), 'MMM yyyy');
      } catch {
        return null;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractColumnYears = (json: any): number[] => {
      if (!json?.result) return [];
      const keysFromRecords = json.result.records?.[0] ? Object.keys(json.result.records[0]) : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const keysFromFields = json.result.fields ? json.result.fields.map((f: any) => f.id) : [];
      return [...keysFromRecords, ...keysFromFields]
        .map(Number)
        .filter(n => !isNaN(n) && n >= 1960 && n <= 2100);
    };

    // Update dynamically when response is successful
    const incomeYear = income?.result?.records?.[0]?.Dollar;
    if (incomeYear && !isNaN(Number(incomeYear))) {
      lastKnownDates.income = 'Latest: ' + incomeYear;
    }

    const birthYears = extractColumnYears(birth);
    if (birthYears.length > 0) {
      lastKnownDates.birth = 'Latest: ' + Math.max(...birthYears);
    }

    const coeMonth = formatMonth(coe?.result?.records?.[0]?.month);
    if (coeMonth) {
      lastKnownDates.coe = coeMonth;
    }

    const gesYear = ges?.result?.records?.[0]?.year;
    if (gesYear && !isNaN(Number(gesYear))) {
      lastKnownDates.ges = 'Latest: ' + gesYear;
    }

    const climateMonth = formatMonth(climate?.result?.records?.[0]?.month);
    if (climateMonth) {
      lastKnownDates.climate = climateMonth;
    }

    const empYears = extractColumnYears(employment);
    if (empYears.length > 0) {
      lastKnownDates.employment = 'Latest: ' + Math.max(...empYears);
    }

    const transportYear = transport?.result?.records?.[0]?.year;
    if (transportYear && !isNaN(Number(transportYear))) {
      lastKnownDates.transport = 'Latest: ' + transportYear;
    }

    const hdbMonth = formatMonth(hdb?.result?.records?.[0]?.month);
    if (hdbMonth) {
      lastKnownDates.hdb = hdbMonth;
    }

    return { ...lastKnownDates };
  } catch (e) {
    console.error('Error fetching dataset dates:', e);
    return { ...lastKnownDates };
  }
}
