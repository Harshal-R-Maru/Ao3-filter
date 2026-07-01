import { saveToStorage } from './storage.js';

export function isDarkModeEnabled() {
    return !document.body.classList.contains('light');
}

export function setDarkMode(dark) {
    if (dark) {
        document.body.classList.remove('light');
        document.getElementById('darkModeToggle').textContent = '🌙';
    } else {
        document.body.classList.add('light');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
    saveToStorage('darkMode', String(dark));
}

export function toggleDarkMode() {
    setDarkMode(!isDarkModeEnabled());
}