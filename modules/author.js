import { getFromStoragePromise, saveToStorage } from './storage.js';
import { showMessage, showToast } from './utils.js';
import { addToBlocked } from './blockList.js';

export async function generateAuthorCSS() {
    const url = document.getElementById('authorUrl').value.trim();
    const message = document.getElementById('authorMessage');
    const spinner = document.getElementById('authorSpinner');
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
    spinner.style.display = 'inline-block';
    btn.disabled = true;

    try {
        const css = `.blurb:has(a[href*="/users/${username}/pseuds"]) { display: none !important; }`;
        document.getElementById('authorCssCode').textContent = css;
        document.getElementById('authorCssOutput').style.display = 'block';
        document.getElementById('authorCopyBtnGroup').style.display = 'flex';
        document.getElementById('authorAddBtnGroup').style.display = 'flex';
        document.getElementById('authorAddBtn').dataset.username = username;
        showToast(`CSS generated for @${username}`, 'success');
        saveToStorage('lastAuthorUrl', url);
    } catch (error) {
        showMessage(message, `Error: ${error.message}`, 'error');
    } finally {
        spinner.style.display = 'none';
        btn.disabled = false;
    }
}

export function addAuthorToBlockList() {
    const username = document.getElementById('authorAddBtn').dataset.username;
    if (!username) {
        showToast('No author to add', 'error');
        return;
    }
    addToBlocked('author', [username]);
    showToast(`Added @${username} to block list`, 'success');
}

export function blockAnonymousFics() {
    const css = `.blurb.work:not([class*="user-"]) {\n  display: none !important;\n}`;
    document.getElementById('authorCssCode').textContent = css;
    document.getElementById('authorCssOutput').style.display = 'block';
    document.getElementById('authorCopyBtnGroup').style.display = 'flex';
    showToast('CSS generated to hide anonymous fics', 'success');
    saveToStorage('blockAnonymous', true);
    const toggle = document.getElementById('blockAnonymousToggle');
    if (toggle) toggle.checked = true;
}