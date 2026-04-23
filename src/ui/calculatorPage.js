/**
 * Calculator Page — UI & logic
 * Renders the input form and shows cost breakdown + pricing tiers.
 */

import { loadSettings, getFilament } from '../settings.js';
import { calculateCost, calculatePricing, formatBaht, formatBahtRound } from '../calculator.js';
import { saveHistory } from '../historyStore.js';
import { openQuotationModal } from './quotationModal.js';

/** Render the full calculator page HTML */
/** Global plate counter */
let plateCounter = 0;

/** Generate HTML for a single plate row */
function createPlateHTML(plateNum) {
    const id = plateCounter++;
    return `
    <div class="plate-item" data-plate-id="${id}">
      <div class="plate-header">
        <span class="plate-label">🖨️ Plate ${plateNum}</span>
        <button type="button" class="btn-plate-remove" data-remove-plate="${id}" title="ลบ Plate นี้">✕</button>
      </div>
      <div class="plate-inputs">
        <div class="form-group plate-input-weight">
          <label>น้ำหนัก (g)</label>
          <input type="number" class="plate-weight" placeholder="เช่น 45" min="0" step="0.1" />
        </div>
        <div class="form-group plate-input-time">
          <label>ชั่วโมง (h)</label>
          <input type="number" class="plate-time-h" placeholder="0" min="0" step="1" />
        </div>
        <div class="form-group plate-input-time">
          <label>นาที (m)</label>
          <input type="number" class="plate-time-m" placeholder="0" min="0" max="59" step="1" />
        </div>
      </div>
    </div>`;
}

export function renderCalculatorPage() {
    const settings = loadSettings();
    const filamentOptions = settings.filaments
        .map(f => `<option value="${f.id}">${f.name} (฿${f.pricePerRoll}/${f.weightPerRoll}g)</option>`)
        .join('');

    // Reset counter for fresh render
    plateCounter = 0;

    return `
    <!-- Input Form -->
    <div class="glass-card">
      <h2><span class="card-icon">📐</span> ข้อมูลงานพิมพ์</h2>

      <div class="form-group">
        <label>ชนิด Filament</label>
        <select id="inp-filament">
          ${filamentOptions}
        </select>
      </div>

      <!-- Plates Container -->
      <div id="plates-container">
        ${createPlateHTML(1)}
      </div>

      <button type="button" class="btn btn-add-plate" id="btn-add-plate">
        <span>＋</span> เพิ่ม Plate
      </button>

      <!-- Summary bar (shows when >1 plate) -->
      <div id="plates-summary" class="plates-summary" style="display:none;"></div>

      <div class="form-group" style="margin-top: 16px;">
        <label>จำนวนชิ้น (ชุด)</label>
        <input type="number" id="inp-quantity" placeholder="1" min="1" step="1" value="1" />
        <div class="hint">น้ำหนักและเวลาปริ้นจะรวมจากทุก Plate / ค่าปั้นแบบ & Slicing จะเฉลี่ยต่อชิ้น</div>
      </div>
    </div>

    <!-- Labor Inputs -->
    <div class="glass-card">
      <h2><span class="card-icon">🛠️</span> ค่าแรง (ถ้ามี)</h2>

      <div class="form-row-3">
        <div class="form-group">
          <label>ปั้นแบบ (ชม.)</label>
          <input type="number" id="inp-modeling" placeholder="0" min="0" step="0.25" value="0" />
        </div>
        <div class="form-group">
          <label>Slicing (นาที)</label>
          <input type="number" id="inp-slicing" placeholder="0" min="0" step="1" value="0" />
        </div>
        <div class="form-group">
          <label>Post-Process (ชม.)</label>
          <input type="number" id="inp-postprocess" placeholder="0" min="0" step="0.25" value="0" />
        </div>
      </div>
    </div>

    <!-- Calculate Button -->
    <button class="btn btn-primary btn-full" id="btn-calculate">
      🧮 คำนวณต้นทุน & ราคาขาย
    </button>

    <!-- Results (hidden until calculated) -->
    <div id="results-container" style="display:none; margin-top: 24px;">
      <div id="result-breakdown"></div>
      <div id="result-pricing"></div>
    </div>
  `;
}

/** Bind event listeners after the page renders */
export function initCalculatorPage() {
    const btnCalc = document.getElementById('btn-calculate');
    if (!btnCalc) return;

    btnCalc.addEventListener('click', handleCalculate);

    // Add Plate button
    const btnAddPlate = document.getElementById('btn-add-plate');
    if (btnAddPlate) {
        btnAddPlate.addEventListener('click', handleAddPlate);
    }

    // Delegate remove-plate clicks on the container
    const platesContainer = document.getElementById('plates-container');
    if (platesContainer) {
        platesContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-remove-plate]');
            if (removeBtn) handleRemovePlate(removeBtn);
        });
        // Live summary update on input change
        platesContainer.addEventListener('input', updatePlatesSummary);
    }

    // Also calculate on Enter key in any input
    document.getElementById('page-content')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.matches('input')) handleCalculate();
    });

    // Initial state: hide remove btn if only 1 plate
    updatePlateRemoveButtons();
    updatePlatesSummary();
}

/** Add a new plate row */
function handleAddPlate() {
    const container = document.getElementById('plates-container');
    if (!container) return;
    const plateCount = container.querySelectorAll('.plate-item').length + 1;
    const html = createPlateHTML(plateCount);
    container.insertAdjacentHTML('beforeend', html);
    updatePlateRemoveButtons();
    updatePlatesSummary();

    // Animate the new plate in
    const newPlate = container.querySelector('.plate-item:last-child');
    if (newPlate) {
        newPlate.style.animation = 'fadeInUp 0.35s ease';
    }
}

/** Remove a plate row */
function handleRemovePlate(btn) {
    const container = document.getElementById('plates-container');
    if (!container) return;
    const plates = container.querySelectorAll('.plate-item');
    if (plates.length <= 1) {
        showToast('⚠️ ต้องมีอย่างน้อย 1 Plate');
        return;
    }
    const plateId = btn.dataset.removePlate;
    const plateEl = container.querySelector(`.plate-item[data-plate-id="${plateId}"]`);
    if (plateEl) {
        plateEl.style.animation = 'fadeOut 0.25s ease forwards';
        setTimeout(() => {
            plateEl.remove();
            renumberPlates();
            updatePlateRemoveButtons();
            updatePlatesSummary();
        }, 250);
    }
}

/** Renumber plate labels sequentially */
function renumberPlates() {
    const container = document.getElementById('plates-container');
    if (!container) return;
    const plates = container.querySelectorAll('.plate-item');
    plates.forEach((plate, i) => {
        const label = plate.querySelector('.plate-label');
        if (label) label.textContent = `🖨️ Plate ${i + 1}`;
    });
}

/** Show/hide remove buttons when only 1 plate exists */
function updatePlateRemoveButtons() {
    const container = document.getElementById('plates-container');
    if (!container) return;
    const plates = container.querySelectorAll('.plate-item');
    const removeBtns = container.querySelectorAll('.btn-plate-remove');
    removeBtns.forEach(btn => {
        btn.style.display = plates.length <= 1 ? 'none' : '';
    });
}

/** Update the summary bar showing totals across plates */
function updatePlatesSummary() {
    const container = document.getElementById('plates-container');
    const summaryEl = document.getElementById('plates-summary');
    if (!container || !summaryEl) return;

    const plates = container.querySelectorAll('.plate-item');
    if (plates.length <= 1) {
        summaryEl.style.display = 'none';
        return;
    }

    let totalWeight = 0;
    let totalHours = 0;
    let totalMinutes = 0;

    plates.forEach(plate => {
        totalWeight += parseFloat(plate.querySelector('.plate-weight')?.value) || 0;
        totalHours += parseInt(plate.querySelector('.plate-time-h')?.value) || 0;
        totalMinutes += parseInt(plate.querySelector('.plate-time-m')?.value) || 0;
    });

    // Normalize minutes into hours
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    const timeStr = `${totalHours}h ${totalMinutes}m`;

    summaryEl.style.display = 'flex';
    summaryEl.innerHTML = `
        <span>📊 รวม ${plates.length} Plates</span>
        <span class="plates-summary-divider">|</span>
        <span>⚖️ ${totalWeight.toFixed(1)}g</span>
        <span class="plates-summary-divider">|</span>
        <span>⏱️ ${timeStr}</span>
    `;
}

/** Read all plate inputs and sum them */
function collectPlateData() {
    const container = document.getElementById('plates-container');
    if (!container) return { weightGrams: 0, printTimeHours: 0 };

    let totalWeight = 0;
    let totalMinutes = 0;

    container.querySelectorAll('.plate-item').forEach(plate => {
        totalWeight += parseFloat(plate.querySelector('.plate-weight')?.value) || 0;
        const h = parseInt(plate.querySelector('.plate-time-h')?.value) || 0;
        const m = parseInt(plate.querySelector('.plate-time-m')?.value) || 0;
        totalMinutes += (h * 60) + m;
    });

    return {
        weightGrams: totalWeight,
        printTimeHours: totalMinutes / 60,
    };
}

function handleCalculate() {
    const settings = loadSettings();

    const filamentId = document.getElementById('inp-filament').value;
    const { weightGrams, printTimeHours } = collectPlateData();
    const quantity = parseInt(document.getElementById('inp-quantity').value) || 1;
    const modelingHours = parseFloat(document.getElementById('inp-modeling').value) || 0;
    const slicingMinutes = parseFloat(document.getElementById('inp-slicing').value) || 0;
    const postProcessHours = parseFloat(document.getElementById('inp-postprocess').value) || 0;

    if (weightGrams <= 0 || printTimeHours <= 0) {
        showToast('⚠️ กรุณากรอกน้ำหนักและเวลาปริ้นอย่างน้อย 1 Plate');
        return;
    }

    const input = { filamentId, weightGrams, printTimeHours, quantity, modelingHours, slicingMinutes, postProcessHours };
    const breakdown = calculateCost(input, settings);
    const pricing = calculatePricing(breakdown.totalCost, settings.tiers);

    // Save to history
    const filament = getFilament(settings, filamentId);
    const perUnitPricing = calculatePricing(breakdown.perUnitCost, settings.tiers);
    const savedItem = saveHistory({
        filamentId,
        filamentName: filament.name,
        weightGrams,
        printTimeHours,
        quantity,
        totalCost: breakdown.totalCost,
        perUnitCost: breakdown.perUnitCost,
        standardPrice: perUnitPricing.standard.recommended,
        breakdown,
    });

    renderResults(breakdown, pricing, settings, quantity, savedItem);
}

function renderResults(breakdown, pricing, settings, quantity = 1, savedItem = null) {
    const container = document.getElementById('results-container');
    container.style.display = 'block';

    const showQuantity = quantity > 1;

    // Quantity summary badge
    const quantityBadge = showQuantity ? `
      <div class="quantity-badge">
        <span>📦 ${quantity} ชิ้น</span>
        <span class="quantity-divider">|</span>
        <span>ต่อชิ้น ${formatBaht(breakdown.perUnitCost)}</span>
        <span class="quantity-divider">|</span>
        <span>รวม ${formatBaht(breakdown.totalCost)}</span>
      </div>
    ` : '';

    // Cost Breakdown
    document.getElementById('result-breakdown').innerHTML = `
    <div class="glass-card result-section">
      <h2><span class="card-icon">📊</span> สรุปต้นทุน${showQuantity ? ` (${quantity} ชิ้น)` : ''}</h2>
      ${quantityBadge}
      <ul class="cost-breakdown">
        <li class="cost-item">
          <span class="cost-label"><span>📦</span> ค่าวัสดุ (รวมเผื่อเสีย ${settings.materialLossPercent}%)</span>
          <span class="cost-value">${formatBaht(breakdown.materialCost)}</span>
        </li>
        <li class="cost-item">
          <span class="cost-label"><span>⚡</span> ค่าไฟ</span>
          <span class="cost-value">${formatBaht(breakdown.electricityCost)}</span>
        </li>
        <li class="cost-item">
          <span class="cost-label"><span>📉</span> ค่าเสื่อมราคา</span>
          <span class="cost-value">${formatBaht(breakdown.depreciationCost)}</span>
        </li>
        <li class="cost-item">
          <span class="cost-label"><span>🔧</span> ค่าซ่อมบำรุง</span>
          <span class="cost-value">${formatBaht(breakdown.maintenanceCost)}</span>
        </li>
        <li class="cost-item">
          <span class="cost-label"><span>🎨</span> ค่าปั้นแบบ${showQuantity ? ' (คงที่)' : ''}</span>
          <span class="cost-value">${formatBaht(breakdown.modelingCost)}</span>
        </li>
        <li class="cost-item">
          <span class="cost-label"><span>🖥️</span> ค่า Slicing${showQuantity ? ' (คงที่)' : ''}</span>
          <span class="cost-value">${formatBaht(breakdown.slicingCost)}</span>
        </li>
        <li class="cost-item">
          <span class="cost-label"><span>✨</span> ค่า Post-Processing</span>
          <span class="cost-value">${formatBaht(breakdown.postProcessCost)}</span>
        </li>
        <li class="cost-item">
          <span class="cost-label"><span>🏢</span> ต้นทุนแฝง (${settings.overheadPercent}%)</span>
          <span class="cost-value">${formatBaht(breakdown.overheadCost)}</span>
        </li>
      </ul>
      <div class="cost-total">
        <span class="cost-label">💰 ต้นทุนรวม${showQuantity ? ` (${quantity} ชิ้น)` : ''}</span>
        <span class="cost-value">${formatBaht(breakdown.totalCost)}</span>
      </div>
      ${showQuantity ? `
      <div class="cost-per-unit">
        <span class="cost-label">📌 ต้นทุนต่อชิ้น</span>
        <span class="cost-value">${formatBaht(breakdown.perUnitCost)}</span>
      </div>
      ` : ''}
    </div>
  `;

    // Pricing Tiers — use perUnitCost for per-piece pricing
    const tierMeta = {
        economy: { name: 'ECONOMY', thai: 'ราคามิตรภาพ', class: 'economy' },
        standard: { name: 'STANDARD', thai: 'ราคามาตรฐาน', class: 'standard' },
        rush: { name: 'RUSH', thai: 'งานด่วน', class: 'rush' },
        premium: { name: 'PREMIUM', thai: 'คุณภาพสูง', class: 'premium' },
    };

    // Calculate per-unit pricing for tiers
    const perUnitPricing = calculatePricing(breakdown.perUnitCost, settings.tiers);

    let tierHTML = '';
    for (const [key, meta] of Object.entries(tierMeta)) {
        const p = perUnitPricing[key];
        tierHTML += `
      <div class="tier-card ${meta.class} tier-clickable" data-tier="${key}" data-price="${p.recommended}" data-tier-name="${meta.name}" data-tier-thai="${meta.thai}">
        <div class="tier-name">${meta.name}</div>
        <div class="tier-thai">${meta.thai}</div>
        <div class="tier-price">${formatBahtRound(p.recommended)}</div>
        <div class="tier-unit">บาท/ชิ้น</div>
        <div class="tier-margin">${formatBahtRound(p.min)} — ${formatBahtRound(p.max)}</div>
        ${showQuantity ? `<div class="tier-total">รวม ${quantity} ชิ้น = ${formatBahtRound(p.recommended * quantity)}</div>` : ''}
        <div class="tier-action">📄 สร้างใบเสนอราคา</div>
      </div>
    `;
    }

    document.getElementById('result-pricing').innerHTML = `
    <div class="glass-card result-section">
      <h2><span class="card-icon">💲</span> ราคาขายแนะนำ${showQuantity ? ' (ต่อชิ้น)' : ''}</h2>
      <div class="tier-grid">
        ${tierHTML}
      </div>
    </div>
  `;

    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Bind tier card click for quotation
    const filament = getFilament(settings, document.getElementById('inp-filament').value);
    document.querySelectorAll('.tier-clickable').forEach(card => {
        card.addEventListener('click', () => {
            openQuotationModal({
                ...savedItem, // includes weightGrams, printTimeHours
                tierClass: card.dataset.tier,
                tierName: card.dataset.tierName,
                tierThai: card.dataset.tierThai,
                pricePerUnit: parseFloat(card.dataset.price),
                quantity: quantity,
                filamentName: filament.name,
                totalCost: breakdown.totalCost,
                perUnitCost: breakdown.perUnitCost,
                breakdown: breakdown,
            }, savedItem ? savedItem.id : null);
        });
    });
}

function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

export { showToast };
