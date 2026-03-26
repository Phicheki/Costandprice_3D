/**
 * Calculator Page — UI & logic
 * Renders the input form and shows cost breakdown + pricing tiers.
 */

import { loadSettings, getFilament } from '../settings.js';
import { calculateCost, calculatePricing, formatBaht, formatBahtRound } from '../calculator.js';
import { saveHistory } from '../historyStore.js';
import { openQuotationModal } from './quotationModal.js';

/** Render the full calculator page HTML */
export function renderCalculatorPage() {
    const settings = loadSettings();
    const filamentOptions = settings.filaments
        .map(f => `<option value="${f.id}">${f.name} (฿${f.pricePerRoll}/${f.weightPerRoll}g)</option>`)
        .join('');

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

      <div class="form-row">
        <div class="form-group">
          <label>น้ำหนักที่ใช้ (กรัม)</label>
          <input type="number" id="inp-weight" placeholder="เช่น 45" min="0" step="0.1" />
        </div>
        <div class="form-group">
          <label>เวลาปริ้น (ชั่วโมง)</label>
          <input type="number" id="inp-time" placeholder="เช่น 2.5" min="0" step="0.01" />
        </div>
      </div>

      <div class="form-group">
        <label>จำนวนชิ้น</label>
        <input type="number" id="inp-quantity" placeholder="1" min="1" step="1" value="1" />
        <div class="hint">น้ำหนักและเวลาปริ้น = ต่อ 1 ชิ้น / ค่าปั้นแบบ & Slicing จะเฉลี่ยต่อชิ้น</div>
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

    // Also calculate on Enter key in any input
    const inputs = document.querySelectorAll('#page-content input');
    inputs.forEach(inp => {
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleCalculate();
        });
    });
}

function handleCalculate() {
    const settings = loadSettings();

    const filamentId = document.getElementById('inp-filament').value;
    const weightGrams = parseFloat(document.getElementById('inp-weight').value) || 0;
    const printTimeHours = parseFloat(document.getElementById('inp-time').value) || 0;
    const quantity = parseInt(document.getElementById('inp-quantity').value) || 1;
    const modelingHours = parseFloat(document.getElementById('inp-modeling').value) || 0;
    const slicingMinutes = parseFloat(document.getElementById('inp-slicing').value) || 0;
    const postProcessHours = parseFloat(document.getElementById('inp-postprocess').value) || 0;

    if (weightGrams <= 0 || printTimeHours <= 0) {
        showToast('⚠️ กรุณากรอกน้ำหนักและเวลาปริ้น');
        return;
    }

    const input = { filamentId, weightGrams, printTimeHours, quantity, modelingHours, slicingMinutes, postProcessHours };
    const breakdown = calculateCost(input, settings);
    const pricing = calculatePricing(breakdown.totalCost, settings.tiers);

    // Save to history
    const filament = getFilament(settings, filamentId);
    const perUnitPricing = calculatePricing(breakdown.perUnitCost, settings.tiers);
    saveHistory({
        filamentId,
        filamentName: filament.name,
        weightGrams,
        printTimeHours,
        quantity,
        totalCost: breakdown.totalCost,
        perUnitCost: breakdown.perUnitCost,
        standardPrice: perUnitPricing.standard.recommended,
    });

    renderResults(breakdown, pricing, settings, quantity);
}

function renderResults(breakdown, pricing, settings, quantity = 1) {
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
                tierClass: card.dataset.tier,
                tierName: card.dataset.tierName,
                tierThai: card.dataset.tierThai,
                pricePerUnit: parseFloat(card.dataset.price),
                quantity: quantity,
                filamentName: filament.name,
                totalCost: breakdown.totalCost,
                perUnitCost: breakdown.perUnitCost,
            });
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
