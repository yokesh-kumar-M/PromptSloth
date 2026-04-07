const apiUrl = 'http://localhost:8000/api/templates/';

document.getElementById('saveBtn').addEventListener('click', async () => {
    const title = document.getElementById('title').value;
    const shortcut = document.getElementById('shortcut').value;
    const content = document.getElementById('content').value;

    if (!title || !shortcut || !content) {
        alert("Please fill all fields.");
        return;
    }

    try {
        await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, shortcut, content })
        });
        
        document.getElementById('title').value = '';
        document.getElementById('shortcut').value = '';
        document.getElementById('content').value = '';
        loadTemplates();
    } catch (e) {
        console.error("Error saving template:", e);
        alert("Error saving template. Ensure Django backend is running.");
    }
});

async function loadTemplates() {
    try {
        const res = await fetch(apiUrl);
        if (res.ok) {
            const templates = await res.json();
            const list = document.getElementById('templateList');
            list.innerHTML = templates.map(t => `<div class="template-item"><strong>${t.shortcut}</strong>: ${t.title}</div>`).join('');
        }
    } catch (e) {
        console.error("Error loading templates:", e);
        document.getElementById('templateList').innerHTML = '<div style="color:red;">Could not load templates. Is Django running?</div>';
    }
}

loadTemplates();