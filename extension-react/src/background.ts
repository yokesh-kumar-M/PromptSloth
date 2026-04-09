console.log('Prompt Enhancer: Background script initialized.');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Prompt Enhancer Extension installed.');
});

async function streamGeminiAPI(apiKey: string, prompt: string, action: string, port: chrome.runtime.Port) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}`;
  
  let systemInstruction = "You are an AI assistant that improves text.";
  if (action === "Enhance") {
    systemInstruction = "You are a prompt engineer. Enhance the user's prompt to be extremely clear, detailed, and structured for an AI to understand. Provide ONLY the enhanced prompt text, without any conversational filler or preambles.";
  } else if (action === "Professional") {
    systemInstruction = "Rewrite the user's text to be highly professional, polite, and suitable for a corporate environment or email. Provide ONLY the rewritten text.";
  } else if (action === "Shorten") {
    systemInstruction = "Shorten the user's text while keeping the core meaning intact. Make it concise and punchy. Provide ONLY the shortened text.";
  }

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    systemInstruction: {
      parts: [{
        text: systemInstruction
      }]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API Error');
    }

    if (!response.body) {
       throw new Error('ReadableStream not yet supported in this browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullTextSoFar = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // Basic JSON chunk extraction
      const matches = [...chunk.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
      
      for (const match of matches) {
        try {
          const unescaped = JSON.parse(`"${match[1]}"`);
          fullTextSoFar += unescaped;
        } catch(e) {
          // ignore
        }
      }
      
      if (fullTextSoFar) {
         port.postMessage({ type: 'chunk', text: fullTextSoFar });
      }
    }
    
    port.postMessage({ type: 'done', text: fullTextSoFar });

  } catch (error: any) {
    port.postMessage({ type: 'error', error: error.message || 'Failed to stream response' });
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "enhance-stream") {
    port.onMessage.addListener(async (msg) => {
      if (msg.action === 'startStream') {
        chrome.storage.local.get(['geminiApiKey'], async (result) => {
          const apiKey = result.geminiApiKey as string;
          if (!apiKey) {
            port.postMessage({ type: 'error', error: 'Please set your Gemini API key in the popup.' });
            return;
          }
          await streamGeminiAPI(apiKey, msg.text, msg.promptType, port);
        });
      }
    });
  }
});
