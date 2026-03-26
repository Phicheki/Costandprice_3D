/**
 * History Page — UI & logic
 * Shows calculation history with expandable detail cards.
 */

import { loadHistory, deleteHistoryItem, clearHistory } from '../historyStore.js';
import { formatBaht } from '../calculator.js';
import { showToast } from './calculatorPage.js';

/** Render the history page HTML */
export function renderHistoryPage() {
    const history = loadHistory();

    if (history.length === 0) {
        return `
        <div class="glass-card" style="text-align:center; padding:48px 24px;">
            <div style="font-size:3rem; margin-bottom:16px;">📋</div>
            <h2 style="color:var(--text-secondary); margin-bottom:8px;">ยังไม่มีประวัติ</h2>
            <p style="color:var(--text-muted); font-size:0.85rem;">เมื่อคำนวณต้นทุน ระบบจะบันทึกไว้ที่นี่อัตโนมัติ</p>
        </div>
        `;
    }

    const cards = history.map(item => {
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
        const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        return `
        <div class="history-card" data-id="${item.id}">
            <div class="history-card-header" data-id="${item.id}">
                <div class="history-card-info">
                    <div class="history-card-title">${item.filamentName || 'N/A'} — ${item.weightGrams}g × ${item.quantity || 1} ชิ้น</div>
                    <div class="history-card-date">${dateStr} ${timeStr}</div>
                </div>
                <div class="history-card-price">${formatBaht(item.totalCost)}</div>
            </div>
            <div class="history-card-detail" id="detail-${item.id}">
                <div class="history-detail-grid">
                    <div class="history-detail-item">
                        <span class="detail-label">Filament</span>
                        <span class="detail-value">${item.filamentName}</span>
                    </div>
                    <div class="history-detail-item">
                        <span class="detail-label">น้ำหนัก</span>
                        <span class="detail-value">${item.weightGrams}g</span>
                    </div>
                    <div class="history-detail-item">
                        <span class="detail-label">เวลาปริ้น</span>
                        <span class="detail-value">${item.printTimeHours} ชม.</span>
                    </div>
                    <div class="history-detail-item">
                        <span class="detail-label">จำนวน</span>
                        <span class="detail-value">${item.quantity || 1} ชิ้น</span>
                    </div>
                    <div class="history-detail-item">
                        <span class="detail-label">ต้นทุนรวม</span>
                        <span class="detail-value accent">${formatBaht(item.totalCost)}</span>
                    </div>
                    <div class="history-detail-item">
                        <span class="detail-label">ต้นทุน/ชิ้น</span>
                        <span class="detail-value accent">${formatBaht(item.perUnitCost)}</span>
                    </div>
                    ${item.standardPrice ? `
                    <div class="history-detail-item">
                        <span class="detail-label">ราคา Standard</span>
                        <span class="detail-value" style="color:var(--tier-standard)">${formatBaht(item.standardPrice)}/ชิ้น</span>
                    </div>` : ''}
                </div>
                <button class="btn btn-danger btn-sm btn-delete-history" data-id="${item.id}">🗑️ ลบ</button>
            </div>
        </div>
        `;
    }).join('');

    return `
    <div class="glass-card">
        <div class="history-header">
            <h2><span class="card-icon">📋</span> ประวัติการคำนวณ (${history.length})</h2>
            <button class="btn btn-danger btn-sm" id="btn-clear-history">ล้างทั้งหมด</button>
        </div>
        <div class="history-list">
            ${cards}
        </div>
    </div>
    `;
}

/** Bind event listeners */
export function initHistoryPage() {
    // Toggle detail on card header click
    document.querySelectorAll('.history-card-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.history-card');
            card.classList.toggle('expanded');
        });
    });

    // Delete single item
    document.querySelectorAll('.btn-delete-history').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteHistoryItem(id);
            const card = btn.closest('.history-card');
            card.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.getElementById('page-content').innerHTML = renderHistoryPage();
                initHistoryPage();
            }, 300);
            showToast('🗑️ ลบรายการแล้ว');
        });
    });

    // Clear all
    document.getElementById('btn-clear-history')?.addEventListener('click', () => {
        if (confirm('ลบประวัติทั้งหมด?')) {
            clearHistory();
            document.getElementById('page-content').innerHTML = renderHistoryPage();
            initHistoryPage();
            showToast('🗑️ ลบประวัติทั้งหมดแล้ว');
        }
    });
}
