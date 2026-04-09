import { createRoot } from 'react-dom/client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Briefcase, Scissors, Loader2 } from 'lucide-react';
import styleText from './index.css?inline';

console.log('Prompt Enhancer: Content script loaded');

// ------------- 1. Bulletproof Text Injection -------------
function injectText(element: HTMLElement, newText: string) {
  element.focus();

  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    element.setSelectionRange(0, element.value.length);
    const success = document.execCommand('insertText', false, newText);
    if (!success) {
      element.value = newText;
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);
    }
  } else if (element.isContentEditable) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    const success = document.execCommand('insertText', false, newText);
    if (!success) {
      element.innerText = newText;
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }
  }
}

// ------------- 2. The React UI Overlay -------------
function PromptEnhancerOverlay({ hostElement }: { hostElement: HTMLElement }) {
  const [activeEl, setActiveEl] = useState<HTMLElement | null>(null);
  const [buttonPos, setButtonPos] = useState({ top: -9999, left: -9999 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (hostElement.contains(target)) return;

      if (
        target.tagName.toLowerCase() === 'textarea' ||
        target.isContentEditable ||
        (target.tagName.toLowerCase() === 'input' && (target as HTMLInputElement).type === 'text')
      ) {
        setActiveEl(target);
        updatePosition(target);
        setIsMenuOpen(false);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideMenu = menuRef.current?.contains(target) || hostElement.contains(target);
      
      if (!clickedInsideMenu) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('click', handleClick);
    
    const handleResizeOrScroll = () => {
      if (activeEl) updatePosition(activeEl);
    };
    
    window.addEventListener('resize', handleResizeOrScroll);
    document.addEventListener('scroll', handleResizeOrScroll, true);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResizeOrScroll);
      document.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [activeEl, hostElement]);

  const updatePosition = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setButtonPos({
      top: rect.bottom + window.scrollY - 36,
      left: rect.right + window.scrollX - 36,
    });
  };

  const handleAction = async (promptEngine: string) => {
    if (!activeEl) return;
    
    let currentText = '';
    if (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement) {
      currentText = activeEl.value;
    } else {
      currentText = activeEl.innerText;
    }

    if (!currentText.trim()) return;

    setIsProcessing(true);
    setIsMenuOpen(false);
    
    injectText(activeEl, "✨ Enhancing prompt...");

    try {
      const port = chrome.runtime.connect({ name: "enhance-stream" });
      
      port.postMessage({
        action: 'startStream',
        promptType: promptEngine,
        text: currentText
      });

      port.onMessage.addListener((msg) => {
        if (msg.type === 'chunk' && msg.text) {
           injectText(activeEl, msg.text);
        } else if (msg.type === 'done') {
           setIsProcessing(false);
           port.disconnect();
        } else if (msg.type === 'error') {
           console.error('API Error:', msg.error);
           injectText(activeEl, currentText);
           setIsProcessing(false);
           port.disconnect();
           alert("Extension error: " + msg.error);
        }
      });
      
    } catch (err) {
      console.error('Error sending message:', err);
      setIsProcessing(false);
      injectText(activeEl, currentText);
    }
  };

  if (!activeEl) return null;

  return (
    <div style={{ position: 'absolute', top: buttonPos.top, left: buttonPos.left, zIndex: 2147483647 }} className="font-sans text-text-primary">
      <AnimatePresence>
        {!isMenuOpen && !isProcessing && (
          <motion.button 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={(e) => { e.preventDefault(); setIsMenuOpen(true); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer backdrop-blur-md transition-colors duration-300 ${
              isHovered 
                ? 'bg-magic-primary border-magic-primary shadow-[0_0_15px_rgba(139,92,246,0.4)]' 
                : 'bg-surface-elevated border-border-subtle shadow-md'
            }`}
            title="PromptEnhancer Pro"
          >
            <Sparkles className={`w-4 h-4 ${isHovered ? 'text-white' : 'text-text-primary'}`} strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Loading Indicator over the button position */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-magic-ring bg-surface-elevated backdrop-blur-md shadow-md"
          >
            <Loader2 className="w-4 h-4 text-magic-primary animate-spin" strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-0 right-0 bg-surface-elevated backdrop-blur-2xl border border-border-subtle shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),_0_0_20px_rgba(139,92,246,0.1)] rounded-2xl p-2 w-52 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
          >
            <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2 px-3 pt-1">
              Magic Actions
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <ActionButton 
                icon={<Wand2 className="w-4 h-4 text-magic-primary" strokeWidth={1.5} />} 
                label="Enhance Prompt" 
                onClick={() => handleAction("Enhance")} 
              />
              <ActionButton 
                icon={<Briefcase className="w-4 h-4 text-blue-400" strokeWidth={1.5} />} 
                label="Make Professional" 
                onClick={() => handleAction("Professional")} 
              />
              <ActionButton 
                icon={<Scissors className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />} 
                label="Shorten & Refine" 
                onClick={() => handleAction("Shorten")} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="group w-full text-left px-3 py-2 text-sm text-text-primary bg-transparent border-0 hover:bg-white/5 rounded-xl transition-all duration-200 flex items-center cursor-pointer relative overflow-hidden"
    >
      <span className="mr-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:scale-110">
        {icon}
      </span>
      <span className="font-medium tracking-tight relative z-10">{label}</span>
    </button>
  );
}

function init() {
  const container = document.createElement('div');
  container.id = 'prompt-enhancer-root';
  document.body.appendChild(container);
  
  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  const style = document.createElement('style');
  style.textContent = styleText;
  shadowRoot.appendChild(style);

  const reactRoot = document.createElement('div');
  shadowRoot.appendChild(reactRoot);
  
  const root = createRoot(reactRoot);
  root.render(<PromptEnhancerOverlay hostElement={container} />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
