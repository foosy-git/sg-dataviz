export interface HdbRecordRaw {
  month: string;
  town: string;
  flat_type: string;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: string | number;
  flat_model: string;
  lease_commence_date: string | number;
  remaining_lease?: string | number;
  resale_price: string | number;
}

export interface HdbRecord {
  id: string; // generated unique ID
  month: string; // YYYY-MM
  year: number;
  town: string;
  flatType: string;
  block: string;
  streetName: string;
  storeyRange: string;
  floorAreaSqm: number;
  floorAreaSqft: number;
  flatModel: string;
  leaseCommenceDate: number;
  remainingLeaseYears: number; // Normalized to decimal years
  resalePrice: number;
  pricePerSqm: number;
  pricePerSqft: number;
}
