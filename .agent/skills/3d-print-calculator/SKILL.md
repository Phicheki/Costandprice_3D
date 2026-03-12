---
name: 3D Print Cost & Pricing Calculator
description: Internal web app for calculating 3D printing costs and recommended selling prices with configurable settings
---

# 3D Print Cost & Pricing Calculator

## Overview
เว็บแอปสำหรับคำนวณต้นทุนและตั้งราคางาน 3D Print ใช้งานภายใน (Internal Use)
- เครื่องปริ้น: **Bambu Lab P2S**
- เครื่องอบเส้น: **Creality Space Pi** (อบไปปริ้นไปเพื่อลดการชื้น)

## Tech Stack
- **Vite** + Vanilla JavaScript (no framework)
- **localStorage** for settings persistence (no backend)
- **Dark theme** with glassmorphism, Google Font: Inter

## Project Structure

```
Costandprice_3D/
├── index.html              # Root HTML, 2-tab layout
├── package.json
├── vite.config.js
├── src/
│   ├── main.js             # Entry: tab switching, page rendering
│   ├── style.css           # Global styles, dark theme, glassmorphism
│   ├── calculator.js       # Pure cost/pricing calculation functions
│   ├── settings.js         # Settings store (localStorage load/save)
│   └── ui/
│       ├── calculatorPage.js   # Calculator page UI & logic
│       └── settingsPage.js     # Admin settings page UI & logic
└── .agent/
    └── skills/
        └── 3d-print-calculator/
            └── SKILL.md
```

## Cost Structure (สูตรคำนวณ)

### A. ต้นทุนทางตรง (Direct Costs)
1. **ค่าวัสดุ** = (ราคาเส้นต่อม้วน / น้ำหนักต่อม้วน) × น้ำหนักที่ใช้ × (1 + %เผื่อเสีย)
2. **ค่าไฟ** = ((กำลังไฟเครื่องปริ้น + กำลังไฟเครื่องอบ) / 1000) × เวลาปริ้น(ชม.) × ค่าไฟต่อหน่วย
3. **ค่าเสื่อมราคา** = (ราคาเครื่อง / อายุการใช้งาน(ชม.)) × เวลาปริ้น(ชม.)
4. **ค่าซ่อมบำรุง** = ค่าซ่อมบำรุงต่อชม. × เวลาปริ้น(ชม.)

### B. ต้นทุนแรงงาน (Labor Costs)
5. **ค่าปั้นแบบ** = ชม.ปั้นแบบ × ค่าแรงต่อชม.
6. **ค่าเตรียมไฟล์ (Slicing)** = นาที Slicing × (ค่าแรงต่อชม. / 60)
7. **ค่า Post-Processing** = ชม. Post-Processing × ค่าแรงต่อชม.

### C. ต้นทุนคงที่ (Overhead)
8. **ค่าโสหุ้ย** = (ผลรวมข้อ 1-7) × %โสหุ้ย

### Total Cost = ข้อ 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8

## Pricing Tiers (ระดับราคาขาย)

| Tier | ชื่อไทย | Margin | ลักษณะงาน |
|------|---------|--------|-----------|
| Economy | ราคามิตรภาพ | ×1.5-2 | Layer หนา 0.28mm, ไม่แต่ง, PLA |
| Standard | ราคามาตรฐาน | ×3-4 | Layer 0.16-0.20mm, ขัดเบาๆ, PETG/ABS |
| Rush | งานด่วน | Standard + 30-50% | เหมือน Standard แต่แซงคิว |
| Premium | คุณภาพสูง | ×5-10 | Layer 0.08mm, ทำสี Airbrush, วัสดุพิเศษ |

## Configurable Settings (ห้าม Hardcode)
ค่าทุกตัวสามารถปรับได้จากหน้า Settings:
- ราคา Filament / ชนิดเส้น / น้ำหนักต่อม้วน
- %เผื่อเสีย (Material Loss)
- ค่าไฟ (บาท/kWh)
- กำลังไฟเครื่องปริ้น (W) / เครื่องอบ (W)
- ราคาเครื่อง / อายุการใช้งาน (ชม.)
- ค่าซ่อมบำรุงต่อชม.
- ค่าแรงต่อชม. (Modeling / Slicing / Post-Processing)
- %โสหุ้ย (Overhead)
- Margin ของแต่ละ Tier

## Workflow: การใช้งาน
1. นำไฟล์ STL ไปเปิดใน Slicer (เช่น Bambu Studio)
2. จด **เวลาปริ้น** และ **น้ำหนักเส้นที่ใช้** จาก Slicer
3. เปิด Web App → กรอกเวลาและน้ำหนัก
4. เลือกชนิดเส้น + ระดับงาน
5. (ถ้ามี) กรอกชม.ปั้นแบบ / ชม. Post-Processing
6. ดูผลลัพธ์: Cost Breakdown + ราคาขายแนะนำ 4 ระดับ

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```
