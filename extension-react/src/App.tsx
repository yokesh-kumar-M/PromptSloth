import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Key, Check, Loader2, History, Settings, 
  BookTemplate, Trash2, Clock, ChevronRight, ExternalLink,
  Wand2, Briefcase, Scissors, Code, Zap, Copy, Search
} from 'lucide-react';
import './App.css';
import './index.css';

type Tab = 'home' | 'history' | 'templates' | 'settings';

interface HistoryItem {
  id: string;
  original: string;
  enhanced: string;
  type: string;
  timestamp: number;
  domain?: string;
}

interface Template {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  category: string;
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, today: 0 });

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['geminiApiKey'], (result: any) => {
        if (result.geminiApiKey) setApiKey(result.geminiApiKey as string);
      });
    }
    loadHistory();
    loadTemplates();
  }, []);

  const loadHistory = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'getHistory' }, (response: any) => {
        if (response?.history) {
          setHistory(response.history);
          const today = new Date().toDateString();
          const todayCount = response.history.filter((h: HistoryItem) => 
            new Date(h.timestamp).toDateString() === today
          ).length;
          setStats({ total: response.history.length, today: todayCount });
        }
      });
    }
  };

  const loadTemplates = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'getTemplates' }, (response: any) => {
        if (response?.templates) setTemplates(response.templates);
      });
    }
  };

  const saveKey = () => {
    if (!apiKey.trim()) return;
    setStatus('loading');
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
        setTimeout(() => {
          setStatus('success');
          setTimeout(() => setStatus('idle'), 2000);
        }, 500);
      });
    } else {
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
      }, 500);
    }
  };

  const clearHistory = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'clearHistory' }, () => {
        setHistory([]);
        setStats({ total: 0, today: 0 });
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    const iconProps = { style: { width: 12, height: 12 }, strokeWidth: 2 };
    switch (type) {
      case 'Enhance': return <Wand2 {...iconProps} style={{ ...iconProps.style, color: '#8B5CF6' }} />;
      case 'Professional': return <Briefcase {...iconProps} style={{ ...iconProps.style, color: '#3B82F6' }} />;
      case 'Shorten': return <Scissors {...iconProps} style={{ ...iconProps.style, color: '#10B981' }} />;
      case 'Code': return <Code {...iconProps} style={{ ...iconProps.style, color: '#F59E0B' }} />;
      case 'Creative': return <Zap {...iconProps} style={{ ...iconProps.style, color: '#EC4899' }} />;
      default: return <Sparkles {...iconProps} style={{ ...iconProps.style, color: '#8B5CF6' }} />;
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="popup-container">
      {/* Decorative glows */}
      <div className="glow glow-top" />
      <div className="glow glow-bottom" />

      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="header-icon-wrap">
            <Sparkles className="header-icon" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="header-title">PromptEnhancer Pro</h1>
            <p className="header-subtitle">Unlimited · BYOK · v2.0</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav">
        {[
          { id: 'home' as Tab, icon: <Key style={{ width: 14, height: 14 }} strokeWidth={1.5} />, label: 'API Key' },
          { id: 'history' as Tab, icon: <History style={{ width: 14, height: 14 }} strokeWidth={1.5} />, label: 'History' },
          { id: 'templates' as Tab, icon: <BookTemplate style={{ width: 14, height: 14 }} strokeWidth={1.5} />, label: 'Templates' },
          { id: 'settings' as Tab, icon: <Settings style={{ width: 14, height: 14 }} strokeWidth={1.5} />, label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {/* ============ HOME TAB ============ */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Stats Bar */}
              <div className="stats-bar">
                <div className="stat-item">
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">Total Enhanced</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value">{stats.today}</span>
                  <span className="stat-label">Today</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value">∞</span>
                  <span className="stat-label">Credits Left</span>
                </div>
              </div>

              {/* API Key Card */}
              <div className="card">
                <label className="card-label">
                  <Key style={{ width: 14, height: 14, color: '#A1A1AA' }} strokeWidth={1.5} />
                  API Configuration
                </label>
                <p className="card-description">
                  Enter your free Gemini API key from{' '}
                  <a 
                    href="https://aistudio.google.com/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="link"
                  >
                    Google AI Studio <ExternalLink style={{ width: 10, height: 10, display: 'inline' }} />
                  </a>{' '}
                  to unlock unlimited enhancements.
                </p>

                <div className="input-group">
                  <input 
                    type="password"
                    className="input"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    spellCheck="false"
                    autoComplete="off"
                    onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                  />
                </div>
                
                <button 
                  onClick={saveKey}
                  disabled={status !== 'idle' || !apiKey.trim()}
                  className="btn-primary"
                >
                  <AnimatePresence mode="wait">
                    {status === 'idle' && (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        Save API Key
                      </motion.span>
                    )}
                    {status === 'loading' && (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} strokeWidth={2} />
                      </motion.div>
                    )}
                    {status === 'success' && (
                      <motion.div key="success" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="btn-success-content">
                        <Check style={{ width: 18, height: 18 }} strokeWidth={2} />
                        <span>Saved</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              {/* Quick Guide */}
              <div className="card guide-card">
                <div className="guide-title">How to Use</div>
                <div className="guide-steps">
                  <div className="guide-step">
                    <span className="guide-step-num">1</span>
                    <span>Click the <Sparkles style={{ width: 12, height: 12, color: '#8B5CF6', display: 'inline' }} /> button on any text input</span>
                  </div>
                  <div className="guide-step">
                    <span className="guide-step-num">2</span>
                    <span>Choose an enhancement action</span>
                  </div>
                  <div className="guide-step">
                    <span className="guide-step-num">3</span>
                    <span>Watch your prompt get enhanced in real-time ✨</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============ HISTORY TAB ============ */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              {history.length === 0 ? (
                <div className="empty-state">
                  <Clock style={{ width: 32, height: 32, color: '#3F3F46' }} strokeWidth={1} />
                  <p>No history yet</p>
                  <span>Enhanced prompts will appear here</span>
                </div>
              ) : (
                <>
                  <div className="history-header">
                    <span className="history-count">{history.length} enhancements</span>
                    <button className="text-btn danger" onClick={clearHistory}>
                      <Trash2 style={{ width: 12, height: 12 }} /> Clear All
                    </button>
                  </div>
                  <div className="history-list">
                    {history.slice(0, 20).map((item) => (
                      <div key={item.id} className="history-item">
                        <div className="history-item-header">
                          <div className="history-item-meta">
                            {getTypeIcon(item.type)}
                            <span className="history-type">{item.type}</span>
                            <span className="history-time">{formatTime(item.timestamp)}</span>
                          </div>
                          <button 
                            className="icon-btn"
                            onClick={() => copyToClipboard(item.enhanced, item.id)}
                          >
                            {copiedId === item.id 
                              ? <Check style={{ width: 12, height: 12, color: '#10B981' }} strokeWidth={2} />
                              : <Copy style={{ width: 12, height: 12 }} strokeWidth={1.5} />
                            }
                          </button>
                        </div>
                        <div className="history-original">
                          {item.original.substring(0, 80)}{item.original.length > 80 ? '...' : ''}
                        </div>
                        <div className="history-enhanced">
                          <ChevronRight style={{ width: 10, height: 10, color: '#8B5CF6', flexShrink: 0 }} />
                          {item.enhanced.substring(0, 120)}{item.enhanced.length > 120 ? '...' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ============ TEMPLATES TAB ============ */}
          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="search-bar">
                <Search style={{ width: 14, height: 14, color: '#52525B' }} strokeWidth={1.5} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="template-list">
                {filteredTemplates.map((t) => (
                  <div key={t.id} className="template-item">
                    <div className="template-header">
                      <span className="template-shortcut">{t.shortcut}</span>
                      <span className="template-category">{t.category}</span>
                    </div>
                    <div className="template-title">{t.title}</div>
                    <div className="template-content">
                      {t.content.substring(0, 90)}...
                    </div>
                    <button 
                      className="template-copy-btn"
                      onClick={() => copyToClipboard(t.content, t.id)}
                    >
                      {copiedId === t.id 
                        ? <><Check style={{ width: 12, height: 12, color: '#10B981' }} strokeWidth={2} /> Copied!</>
                        : <><Copy style={{ width: 12, height: 12 }} strokeWidth={1.5} /> Copy</>
                      }
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ============ SETTINGS TAB ============ */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="card">
                <div className="setting-item">
                  <div>
                    <div className="setting-label">AI Model</div>
                    <div className="setting-desc">Current model for enhancements</div>
                  </div>
                  <div className="setting-badge">Gemini 2.5 Flash</div>
                </div>

                <div className="setting-divider" />
                
                <div className="setting-item">
                  <div>
                    <div className="setting-label">Auto-Detect Inputs</div>
                    <div className="setting-desc">Show button on all text fields</div>
                  </div>
                  <div className="setting-badge active">Active</div>
                </div>
                
                <div className="setting-divider" />

                <div className="setting-item">
                  <div>
                    <div className="setting-label">History Limit</div>
                    <div className="setting-desc">Max stored enhancements</div>
                  </div>
                  <div className="setting-badge">50</div>
                </div>
              </div>
              
              <div className="card">
                <div className="setting-label" style={{ marginBottom: 8 }}>Supported Platforms</div>
                <div className="platform-list">
                  {['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Copilot', 'Poe', 'Any Website'].map((p) => (
                    <div key={p} className="platform-badge">
                      <div className="platform-dot" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card about-card">
                <div className="setting-label">About</div>
                <div className="setting-desc" style={{ marginTop: 4 }}>
                  PromptEnhancer Pro v2.0 — Your AI prompt co-pilot. 
                  Unlimited usage with your own API key. No credits, no limits, no subscriptions.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Status */}
      <footer className="footer">
        <div className={`status-dot ${apiKey ? 'active' : ''}`} />
        {apiKey ? 'System Ready' : 'API Key Required'}
      </footer>
    </div>
  );
}

export default App;
