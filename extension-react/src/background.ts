console.log('[PromptEnhancer Pro] Background service worker initialized.');

// ======================== INSTALLATION ========================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[PromptEnhancer Pro] Extension installed:', details.reason);
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'enhance-selection',
    title: '✨ Enhance with PromptEnhancer Pro',
    contexts: ['selection'],
  });
  
  // Seed default templates if first install
  if (details.reason === 'install') {
    chrome.storage.local.set({
      promptHistory: [],
      customTemplates: DEFAULT_TEMPLATES,
      settings: {
        model: 'gemini-2.5-flash',
        autoDetect: true,
        historyLimit: 50,
      },
    });
  }
});

// ======================== DEFAULT TEMPLATES ========================

const DEFAULT_TEMPLATES = [
  { id: '1', shortcut: '//code', title: 'Code Expert', content: 'You are an expert programmer. Write clean, well-documented, production-ready code for: ', category: 'coding' },
  { id: '2', shortcut: '//debug', title: 'Debug Helper', content: 'Analyze the following code and identify bugs, performance issues, and suggest fixes with explanations: ', category: 'coding' },
  { id: '3', shortcut: '//review', title: 'Code Review', content: 'Perform a thorough code review. Check for security issues, edge cases, naming conventions, and best practices: ', category: 'coding' },
  { id: '4', shortcut: '//email', title: 'Professional Email', content: 'Write a professional, concise email about the following topic. Use appropriate tone and formatting: ', category: 'writing' },
  { id: '5', shortcut: '//blog', title: 'Blog Post', content: 'Write an engaging, SEO-optimized blog post about the following topic. Include headers, bullet points, and a call to action: ', category: 'writing' },
  { id: '6', shortcut: '//explain', title: 'Explain Simply', content: 'Explain the following concept in simple terms that a beginner would understand. Use analogies and examples: ', category: 'learning' },
  { id: '7', shortcut: '//compare', title: 'Compare & Contrast', content: 'Create a detailed comparison of the following items. Include a table, pros/cons, and a recommendation: ', category: 'analysis' },
  { id: '8', shortcut: '//brainstorm', title: 'Brainstorm Ideas', content: 'Generate 10 creative and unique ideas for the following. Think outside the box and include brief explanations: ', category: 'creative' },
  { id: '9', shortcut: '//summarize', title: 'Summarize', content: 'Provide a clear, structured summary of the following content. Include key points, takeaways, and action items: ', category: 'analysis' },
  { id: '10', shortcut: '//refactor', title: 'Refactor Code', content: 'Refactor the following code to improve readability, performance, and maintainability. Explain each change: ', category: 'coding' },
  { id: '11', shortcut: '//test', title: 'Write Tests', content: 'Write comprehensive unit tests for the following code. Cover edge cases, error handling, and happy paths: ', category: 'coding' },
  { id: '12', shortcut: '//pitch', title: 'Elevator Pitch', content: 'Create a compelling 60-second elevator pitch for the following product/idea. Focus on the value proposition: ', category: 'business' },
  { id: '13', shortcut: '//seo', title: 'SEO Content', content: 'Optimize the following content for SEO. Include keyword suggestions, meta description, and heading structure: ', category: 'marketing' },
  { id: '14', shortcut: '//tweet', title: 'Twitter Thread', content: 'Create an engaging Twitter/X thread (5-8 tweets) about the following topic. Make it viral-worthy: ', category: 'social' },
  { id: '15', shortcut: '//linkedin', title: 'LinkedIn Post', content: 'Write a professional LinkedIn post about the following. Include a hook, story, insight, and CTA: ', category: 'social' },
];

// ======================== SYSTEM PROMPTS ========================

const SYSTEM_PROMPTS: Record<string, string> = {
  Enhance: `You are a world-class prompt engineer. Transform the user's vague request into a highly structured, context-rich prompt optimized for AI models.

Rules:
- Add clear context, constraints, and desired output format
- Include role definition, task description, and success criteria  
- Use markdown formatting where appropriate
- Return ONLY the enhanced prompt, no explanations or preambles
- Make it 3-5x more detailed than the original`,

  Professional: `You are an expert business communications specialist. Rewrite the user's text to be highly professional, articulate, and suitable for corporate environments.

Rules:
- Use formal but natural language
- Maintain the original meaning
- Fix grammar, tone, and structure
- Return ONLY the rewritten text
- Keep it concise yet impactful`,

  Shorten: `You are a concise writing expert. Shorten the user's text while preserving ALL key information and meaning.

Rules:
- Cut unnecessary words and redundancies
- Use active voice
- Maintain the core message
- Return ONLY the shortened text
- Aim for 40-60% of original length`,

  Code: `You are a senior software architect. Transform the user's request into a precise, technical prompt optimized for code generation.

Rules:
- Specify programming language, framework, and version
- Include input/output specifications
- Add error handling and edge case requirements
- Request code documentation and type annotations
- Return ONLY the enhanced technical prompt`,

  Creative: `You are a creative writing virtuoso. Transform the user's text into something vivid, imaginative, and emotionally engaging.

Rules:
- Use sensory language and powerful metaphors
- Add emotional depth and narrative flair
- Maintain the original intent
- Return ONLY the enhanced text
- Make it memorable and share-worthy`,
};

// ======================== STREAMING API ========================

async function streamGeminiAPI(apiKey: string, prompt: string, action: string, port: chrome.runtime.Port) {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;
  
  const systemInstruction = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.Enhance;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: action === 'Creative' ? 0.9 : 0.7,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      const errorMsg = err.error?.message || `HTTP ${response.status}`;
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 403) {
        throw new Error('API key is invalid or has insufficient permissions. Check your key in the popup.');
      }
      throw new Error(errorMsg);
    }

    if (!response.body) {
      throw new Error('Streaming not supported in this environment.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullTextSoFar = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // Extract text from streaming JSON chunks
      const matches = [...chunk.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
      
      for (const match of matches) {
        try {
          const unescaped = JSON.parse(`"${match[1]}"`);
          fullTextSoFar += unescaped;
        } catch(_) {
          // ignore malformed chunks
        }
      }
      
      if (fullTextSoFar) {
        port.postMessage({ type: 'chunk', text: fullTextSoFar });
      }
    }
    
    port.postMessage({ type: 'done', text: fullTextSoFar });

  } catch (error: any) {
    port.postMessage({ 
      type: 'error', 
      error: error.message || 'Failed to enhance prompt. Check your API key and try again.',
    });
  }
}

// ======================== MESSAGE HANDLERS ========================

// Streaming connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'enhance-stream') {
    port.onMessage.addListener(async (msg) => {
      if (msg.action === 'startStream') {
        chrome.storage.local.get(['geminiApiKey'], async (result) => {
          const apiKey = result.geminiApiKey as string;
          if (!apiKey) {
            port.postMessage({ 
              type: 'error', 
              error: 'No API key configured. Click the extension icon to set your Gemini API key.',
            });
            return;
          }
          await streamGeminiAPI(apiKey, msg.text, msg.promptType, port);
        });
      }
    });
  }
});

// One-shot messages
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'saveHistory') {
    chrome.storage.local.get(['promptHistory', 'settings'], (result) => {
      const history = (result.promptHistory || []) as any[];
      const settings = (result.settings || { historyLimit: 50 }) as { historyLimit: number };
      
      history.unshift({
        id: Date.now().toString(),
        original: request.original,
        enhanced: request.enhanced,
        type: request.type,
        timestamp: Date.now(),
        domain: request.domain || 'unknown',
      });
      
      // Trim to limit
      const trimmed = history.slice(0, settings.historyLimit || 50);
      chrome.storage.local.set({ promptHistory: trimmed });
    });
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'getTemplates') {
    chrome.storage.local.get(['customTemplates'], (result) => {
      sendResponse({ templates: result.customTemplates || DEFAULT_TEMPLATES });
    });
    return true;
  }
  
  if (request.action === 'getHistory') {
    chrome.storage.local.get(['promptHistory'], (result) => {
      sendResponse({ history: result.promptHistory || [] });
    });
    return true;
  }

  if (request.action === 'clearHistory') {
    chrome.storage.local.set({ promptHistory: [] });
    sendResponse({ success: true });
    return true;
  }
  
  return false;
});

// ======================== CONTEXT MENU ========================

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'enhance-selection' && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'enhanceSelection',
      text: info.selectionText,
    });
  }
});
