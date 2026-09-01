const fs = require('fs');
const path = require('path');

const RESOURCE_IDS = [
  '8c00bf08-9124-479e-aeca-7cc411d884c4', // 2000-2012
  '83b2fc37-ce8c-4df4-968b-370fd818138b', // 2012-2014
  '1b702208-44bf-4829-b620-4615ee19b57c', // 2015-2016
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
