// HTML entity decoding
export function decodeHTML(text) {
    if (!text) return text;
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&apos;': "'"
    };
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&apos;/g, m => entities[m]);
}

// Toast notifications
export function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// In‑tab messages (error/success/info)
export function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message show ${type}`;
    setTimeout(() => element.classList.remove('show'), 4000);
}

// Copy and download helpers
export function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

export function downloadCSS(elementId, filename) {
    const css = document.getElementById(elementId).textContent;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(css));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Downloaded ' + filename, 'success');
}

// Clear input field
export function clearInput(inputId) {
    document.getElementById(inputId).value = '';
    document.getElementById(inputId).focus();
}

// Fuzzy search (used in fics search)
export function fuzzySearch(query, items) {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item => {
        let score = 0, queryIdx = 0;
        for (let i = 0; i < item.toLowerCase().length && queryIdx < lowerQuery.length; i++) {
            if (item[i].toLowerCase() === lowerQuery[queryIdx]) {
                score++;
                queryIdx++;
            }
        }
        return queryIdx === lowerQuery.length;
    }).sort((a, b) => {
        const aLower = a.toLowerCase(), bLower = b.toLowerCase(), qLower = query.toLowerCase();
        if (aLower.startsWith(qLower) && !bLower.startsWith(qLower)) return -1;
        if (!aLower.startsWith(qLower) && bLower.startsWith(qLower)) return 1;
        return aLower.indexOf(qLower) - bLower.indexOf(qLower);
    });
}

// Fetch page HTML (used in multiple modules)
export async function fetchPageHTML(url) {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return await response.text();
}