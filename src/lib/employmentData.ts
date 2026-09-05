/**
 * Singapore Labour Market Data (data.gov.sg)
 * Sourced from Ministry of Manpower (MOM) via data.gov.sg
 * Dataset: Total and Resident Unemployment Rate, Seasonally Adjusted, End June
 * Resource ID: d_285a079d823a1cc22dffb9cac325f81a
 */

export interface EmploymentRecord {
  year: string;
  total: number | null;
  resident: number | null;
  gap: number | null; // resident - total
}

/**
 * Formats live records from data.gov.sg and computes the arithmetic difference (gap)
 */
export function buildEmploymentDataset(
  liveRecords: { year: string; total: number | null; resident: number | null }[]
): EmploymentRecord[] {
  return liveRecords.map(item => {
    const total = item.total !== null && !isNaN(item.total) ? item.total : null;
    const resident = item.resident !== null && !isNaN(item.resident) ? item.resident : null;
    const gap = total !== null && resident !== null ? Number((resident - total).toFixed(1)) : null;

    return {
      year: item.year,
      total,
      resident,
      gap,
    };
  });
}

