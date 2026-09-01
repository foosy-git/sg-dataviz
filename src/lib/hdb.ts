import { HdbRecord, HdbRecordRaw } from "@/types/hdb";

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
