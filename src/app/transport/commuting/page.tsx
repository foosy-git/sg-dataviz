import RidershipDashboard from '@/components/transport/RidershipDashboard';
import { Metadata } from 'next';
import ErrorState from '@/components/ui/ErrorState';

export const metadata: Metadata = {
  title: 'Public Transport Ridership | SG DataViz',
  description: 'Analyze average daily public transport ridership in Singapore across MRT, LRT, and Buses.',
};

export const dynamic = 'force-dynamic';

export default async function RidershipPage() {
  try {
    const pollRes = await fetch('https://api-open.data.gov.sg/v1/public/api/datasets/d_75248cf2fbf340de6a746dc91ec9223c/poll-download', { next: { revalidate: 86400 } });
    if (!pollRes.ok) throw new Error('Failed to poll dataset');
    const pollData = await pollRes.json();
    
    if (pollData?.code !== 0 || !pollData?.data?.url) {
      throw new Error('Failed to get download URL');
    }

    const csvRes = await fetch(pollData.data.url, { next: { revalidate: 86400 } });
    const csvText = await csvRes.text();

    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 3) continue;
      
      const year = parts[0];
      const mode = parts[1];
      const ridership = parseFloat(parts[2]);

      parsedData.push({
        year,
        mode,
        ridership: isNaN(ridership) ? 0 : ridership
      });
    }

    return (
      <main className="min-h-screen bg-[#FBF9F5]">
        <RidershipDashboard data={parsedData} />
      </main>
    );

  } catch (error) {
    console.error('Ridership data fetch error:', error);
    return <ErrorState />;
  }
}
