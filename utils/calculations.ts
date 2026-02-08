import {
  Vial,
  ScheduleRow,
  SimulationResult,
  BacWaterItem,
  SyringeConfig,
  ProtocolStep,
} from '../types';
import { addWeeks } from 'date-fns';

export const SYRINGE_UNITS_PER_ML = 100;

export const generateSchedule = (
  vialsInput: Vial[],
  bawInventoryInput: BacWaterItem[],
  syringeConfigInput: SyringeConfig,
  protocolSteps: ProtocolStep[],
  startDate: Date,
  startProtocolWeek: number,
  discountPercent: number = 0,
  reorderLeadWeeks: number = 2,
): SimulationResult => {
  const schedule: ScheduleRow[] = [];
  const discountFactor = Math.max(0, (100 - discountPercent) / 100);

  // Apply discount to cost basis effectively
  const vials = vialsInput.map((v) => ({ ...v, cost: v.cost * discountFactor }));
  const bawInventory = bawInventoryInput.map((b) => ({ ...b, cost: b.cost * discountFactor }));
  const syringeConfig = {
    ...syringeConfigInput,
    costPerBox: syringeConfigInput.costPerBox * discountFactor,
  };

  // Inventory State
  const peptideStock = vials.map((v) => ({ ...v, currentMg: v.mg }));
  let currentVialIndex = 0;

  // Bac Water State
  let currentBawIndex = 0;
  const safeBawInventory =
    bawInventory.length > 0
      ? bawInventory
      : [{ id: 'default', name: 'Default Water', sizeMl: 10, cost: 0 }];
  let bawStockMl = 0;

  let syringeStockCount = 0; // Current open box remaining

  // Financial State
  let cumulativeCashCost = 0;

  // Dynamic Dosing Rule
  const getDoseForWeek = (pWeek: number): number => {
    // Find the step that covers this week
    const step = protocolSteps.find(
      (s) => pWeek >= s.startWeek && (s.endWeek === null || pWeek <= s.endWeek),
    );

    // Fallback if no step matches (e.g. beyond defined range), use the last defined step or 0
    if (!step) {
      const lastStep = protocolSteps[protocolSteps.length - 1];
      if (lastStep && pWeek > lastStep.startWeek) return lastStep.dosageMg;
      return 0;
    }

    return step.dosageMg;
  };

  let week = 1; // Simulation week
  let protocolWeek = startProtocolWeek;
  let running = true;
  const totalWeeksToSimulate = 104; // 2 years cap

  while (running && week <= totalWeeksToSimulate) {
    if (currentVialIndex >= peptideStock.length) {
      running = false;
      break;
    }

    const currentVial = peptideStock[currentVialIndex];
    const doseMg = getDoseForWeek(protocolWeek);

    if (doseMg <= 0) {
      // No dose defined for this week, skip or stop? Let's stop to avoid infinite loops of 0 cost
      running = false;
      break;
    }

    // Calculate Volume & Units
    const concentration = currentVial.mg / currentVial.waterAddedMl;
    let doseMl = doseMg / concentration;
    let doseUnits = doseMl * SYRINGE_UNITS_PER_ML;

    const notes: string[] = [];
    const warnings: string[] = [];

    // Track Events
    let isNewVial = false;
    let isNewBaw = false;
    let isNewSyringeBox = false;

    // --- 1. Syringe Check ---
    if (syringeStockCount <= 0) {
      cumulativeCashCost += syringeConfig.costPerBox;
      syringeStockCount += syringeConfig.countPerBox;
      isNewSyringeBox = true;
      notes.push('Opened new box of syringes');
    }
    syringeStockCount--;
    const syringeCostThisWeek = syringeConfig.costPerBox / syringeConfig.countPerBox;

    // --- 2. Vial & Water Check ---
    const vialMgRemainingBefore = currentVial.currentMg;

    // Check if we need to reconstitute the CURRENT vial (if it's untouched)
    if (currentVial.currentMg === currentVial.mg) {
      // It's a fresh vial, need water
      const waterNeeded = currentVial.waterAddedMl;

      if (bawStockMl < waterNeeded) {
        while (bawStockMl < waterNeeded) {
          let nextBaw: BacWaterItem;

          // Check if we have a defined next bottle
          if (currentBawIndex < safeBawInventory.length && bawStockMl === 0) {
            nextBaw = safeBawInventory[currentBawIndex];
            currentBawIndex++;
          } else if (currentBawIndex < safeBawInventory.length) {
            nextBaw = safeBawInventory[currentBawIndex];
            currentBawIndex++;
          } else {
            nextBaw = safeBawInventory[safeBawInventory.length - 1];
            notes.push(`Auto-reordered ${nextBaw.name}`);
          }

          cumulativeCashCost += nextBaw.cost;
          bawStockMl += nextBaw.sizeMl;
          isNewBaw = true;
        }
        if (!notes.includes('Opened new Bac Water')) {
          notes.push('Opened new Bac Water');
        }
      }

      bawStockMl -= waterNeeded;
      cumulativeCashCost += currentVial.cost;
      isNewVial = true;
    }

    // Amortized Cost Calculation
    const costPerMg = currentVial.cost / currentVial.mg;
    const peptideValueUsed = doseMg * costPerMg;

    const activeBawIndex = Math.max(0, currentBawIndex - 1);
    const activeBaw = safeBawInventory[Math.min(activeBawIndex, safeBawInventory.length - 1)];
    const waterCostPerMl = activeBaw.cost / activeBaw.sizeMl;
    const waterValueUsed = (doseMg / currentVial.mg) * (currentVial.waterAddedMl * waterCostPerMl);

    const weeklyAmortizedCost = peptideValueUsed + syringeCostThisWeek + waterValueUsed;

    // --- 3. Deduct Peptide ---
    if (currentVial.currentMg < doseMg) {
      // Split dose or finish vial
      const partialMg = currentVial.currentMg;
      const remainingNeeded = doseMg - partialMg;

      currentVial.currentMg = 0;
      notes.push(`Finished ${currentVial.name}`);

      // Switch to next
      currentVialIndex++;
      if (currentVialIndex < peptideStock.length) {
        const nextVial = peptideStock[currentVialIndex];

        // --- Open Next Vial (Reconstitute) ---
        const nextWaterNeeded = nextVial.waterAddedMl;

        if (bawStockMl < nextWaterNeeded) {
          while (bawStockMl < nextWaterNeeded) {
            let nextBaw: BacWaterItem;
            if (currentBawIndex < safeBawInventory.length) {
              nextBaw = safeBawInventory[currentBawIndex];
              currentBawIndex++;
            } else {
              nextBaw = safeBawInventory[safeBawInventory.length - 1];
              notes.push(`Auto-reordered ${nextBaw.name}`);
            }
            cumulativeCashCost += nextBaw.cost;
            bawStockMl += nextBaw.sizeMl;
            isNewBaw = true;
          }
          if (!notes.includes('Opened new Bac Water')) {
            notes.push('Opened new Bac Water');
          }
        }
        bawStockMl -= nextWaterNeeded;
        cumulativeCashCost += nextVial.cost;
        isNewVial = true;
        notes.push(`Started ${nextVial.name}`);

        if (nextVial.currentMg >= remainingNeeded) {
          nextVial.currentMg -= remainingNeeded;
        } else {
          nextVial.currentMg = 0;
          running = false;
          notes.push('Stock depleted mid-dose');
        }

        // Recalculate injection volume based on actual vials used
        const newConc = nextVial.mg / nextVial.waterAddedMl;
        doseMl = partialMg / concentration + remainingNeeded / newConc;
        doseUnits = doseMl * SYRINGE_UNITS_PER_ML;
      } else {
        running = false;
        notes.push('Stock depleted');
      }
    } else {
      currentVial.currentMg -= doseMg;
    }

    // Calculate remaining mL for the *active* vial after dose
    const activeVialAfter = peptideStock[currentVialIndex];
    let vialMlRemainingAfter = 0;
    if (activeVialAfter) {
      const activeConc = activeVialAfter.mg / activeVialAfter.waterAddedMl;
      vialMlRemainingAfter = activeVialAfter.currentMg / activeConc;
    }

    // Warnings
    if (doseMl > syringeConfig.sizeMl) {
      warnings.push(`Dose (${doseMl.toFixed(2)}mL) exceeds syringe (${syringeConfig.sizeMl}mL)`);
    }

    // --- 4. Reorder Logic ---
    let totalStockMg = 0;
    for (let i = currentVialIndex; i < peptideStock.length; i++) {
      totalStockMg += peptideStock[i].currentMg;
    }

    // Check next N weeks based on reorderLeadWeeks
    let futureDemand = 0;
    for (let k = 1; k <= reorderLeadWeeks; k++) {
      futureDemand += getDoseForWeek(protocolWeek + k);
    }

    const isReorderWarning = totalStockMg < futureDemand && totalStockMg > 0;

    if (running) {
      schedule.push({
        week,
        protocolWeek,
        date: addWeeks(startDate, week - 1),
        doseMg,
        doseUnits: Math.round(doseUnits),
        doseMl,
        vialId: peptideStock[currentVialIndex]?.id || '',
        vialName: peptideStock[currentVialIndex]?.name || 'Unknown',
        vialMgRemainingBefore,
        vialMgRemainingAfter: peptideStock[currentVialIndex]?.currentMg || 0,
        vialMlRemainingAfter,
        cumulativeCost: cumulativeCashCost,
        weeklyAmortizedCost,
        isNewVial,
        isNewBaw,
        isNewSyringeBox,
        isReorderWarning,
        warnings,
        notes,
      });

      week++;
      protocolWeek++;
    }
  }

  // Summary Stats
  const totalAmortized = schedule.reduce((acc, row) => acc + row.weeklyAmortizedCost, 0);
  const avgWeekly = schedule.length > 0 ? totalAmortized / schedule.length : 0;

  return {
    schedule,
    totalCashCost: cumulativeCashCost,
    avgWeeklyCost: avgWeekly,
    runoutDate: schedule.length > 0 ? addWeeks(schedule[schedule.length - 1].date, 1) : null,
    weeksCovered: schedule.length,
  };
};
