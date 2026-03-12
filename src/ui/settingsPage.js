/**
 * Settings Page — UI & logic
 * Admin page for configuring all calculator parameters.
 */

import { loadSettings, saveSettings, resetSettings, DEFAULTS } from '../settings.js';
import { showToast } from './calculatorPage.js';

/** Render the settings page HTML */
export function renderSettingsPage() {
    const s = loadSettings();

    return `
    <!-- Filament Settings -->
    <div class="glass-card">
      <h2><span class="card-icon">🧵</span> ตั้งค่า Filament</h2>
      <div id="filament-list" class="filament-cards">
        ${s.filaments.map((f, i) => renderFilamentCard(f, i, s.filaments.length)).join('')}
      </div>
      <button class="btn btn-secondary" id="btn-add-filament" style="margin-top: 12px;">
        ➕ เพิ่มชนิด Filament
      </button>
    </div>

    <!-- Machine & Electricity -->
    <div class="glass-card">
      <h2><span class="card-icon">⚡</span> เครื่องพิมพ์ & ค่าไฟ</h2>

      <div class="form-row">
        <div class="setting-item">
          <label>กำลังไฟเครื่องปริ้น (W)</label>
          <input type="number" id="set-printer-watt" value="${s.printerWattage}" min="0" />
          <div class="hint">Bambu Lab P2S ≈ 350W</div>
        </div>
        <div class="setting-item">
          <label>กำลังไฟเครื่องอบ (W)</label>
          <input type="number" id="set-dryer-watt" value="${s.dryerWattage}" min="0" />
          <div class="hint">Creality Space Pi ≈ 80W</div>
        </div>
      </div>

      <div class="form-row">
        <div class="setting-item">
          <label>ค่าไฟ (บาท/kWh)</label>
          <input type="number" id="set-elec-rate" value="${s.electricityRate}" min="0" step="0.1" />
        </div>
        <div class="setting-item">
          <label>% เผื่อเสีย (Material Loss)</label>
          <input type="number" id="set-material-loss" value="${s.materialLossPercent}" min="0" max="100" step="1" />
        </div>
      </div>
    </div>

    <!-- Depreciation & Maintenance -->
    <div class="glass-card">
      <h2><span class="card-icon">📉</span> ค่าเสื่อมราคา & ซ่อมบำรุง</h2>

      <div class="form-row">
        <div class="setting-item">
          <label>ราคาเครื่อง (บาท)</label>
          <input type="number" id="set-printer-price" value="${s.printerPrice}" min="0" />
        </div>
        <div class="setting-item">
          <label>อายุการใช้งาน (ชม.)</label>
          <input type="number" id="set-printer-life" value="${s.printerLifetimeHours}" min="1" />
        </div>
      </div>

      <div class="setting-item">
        <label>ค่าซ่อมบำรุง (บาท/ชม.)</label>
        <input type="number" id="set-maintenance" value="${s.maintenanceCostPerHour}" min="0" step="0.5" />
      </div>
    </div>

    <!-- Labor -->
    <div class="glass-card">
      <h2><span class="card-icon">👷</span> ค่าแรง</h2>

      <div class="setting-item">
        <label>ค่าแรง (บาท/ชม.)</label>
        <input type="number" id="set-labor-rate" value="${s.laborRatePerHour}" min="0" />
        <div class="hint">ใช้สำหรับปั้นแบบ, Slicing, และ Post-Processing</div>
      </div>

      <div class="setting-item">
        <label>% โสหุ้ย (Overhead)</label>
        <input type="number" id="set-overhead" value="${s.overheadPercent}" min="0" max="100" step="1" />
      </div>
    </div>

    <!-- Pricing Tiers -->
    <div class="glass-card">
      <h2><span class="card-icon">💲</span> ตั้งค่า Pricing Tiers (ตัวคูณ)</h2>

      <div class="form-row" style="margin-bottom:12px">
        <div class="setting-item">
          <label style="color: var(--tier-economy)">Economy — Min</label>
          <input type="number" id="set-tier-eco-min" value="${s.tiers.economy.min}" min="1" step="0.1" />
        </div>
        <div class="setting-item">
          <label style="color: var(--tier-economy)">Economy — Max</label>
          <input type="number" id="set-tier-eco-max" value="${s.tiers.economy.max}" min="1" step="0.1" />
        </div>
      </div>

      <div class="form-row" style="margin-bottom:12px">
        <div class="setting-item">
          <label style="color: var(--tier-standard)">Standard — Min</label>
          <input type="number" id="set-tier-std-min" value="${s.tiers.standard.min}" min="1" step="0.1" />
        </div>
        <div class="setting-item">
          <label style="color: var(--tier-standard)">Standard — Max</label>
          <input type="number" id="set-tier-std-max" value="${s.tiers.standard.max}" min="1" step="0.1" />
        </div>
      </div>

      <div class="form-row" style="margin-bottom:12px">
        <div class="setting-item">
          <label style="color: var(--tier-rush)">Rush — Min</label>
          <input type="number" id="set-tier-rush-min" value="${s.tiers.rush.min}" min="1" step="0.1" />
        </div>
        <div class="setting-item">
          <label style="color: var(--tier-rush)">Rush — Max</label>
          <input type="number" id="set-tier-rush-max" value="${s.tiers.rush.max}" min="1" step="0.1" />
        </div>
      </div>

      <div class="form-row">
        <div class="setting-item">
          <label style="color: var(--tier-premium)">Premium — Min</label>
          <input type="number" id="set-tier-prem-min" value="${s.tiers.premium.min}" min="1" step="0.1" />
        </div>
        <div class="setting-item">
          <label style="color: var(--tier-premium)">Premium — Max</label>
          <input type="number" id="set-tier-prem-max" value="${s.tiers.premium.max}" min="1" step="0.1" />
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="settings-actions">
      <button class="btn btn-primary btn-full" id="btn-save-settings">
        💾 บันทึกการตั้งค่า
      </button>
      <button class="btn btn-danger" id="btn-reset-settings">
        🔄 รีเซ็ต
      </button>
    </div>
  `;
}

function renderFilamentCard(f, index, totalCount) {
    return `
    <div class="filament-card" data-index="${index}">
      <div class="filament-card-header">
        <span class="filament-card-title">🧵 ${f.name || 'Filament ใหม่'}</span>
        ${totalCount > 1 ? `<button class="btn-icon btn-delete-filament" data-index="${index}" title="ลบ">🗑️</button>` : ''}
      </div>
      <div class="filament-card-body">
        <div class="form-group">
          <label>ชื่อ Filament</label>
          <input type="text" class="fil-name" value="${f.name}" placeholder="เช่น PLA, PETG" />
        </div>
        <div class="filament-card-row">
          <div class="form-group">
            <label>ราคา/ม้วน (฿)</label>
            <input type="number" class="fil-price" value="${f.pricePerRoll}" min="0" />
          </div>
          <div class="form-group">
            <label>น้ำหนัก/ม้วน (g)</label>
            <input type="number" class="fil-weight" value="${f.weightPerRoll}" min="1" />
          </div>
        </div>
      </div>
    </div>
  `;
}

/** Bind event listeners */
export function initSettingsPage() {
    // Save
    document.getElementById('btn-save-settings')?.addEventListener('click', handleSave);

    // Reset
    document.getElementById('btn-reset-settings')?.addEventListener('click', handleReset);

    // Add filament
    document.getElementById('btn-add-filament')?.addEventListener('click', handleAddFilament);

    // Delete filament
    document.querySelectorAll('.btn-delete-filament').forEach(btn => {
        btn.addEventListener('click', handleDeleteFilament);
    });
}

function handleSave() {
    const settings = loadSettings();

    // Gather filament data
    const rows = document.querySelectorAll('.filament-card');
    const filaments = [];
    rows.forEach((row, i) => {
        const name = row.querySelector('.fil-name').value.trim();
        const pricePerRoll = parseFloat(row.querySelector('.fil-price').value) || 0;
        const weightPerRoll = parseFloat(row.querySelector('.fil-weight').value) || 1000;
        if (name) {
            const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            filaments.push({ id, name, pricePerRoll, weightPerRoll });
        }
    });

    if (filaments.length === 0) {
        showToast('⚠️ ต้องมี Filament อย่างน้อย 1 ชนิด');
        return;
    }

    // Gather other settings
    settings.filaments = filaments;
    settings.printerWattage = parseFloat(document.getElementById('set-printer-watt').value) || 0;
    settings.dryerWattage = parseFloat(document.getElementById('set-dryer-watt').value) || 0;
    settings.electricityRate = parseFloat(document.getElementById('set-elec-rate').value) || 0;
    settings.materialLossPercent = parseFloat(document.getElementById('set-material-loss').value) || 0;
    settings.printerPrice = parseFloat(document.getElementById('set-printer-price').value) || 0;
    settings.printerLifetimeHours = parseFloat(document.getElementById('set-printer-life').value) || 1;
    settings.maintenanceCostPerHour = parseFloat(document.getElementById('set-maintenance').value) || 0;
    settings.laborRatePerHour = parseFloat(document.getElementById('set-labor-rate').value) || 0;
    settings.overheadPercent = parseFloat(document.getElementById('set-overhead').value) || 0;

    settings.tiers = {
        economy: { min: parseFloat(document.getElementById('set-tier-eco-min').value) || 1, max: parseFloat(document.getElementById('set-tier-eco-max').value) || 1 },
        standard: { min: parseFloat(document.getElementById('set-tier-std-min').value) || 1, max: parseFloat(document.getElementById('set-tier-std-max').value) || 1 },
        rush: { min: parseFloat(document.getElementById('set-tier-rush-min').value) || 1, max: parseFloat(document.getElementById('set-tier-rush-max').value) || 1 },
        premium: { min: parseFloat(document.getElementById('set-tier-prem-min').value) || 1, max: parseFloat(document.getElementById('set-tier-prem-max').value) || 1 },
    };

    saveSettings(settings);
    showToast('✅ บันทึกสำเร็จ');
}

function handleReset() {
    if (confirm('รีเซ็ตการตั้งค่าทั้งหมดเป็นค่าเริ่มต้น?')) {
        resetSettings();
        // Re-render settings page
        document.getElementById('page-content').innerHTML = renderSettingsPage();
        initSettingsPage();
        showToast('🔄 รีเซ็ตเรียบร้อยแล้ว');
    }
}

function handleAddFilament() {
    const list = document.getElementById('filament-list');
    const totalCount = list.querySelectorAll('.filament-card').length + 1;
    const newCard = document.createElement('div');
    newCard.innerHTML = renderFilamentCard({ id: '', name: '', pricePerRoll: 590, weightPerRoll: 1000 }, totalCount - 1, totalCount);
    const card = newCard.firstElementChild;
    list.appendChild(card);

    // Re-render all cards to update delete button visibility
    refreshFilamentCards();
}

function handleDeleteFilament(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const cards = document.querySelectorAll('.filament-card');
    if (cards.length <= 1) {
        showToast('⚠️ ต้องมี Filament อย่างน้อย 1 ชนิด');
        return;
    }
    cards[index].remove();
    refreshFilamentCards();
}

function refreshFilamentCards() {
    const cards = document.querySelectorAll('.filament-card');
    const totalCount = cards.length;
    cards.forEach((card, i) => {
        card.dataset.index = i;
        // Update title from input value
        const nameInput = card.querySelector('.fil-name');
        const title = card.querySelector('.filament-card-title');
        if (title && nameInput) {
            title.textContent = '🧵 ' + (nameInput.value || 'Filament ใหม่');
        }
        // Update delete button visibility
        const existingBtn = card.querySelector('.btn-delete-filament');
        if (totalCount > 1 && !existingBtn) {
            const header = card.querySelector('.filament-card-header');
            const btn = document.createElement('button');
            btn.className = 'btn-icon btn-delete-filament';
            btn.dataset.index = i;
            btn.title = 'ลบ';
            btn.textContent = '🗑️';
            btn.addEventListener('click', handleDeleteFilament);
            header.appendChild(btn);
        } else if (totalCount <= 1 && existingBtn) {
            existingBtn.remove();
        } else if (existingBtn) {
            existingBtn.dataset.index = i;
        }
    });
}
