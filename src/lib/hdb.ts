import { HdbRecord, HdbRecordRaw, HdbResaleIndexPoint, HdbAnnualTrendPoint } from "@/types/hdb";

const SQM_TO_SQFT = 10.7639;

export function normalizeHdbData(raw: HdbRecordRaw[]): HdbRecord[] {
  return raw.map((record, index) => {
    const floorAreaSqm = Number(record.floor_area_sqm);
    const resalePrice = Number(record.resale_price);
    const leaseCommenceDate = Number(record.lease_commence_date);
    
    // Parse month (YYYY-MM)
    const [yearStr] = record.month.split('-');
    const transactionYear = Number(yearStr);
    
    // Parse or calculate remaining lease
    let remainingLeaseYears = 0;
    if (record.remaining_lease) {
      const leaseStr = String(record.remaining_lease).toLowerCase();
      // Example formats: "61 years 04 months", "61"
      const yearsMatch = leaseStr.match(/(\d+)\s*year/);
      const monthsMatch = leaseStr.match(/(\d+)\s*month/);
      
      if (yearsMatch) {
        remainingLeaseYears = parseInt(yearsMatch[1], 10);
        if (monthsMatch) {
          remainingLeaseYears += parseInt(monthsMatch[1], 10) / 12;
        }
      } else if (!isNaN(Number(leaseStr))) {
        remainingLeaseYears = Number(leaseStr);
      } else {
         remainingLeaseYears = 99 - (transactionYear - leaseCommenceDate);
      }
    } else {
      // Pre-2015 data doesn't have remaining_lease
      remainingLeaseYears = 99 - (transactionYear - leaseCommenceDate);
    }
    
    const floorAreaSqft = floorAreaSqm * SQM_TO_SQFT;
    
    return {
      id: `${record.month}-${record.block}-${record.street_name}-${record.storey_range}-${index}`.replace(/\s+/g, '-'),
      month: record.month,
      year: transactionYear,
      town: record.town,
      flatType: record.flat_type,
      block: record.block,
      streetName: record.street_name,
      storeyRange: record.storey_range,
      floorAreaSqm,
      floorAreaSqft,
      flatModel: record.flat_model,
      leaseCommenceDate,
      remainingLeaseYears,
      resalePrice,
      pricePerSqm: resalePrice / floorAreaSqm,
      pricePerSqft: resalePrice / floorAreaSqft,
    };
  });
}

import fs from 'fs';
import path from 'path';

let cachedHistoricalData: HdbRecord[] | null = null;

// Static fallback for historical data (for demo purposes if real files are large)
// In a real production app, this would parse local CSVs or JSONs from the public dir
export async function getHistoricalData(): Promise<HdbRecord[]> {
  if (cachedHistoricalData) {
    return cachedHistoricalData;
  }
  try {
     const filePath = path.join(process.cwd(), 'public', 'hdb-data-until-aug2026-full.json');
     if (!fs.existsSync(filePath)) {
       return [];
     }
     const fileContents = fs.readFileSync(filePath, 'utf8');
     const raw = JSON.parse(fileContents);
     cachedHistoricalData = normalizeHdbData(raw);
     return cachedHistoricalData;
  } catch (e) {
     console.error('Error reading historical data:', e);
     return [];
  }
}

let cachedResaleIndexData: HdbResaleIndexPoint[] | null = null;
let cachedAnnualTrendData: HdbAnnualTrendPoint[] | null = null;

const HDB_RPI_RESOURCE_ID = 'd_14f63e595975691e7c24a27ae4c07c79';

export async function getHdbResaleIndexData(): Promise<HdbResaleIndexPoint[]> {
  if (cachedResaleIndexData) {
    return cachedResaleIndexData;
  }

  // 1. Try local bundled fallback first
  try {
    const filePath = path.join(process.cwd(), 'public', 'hdb_resale_index.json');
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      cachedResaleIndexData = JSON.parse(fileContents);
      return cachedResaleIndexData!;
    }
  } catch (err) {
    console.warn('Error reading local hdb_resale_index.json:', err);
  }

  // 2. If fallback not loaded, fetch from data.gov.sg
  try {
    const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${HDB_RPI_RESOURCE_ID}&limit=1000`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = (data.result?.records || []).sort((a: any, b: any) => a.quarter.localeCompare(b.quarter));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cachedResaleIndexData = records.map((r: any, idx: number) => {
        const indexVal = parseFloat(r.index);
        let yoy: number | null = null;
        let qoq: number | null = null;
        if (idx >= 4) {
          const prevYear = parseFloat(records[idx - 4].index);
          yoy = parseFloat((((indexVal - prevYear) / prevYear) * 100).toFixed(2));
        }
        if (idx >= 1) {
          const prevQ = parseFloat(records[idx - 1].index);
          qoq = parseFloat((((indexVal - prevQ) / prevQ) * 100).toFixed(2));
        }
        return {
          quarter: r.quarter,
          year: parseInt(r.quarter.split('-')[0], 10),
          index: indexVal,
          yoy,
          qoq
        };
      });
      return cachedResaleIndexData!;
    }
  } catch (err) {
    console.error('Error fetching live HDB Resale Price Index:', err);
  }

  return [];
}

export function getHdbAnnualTrendData(): HdbAnnualTrendPoint[] {
  if (cachedAnnualTrendData) {
    return cachedAnnualTrendData;
  }
  try {
    const filePath = path.join(process.cwd(), 'public', 'hdb_historical_avg.json');
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const rawMap: Record<string, number> = JSON.parse(fileContents);
    const sortedYears = Object.keys(rawMap).map(Number).sort((a, b) => a - b);
    
    cachedAnnualTrendData = sortedYears.map((year, idx) => {
      const avg = rawMap[year.toString()];
      let yoyChangePercent: number | null = null;
      if (idx > 0) {
        const prevAvg = rawMap[sortedYears[idx - 1].toString()];
        if (prevAvg) {
          yoyChangePercent = parseFloat((((avg - prevAvg) / prevAvg) * 100).toFixed(2));
        }
      }
      return {
        year,
        averagePrice: avg,
        yoyChangePercent
      };
    });
    return cachedAnnualTrendData;
  } catch (err) {
    console.error('Error reading hdb_historical_avg.json:', err);
    return [];
  }
}
