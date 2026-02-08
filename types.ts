export interface Vial {
  id: string;
  name: string;
  cost: number;
  mg: number;
  waterAddedMl: number;
  inUse: boolean;
}

export interface BacWaterItem {
  id: string;
  name: string;
  sizeMl: number;
  cost: number;
}

export interface SyringeConfig {
  sizeMl: number;
  costPerBox: number;
  countPerBox: number;
}

export interface ProtocolStep {
  id: string;
  startWeek: number;
  endWeek: number | null; // null indicates "ongoing" or "plus"
  dosageMg: number;
}

export interface ScheduleRow {
  week: number;
  protocolWeek: number;
  date: Date;
  doseMg: number;
  doseUnits: number;
  doseMl: number;
  vialId: string;
  vialName: string;
  vialMgRemainingBefore: number;
  vialMgRemainingAfter: number;
  vialMlRemainingAfter: number;

  // Costing
  cumulativeCost: number; // Cash flow (buying items)
  weeklyAmortizedCost: number; // Value consumed this week

  // Events
  isNewVial: boolean;
  isNewBaw: boolean;
  isNewSyringeBox: boolean;
  isReorderWarning: boolean;
  warnings: string[];
  notes: string[];
}

export interface SimulationResult {
  schedule: ScheduleRow[];
  totalCashCost: number;
  avgWeeklyCost: number;
  runoutDate: Date | null;
  weeksCovered: number;
}
