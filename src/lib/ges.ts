export interface GESRecord {
  year: string;
  university: string;
  school: string;
  degree: string;
  employment_rate_overall: string | number;
  employment_rate_ft_perm: string | number;
  basic_monthly_mean: string | number;
  basic_monthly_median: string | number;
  gross_monthly_mean: string | number;
  gross_monthly_median: string | number;
  gross_mthly_25_percentile: string | number;
  gross_mthly_75_percentile: string | number;
}

export async function getGESData(): Promise<GESRecord[]> {
  const url = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/graduate-employment.json'
    : '/graduate-employment.json';
    
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    // Parse numeric fields, converting 'na' to null or handling them
    return data.map((d: any) => {
      const parseNum = (val: string) => {
        if (!val || val.toLowerCase() === 'na' || val === '-') return null;
        return parseFloat(val);
      };

      return {
        ...d,
        employment_rate_overall: parseNum(d.employment_rate_overall),
        employment_rate_ft_perm: parseNum(d.employment_rate_ft_perm),
        basic_monthly_mean: parseNum(d.basic_monthly_mean),
        basic_monthly_median: parseNum(d.basic_monthly_median),
        gross_monthly_mean: parseNum(d.gross_monthly_mean),
        gross_monthly_median: parseNum(d.gross_monthly_median),
        gross_mthly_25_percentile: parseNum(d.gross_mthly_25_percentile),
        gross_mthly_75_percentile: parseNum(d.gross_mthly_75_percentile),
      };
    });
  } catch (error) {
    console.error("Failed to load GES data:", error);
    return [];
  }
}
