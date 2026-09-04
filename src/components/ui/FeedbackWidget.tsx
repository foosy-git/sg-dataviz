'use client';

import { useState, useEffect } from 'react';
import { MessageSquarePlus, X, Send, Loader2 } from 'lucide-react';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('Enhancement');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot field for bot detection
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-feedback', handleOpen);
    return () => window.removeEventListener('open-feedback', handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, email, website }),
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          setIsOpen(false);
          setStatus('idle');
          setMessage('');
          setEmail('');
          setWebsite('');
        }, 3000);
      } else {
        throw new Error('Failed to submit');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      
      // Fallback to mailto if API fails or isn't configured
      const subject = encodeURIComponent(`[SG DataViz ${type}] Feedback`);
      const body = encodeURIComponent(`From: ${email || 'Anonymous'}\n\nMessage:\n${message}`);
      window.location.href = `mailto:shiyunn.dream@gmail.com?subject=${subject}&body=${body}`;
      
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl w-[320px] md:w-[360px] border border-[#243324]/10 overflow-hidden flex flex-col transform transition-all duration-300 origin-bottom-right">
          <div className="bg-[#243324] p-4 flex justify-between items-center text-white">
            <h3 className="font-serif font-medium text-lg flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5" />
              Send Feedback
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {status === 'success' ? (
              <div className="py-8 text-center text-emerald-600 flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                  <Send className="w-6 h-6" />
                </div>
                <p className="font-medium text-lg">Thank you!</p>
                <p className="text-sm text-[#243324]/60">Your feedback has been logged.</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#243324]/70 uppercase tracking-wider">Feedback Type</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value)}
                    className="w-full bg-[#FBF9F5] border border-[#243324]/20 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4D36]"
                  >
                    <option value="Enhancement">Enhancement / Idea</option>
                    <option value="Bug">Bug Report</option>
                    <option value="Data Issue">Data Accuracy Issue</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {/* Honeypot field - invisible to humans, catches automated spam bots */}
                <div className="hidden" aria-hidden="true">
                  <input 
                    type="text" 
                    name="website" 
                    tabIndex={-1} 
                    autoComplete="off" 
                    value={website} 
                    onChange={e => setWebsite(e.target.value)} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#243324]/70 uppercase tracking-wider">Your Email (Optional)</label>
                  <input 
                    type="email" 
                    maxLength={100}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#FBF9F5] border border-[#243324]/20 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4D36]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#243324]/70 uppercase tracking-wider">Message</label>
                  <textarea 
                    required
                    maxLength={2000}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="How can we improve this dashboard?"
                    rows={4}
                    className="w-full bg-[#FBF9F5] border border-[#243324]/20 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4D36] resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={status === 'loading'}
                  className="w-full mt-2 bg-[#243324] hover:bg-[#3B4D36] text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {status === 'loading' ? 'Sending...' : 'Submit Feedback'}
                </button>
                
                {status === 'error' && (
                  <p className="text-xs text-red-500 text-center mt-1">Failed to send via API. Redirecting to email client...</p>
                )}
              </>
            )}
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[#243324] hover:bg-[#3B4D36] text-white px-5 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2.5 group"
          aria-label="Send Feedback"
        >
          <MessageSquarePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-sm pr-1">Feedback</span>
        </button>
      )}
    </div>
  );
}
