import './style.css';
import { renderCalculatorPage, initCalculatorPage } from './ui/calculatorPage.js';
import { renderSettingsPage, initSettingsPage } from './ui/settingsPage.js';
import { renderHistoryPage, initHistoryPage } from './ui/historyPage.js';
import { renderQuickQuotePage, initQuickQuotePage } from './ui/quickQuotePage.js';

const pageContent = document.getElementById('page-content');

export let currentTab = 'calculator';

/** Switch to a tab and render its page */
export function switchTab(tabName) {
    currentTab = tabName;

    // Update tab button styles
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Render page content
    if (tabName === 'calculator') {
        pageContent.innerHTML = renderCalculatorPage();
        initCalculatorPage();
    } else if (tabName === 'history') {
        pageContent.innerHTML = renderHistoryPage();
        initHistoryPage();
    } else if (tabName === 'quickquote') {
        pageContent.innerHTML = renderQuickQuotePage();
        initQuickQuotePage();
    } else if (tabName === 'settings') {
        pageContent.innerHTML = renderSettingsPage();
        initSettingsPage();
    }
}

// Bind tab click events
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});

export function refreshCurrentTab() {
    switchTab(currentTab);
}

// Initialize with calculator page
switchTab('calculator');

