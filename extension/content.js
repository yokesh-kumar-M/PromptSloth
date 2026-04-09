let activeElement = null;
let templates = [];
let templatePopup = null;

// Fetch templates from backend on load
chrome.runtime.sendMessage({ action: "get_templates" }, (response) => {
    if (response && response.templates) {
        templates = response.templates;
    }
});

// Listen for typing
document.addEventListener('input', function(event) {
    const target = event.target;
    if (target.tagName.toLowerCase() === 'textarea' || target.isContentEditable || (target.tagName.toLowerCase() === 'input' && target.type === 'text')) {
        const text = target.value !== undefined ? target.value : target.innerText;
        
        // Handle //enhance trigger
        if (text && text.trim().endsWith('//enhance')) {
            const lastIndex = text.lastIndexOf('//enhance');
            const promptToEnhance = text.substring(0, lastIndex).trim();
            
            updateText(target, "Enhancing prompt... ⏳");

            chrome.runtime.sendMessage(
                { action: "enhance_prompt", text: promptToEnhance }, 
                function(response) {
                    updateText(target, response?.enhancedText || "Error: Could not enhance prompt.");
                }
            );
        }
        
        // Handle // trigger for templates
        if (text && text.endsWith('//')) {
            showTemplateMenu(target);
        } else if (templatePopup && templatePopup.style.display === 'block' && !text.includes('//')) {
            hideTemplateMenu();
        }
    }
});

function showTemplateMenu(target) {
    if (!templatePopup) {
        templatePopup = document.createElement('div');
        templatePopup.id = 'prompt-enhancer-menu';
        templatePopup.style.cssText = `
            position: absolute;
            z-index: 10000;
            background: #1e1e2f;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 5px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: sans-serif;
            color: white;
            min-width: 200px;
        `;
        document.body.appendChild(templatePopup);
    }
    
    // Refresh templates just in case
    chrome.runtime.sendMessage({ action: "get_templates" }, (response) => {
        if (response && response.templates) {
            templates = response.templates;
        }
        
        if (templates.length === 0) {
            templatePopup.innerHTML = '<div style="padding: 8px 12px; font-size: 13px; color: #aaa;">No templates found. Add them in the extension popup.</div>';
        } else {
            templatePopup.innerHTML = '';
            templates.forEach(t => {
                const item = document.createElement('div');
                item.style.cssText = 'padding: 8px 12px; font-size: 13px; cursor: pointer; transition: background 0.2s;';
                item.innerHTML = `<strong style="color: #a78bfa;">${t.shortcut}</strong> - ${t.title}`;
                item.onmouseover = () => item.style.background = '#2d2d44';
                item.onmouseout = () => item.style.background = 'transparent';
                item.onclick = () => {
                    const text = target.value !== undefined ? target.value : target.innerText;
                    const newText = text.substring(0, text.lastIndexOf('//')) + t.content;
                    updateText(target, newText);
                    hideTemplateMenu();
                };
                templatePopup.appendChild(item);
            });
        }
        
        const rect = target.getBoundingClientRect();
        templatePopup.style.top = `${window.scrollY + rect.bottom + 5}px`;
        templatePopup.style.left = `${window.scrollX + rect.left}px`;
        templatePopup.style.display = 'block';
    });
}

function hideTemplateMenu() {
    if (templatePopup) templatePopup.style.display = 'none';
}

// Inject floating ✨ button on focus
document.addEventListener('focusin', function(event) {
    const target = event.target;
    if (target.tagName.toLowerCase() === 'textarea' || target.isContentEditable || (target.tagName.toLowerCase() === 'input' && target.type === 'text')) {
        activeElement = target;
        showFloatingButton(target);
    }
});

function updateText(target, text) {
    if (target.value !== undefined) {
        target.value = text;
        // Trigger input event so React/Vue apps know the value changed
        target.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        target.innerText = text;
        target.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

function showFloatingButton(target) {
    let btn = document.getElementById('prompt-enhancer-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'prompt-enhancer-btn';
        btn.innerHTML = '✨';
        btn.title = "Enhance Prompt";
        btn.style.cssText = `
            position: absolute; 
            z-index: 9999; 
            background: #6366f1; 
            color: white; 
            border: none; 
            width: 28px; 
            height: 28px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(99, 102, 241, 0.4);
            transition: transform 0.1s, background 0.1s;
        `;
        btn.onmouseover = () => btn.style.background = '#4f46e5';
        btn.onmouseout = () => btn.style.background = '#6366f1';
        btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
        btn.onmouseup = () => btn.style.transform = 'scale(1)';
        document.body.appendChild(btn);
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (activeElement) {
                const text = activeElement.value !== undefined ? activeElement.value : activeElement.innerText;
                if (!text.trim()) return;
                
                updateText(activeElement, "Enhancing prompt... ⏳");
                chrome.runtime.sendMessage({ action: "enhance_prompt", text: text }, (res) => {
                    updateText(activeElement, res?.enhancedText || "Error: Could not enhance prompt.");
                });
            }
        });
    }
    
    const rect = target.getBoundingClientRect();
    // Position the button nicely inside the text area, bottom right corner
    btn.style.top = `${window.scrollY + rect.bottom - 35}px`;
    btn.style.left = `${window.scrollX + rect.right - 35}px`;
    btn.style.display = 'flex';
}

document.addEventListener('focusout', (e) => {
    setTimeout(() => {
        const btn = document.getElementById('prompt-enhancer-btn');
        if (btn && e.relatedTarget !== btn) {
            btn.style.display = 'none';
        }
    }, 200);
});

// Hide menus when clicking outside
document.addEventListener('click', (e) => {
    if (templatePopup && !templatePopup.contains(e.target) && e.target !== activeElement) {
        hideTemplateMenu();
    }
});