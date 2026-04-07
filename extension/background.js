chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "enhance_prompt") {
        const apiUrl = 'http://localhost:8000/api/enhance/'; 

        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_prompt: request.text })
        })
        .then(response => response.json())
        .then(data => sendResponse({ enhancedText: data.enhanced_prompt }))
        .catch(error => {
            console.error('API Error:', error);
            sendResponse({ enhancedText: null });
        });
        return true; 
    }
    
    if (request.action === "get_templates") {
        fetch('http://localhost:8000/api/templates/')
            .then(res => res.json())
            .then(data => sendResponse({ templates: data }))
            .catch(error => {
                console.error('Template fetch Error:', error);
                sendResponse({ templates: [] });
            });
        return true;
    }
});