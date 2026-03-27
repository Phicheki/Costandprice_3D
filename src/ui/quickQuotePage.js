import { loadSettings } from '../settings.js';
import { formatBahtRound } from '../calculator.js';
import { openQuotationModal } from './quotationModal.js';

/** Render the Quick Quote Page HTML */
export function renderQuickQuotePage() {
    const settings = loadSettings();
    const pricing = settings.modelPricing || [];

    let tableRows = pricing.map(p => `
        <tr>
            <td class="text-center font-semibold" style="color:var(--text-accent);">${p.size}</td>
            <td class="text-right">${p.prefix || ''}${formatBahtRound(p.rawPrice)}</td>
            <td class="text-right">${p.prefix || ''}${formatBahtRound(p.paintedPrice)}</td>
        </tr>
    `).join('');

    let sizeOptions = pricing.map(p => `
        <option value="${p.id}" data-raw="${p.rawPrice}" data-painted="${p.paintedPrice}" data-prefix="${p.prefix || ''}">${p.size}</option>
    `).join('');

    return `
    <div class="quick-quote-container">
        <!-- Reference Table -->
        <div class="glass-card mb-4">
            <h2><span class="card-icon">📋</span> ตารางราคาอ้างอิง</h2>
            <div class="table-responsive">
                <table class="quick-quote-table">
                    <thead>
                        <tr>
                            <th class="text-center">ขนาด</th>
                            <th class="text-right">งานดิบ</th>
                            <th class="text-right">งานทำสีสมบูรณ์</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            <div class="hint text-center mt-2">* กรณี Custom เป็นราคาประเมินเริ่มต้น อาจมีการปรับเปลี่ยนตามความยากง่ายของงาน</div>
        </div>

        <!-- Calculator Form -->
        <div class="glass-card">
            <h2><span class="card-icon">⚡</span> ประเมินราคาด่วน</h2>
            
            <div class="form-row">
                <div class="form-group">
                    <label>ขนาดโมเดล</label>
                    <select id="qq-size">
                        ${sizeOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>ประเภทงาน</label>
                    <select id="qq-type">
                        <option value="raw">งานดิบ</option>
                        <option value="painted">งานทำสีสมบูรณ์</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>จำนวนชิ้น</label>
                    <input type="number" id="qq-quantity" min="1" step="1" value="1" />
                </div>
                <div class="form-group">
                    <label>ส่วนลด (%)</label>
                    <input type="number" id="qq-discount" min="0" max="100" placeholder="0" />
                    <div class="hint">เว้นว่างถ้าไม่มีส่วนลด</div>
                </div>
            </div>

            <!-- Total Preview -->
            <div class="qq-preview-box">
                <div class="qq-preview-row">
                    <span>ราคาต่อชิ้น:</span>
                    <span id="qq-preview-unit-price">฿0</span>
                </div>
                <div class="qq-preview-row" id="qq-discount-row" style="display:none; color:var(--danger);">
                    <span>ส่วนลด:</span>
                    <span id="qq-preview-discount">-฿0</span>
                </div>
                <div class="qq-preview-total">
                    <span>ยอดรวมสุทธิ:</span>
                    <span id="qq-preview-net">฿0</span>
                </div>
            </div>

            <button class="btn btn-primary btn-full mt-4" id="btn-qq-quotation">
                📄 สร้างใบเสนอราคา (PDF)
            </button>
        </div>
    </div>
    `;
}

/** Bind events for Quick Quote Page */
export function initQuickQuotePage() {
    const sizeSelect = document.getElementById('qq-size');
    const typeSelect = document.getElementById('qq-type');
    const qtyInput = document.getElementById('qq-quantity');
    const docInput = document.getElementById('qq-discount');
    const btnQuote = document.getElementById('btn-qq-quotation');

    const updatePreview = () => {
        const selectedOpt = sizeSelect.options[sizeSelect.selectedIndex];
        const rawPrice = parseFloat(selectedOpt.dataset.raw) || 0;
        const paintedPrice = parseFloat(selectedOpt.dataset.painted) || 0;
        
        const unitPrice = typeSelect.value === 'raw' ? rawPrice : paintedPrice;
        const qty = parseInt(qtyInput.value) || 1;
        const discountPct = parseFloat(docInput.value) || 0;

        const subtotal = unitPrice * qty;
        const discountAmt = subtotal * (discountPct / 100);
        const netTotal = subtotal - discountAmt;

        document.getElementById('qq-preview-unit-price').textContent = formatBahtRound(unitPrice);
        document.getElementById('qq-preview-net').textContent = formatBahtRound(netTotal);

        const discountRow = document.getElementById('qq-discount-row');
        if (discountPct > 0) {
            discountRow.style.display = 'flex';
            document.getElementById('qq-preview-discount').textContent = `-${formatBahtRound(discountAmt)}`;
        } else {
            discountRow.style.display = 'none';
        }
    };

    [sizeSelect, typeSelect, qtyInput, docInput].forEach(el => {
        el.addEventListener('input', updatePreview);
        el.addEventListener('change', updatePreview);
    });

    updatePreview();

    btnQuote.addEventListener('click', () => {
        const selectedOpt = sizeSelect.options[sizeSelect.selectedIndex];
        const rawPrice = parseFloat(selectedOpt.dataset.raw) || 0;
        const paintedPrice = parseFloat(selectedOpt.dataset.painted) || 0;
        const unitPrice = typeSelect.value === 'raw' ? rawPrice : paintedPrice;
        const typeName = typeSelect.value === 'raw' ? 'งานดิบ' : 'งานทำสีสมบูรณ์';
        
        const prefix = selectedOpt.dataset.prefix || '';
        let desc = `โมเดลขนาด ${selectedOpt.text} (${typeName})`;
        if (selectedOpt.text === 'Custom') {
            desc = `รับงานตามสั่ง (Custom) - ${typeName}`;
        }

        const qty = parseInt(qtyInput.value) || 1;
        const discountPct = parseFloat(docInput.value) || 0;

        const data = {
            tierClass: 'tier-standard',
            tierName: 'พิมพ์โมเดล (ราคาเหมา)',
            qtNumber: null,
            customer: '',
            description: desc,
            pricePerUnit: unitPrice,
            perUnitCost: unitPrice, 
            quantity: qty,
            discountPct: discountPct,
            filamentName: '-', 
            totalCost: unitPrice * qty,
            docType: 'quotation'
        };

        openQuotationModal(data, null);
    });
}
