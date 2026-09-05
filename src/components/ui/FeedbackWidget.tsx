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
    <div className="fixed bottom-4 right-4 md:bottom-5 md:right-5 z-[100] font-sans">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px] border border-[#243324]/10 overflow-hidden flex flex-col transform transition-all duration-300 origin-bottom-right">
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

          {/* Footer for direct LinkedIn contact */}
          <div className="border-t border-[#243324]/10 bg-[#FBF9F5] px-4 py-2.5 text-center">
            <p className="text-xs text-[#243324]/70 flex items-center justify-center gap-1.5 flex-wrap">
              <span>or</span>
              <a
                href="https://www.linkedin.com/in/shiyunfoo/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#0A66C2] hover:text-[#004182] font-medium hover:underline transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
                <span>contact me directly via LinkedIn</span>
              </a>
            </p>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[#243324] hover:bg-[#3B4D36] text-white px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5 group text-xs font-medium"
          aria-label="Send Feedback"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Feedback</span>
        </button>
      )}
    </div>
  );
}
