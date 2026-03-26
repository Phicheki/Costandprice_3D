/**
 * History Store
 * Manages calculation history via localStorage.
 */

const HISTORY_KEY = '3d-print-calculator-history';
const MAX_ITEMS = 50;

/** Load all history entries */
export function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** Save a new calculation entry to history */
export function saveHistory(entry) {
    const history = loadHistory();
    const item = {
        id: Date.now(),
        date: new Date().toISOString(),
        ...entry,
    };
    history.unshift(item); // newest first
    if (history.length > MAX_ITEMS) history.length = MAX_ITEMS;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return item;
}

/** Delete a single history item by id */
export function deleteHistoryItem(id) {
    const history = loadHistory().filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/** Update an existing history item by id */
export function updateHistoryItem(id, updates) {
    const history = loadHistory();
    const index = history.findIndex(h => h.id === id);
    if (index !== -1) {
        history[index] = { ...history[index], ...updates };
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        return history[index];
    }
    return null;
}

/** Clear all history */
export function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
}
