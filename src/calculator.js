/**
 * Calculator — Pure cost/pricing calculation functions
 * All values come from the settings object (no hardcoded numbers).
 */

/**
 * Calculate the full cost breakdown.
 *
 * @param {Object} input
 * @param {string}  input.filamentId       - Which filament to use
 * @param {number}  input.weightGrams      - Weight of filament used (g)
 * @param {number}  input.printTimeHours   - Print time (hours, decimal)
 * @param {number}  input.modelingHours    - Hours spent on 3D modeling (0 if none)
 * @param {number}  input.slicingMinutes   - Minutes spent slicing (0 if none)
 * @param {number}  input.postProcessHours - Hours spent post-processing (0 if none)
 *
 * @param {Object} settings - The full settings object from settings.js
 *
 * @returns {Object} breakdown — individual cost lines + total
 */
export function calculateCost(input, settings) {
    const filament = settings.filaments.find(f => f.id === input.filamentId)
        || settings.filaments[0];

    // A. Direct Costs
    // 1. Material cost
    const pricePerGram = filament.pricePerRoll / filament.weightPerRoll;
    const materialCost = pricePerGram * input.weightGrams * (1 + settings.materialLossPercent / 100);

    // 2. Electricity cost
    const totalWattage = settings.printerWattage + settings.dryerWattage;
    const electricityCost = (totalWattage / 1000) * input.printTimeHours * settings.electricityRate;

    // 3. Depreciation cost
    const depreciationRate = settings.printerPrice / settings.printerLifetimeHours;
    const depreciationCost = depreciationRate * input.printTimeHours;

    // 4. Maintenance cost
    const maintenanceCost = settings.maintenanceCostPerHour * input.printTimeHours;

    // B. Labor Costs
    // 5. Modeling cost
    const modelingCost = input.modelingHours * settings.laborRatePerHour;

    // 6. Slicing cost
    const slicingCost = (input.slicingMinutes / 60) * settings.laborRatePerHour;

    // 7. Post-Processing cost
    const postProcessCost = input.postProcessHours * settings.laborRatePerHour;

    // Sum of items 1-7
    const subtotal = materialCost + electricityCost + depreciationCost
        + maintenanceCost + modelingCost + slicingCost + postProcessCost;

    // C. Overhead
    // 8. Overhead cost
    const overheadCost = subtotal * (settings.overheadPercent / 100);

    // Total
    const totalCost = subtotal + overheadCost;

    return {
        materialCost,
        electricityCost,
        depreciationCost,
        maintenanceCost,
        modelingCost,
        slicingCost,
        postProcessCost,
        overheadCost,
        totalCost,
    };
}

/**
 * Calculate recommended selling prices for all tiers.
 *
 * @param {number} totalCost - The total cost from calculateCost()
 * @param {Object} tiers     - Tier multiplier config from settings
 *
 * @returns {Object} tierPrices — each tier has { min, max, recommended }
 */
export function calculatePricing(totalCost, tiers) {
    const result = {};

    for (const [tierName, multiplier] of Object.entries(tiers)) {
        const minPrice = totalCost * multiplier.min;
        const maxPrice = totalCost * multiplier.max;
        // Recommended = midpoint, rounded to nearest 10
        const recommended = Math.round(((minPrice + maxPrice) / 2) / 10) * 10;
        result[tierName] = { min: minPrice, max: maxPrice, recommended };
    }

    return result;
}

/** Format a number as Thai Baht */
export function formatBaht(amount) {
    return '฿' + amount.toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/** Format a number as Thai Baht (rounded, no decimals) */
export function formatBahtRound(amount) {
    return '฿' + Math.round(amount).toLocaleString('th-TH');
}
