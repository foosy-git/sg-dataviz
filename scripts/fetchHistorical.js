const fs = require('fs');
const path = require('path');

const RESOURCE_IDS = [
  'd_8b84c4ee58e3cfc0ece0d773c8ca6abc', // 2017-Present
];

async function fetchResource(resourceId) {
  let allRecords = [];
  let offset = 0;
  const limit = 5000;
  let hasMore = true;

  console.log(`Fetching resource ${resourceId}...`);

  while (hasMore) {
    const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${resourceId}&limit=${limit}&offset=${offset}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
         console.log(`Failed to fetch offset ${offset}: ${res.status}`);
         break;
      }
      const data = await res.json();
      const records = data.result.records;
      if (records.length === 0) {
        hasMore = false;
        break;
      }
      allRecords = allRecords.concat(records);
      console.log(`Fetched ${allRecords.length} records...`);
      offset += limit;
    } catch(e) {
      console.log('Error', e);
      break;
    }
  }
  return allRecords;
}

async function main() {
  let historical = [];
  for (const id of RESOURCE_IDS) {
    const records = await fetchResource(id);
    historical = historical.concat(records);
  }

  console.log(`Total historical records fetched: ${historical.length}`);

  const existingPath = path.join(__dirname, '..', 'public', 'hdb-data-until-aug2026.json');
  let existing = [];
  if (fs.existsSync(existingPath)) {
    existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
    console.log(`Loaded ${existing.length} existing records (2017+)`);
  }

  const combined = historical.concat(existing);
  console.log(`Total combined records: ${combined.length}`);

  const fullPath = path.join(__dirname, '..', 'public', 'hdb-data-until-aug2026-full.json');
  fs.writeFileSync(fullPath, JSON.stringify(combined));
  console.log(`Wrote to ${fullPath}`);
}

main();
