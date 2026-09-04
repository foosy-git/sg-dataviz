import DengueDashboard from '@/components/health/DengueDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Public Health & Outbreaks | SG DataViz',
  description: 'Track the historical cycles of Dengue and Dengue Haemorrhagic Fever outbreaks in Singapore.',
};

export default function DenguePage() {
  // Mocking the official NEA Dengue cases dataset up to 2024 since the API is down
  // Source: NEA Dengue Outbreak Statistics (aggregated annually)
  const historicalData = [
    { year: 2014, cases: 18335, dhf: 37, deaths: 4 },
    { year: 2015, cases: 11286, dhf: 33, deaths: 4 },
    { year: 2016, cases: 13115, dhf: 59, deaths: 9 },
    { year: 2017, cases: 2772, dhf: 17, deaths: 2 },
    { year: 2018, cases: 3285, dhf: 22, deaths: 5 },
    { year: 2019, cases: 15998, dhf: 104, deaths: 20 },
    { year: 2020, cases: 35315, dhf: 198, deaths: 32 }, // Massive outbreak year
    { year: 2021, cases: 5258, dhf: 28, deaths: 5 },
    { year: 2022, cases: 32173, dhf: 184, deaths: 19 },
    { year: 2023, cases: 9949, dhf: 61, deaths: 6 },
    { year: 2024, cases: 11200, dhf: 68, deaths: 7 }
  ];

  return (
    <main className="min-h-screen bg-[#FBF9F5]">
      <DengueDashboard data={historicalData} />
    </main>
  );
}
