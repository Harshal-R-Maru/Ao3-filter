import { fetchPageHTML, showMessage, showToast, fuzzySearch } from './utils.js';
import { addToBlocked } from './blockList.js';
import { saveToStorage } from './storage.js';

let allFics = {};

export async function fetchAuthorFics() {
    const url = document.getElementById('ficAuthorUrl').value.trim();
    const message = document.getElementById('ficsMessage');
    const spinner = document.getElementById('ficsSpinner');
    const btn = spinner.parentElement;

    message.classList.remove('show');

    if (!url) {
        showMessage(message, 'Please enter an author URL', 'error');
        return;
    }

    const match = url.match(/\/users\/([^\/]+)/);
    if (!match || !match[1]) {
        showMessage(message, 'Invalid URL format', 'error');
        return;
    }

    const username = match[1];
    const worksUrl = `https://archiveofourown.org/users/${username}/pseuds/${username}/works`;

    spinner.style.display = 'inline-block';
    btn.disabled = true;

    try {
        const html = await fetchPageHTML(worksUrl);
        const workBlockRegex = /<li id="work_(\d+)"[^>]*>[\s\S]*?<h4 class="heading">\s*<a[^>]*>([^<]+)<\/a>[\s\S]*?<h5 class="fandoms heading"[^>]*>([\s\S]*?)<\/h5>/gm;
        const fandoms = {};
        let match2;
        let workCount = 0;

        while ((match2 = workBlockRegex.exec(html)) !== null) {
            const workId = match2[1];
            const title = match2[2].trim();
            const fandomHtml = match2[3];
            const fandomMatch = fandomHtml.match(/<a class="tag"[^>]*>([^<]+)<\/a>/);
            const fandom = fandomMatch ? fandomMatch[1].trim() : 'Other';

            if (!fandoms[fandom]) fandoms[fandom] = [];
            fandoms[fandom].push({ id: workId, title: title });
            workCount++;
        }

        if (workCount === 0) {
            throw new Error('No works found - author may have no public works');
        }

        allFics = fandoms;
        displayFandoms();
        document.getElementById('ficsOutput').style.display = 'block';
        document.getElementById('ficAddBtnGroup').style.display = 'none';
        showToast(`Loaded ${workCount} fic(s)`, 'success');
        saveToStorage('lastFicAuthorUrl', url);
    } catch (error) {
        showMessage(message, `Error: ${error.message}`, 'error');
    } finally {
        spinner.style.display = 'none';
        btn.disabled = false;
    }
}

export function displayFandoms() {
    const container = document.getElementById('fandosList');
    while (container.firstChild) container.removeChild(container.firstChild);

    Object.entries(allFics).forEach(([fandom, fics]) => {
        const section = document.createElement('div');
        section.className = 'fandom-section';

        const header = document.createElement('div');
        header.className = 'fandom-header';
        header.textContent = `${fandom} (${fics.length})`;
        header.onclick = () => toggleFandom(section);

        const list = document.createElement('div');
        list.className = 'fandom-list';
        list.style.display = 'grid';

        fics.forEach(fic => {
            const label = document.createElement('label');
            label.className = 'fic-item';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'fic-checkbox';
            checkbox.value = fic.id;
            checkbox.dataset.title = fic.title;
            const span = document.createElement('span');
            span.textContent = fic.title;
            label.appendChild(checkbox);
            label.appendChild(span);
            list.appendChild(label);
        });

        section.appendChild(header);
        section.appendChild(list);
        container.appendChild(section);
    });

    updateFicsCSS();

    const searchInput = document.getElementById('ficsSearchInput');
    searchInput.oninput = function () {
        const query = this.value.toLowerCase();

        if (!query) {
            document.querySelectorAll('.fandom-section').forEach(section => {
                section.style.display = 'block';
                section.querySelector('.fandom-list').style.display = 'grid';
                section.querySelectorAll('.fic-item').forEach(label => {
                    label.style.display = 'flex';
                });
            });
            return;
        }

        document.querySelectorAll('.fandom-section').forEach(section => {
            const fandomName = section.querySelector('.fandom-header').textContent;
            const labels = section.querySelectorAll('.fic-item');
            const ficTitles = Array.from(labels).map(l => l.textContent.trim());

            const matchingFics = fuzzySearch(query, ficTitles);

            if (matchingFics.length > 0) {
                section.style.display = 'block';
                labels.forEach(label => {
                    const title = label.textContent.trim();
                    label.style.display = matchingFics.includes(title) ? 'flex' : 'none';
                });
            } else if (fandomName.toLowerCase().includes(query)) {
                section.style.display = 'block';
                labels.forEach(label => label.style.display = 'flex');
            } else {
                section.style.display = 'none';
            }
        });
    };
}

export function toggleFandom(section) {
    const list = section.querySelector('.fandom-list');
    list.style.display = list.style.display === 'none' ? 'grid' : 'none';
}

export function updateFicsCSS() {
    const checkboxes = document.querySelectorAll('.fic-checkbox');
    const selected = Array.from(checkboxes).filter(cb => cb.checked);
    let css = '';
    selected.forEach(cb => {
        css += `.blurb.work[id*="work_${cb.value}"] { display: none !important; }\n`;
    });
    document.getElementById('ficsCssCode').textContent = css || '/* Select fics to generate CSS */';

    const stats = document.getElementById('ficsStats');
    while (stats.firstChild) stats.removeChild(stats.firstChild);
    const item1 = document.createElement('div');
    item1.className = 'stat-item';
    const span1 = document.createElement('span');
    span1.className = 'stat-value';
    span1.textContent = selected.length;
    item1.appendChild(document.createTextNode('Selected: '));
    item1.appendChild(span1);
    item1.appendChild(document.createTextNode(' fic(s)'));
    const item2 = document.createElement('div');
    item2.className = 'stat-item';
    const span2 = document.createElement('span');
    span2.className = 'stat-value';
    span2.textContent = selected.length;
    item2.appendChild(document.createTextNode('CSS rules: '));
    item2.appendChild(span2);
    stats.appendChild(item1);
    stats.appendChild(item2);

    document.getElementById('ficsCopyBtnGroup').style.display = selected.length > 0 ? 'flex' : 'none';
    document.getElementById('ficAddBtnGroup').style.display = selected.length > 0 ? 'flex' : 'none';
}

export function addSelectedFicsToBlockList() {
    const checkboxes = document.querySelectorAll('.fic-checkbox:checked');
    if (checkboxes.length === 0) {
        showToast('No fics selected', 'error');
        return;
    }
    const fics = Array.from(checkboxes).map(cb => ({
        id: cb.value,
        title: cb.dataset.title
    }));
    addToBlocked('fic', fics);
    showToast(`Added ${fics.length} fic(s) to block list`, 'success');
}

export function selectAllFics() {
    document.querySelectorAll('.fic-checkbox').forEach(cb => cb.checked = true);
    updateFicsCSS();
}

export function clearAllFics() {
    document.querySelectorAll('.fic-checkbox').forEach(cb => cb.checked = false);
    updateFicsCSS();
}