import CommutingDashboard from '@/components/transport/CommutingDashboard';
import { Metadata } from 'next';
import ErrorState from '@/components/ui/ErrorState';

export const metadata: Metadata = {
  title: 'Commuting to Work | SG DataViz',
  description: 'Analyze how Singaporeans commute to work based on the latest census data.',
};

export const dynamic = 'force-dynamic';

export default async function CommutingPage() {
  try {
    const pollRes = await fetch('https://api-open.data.gov.sg/v1/public/api/datasets/d_b2adcabcfc9c4352f3086f1a61f77bc0/poll-download', { next: { revalidate: 86400 } });
    if (!pollRes.ok) throw new Error('Failed to poll dataset');
    const pollData = await pollRes.json();
    
    if (pollData?.code !== 0 || !pollData?.data?.url) {
      throw new Error('Failed to get download URL');
    }

    const csvRes = await fetch(pollData.data.url, { next: { revalidate: 86400 } });
    const csvText = await csvRes.text();

    const lines = csvText.split('\\n').map(l => l.trim()).filter(Boolean);
    // Parse the CSV
    const parsedData = [];
    // Data starts at line 1. Line 0 is header.
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 3) continue;
      
      const mode = parts[0];
      if (mode === 'Total') continue; // Skip the aggregate Total row

      const total = parseFloat(parts[1]);
      const males = parseFloat(parts[2]);
      const females = parseFloat(parts[3]);

      parsedData.push({
        mode,
        total: isNaN(total) ? 0 : total,
        males: isNaN(males) ? 0 : males,
        females: isNaN(females) ? 0 : females
      });
    }

    return (
      <main className="min-h-screen bg-[#FBF9F5]">
        <CommutingDashboard data={parsedData} />
      </main>
    );

  } catch (error) {
    console.error('Commuting data fetch error:', error);
    return <ErrorState />;
  }
}
