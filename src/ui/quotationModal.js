/**
 * Quotation Modal — PDF generation via Print Window
 * Opens modal for customer info, generates professional quotation
 * Brand: Craft Caster
 */

import { formatBaht, formatBahtRound, formatBahtSmart } from '../calculator.js';
import { showToast } from './calculatorPage.js';
import { saveHistory, updateHistoryItem } from '../historyStore.js';
import { refreshCurrentTab } from '../main.js';

let currentQuotationData = null;
let currentHistoryId = null;

/** Generate quotation number */
function generateQuotationNumber() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `QT-${y}${m}${d}-${seq}`;
}

/** Open quotation modal with selected tier data */
export function openQuotationModal(data, historyId = null) {
    currentQuotationData = data;
    currentHistoryId = historyId;

    const existing = document.getElementById('quotation-modal');
    if (existing) existing.remove();

    const qtNumber = generateQuotationNumber();

    const modal = document.createElement('div');
    modal.id = 'quotation-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
    <div class="modal-content glass-card">
        <div class="modal-header">
            <h2><span class="card-icon">📄</span> สร้างใบเสนอราคา</h2>
            <button class="btn-icon modal-close" id="btn-close-modal">✕</button>
        </div>

        <div class="modal-tier-badge ${data.tierClass || 'tier-standard'}">
            ${data.tierName || 'รายการที่บันทึกไว้'} — ราคาแนะนำ ${formatBahtSmart(data.pricePerUnit || data.perUnitCost || 0)}/ชิ้น
        </div>

        <div class="form-group">
            <label>📑 ประเภทเอกสาร</label>
            <div class="qt-timeline-options" style="margin-bottom: 8px;">
                <label class="qt-radio-label">
                    <input type="radio" name="qt-doc-type" value="quotation" checked />
                    <span class="qt-radio-pill normal">📄 ใบเสนอราคา</span>
                </label>
                <label class="qt-radio-label">
                    <input type="radio" name="qt-doc-type" value="deposit" />
                    <span class="qt-radio-pill custom">💸 รับมัดจำ 50%</span>
                </label>
                <label class="qt-radio-label">
                    <input type="radio" name="qt-doc-type" value="receipt" />
                    <span class="qt-radio-pill urgent">✅ รับเงิน 100%</span>
                </label>
            </div>
        </div>

        <div class="form-group">
            <label>เลขใบเสนอราคา</label>
            <input type="text" id="qt-number" value="${data.qtNumber || qtNumber}" />
        </div>

        <div class="form-group">
            <label>ชื่อลูกค้า</label>
            <input type="text" id="qt-customer" placeholder="เช่น คุณสมชาย" value="${data.customer || ''}" />
        </div>

        <div class="form-group">
            <label>💰 ราคาขาย (บาท/ชิ้น)</label>
            <input type="number" id="qt-price" value="${(data.sellPrice || data.pricePerUnit || data.perUnitCost || 0)}" min="0" step="any" />
            <div class="hint">ราคาตั้งต้น: ${formatBahtSmart(data.pricePerUnit || data.perUnitCost || 0)} — แก้ไขได้ตามต้องการ (ใส่จุดทศนิยมได้)</div>
        </div>

        <div class="form-group">
            <label>📉 ส่วนลด (%)</label>
            <input type="number" id="qt-discount" placeholder="0" min="0" max="100" value="${data.discountPct || ''}" />
            <div class="hint">ใส่เฉพาะตัวเลขเปอร์เซ็นต์ (เช่น 10 สำหรับลด 10%) — เว้นว่างถ้าไม่มีส่วนลด</div>
        </div>

        <div id="qt-preview-total" style="background:#f8f9fc; padding: 12px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #6366f1; display: none;">
            <!-- Real-time total preview will be rendered here -->
        </div>

        <div class="form-group">
            <label>ชื่องาน / รายละเอียด</label>
            <input type="text" id="qt-description" placeholder="เช่น ฟิกเกอร์ Dragon Ball" value="${data.description || ''}" />
        </div>

        <div class="form-group">
            <label>ระยะเวลาในการผลิต <span style="font-size:11px;color:#94a3b8;font-weight:400;">(ไม่รวมระยะเวลาจัดส่ง)</span></label>
            <div class="qt-timeline-options">
                <label class="qt-radio-label">
                    <input type="radio" name="qt-timeline" value="urgent" />
                    <span class="qt-radio-pill urgent">🔥 เร่งด่วน <span class="qt-radio-days">2-3 วัน</span></span>
                </label>
                <label class="qt-radio-label">
                    <input type="radio" name="qt-timeline" value="normal" checked />
                    <span class="qt-radio-pill normal">📦 ปกติ <span class="qt-radio-days">7-14 วัน</span></span>
                </label>
                <label class="qt-radio-label">
                    <input type="radio" name="qt-timeline" value="custom" />
                    <span class="qt-radio-pill custom">✏️ กำหนดเอง</span>
                </label>
            </div>
            <div id="qt-custom-timeline-wrap" class="qt-custom-timeline-wrap" style="display:none;">
                <input type="text" id="qt-custom-timeline" placeholder="เช่น 5-7 วัน" />
            </div>
        </div>

        <div class="form-group">
            <label>หมายเหตุอื่นๆ (ถ้ามี)</label>
            <input type="text" id="qt-notes" placeholder="เช่น ต้องการสีแดง, ขัดผิวเรียบ" />
        </div>

        <button class="btn btn-primary btn-full" id="btn-generate-pdf">
            🖨️ สร้างเอกสาร PDF
        </button>
    </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));

    // Pre-select document type if editing
    if (data.docType) {
        const radio = modal.querySelector(`input[name="qt-doc-type"][value="${data.docType}"]`);
        if (radio) radio.checked = true;
    }

    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.getElementById('btn-generate-pdf').addEventListener('click', generatePDF);

    modal.querySelectorAll('input[name="qt-timeline"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const wrap = document.getElementById('qt-custom-timeline-wrap');
            wrap.style.display = radio.value === 'custom' && radio.checked ? 'block' : 'none';
            if (radio.value === 'custom') {
                document.getElementById('qt-custom-timeline').focus();
            }
        });
    });

    const updatePreview = () => {
        const price = parseFloat(document.getElementById('qt-price').value) || data.pricePerUnit || data.perUnitCost || 0;
        const discountPct = parseFloat(document.getElementById('qt-discount').value) || 0;
        const qty = data.quantity || 1;
        
        const docTypeRadio = document.querySelector('input[name="qt-doc-type"]:checked');
        const docType = docTypeRadio ? docTypeRadio.value : 'quotation';

        const subtotal = price * qty;
        const discountAmt = subtotal * (discountPct / 100);
        const netTotal = subtotal - discountAmt;

        const previewBox = document.getElementById('qt-preview-total');
        if (discountPct > 0 || qty > 1 || docType === 'deposit') {
            previewBox.style.display = 'block';
            let html = ``;
            if (qty > 1) {
                html += `<div style="display:flex; justify-content:space-between; margin-bottom: 4px; color:#475569; font-size:13px;"><span>จำนวน:</span> <span>${qty} ชิ้น</span></div>`;
            }
            if (discountPct > 0) {
                html += `<div style="display:flex; justify-content:space-between; margin-bottom: 4px; color:#475569; font-size:13px;"><span>ยอดก่อนลด:</span> <span>${formatBahtSmart(subtotal)}</span></div>`;
                html += `<div style="display:flex; justify-content:space-between; margin-bottom: 8px; color:#ef4444; font-size:13px;"><span>ส่วนลด (${discountPct}%):</span> <span>-${formatBahtSmart(discountAmt)}</span></div>`;
            }
            html += `<div style="display:flex; justify-content:space-between; font-weight:600; font-size:15px; color:#1e293b; border-top:1px solid #cbd5e1; padding-top:8px; margin-bottom: 4px;"><span>ยอดรวมสุทธิ:</span> <span>${formatBahtSmart(netTotal)}</span></div>`;
            
            if (docType === 'deposit') {
                const depositAmt = netTotal / 2;
                html += `<div style="display:flex; justify-content:space-between; font-size:14px; color:#10b981; margin-top: 8px;"><span>รับชำระมัดจำ 50% แล้ว:</span> <span>-${formatBahtSmart(depositAmt)}</span></div>`;
                html += `<div style="display:flex; justify-content:space-between; font-weight:600; font-size:15px; color:#ef4444; margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 8px;"><span>ยอดคงค้างชำระ (Balance Due):</span> <span>${formatBahtSmart(depositAmt)}</span></div>`;
            }
            
            previewBox.innerHTML = html;
        } else {
            previewBox.style.display = 'none';
        }
    };

    document.getElementById('qt-price').addEventListener('input', updatePreview);
    document.getElementById('qt-discount').addEventListener('input', updatePreview);
    modal.querySelectorAll('input[name="qt-doc-type"]').forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });
    updatePreview(); // initial call
}

function closeModal() {
    const modal = document.getElementById('quotation-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/** Build the full quotation HTML page for printing */
function buildQuotationHTML(data) {
    const qtNumber = document.getElementById('qt-number').value || 'QT-000';
    const customer = document.getElementById('qt-customer').value || '-';
    const description = document.getElementById('qt-description').value || '-';
    const notes = document.getElementById('qt-notes').value || '';

    const timelineRadio = document.querySelector('input[name="qt-timeline"]:checked');
    let timelineText = '';
    if (timelineRadio) {
        switch (timelineRadio.value) {
            case 'urgent': timelineText = 'เร่งด่วน (2-3 วัน)'; break;
            case 'normal': timelineText = 'ปกติ (7-14 วัน)'; break;
            case 'custom': {
                const customVal = document.getElementById('qt-custom-timeline').value;
                timelineText = customVal ? `กำหนดเอง (${customVal})` : 'กำหนดเอง';
                break;
            }
        }
    }

    const quantity = data.quantity || 1;
    const customPrice = parseFloat(document.getElementById('qt-price').value) || data.pricePerUnit || data.perUnitCost || 0;
    const discountPct = parseFloat(document.getElementById('qt-discount').value) || 0;
    
    const docTypeRadio = document.querySelector('input[name="qt-doc-type"]:checked');
    const docType = docTypeRadio ? docTypeRadio.value : 'quotation';

    let docTitleTH = 'ใบเสนอราคา';
    let docTitleEN = 'QUOTATION';
    let sigLeftTH = 'ผู้เสนอราคา';
    let sigRightTH = 'ผู้อนุมัติ / ลูกค้า';
    let depositAmt = 0;

    if (docType === 'deposit') {
        docTitleTH = 'ใบเสร็จรับเงินมัดจำ';
        docTitleEN = 'DEPOSIT RECEIPT';
        sigLeftTH = 'ผู้รับเงิน';
        sigRightTH = 'ผู้จ่ายเงิน / ลูกค้า';
    } else if (docType === 'receipt') {
        docTitleTH = 'ใบเสร็จรับเงิน';
        docTitleEN = 'RECEIPT';
        sigLeftTH = 'ผู้รับเงิน';
        sigRightTH = 'ผู้รับสินค้า / ลูกค้า';
    }

    const subtotal = customPrice * quantity;
    const discountAmt = subtotal * (discountPct / 100);
    const netTotal = subtotal - discountAmt;
    if (docType === 'deposit') {
        depositAmt = netTotal / 2;
    }

    const dateStr = new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ใบเสนอราคา ${qtNumber} — Craft Caster</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Sarabun', sans-serif;
            color: #1a1a2e;
            background: #f5f5f5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            padding: 24px 32px;
            position: relative;
        }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: stretch;
            margin-bottom: 0;
        }
        .brand {
            flex: 1;
            padding: 8px 0;
        }
        .brand-name {
            font-size: 28px;
            font-weight: 800;
            color: #6366f1;
            letter-spacing: 1px;
        }
        .brand-sub {
            font-size: 12px;
            color: #888;
            margin-top: 2px;
        }
        .title-badge {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            padding: 16px 32px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-radius: 0 0 0 16px;
        }
        .title-badge h1 {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 2px;
        }
        .title-badge .en {
            font-size: 11px;
            margin-top: 4px;
            opacity: 0.8;
        }

        /* Accent line */
        .accent-line {
            height: 3px;
            background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
            margin-bottom: 20px;
        }

        /* Info row */
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .info-item label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-item .val {
            font-weight: 700;
            font-size: 14px;
        }
        .info-item .val.accent {
            color: #6366f1;
        }
        .info-item.right { text-align: right; }
        .info-item.center { text-align: center; }

        /* Customer box */
        .customer-box {
            background: #f8f9fc;
            border: 1px solid #e8e8f0;
            border-radius: 8px;
            padding: 14px 18px;
            margin-bottom: 24px;
        }
        .customer-box label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .customer-box .name {
            font-weight: 700;
            font-size: 16px;
            margin-top: 2px;
        }

        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }
        thead tr {
            background: #6366f1;
            color: white;
        }
        thead th {
            padding: 10px 12px;
            font-size: 12px;
            font-weight: 600;
        }
        thead th:first-child { border-radius: 8px 0 0 0; }
        thead th:last-child { border-radius: 0 8px 0 0; }
        tbody td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }

        /* Totals */
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 24px;
        }
        .totals-box { width: 260px; }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 16px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
        }
        .total-row .label { color: #666; }
        .total-row .value { font-weight: 600; }
        .grand-total {
            display: flex;
            justify-content: space-between;
            padding: 12px 16px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            border-radius: 0 0 8px 8px;
        }
        .grand-total .label { font-weight: 700; font-size: 14px; }
        .grand-total .value { font-weight: 800; font-size: 16px; }

        /* Info boxes */
        .info-boxes {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }
        .info-box {
            flex: 1;
            padding: 12px 16px;
            border-radius: 0 8px 8px 0;
        }
        .info-box.timeline {
            background: #eef2ff;
            border-left: 3px solid #6366f1;
        }
        .info-box.notes {
            background: #fffbeb;
            border-left: 3px solid #f59e0b;
        }
        .info-box .box-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .info-box.timeline .box-label { color: #4338ca; }
        .info-box.notes .box-label { color: #92400e; }
        .info-box.timeline .box-value { color: #312e81; font-weight: 600; }
        .info-box.notes .box-value { color: #78350f; }
        .info-box .box-hint { font-size: 10px; color: #6366f1; margin-top: 3px; }

        /* Separator */
        .separator { border-top: 1px dashed #ddd; margin: 16px 0; }

        /* Signatures */
        .signatures {
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            margin-top: 24px;
        }
        .sig-block {
            text-align: center;
            width: 200px;
        }
        .sig-block .sig-line {
            border-bottom: 1px solid #ccc;
            height: 50px;
        }
        .sig-block .sig-title {
            font-size: 11px;
            color: #888;
            margin-top: 6px;
        }
        .sig-block .sig-sub {
            font-size: 10px;
            color: #aaa;
        }

        /* Footer */
        .footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 12px;
            border-top: 2px solid #6366f1;
            font-size: 10px;
            color: #999;
        }

        /* Paid Stamp */
        .paid-stamp {
            position: absolute;
            top: 150px;
            right: 60px;
            border: 4px solid #10b981;
            color: #10b981;
            padding: 8px 24px;
            font-size: 24px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 4px;
            border-radius: 8px;
            transform: rotate(-15deg);
            opacity: 0.6;
            z-index: 0;
            pointer-events: none;
        }

        /* Print-specific */
        @media print {
            body { background: white; }
            .page {
                margin: 0;
                padding: 20px 28px;
                box-shadow: none;
            }
            .no-print { display: none !important; }
        }

        @media screen {
            .page {
                box-shadow: 0 2px 20px rgba(0,0,0,0.1);
                margin: 20px auto;
            }
            .print-bar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #6366f1;
                color: white;
                padding: 12px 24px;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 16px;
                z-index: 999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            .print-bar button {
                background: white;
                color: #6366f1;
                border: none;
                padding: 8px 24px;
                border-radius: 6px;
                font-family: 'Sarabun', sans-serif;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
            }
            .print-bar button:hover {
                background: #eef2ff;
            }
            .print-bar span {
                font-size: 13px;
            }
            body { padding-top: 56px; }
        }
    </style>
</head>
<body>

    <!-- Print Action Bar (screen only) -->
    <div class="print-bar no-print">
        <span>📄 ${docTitleTH} ${qtNumber}</span>
        <button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
        <button onclick="window.close()" style="background:rgba(255,255,255,0.2);color:white;">✕ ปิด</button>
    </div>

    <div class="page" style="position: relative;">
        ${docType === 'receipt' ? '<div class="paid-stamp">PAID</div>' : ''}
        
        <!-- Header -->
        <div class="header">
            <div class="brand">
                <div class="brand-name">Craft Caster</div>
                <div class="brand-sub">3D Printing Service</div>
            </div>
            <div class="title-badge">
                <h1>${docTitleTH}</h1>
                <div class="en">${docTitleEN}</div>
            </div>
        </div>

        <div class="accent-line"></div>

        <!-- Quotation Info -->
        <div class="info-row">
            <div class="info-item">
                <label>เลขที่ / No.</label>
                <div class="val">${qtNumber}</div>
            </div>
            <div class="info-item center">
                <label>วันที่ / Date</label>
                <div class="val">${dateStr}</div>
            </div>
            <div class="info-item right">
                <label>ระดับราคา / Tier</label>
                <div class="val accent">${data.tierName}</div>
            </div>
        </div>

        <!-- Customer -->
        <div class="customer-box">
            <label>ลูกค้า / Customer</label>
            <div class="name">${customer}</div>
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:40px">#</th>
                    <th class="text-left">รายการ</th>
                    <th class="text-center">Filament</th>
                    <th class="text-center" style="width:60px">จำนวน</th>
                    <th class="text-right">ราคา/ชิ้น</th>
                    <th class="text-right">จำนวนเงิน</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="text-center" style="color:#666">1</td>
                    <td style="font-weight:500">${description}</td>
                    <td class="text-center" style="color:#666">${data.filamentName}</td>
                    <td class="text-center">${quantity}</td>
                    <td class="text-right">${formatBahtSmart(customPrice)}</td>
                    <td class="text-right" style="font-weight:600">${formatBahtSmart(subtotal)}</td>
                </tr>
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals" style="position: relative; z-index: 1;">
            <div class="totals-box">
                <div class="total-row">
                    <span class="label">รวมเป็นเงิน</span>
                    <span class="value">${formatBahtSmart(subtotal)}</span>
                </div>
                ${discountPct > 0 ? `
                <div class="total-row" style="color:#ef4444">
                    <span class="label">ส่วนลด (${discountPct}%)</span>
                    <span class="value">-${formatBahtSmart(discountAmt)}</span>
                </div>
                ` : ''}
                
                ${docType === 'quotation' ? `
                <div class="grand-total">
                    <span class="label">ยอดรวมสุทธิ</span>
                    <span class="value">${formatBahtSmart(netTotal)}</span>
                </div>
                <div style="font-size:11px; color:#6366f1; text-align:right; margin-top:8px; font-weight:500;">
                    * เงื่อนไขชำระมัดจำ 50% (${formatBahtSmart(netTotal/2)}) เพื่อเริ่มงาน
                </div>
                ` : ''}

                ${docType === 'deposit' ? `
                <div class="total-row">
                    <span class="label" style="font-weight:600">ยอดรวมสุทธิ</span>
                    <span class="value">${formatBahtSmart(netTotal)}</span>
                </div>
                <div class="total-row" style="color:#10b981;">
                    <span class="label">หัก: รับชำระมัดจำ 50%</span>
                    <span class="value">-${formatBahtSmart(depositAmt)}</span>
                </div>
                <div class="grand-total" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                    <span class="label">ยอดคงค้างชำระ (Balance Due)</span>
                    <span class="value">${formatBahtSmart(depositAmt)}</span>
                </div>
                ` : ''}

                ${docType === 'receipt' ? `
                <div class="grand-total">
                    <span class="label">ยอดชำระสุทธิ</span>
                    <span class="value">${formatBahtSmart(netTotal)}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Timeline & Notes -->
        ${(timelineText || notes) ? `
        <div class="info-boxes">
            ${timelineText ? `
            <div class="info-box timeline">
                <div class="box-label">⏱ ระยะเวลาผลิต</div>
                <div class="box-value">${timelineText}</div>
                <div class="box-hint">* ไม่รวมระยะเวลาจัดส่ง</div>
            </div>
            ` : ''}
            ${notes ? `
            <div class="info-box notes">
                <div class="box-label">📝 หมายเหตุ</div>
                <div class="box-value">${notes}</div>
            </div>
            ` : ''}
        </div>
        ` : ''}

        <div class="separator"></div>

        <!-- Signatures -->
        <div class="signatures">
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-title">${sigLeftTH}</div>
                <div class="sig-sub">Craft Caster</div>
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-title">${sigRightTH}</div>
                <div class="sig-sub">วันที่ ___/___/______</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            Craft Caster — 3D Printing Service | สร้างโดย 3D Print Calculator
        </div>
    </div>

    <script>
        // Auto-trigger print dialog after page loads
        window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
        };
    </script>
</body>
</html>`;
}

/** Generate PDF by opening a print window */
function generatePDF() {
    const qtNumber = document.getElementById('qt-number').value;
    const customer = document.getElementById('qt-customer').value;
    const description = document.getElementById('qt-description').value;
    const customPrice = parseFloat(document.getElementById('qt-price').value);
    const discountPct = parseFloat(document.getElementById('qt-discount').value) || 0;
    const docType = document.querySelector('input[name="qt-doc-type"]:checked').value;

    const data = currentQuotationData;
    const htmlContent = buildQuotationHTML(data);

    // Save or update order logic
    if (currentHistoryId) {
        updateHistoryItem(currentHistoryId, {
            customer, description, qtNumber, sellPrice: customPrice, discountPct, docType
        });
    } else {
        // Create new history item
        const newItem = saveHistory({
            ...data, 
            customer, description, qtNumber, sellPrice: customPrice, discountPct, docType
        });
        currentHistoryId = newItem.id; // so subsequent prints update this one
    }

    // Open new window with quotation content
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
        showToast('⚠️ กรุณาอนุญาต Pop-up ในเบราว์เซอร์');
        return;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    closeModal();
    showToast('✅ เอกสารเปิดแล้ว & บันทึกประวัติสำเร็จ!');
    
    // Refresh the UI to reflect the updated docType status (e.g. from Pending to Deposit)
    refreshCurrentTab();
}
