import { getFromStoragePromise, saveToStorage } from './storage.js';
import { decodeHTML, showToast } from './utils.js';

// ---------- CRUD operations ----------
export async function addToBlocked(type, items) {
    const keyMap = {
        'author': 'blockedAuthors',
        'tag': 'blockedTags',
        'fic': 'blockedFics'
    };
    const key = keyMap[type];
    if (!key) return;

    const existing = await getFromStoragePromise(key);
    let list = [];
    if (typeof existing === 'string') {
        try { list = JSON.parse(existing); } catch (e) { list = []; }
    } else if (Array.isArray(existing)) {
        list = existing;
    }

    if (type === 'author') {
        items.forEach(item => {
            if (!list.includes(item)) list.push(item);
        });
    } else if (type === 'tag') {
        items.forEach(item => {
            const exists = list.some(t => t.encoded === item.encoded);
            if (!exists) list.push(item);
        });
    } else if (type === 'fic') {
        items.forEach(item => {
            const exists = list.some(f => f.id === item.id);
            if (!exists) list.push(item);
        });
    }

    saveToStorage(key, JSON.stringify(list));
    // Re‑render the UI
    if (type === 'author') renderBlockedAuthors();
    else if (type === 'tag') renderBlockedTags();
    else if (type === 'fic') renderBlockedFics();

    injectCSSToAllTabs
}

export async function removeFromBlocked(type, value) {
    const keyMap = {
        'author': 'blockedAuthors',
        'tag': 'blockedTags',
        'fic': 'blockedFics'
    };
    const key = keyMap[type];
    if (!key) return;

    const existing = await getFromStoragePromise(key);
    let list = [];
    if (typeof existing === 'string') {
        try { list = JSON.parse(existing); } catch (e) { list = []; }
    } else if (Array.isArray(existing)) {
        list = existing;
    }

    if (type === 'author') {
        list = list.filter(item => item !== value);
    } else if (type === 'tag') {
        list = list.filter(item => item.encoded !== value);
    } else if (type === 'fic') {
        list = list.filter(item => item.id !== value);
    }

    saveToStorage(key, JSON.stringify(list));
    if (type === 'author') renderBlockedAuthors();
    else if (type === 'tag') renderBlockedTags();
    else if (type === 'fic') renderBlockedFics();
    showToast(`${type} removed`, 'info');
}

// ---------- Render functions ----------
export async function renderBlockedAuthors() {
    const container = document.getElementById('blockedAuthorsList');
    if (!container) return;
    const data = await getFromStoragePromise('blockedAuthors');
    let list = [];
    if (typeof data === 'string') {
        try { list = JSON.parse(data); } catch (e) { list = []; }
    } else if (Array.isArray(data)) {
        list = data;
    }

    while (container.firstChild) container.removeChild(container.firstChild);

    if (list.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-message';
        empty.textContent = 'No authors blocked.';
        container.appendChild(empty);
        return;
    }

    list.forEach(author => {
        const chip = document.createElement('span');
        chip.className = 'blocked-chip';
        chip.appendChild(document.createTextNode(decodeHTML(author) + ' '));
        const btn = document.createElement('button');
        btn.className = 'remove-chip';
        btn.dataset.type = 'author';
        btn.dataset.value = author;
        btn.textContent = '✕';
        chip.appendChild(btn);
        container.appendChild(chip);
    });

    container.querySelectorAll('.remove-chip').forEach(btn => {
        btn.addEventListener('click', function () {
            removeFromBlocked('author', this.dataset.value);
        });
    });
}

export async function renderBlockedTags() {
    const container = document.getElementById('blockedTagsList');
    if (!container) return;
    const data = await getFromStoragePromise('blockedTags');
    let list = [];
    if (typeof data === 'string') {
        try { list = JSON.parse(data); } catch (e) { list = []; }
    } else if (Array.isArray(data)) {
        list = data;
    }

    while (container.firstChild) container.removeChild(container.firstChild);

    if (list.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-message';
        empty.textContent = 'No tags blocked.';
        container.appendChild(empty);
        return;
    }

    const categories = {};
    list.forEach(tag => {
        const cat = tag.category || 'other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(tag);
    });

    const catNames = {
        'warnings': '⚠️ Warnings',
        'relationships': '💕 Relationships',
        'characters': '👤 Characters',
        'freeforms': '🏷️ Additional Tags',
        'other': '📌 Other'
    };

    Object.entries(categories).forEach(([cat, tags]) => {
        const catDiv = document.createElement('div');
        catDiv.className = 'blocked-category';

        const catTitle = document.createElement('div');
        catTitle.className = 'blocked-category-title';
        catTitle.textContent = catNames[cat] || cat;
        catDiv.appendChild(catTitle);

        const chipContainer = document.createElement('div');
        chipContainer.className = 'blocked-chip-container';

        tags.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'blocked-chip';
            chip.appendChild(document.createTextNode(decodeHTML(tag.display) + ' '));
            const btn = document.createElement('button');
            btn.className = 'remove-chip';
            btn.dataset.type = 'tag';
            btn.dataset.value = tag.encoded;
            btn.textContent = '✕';
            chip.appendChild(btn);
            chipContainer.appendChild(chip);
        });

        catDiv.appendChild(chipContainer);
        container.appendChild(catDiv);
    });

    container.querySelectorAll('.remove-chip').forEach(btn => {
        btn.addEventListener('click', function () {
            removeFromBlocked('tag', this.dataset.value);
        });
    });
}

export async function renderBlockedFics() {
    const container = document.getElementById('blockedFicsList');
    if (!container) return;
    const data = await getFromStoragePromise('blockedFics');
    let list = [];
    if (typeof data === 'string') {
        try { list = JSON.parse(data); } catch (e) { list = []; }
    } else if (Array.isArray(data)) {
        list = data;
    }

    while (container.firstChild) container.removeChild(container.firstChild);

    if (list.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-message';
        empty.textContent = 'No fics blocked.';
        container.appendChild(empty);
        return;
    }

    list.forEach(fic => {
        const chip = document.createElement('span');
        chip.className = 'blocked-chip';
        chip.appendChild(document.createTextNode(decodeHTML(fic.title) + ' '));
        const btn = document.createElement('button');
        btn.className = 'remove-chip';
        btn.dataset.type = 'fic';
        btn.dataset.value = fic.id;
        btn.textContent = '✕';
        chip.appendChild(btn);
        container.appendChild(chip);
    });

    container.querySelectorAll('.remove-chip').forEach(btn => {
        btn.addEventListener('click', function () {
            removeFromBlocked('fic', this.dataset.value);
        });
    });
}

// ---------- Generate combined CSS (used by export & content script) ----------
export async function generateCSSFromPrefs() {
    const authors = await getFromStoragePromise('blockedAuthors');
    const tags = await getFromStoragePromise('blockedTags');
    const fics = await getFromStoragePromise('blockedFics');
    const anonymous = await getFromStoragePromise('blockAnonymous');

    let css = '';

    if (anonymous === true) {
        css += `.blurb.work:not([class*="user-"]) { display: none !important; }\n`;
    }

    let parsedAuthors = [];
    if (typeof authors === 'string') {
        try { parsedAuthors = JSON.parse(authors); } catch (e) { }
    } else if (Array.isArray(authors)) {
        parsedAuthors = authors;
    }
    parsedAuthors.forEach(author => {
        css += `.blurb:has(a[href*="/users/${author}/pseuds"]) { display: none !important; }\n`;
    });

    let parsedTags = [];
    if (typeof tags === 'string') {
        try { parsedTags = JSON.parse(tags); } catch (e) { }
    } else if (Array.isArray(tags)) {
        parsedTags = tags;
    }
    parsedTags.forEach(tag => {
        const encoded = tag.encoded || tag;
        css += `.blurb:has(a[href*="${encoded}"]) { display: none !important; }\n`;
    });

    let parsedFics = [];
    if (typeof fics === 'string') {
        try { parsedFics = JSON.parse(fics); } catch (e) { }
    } else if (Array.isArray(fics)) {
        parsedFics = fics;
    }
    parsedFics.forEach(fic => {
        const id = fic.id || fic;
        css += `.blurb.work[id*="work_${id}"] { display: none !important; }\n`;
    });

    return css;
}

function injectCSSToAllTabs() {
    chrome.storage.local.get(['blockedAuthors', 'blockedTags', 'blockedFics', 'blockAnonymous'], (result) => {
        // Parse the stored data (same logic as content.js)
        let authors = result.blockedAuthors || [];
        if (typeof authors === 'string') try { authors = JSON.parse(authors); } catch (e) { authors = []; }
        let tags = result.blockedTags || [];
        if (typeof tags === 'string') try { tags = JSON.parse(tags); } catch (e) { tags = []; }
        let fics = result.blockedFics || [];
        if (typeof fics === 'string') try { fics = JSON.parse(fics); } catch (e) { fics = []; }

        let css = '';
        if (result.blockAnonymous === true) {
            css += `.blurb.work:not([class*="user-"]) { display: none !important; }\n`;
        }
        authors.forEach(author => {
            css += `.blurb:has(a[href*="/users/${author}/pseuds"]) { display: none !important; }\n`;
        });
        tags.forEach(tag => {
            const encoded = tag.encoded || tag;
            css += `.blurb:has(a[href*="${encoded}"]) { display: none !important; }\n`;
        });
        fics.forEach(fic => {
            const id = fic.id || fic;
            css += `.blurb.work[id*="work_${id}"] { display: none !important; }\n`;
        });

        // Send to all AO3 tabs
        chrome.tabs.query({ url: '*://archiveofourown.org/*' }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'injectCSS', css: css }).catch(() => { });
            });
        });
    });
}