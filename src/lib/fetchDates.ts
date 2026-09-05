import { format, parseISO } from 'date-fns';

const headers: Record<string, string> = process.env.DATAGOV_API_KEY 
  ? { 'api-key': process.env.DATAGOV_API_KEY.trim() } 
  : {};

const fetchOpts: RequestInit = {
  headers,
  next: { revalidate: 3600 }
} as RequestInit;

export async function fetchDatasetDates() {
  try {
    const [income, birth, coe, ges, climate, employment, transport, hdb] = await Promise.all([
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_c74ebe613db891d25e4836aaf98d7a47&limit=1&sort=Dollar%20desc', fetchOpts).then(r => r.json()).catch(() => null),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_e39eeaeadb571c0d0725ef1eec48d166&limit=1', fetchOpts).then(r => r.json()).catch(() => null),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_69b3380ad7e51aff3a7dcc84eba52b8a&limit=1&sort=month%20desc', fetchOpts).then(r => r.json()).catch(() => null),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_3c55210de27fcccda2ed0c63fdd2b352&limit=1&sort=year%20desc', fetchOpts).then(r => r.json()).catch(() => null),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_755290a24afe70c8f9e8bcbf9f251573&limit=1&sort=month%20desc', fetchOpts).then(r => r.json()).catch(() => null),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_285a079d823a1cc22dffb9cac325f81a&limit=1', fetchOpts).then(r => r.json()).catch(() => null),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_75248cf2fbf340de6a746dc91ec9223c&limit=1&sort=year%20desc', fetchOpts).then(r => r.json()).catch(() => null),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&limit=1&sort=month%20desc', fetchOpts).then(r => r.json()).catch(() => null)
    ]);

    const formatMonth = (str: string) => {
      if (!str) return null;
      try { return 'Latest: ' + format(parseISO(str + '-01'), 'MMM yyyy'); }
      catch { return null; }
    };

    const formatYear = (str: string) => {
      if (!str) return null;
      return 'Latest: ' + str;
    };

    let birthLatest = 'Latest: 2025'; // Fallback
    if (birth?.result?.records?.[0]) {
      const keys = Object.keys(birth.result.records[0]).filter(k => !isNaN(Number(k)));
      if (keys.length > 0) {
        birthLatest = 'Latest: ' + Math.max(...keys.map(Number));
      }
    }

    let employmentLatest = 'Latest: 2026'; // Fallback
    if (employment?.result?.records?.[0]) {
      const keys = Object.keys(employment.result.records[0]).filter(k => !isNaN(Number(k)));
      if (keys.length > 0) {
        employmentLatest = 'Latest: ' + Math.max(...keys.map(Number));
      }
    }

    return {
      income: formatYear(income?.result?.records?.[0]?.Dollar) || 'Latest: 2025',
      birth: birthLatest,
      hdb: formatMonth(hdb?.result?.records?.[0]?.month) || 'Latest: Sep 2026',
      coe: formatMonth(coe?.result?.records?.[0]?.month) || 'Latest: Aug 2026',
      ges: formatYear(ges?.result?.records?.[0]?.year) || 'Latest: 2024',
      climate: formatMonth(climate?.result?.records?.[0]?.month) || 'Latest: Jul 2026',
      employment: employmentLatest,
      transport: formatYear(transport?.result?.records?.[0]?.year) || 'Latest: 2024'
    };
  } catch (e) {
    console.error('Error fetching dates:', e);
    return { income: 'Latest: 2025', birth: 'Latest: 2025', hdb: 'Latest: Sep 2026', coe: 'Latest: Aug 2026', ges: 'Latest: 2024', climate: 'Latest: Jul 2026', employment: 'Latest: 2026', transport: 'Latest: 2024' };
  }
}
