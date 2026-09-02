import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ErrorState() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#FBF9F5] p-4 text-center">
      <Card className="max-w-md w-full shadow-sm border-[#243324]/10 bg-white/60 backdrop-blur-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-serif text-[#243324] mb-2">Connection Error</h2>
          <p className="text-[#243324]/70 font-sans mb-6">
            Unable to connect to the data node. Please check your connection or try again later.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#243324] text-[#FBF9F5] rounded-md font-sans text-sm hover:bg-[#3B4D36] transition-colors"
          >
            Retry Connection
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
