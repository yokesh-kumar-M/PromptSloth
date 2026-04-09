import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Key, Check, Loader2 } from 'lucide-react';
import './App.css';
import './index.css';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['geminiApiKey'], (result: any) => {
        if (result.geminiApiKey) {
          setApiKey(result.geminiApiKey as string);
        }
      });
    }
  }, []);

  const saveKey = () => {
    setStatus('loading');
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
        setTimeout(() => {
          setStatus('success');
          setTimeout(() => setStatus('idle'), 2000);
        }, 600); // Artificial delay for premium feel
      });
    } else {
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
      }, 600);
    }
  };

  return (
    <div className="p-5 min-h-[400px] w-[350px] font-sans bg-surface-base text-text-primary gradient-mesh relative overflow-hidden flex flex-col justify-center">
      {/* Decorative Glow */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-magic-primary/20 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-magic-primary/10 rounded-full blur-[60px] pointer-events-none" />

      <header className="mb-8 flex items-center gap-3 relative z-10">
        <div className="p-2 bg-white/5 border border-border-subtle rounded-xl shadow-lg shadow-magic-primary/20">
          <Sparkles className="w-5 h-5 text-magic-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white leading-tight">PromptEnhancer Pro</h1>
          <p className="text-xs text-text-secondary font-medium">Bring Your Own Key</p>
        </div>
      </header>
      
      <main className="relative z-10 flex-1">
        <div className="bg-panel/60 backdrop-blur-xl p-5 rounded-2xl border border-border-subtle shadow-2xl relative overflow-hidden">
          
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-white/90 mb-1.5">
              <Key className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
              API Configuration
            </label>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Enter your Gemini API key to unlock unlimited, serverless enhancements directly in your browser.
            </p>
          </div>
          
          <div className="relative mb-5 group">
            <input 
              type="password"
              className="w-full bg-surface-base/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder-text-secondary/50 focus:outline-none focus:border-magic-primary focus:ring-1 focus:ring-magic-ring transition-all duration-300"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              spellCheck="false"
              autoComplete="off"
            />
            {/* Subtle inset shadow on the input */}
            <div className="absolute inset-0 rounded-xl pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" />
          </div>
          
          <button 
            onClick={saveKey}
            disabled={status !== 'idle'}
            className="relative w-full h-10 bg-magic-primary hover:bg-magic-hover text-white font-medium text-sm rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-90 disabled:cursor-not-allowed group overflow-hidden"
          >
            {/* Button subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  Save API Key
                </motion.span>
              )}
              {status === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                </motion.div>
              )}
              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-5 h-5" strokeWidth={2} />
                  <span>Saved</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </main>

      <footer className="mt-6 flex items-center justify-center gap-2 text-xs text-text-secondary relative z-10">
        <div className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`}></div>
        {apiKey ? 'System Ready' : 'Key Required'}
      </footer>
    </div>
  );
}

export default App;
