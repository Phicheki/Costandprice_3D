/**
 * Main Entry Point
 * Handles tab switching and page rendering.
 */

import './style.css';
import { renderCalculatorPage, initCalculatorPage } from './ui/calculatorPage.js';
import { renderSettingsPage, initSettingsPage } from './ui/settingsPage.js';

const pageContent = document.getElementById('page-content');

let currentTab = 'calculator';

/** Switch to a tab and render its page */
function switchTab(tabName) {
    currentTab = tabName;

    // Update tab button styles
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Render page content
    if (tabName === 'calculator') {
        pageContent.innerHTML = renderCalculatorPage();
        initCalculatorPage();
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

// Initialize with calculator page
switchTab('calculator');
