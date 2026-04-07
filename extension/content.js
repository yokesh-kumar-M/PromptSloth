let activeElement = null;

// Listen for typing //enhance
document.addEventListener('input', function(event) {
    const target = event.target;
    if (target.tagName.toLowerCase() === 'textarea' || target.isContentEditable || (target.tagName.toLowerCase() === 'input' && target.type === 'text')) {
        const text = target.value !== undefined ? target.value : target.innerText;
        
        // Make matching more robust, ignore trailing spaces
        if (text && text.trim().endsWith('//enhance')) {
            // Find the last occurrence and replace it
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
    }
});

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
    } else {
        target.innerText = text;
    }
}

function showFloatingButton(target) {
    let btn = document.getElementById('prompt-sloth-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'prompt-sloth-btn';
        btn.innerText = '✨ Enhance';
        btn.style.cssText = 'position:absolute; z-index:9999; background:#6366f1; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;';
        document.body.appendChild(btn);
        
        btn.addEventListener('click', () => {
            if (activeElement) {
                const text = activeElement.value || activeElement.innerText;
                updateText(activeElement, "Enhancing prompt... ⏳");
                chrome.runtime.sendMessage({ action: "enhance_prompt", text: text }, (res) => {
                    updateText(activeElement, res?.enhancedText || "Error: Could not enhance prompt.");
                });
            }
        });
    }
    
    const rect = target.getBoundingClientRect();
    btn.style.top = `${window.scrollY + rect.bottom + 5}px`;
    btn.style.left = `${window.scrollX + rect.right - 80}px`;
    btn.style.display = 'block';
}

document.addEventListener('focusout', (e) => {
    setTimeout(() => {
        const btn = document.getElementById('prompt-sloth-btn');
        // keep it active if the clicked target was the button itself
        if (btn && e.relatedTarget !== btn) {
            btn.style.display = 'none';
        }
    }, 200);
});