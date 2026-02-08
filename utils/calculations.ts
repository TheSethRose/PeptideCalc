import {
  Vial,
  ScheduleRow,
  SimulationResult,
  BacWaterItem,
  SyringeConfig,
  SyringeBoxItem,
  ProtocolStep,
} from '../types';
import { addWeeks } from 'date-fns';

export const SYRINGE_UNITS_PER_ML = 100;
export const UNITS_ROUNDING_INCREMENT = 0.1;

const getIncrementDecimals = (increment: number): number => {
  if (!Number.isFinite(increment) || increment <= 0) return 0;
  const str = increment.toString();
  if (str.includes('e-')) {
    const [, exp] = str.split('e-');
    return Number(exp) || 0;
  }
  const parts = str.split('.');
  return parts.length > 1 ? parts[1].length : 0;
};

export const roundToIncrement = (value: number, increment: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(increment) || increment <= 0) return value;
  return Math.round(value / increment) * increment;
};

export const formatUnits = (value: number, increment: number = UNITS_ROUNDING_INCREMENT): string => {
  const rounded = roundToIncrement(value, increment);
  const decimals = getIncrementDecimals(increment);
  if (decimals === 0) return Math.round(rounded).toString();
  return rounded.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
};

export const generateSchedule = (
  vialsInput: Vial[],
  bawInventoryInput: BacWaterItem[],
  syringeConfigInput: SyringeConfig,
  syringeInventoryInput: SyringeBoxItem[],
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
  };
  const syringeInventory = syringeInventoryInput.map((s) => ({
    ...s,
    cost: s.cost * discountFactor,
  }));

  // Inventory State
  const peptideStock = vials.map((v) => ({
    ...v,
    currentMg: v.mg,
    owned: v.onHand ?? true,
    finished: false,
  }));
  let currentVialIndex = 0;

  // Bac Water State
  let currentBawIndex = 0;
  const safeBawInventory =
    bawInventory.length > 0
      ? bawInventory
      : [{ id: 'default', name: 'Default Water', sizeMl: 10, cost: 0 }];
  let bawStockMl = 0;

  let currentSyringeIndex = 0;
  const safeSyringeInventory =
    syringeInventory.length > 0
      ? syringeInventory
      : [
          {
            id: 'default',
            name: 'Default Syringes',
            cost: 0,
            countPerBox: 100,
            sizeMl: syringeConfig.sizeMl ?? 1.0,
            onHand: true,
          },
        ];
  const onHandSyringeBoxes = safeSyringeInventory.filter((s) => s.onHand ?? true).length;
  let syringeStockCount =
    safeSyringeInventory.reduce(
      (acc, s) => acc + (s.onHand ?? true ? s.countPerBox : 0),
      0,
    ) || 0;
  currentSyringeIndex = Math.min(onHandSyringeBoxes, safeSyringeInventory.length);
  let activeSyringeBox =
    safeSyringeInventory[Math.max(0, onHandSyringeBoxes - 1)] || safeSyringeInventory[0];

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

  let lastReorderWarning = false;

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
    let didPurchaseVial = false;
    let didPurchaseBaw = false;
    let didPurchaseSyringes = false;

    // --- 1. Syringe Check ---
    if (syringeStockCount <= 0) {
      let nextSyringeBox: SyringeBoxItem;
      if (currentSyringeIndex < safeSyringeInventory.length) {
        nextSyringeBox = safeSyringeInventory[currentSyringeIndex];
        currentSyringeIndex++;
      } else {
        nextSyringeBox = safeSyringeInventory[safeSyringeInventory.length - 1];
        notes.push(`Auto-reordered ${nextSyringeBox.name}`);
      }
      if (!(nextSyringeBox.onHand ?? true)) {
        cumulativeCashCost += nextSyringeBox.cost;
        nextSyringeBox.onHand = true;
        didPurchaseSyringes = true;
      }
      syringeStockCount += nextSyringeBox.countPerBox;
      activeSyringeBox = nextSyringeBox;
      isNewSyringeBox = true;
    }
    syringeStockCount--;
    const syringeCostThisWeek =
      (activeSyringeBox?.countPerBox ?? 0) > 0
        ? (activeSyringeBox.cost ?? 0) / activeSyringeBox.countPerBox
        : 0;

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
          if (!(nextBaw.onHand ?? true)) {
            cumulativeCashCost += nextBaw.cost;
            nextBaw.onHand = true;
            didPurchaseBaw = true;
          }
          bawStockMl += nextBaw.sizeMl;
          isNewBaw = true;
        }
      }

      bawStockMl -= waterNeeded;
      if (!currentVial.owned) {
        cumulativeCashCost += currentVial.cost;
        currentVial.owned = true;
        didPurchaseVial = true;
      }
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
      if (partialMg > 0 && !currentVial.finished) {
        notes.push(`Finished ${currentVial.name}`);
        currentVial.finished = true;
      }

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
            if (!(nextBaw.onHand ?? true)) {
              cumulativeCashCost += nextBaw.cost;
              nextBaw.onHand = true;
              didPurchaseBaw = true;
            }
            bawStockMl += nextBaw.sizeMl;
            isNewBaw = true;
          }
        }
        bawStockMl -= nextWaterNeeded;
        if (!nextVial.owned) {
          cumulativeCashCost += nextVial.cost;
          nextVial.owned = true;
          didPurchaseVial = true;
        }
        isNewVial = true;

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
      if (currentVial.currentMg <= 0 && !currentVial.finished) {
        notes.push(`Finished ${currentVial.name}`);
        currentVial.finished = true;
      }
    }

    // Calculate remaining mL for the *active* vial after dose
    const activeVialAfter = peptideStock[currentVialIndex];
    let vialMlRemainingAfter = 0;
    if (activeVialAfter) {
      const activeConc = activeVialAfter.mg / activeVialAfter.waterAddedMl;
      vialMlRemainingAfter = activeVialAfter.currentMg / activeConc;
    }

    // Warnings
    const activeSyringeSize = activeSyringeBox?.sizeMl ?? syringeConfig.sizeMl ?? 1.0;
    if (doseMl > activeSyringeSize) {
      warnings.push(`Dose (${doseMl.toFixed(2)}mL) exceeds syringe (${activeSyringeSize}mL)`);
    }

    // --- 4. Reorder Logic ---
    let totalStockMg = 0;
    for (let i = currentVialIndex; i < peptideStock.length; i++) {
      if (peptideStock[i].owned) {
        totalStockMg += peptideStock[i].currentMg;
      }
    }

    // Check next N weeks based on reorderLeadWeeks
    let futureDemand = 0;
    for (let k = 1; k <= reorderLeadWeeks; k++) {
      futureDemand += getDoseForWeek(protocolWeek + k);
    }

    const isReorderWarning = totalStockMg < futureDemand && totalStockMg > 0;
    const isReorderTrigger = isReorderWarning && !lastReorderWarning;
    lastReorderWarning = isReorderWarning;

    if (running) {
      schedule.push({
        week,
        protocolWeek,
        date: addWeeks(startDate, week - 1),
        doseMg,
        doseUnits: roundToIncrement(doseUnits, UNITS_ROUNDING_INCREMENT),
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
        isReorderWarning: isReorderTrigger,
        didPurchaseVial,
        didPurchaseBaw,
        didPurchaseSyringes,
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
