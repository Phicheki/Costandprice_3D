/**
 * Settings Store
 * Manages all configurable values via localStorage.
 * No values are hardcoded — everything can be adjusted from the Settings page.
 */

const STORAGE_KEY = '3d-print-calculator-settings';

/** Default settings (used on first launch or after reset) */
const DEFAULTS = {
    // === Filament ===
    filaments: [
        { id: 'pla', name: 'PLA', pricePerRoll: 590, weightPerRoll: 1000 },
        { id: 'petg', name: 'PETG', pricePerRoll: 690, weightPerRoll: 1000 },
        { id: 'abs', name: 'ABS', pricePerRoll: 690, weightPerRoll: 1000 },
        { id: 'tpu', name: 'TPU', pricePerRoll: 890, weightPerRoll: 1000 },
        { id: 'asa', name: 'ASA', pricePerRoll: 790, weightPerRoll: 1000 },
    ],

    // === Material Loss ===
    materialLossPercent: 5, // %

    // === Electricity ===
    electricityRate: 4.5,       // บาท/kWh
    printerWattage: 350,        // W — Bambu Lab P2S
    dryerWattage: 80,           // W — Creality Space Pi

    // === Depreciation ===
    printerPrice: 35900,        // บาท — Bambu Lab P2S
    printerLifetimeHours: 5000, // ชม.

    // === Maintenance ===
    maintenanceCostPerHour: 5, // บาท/ชม.

    // === Labor ===
    laborRatePerHour: 200, // บาท/ชม. (Modeling / Post-Processing)

    // === Overhead ===
    overheadPercent: 10, // %

    // === Pricing Tiers (multipliers) ===
    tiers: {
        economy: { min: 1.5, max: 2.0 },
        standard: { min: 3.0, max: 4.0 },
        rush: { min: 3.9, max: 6.0 },   // Standard × 1.3-1.5
        premium: { min: 5.0, max: 10.0 },
    },
};

/**
 * Load settings from localStorage, merging with defaults
 * so new keys added later are always present.
 */
export function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULTS };
        const saved = JSON.parse(raw);
        // Deep merge for nested objects
        return {
            ...DEFAULTS,
            ...saved,
            tiers: {
                ...DEFAULTS.tiers,
                ...(saved.tiers || {}),
            },
            filaments: saved.filaments && saved.filaments.length
                ? saved.filaments
                : DEFAULTS.filaments,
        };
    } catch {
        return { ...DEFAULTS };
    }
}

/** Save full settings object to localStorage */
export function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Reset settings to factory defaults */
export function resetSettings() {
    localStorage.removeItem(STORAGE_KEY);
    return { ...DEFAULTS };
}

/** Get a specific filament definition by id */
export function getFilament(settings, filamentId) {
    return settings.filaments.find(f => f.id === filamentId) || settings.filaments[0];
}

export { DEFAULTS };
