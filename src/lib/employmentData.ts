/**
 * Singapore Resident Labour Market Data (data.gov.sg)
 * Sourced from Ministry of Manpower (MOM) via data.gov.sg
 * Dataset: Resident Unemployment Rate, Seasonally Adjusted, End June
 * Resource ID: d_285a079d823a1cc22dffb9cac325f81a
 */

export interface EmploymentRecord {
  year: string;
  resident: number | null;
}

/**
 * Formats live records from data.gov.sg for Resident Unemployment Rate
 */
export function buildEmploymentDataset(
  liveRecords: { year: string; resident: number | null }[]
): EmploymentRecord[] {
  return liveRecords.map(item => {
    const resident = item.resident !== null && !isNaN(item.resident) ? item.resident : null;
    return {
      year: item.year,
      resident,
    };
  });
}
