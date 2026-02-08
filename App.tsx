import React, { useState, useEffect } from 'react';
import {
  Vial,
  SimulationResult,
  BacWaterItem,
  SyringeConfig,
  SyringeBoxItem,
  ProtocolStep,
} from './types';
import { generateSchedule, formatUnits } from './utils/calculations';
import { InputSection } from './components/InputSection';
import { MixingProtocol } from './components/MixingProtocol';
import { ScheduleTable } from './components/ScheduleTable';
import { ThemeToggle } from './components/ui';
import { useTheme } from './hooks/useTheme';
import { addWeeks, differenceInCalendarWeeks, format } from 'date-fns';
import {
  Copy,
  Check,
  PanelLeft,
  Activity,
  Droplets,
  Calendar,
  TrendingUp,
  AlertCircle,
  DollarSign,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

const DEFAULT_VIALS: Vial[] = [
  {
    id: '1',
    name: 'Peptide 1',
    cost: 109,
    mg: 30,
    waterAddedMl: 1.2,
    inUse: false,
    onHand: true,
  },
  {
    id: '2',
    name: 'Peptide 2',
    cost: 225,
    mg: 60,
    waterAddedMl: 2.4,
    inUse: false,
    onHand: false,
  },
  {
    id: '3',
    name: 'Peptide 3',
    cost: 225,
    mg: 60,
    waterAddedMl: 2.4,
    inUse: false,
    onHand: false,
  },
];

const DEFAULT_BAW_INVENTORY: BacWaterItem[] = [
  { id: '1', name: 'Bac Water 1', sizeMl: 3, cost: 7, onHand: true },
  { id: '2', name: 'Bac Water 2', sizeMl: 10, cost: 15, onHand: false },
];

const DEFAULT_SYRINGE: SyringeConfig = {
  sizeMl: 1.0,
};

const DEFAULT_SYRINGE_BOXES: SyringeBoxItem[] = [
  { id: '1', name: 'Syringe Box 1', cost: 20, countPerBox: 100, sizeMl: 1.0, onHand: true },
  { id: '2', name: 'Syringe Box 2', cost: 20, countPerBox: 100, sizeMl: 1.0, onHand: false },
];

const DEFAULT_PROTOCOL: ProtocolStep[] = [
  { id: '1', startWeek: 1, endWeek: 4, dosageMg: 2.5 },
  { id: '2', startWeek: 5, endWeek: 8, dosageMg: 5.0 },
  { id: '3', startWeek: 9, endWeek: 12, dosageMg: 7.5 },
  { id: '4', startWeek: 13, endWeek: null, dosageMg: 10.0 },
];

const SETTINGS_STORAGE_KEY = 'peptidecalc-settings-v1';

type SettingsPayload = {
  vials: Vial[];
  bawInventory: BacWaterItem[];
  syringeConfig: SyringeConfig;
  syringeInventory: SyringeBoxItem[];
  protocolSteps: ProtocolStep[];
  startDate: string;
  currentDate?: string;
  startWeek?: number;
  discountPercent: number;
  reorderLeadWeeks: number;
};

const loadSettings = (): SettingsPayload | null => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SettingsPayload;
    if (!parsed || !parsed.vials || !parsed.bawInventory || !parsed.syringeConfig || !parsed.protocolSteps) {
      return null;
    }
    const normalizedVials = parsed.vials.map((v) => ({
      ...v,
      onHand: v.onHand ?? true,
    }));
    const normalizedBaw = parsed.bawInventory.map((b) => ({
      ...b,
      onHand: b.onHand ?? true,
    }));
    const normalizedSyringe = {
      ...parsed.syringeConfig,
    };
    const normalizedSyringeInventory = (parsed.syringeInventory ?? DEFAULT_SYRINGE_BOXES).map(
      (s) => ({
        ...s,
        sizeMl: s.sizeMl ?? parsed.syringeConfig?.sizeMl ?? 1.0,
        onHand: s.onHand ?? true,
      }),
    );

    return {
      ...parsed,
      vials: normalizedVials,
      bawInventory: normalizedBaw,
      syringeConfig: normalizedSyringe,
      syringeInventory: normalizedSyringeInventory,
    };
  } catch {
    return null;
  }
};

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [activeView, setActiveView] = useState<'mixing' | 'dosing'>('mixing');
  const [vials, setVials] = useState<Vial[]>(() => loadSettings()?.vials ?? DEFAULT_VIALS);
  const [bawInventory, setBawInventory] = useState<BacWaterItem[]>(
    () => loadSettings()?.bawInventory ?? DEFAULT_BAW_INVENTORY,
  );
  const [syringeConfig, setSyringeConfig] = useState<SyringeConfig>(
    () => loadSettings()?.syringeConfig ?? DEFAULT_SYRINGE,
  );
  const [syringeInventory, setSyringeInventory] = useState<SyringeBoxItem[]>(
    () => loadSettings()?.syringeInventory ?? DEFAULT_SYRINGE_BOXES,
  );
  const [protocolSteps, setProtocolSteps] = useState<ProtocolStep[]>(
    () => loadSettings()?.protocolSteps ?? DEFAULT_PROTOCOL,
  );

  const [startDate, setStartDate] = useState<string>(
    () => loadSettings()?.startDate ?? format(new Date(), 'yyyy-MM-dd'),
  );
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const saved = loadSettings();
    if (saved?.currentDate) return saved.currentDate;
    // Legacy migration: compute currentDate from startWeek
    if (saved?.startWeek && saved.startWeek > 1 && saved?.startDate) {
      const start = new Date(saved.startDate + 'T00:00:00');
      return format(addWeeks(start, saved.startWeek - 1), 'yyyy-MM-dd');
    }
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [discountPercent, setDiscountPercent] = useState<number>(
    () => loadSettings()?.discountPercent ?? 0,
  );
  const [reorderLeadWeeks, setReorderLeadWeeks] = useState<number>(
    () => loadSettings()?.reorderLeadWeeks ?? 2,
  );

  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const activeSyringeSize =
    syringeInventory.find((b) => b.onHand ?? true)?.sizeMl ??
    syringeInventory[0]?.sizeMl ??
    syringeConfig.sizeMl ??
    1.0;

  const resetDefaults = () => {
    setVials(DEFAULT_VIALS);
    setBawInventory(DEFAULT_BAW_INVENTORY);
    setSyringeConfig(DEFAULT_SYRINGE);
    setSyringeInventory(DEFAULT_SYRINGE_BOXES);
    setProtocolSteps(DEFAULT_PROTOCOL);
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setCurrentDate(format(new Date(), 'yyyy-MM-dd'));
    setDiscountPercent(0);
    setReorderLeadWeeks(2);
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch {
      // storage unavailable
    }
  };

  useEffect(() => {
    // Append T00:00:00 to force local time interpretation to avoid timezone shifts
    const start = new Date(startDate + 'T00:00:00');
    const current = new Date(currentDate + 'T00:00:00');
    const computedStartWeek = Math.max(1, differenceInCalendarWeeks(current, start) + 1);
    const result = generateSchedule(
      vials,
      bawInventory,
      syringeConfig,
      syringeInventory,
      protocolSteps,
      start,
      computedStartWeek,
      discountPercent,
      reorderLeadWeeks,
    );
    setSimulation(result);
  }, [
    vials,
    bawInventory,
    syringeConfig,
    syringeInventory,
    protocolSteps,
    startDate,
    currentDate,
    discountPercent,
    reorderLeadWeeks,
  ]);

  useEffect(() => {
    const payload: SettingsPayload = {
      vials,
      bawInventory,
      syringeConfig,
      syringeInventory,
      protocolSteps,
      startDate,
      currentDate,
      discountPercent,
      reorderLeadWeeks,
    };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // storage unavailable
    }
  }, [
    vials,
    bawInventory,
    syringeConfig,
    syringeInventory,
    protocolSteps,
    startDate,
    currentDate,
    discountPercent,
    reorderLeadWeeks,
  ]);

  const handleCopyToMarkdown = () => {
    if (!simulation) return;

    let md = `# PeptideCalc Schedule Export\n\n`;
    md += `**Generated:** ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;

    md += `## Settings\n`;
    md += `**Start Date:** ${startDate} (Current Date: ${currentDate})\n`;
    const onHandBoxes = syringeInventory.filter((b) => b.onHand ?? true).length;
    md += `**Syringes:** ${onHandBoxes} box(es) on hand\n`;
    if (discountPercent > 0) {
      md += `**Discount Applied:** ${discountPercent}%\n`;
    }
    md += `**Reorder Lead Time:** ${reorderLeadWeeks} weeks\n`;
    md += `\n`;

    md += `### Inventory\n`;
    vials.forEach(
      (v) => (md += `- **${v.name}**: ${v.mg}mg ($${v.cost}) + ${v.waterAddedMl}ml water\n`),
    );
    bawInventory.forEach((b) => (md += `- **${b.name}**: ${b.sizeMl}ml ($${b.cost})\n`));
    syringeInventory.forEach(
      (s) =>
        (md += `- **${s.name}**: ${s.countPerBox}ct ($${s.cost}) ${s.onHand ? '(On hand)' : '(Planned)'}\n`),
    );

    md += `\n### Protocol\n`;
    protocolSteps.forEach(
      (s) => (md += `- Weeks ${s.startWeek}-${s.endWeek || '+'}: ${s.dosageMg}mg\n`),
    );

    md += `\n## Summary\n`;
    md += `- **Weeks Covered:** ${simulation.weeksCovered}\n`;
    md += `- **Total Cost:** $${simulation.totalCashCost.toLocaleString()}\n`;
    md += `- **Avg Weekly Cost:** $${simulation.avgWeeklyCost.toFixed(2)}\n`;
    md += `- **Runout Date:** ${simulation.runoutDate ? format(simulation.runoutDate, 'MMM d, yyyy') : 'N/A'}\n`;

    // --- Reorder & Actions Section ---
    md += `\n## Supply Actions & Reorder Dates\n`;
    let actionsFound = false;

    // 1. Reorder Peptides (Warning)
    const reorderRow = simulation.schedule.find((r) => r.isReorderWarning);
    if (reorderRow) {
      md += `- **${format(reorderRow.date, 'MMM d, yyyy')}**: ⚠️ **Reorder Peptides** (${reorderLeadWeeks} week lead time)\n`;
      actionsFound = true;
    }

    // 2. Consumption Events
    simulation.schedule.forEach((row) => {
      if (row.isNewBaw) {
        md += `- **${format(row.date, 'MMM d, yyyy')}**: Need by / Open New Bacteriostatic Water\n`;
        actionsFound = true;
      }
      if (row.isNewSyringeBox) {
        md += `- **${format(row.date, 'MMM d, yyyy')}**: Need by / Open New Syringe Box\n`;
        actionsFound = true;
      }
      if (row.didPurchaseBaw) {
        md += `- **${format(row.date, 'MMM d, yyyy')}**: Reorder Bacteriostatic Water\n`;
        actionsFound = true;
      }
      if (row.didPurchaseSyringes) {
        md += `- **${format(row.date, 'MMM d, yyyy')}**: Reorder Syringes\n`;
        actionsFound = true;
      }
      if (row.didPurchaseVial) {
        md += `- **${format(row.date, 'MMM d, yyyy')}**: Reorder Peptides\n`;
        actionsFound = true;
      }
    });

    if (!actionsFound) {
      md += `(No immediate reorders or new supply openings projected)\n`;
    }
    md += `\n`;

    // --- Schedule Table ---
    md += `## Detailed Schedule\n`;
    md += `| Date | Wk | Dose | Stock State | Cost |\n`;
    md += `|---|---|---|---|---|\n`;

    simulation.schedule.forEach((row) => {
      const dateStr = format(row.date, 'MMM d');
      const doseStr = `${row.doseMg}mg (${formatUnits(row.doseUnits)}u)`;
      const stockStr = `${row.vialName}: ${Math.max(0, row.vialMgRemainingAfter).toFixed(1)}mg / ${Math.max(0, row.vialMlRemainingAfter).toFixed(2)}mL`;
      const costStr = `$${row.weeklyAmortizedCost.toFixed(2)}`;
      md += `| ${dateStr} | ${row.protocolWeek} | ${doseStr} | ${stockStr} | ${costStr} |\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const today = new Date();
  const nextReorderRow = simulation?.schedule
    .filter((r) => (r.isReorderWarning || r.didPurchaseVial || r.didPurchaseBaw || r.didPurchaseSyringes) && r.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const nextReorderDate = nextReorderRow ? nextReorderRow.date : null;

  return (
    <div
      className="min-h-screen font-sans flex flex-col"
      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Row 1: Brand + Stats + Actions */}
        <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--surface)' }}>
              <svg
                className="w-5 h-5"
                viewBox="0 0 392.469 392.469"
                aria-hidden="true"
              >
                <path
                  d="M196.267,138.861c-31.677,0-57.406,25.729-57.406,57.406s25.729,57.406,57.406,57.406 s57.406-25.729,57.406-57.406S227.943,138.861,196.267,138.861z"
                  style={{ fill: 'var(--card-foreground)' }}
                />
                <path
                  d="M196.267,231.887c-19.653,0-35.62-15.968-35.62-35.62s15.968-35.62,35.62-35.62 s35.62,15.968,35.62,35.62S215.919,231.887,196.267,231.887z"
                  style={{ fill: 'var(--primary)' }}
                />
                <path
                  d="M370.747,224.388c0-11.572-9.438-21.01-21.01-21.01c-11.572,0-21.01,9.438-21.01,21.01 s9.438,21.01,21.01,21.01C361.309,245.398,370.747,235.96,370.747,224.388z"
                  style={{ fill: 'var(--success)' }}
                />
                <path
                  d="M86.82,328.727c-11.572,0-21.01,9.438-21.01,21.01c0,11.572,9.438,21.01,21.01,21.01 s21.01-9.438,21.01-21.01C107.895,338.166,98.457,328.727,86.82,328.727z"
                  style={{ fill: 'var(--primary)' }}
                />
                <path
                  d="M53.915,86.045c17.713,0,32.129-14.481,32.129-32.129S71.564,21.786,53.915,21.786 S21.786,36.267,21.786,53.915C21.786,71.693,36.267,86.045,53.915,86.045z"
                  style={{ fill: 'var(--success)' }}
                />
                <path
                  d="M349.737,181.592c-16.937,0-31.612,9.891-38.465,24.242l-35.879-6.4 c0.065-1.099,0.129-2.069,0.129-3.103c0-43.636-35.556-79.192-79.192-79.192c-17.907,0-34.392,6.012-47.709,16.162L99.103,83.717 c5.624-8.469,8.857-18.683,8.857-29.608C107.83,24.178,83.588,0,53.851,0S0,24.178,0,53.915s24.178,53.915,53.915,53.915 c10.99,0,21.075-3.297,29.673-8.857l49.519,49.584c-10.02,13.317-16.097,29.737-16.097,47.709c0,22.626,9.568,43.055,24.824,57.471 l-39.952,55.919c-4.719-1.745-9.826-2.78-15.127-2.78c-23.661,0-42.796,19.265-42.796,42.796c0,23.661,19.265,42.796,42.796,42.796 c23.661,0,42.796-19.265,42.796-42.796c0-10.408-3.685-19.911-9.891-27.345l39.887-55.919c10.99,5.818,23.402,9.051,36.719,9.051 c35.103,0,64.905-22.949,75.248-54.626l35.491,6.335c1.487,22.303,20.04,40.016,42.667,40.016c23.661,0,42.796-19.265,42.796-42.796 C392.533,200.727,373.269,181.592,349.737,181.592z M86.82,370.748c-11.572,0-21.01-9.438-21.01-21.01 c0-11.572,9.438-21.01,21.01-21.01s21.01,9.438,21.01,21.01C107.895,361.309,98.457,370.748,86.82,370.748z M21.786,53.915 c0-17.713,14.481-32.129,32.129-32.129s32.129,14.481,32.129,32.129S71.564,86.045,53.915,86.045S21.786,71.693,21.786,53.915z M196.267,253.673c-31.677,0-57.406-25.729-57.406-57.406s25.729-57.406,57.406-57.406s57.406,25.729,57.406,57.406 S227.943,253.673,196.267,253.673z M349.737,245.398c-11.572,0-21.01-9.438-21.01-21.01s9.438-21.01,21.01-21.01 c11.572,0,21.01,9.438,21.01,21.01S361.309,245.398,349.737,245.398z M159.547,266.408c10.99,5.818,23.402,9.051,36.719,9.051 c35.103,0,64.905-22.949,75.248-54.626l35.491,6.335c1.487,22.303,20.04,40.016,42.667,40.016c23.661,0,42.796-19.265,42.796-42.796 c0-23.661-19.265-42.796-42.796-42.796c-16.937,0-31.612,9.891-38.465,24.242l-35.879-6.4c0.065-1.099,0.129-2.069,0.129-3.103 c0-43.636-35.556-79.192-79.192-79.192c-17.907,0-34.392,6.012-47.709,16.162L99.038,83.717c5.624-8.469,8.857-18.683,8.857-29.608 C107.83,24.178,83.653,0,53.851,0S0,24.178,0,53.915s24.178,53.915,53.915,53.915c10.99,0,21.075-3.297,29.673-8.857l49.519,49.584 c-10.02,13.317-16.097,29.737-16.097,47.709c0,22.626,9.568,43.055,24.824,57.471l-39.952,55.919 c-4.719-1.745-9.826-2.78-15.127-2.78c-23.661,0-42.796,19.265-42.796,42.796c0,23.661,19.265,42.796,42.796,42.796 c23.661,0,42.796-19.265,42.796-42.796c0-10.408-3.685-19.911-9.891-27.345 M86.82,370.748c-11.572,0-21.01-9.438-21.01-21.01 c0-11.572,9.438-21.01,21.01-21.01s21.01,9.438,21.01,21.01C107.895,361.309,98.457,370.748,86.82,370.748z M21.786,53.915 c0-17.713,14.481-32.129,32.129-32.129s32.129,14.481,32.129,32.129S71.564,86.045,53.915,86.045S21.786,71.693,21.786,53.915z M196.267,253.673c-31.677,0-57.406-25.729-57.406-57.406s25.729-57.406,57.406-57.406s57.406,25.729,57.406,57.406 S227.943,253.673,196.267,253.673z M349.737,245.398c-11.572,0-21.01-9.438-21.01-21.01s9.438-21.01,21.01-21.01 c11.572,0,21.01,9.438,21.01,21.01S361.309,245.398,349.737,245.398z"
                  style={{ fill: 'var(--primary)' }}
                />
              </svg>
            </div>
            <h1
              className="text-base font-bold tracking-tight"
              style={{ color: 'var(--foreground)' }}
            >
              PeptideCalc
            </h1>
          </div>

          {/* Inline Stats */}
          {simulation && (
            <div className="hidden md:flex items-center gap-1">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                style={{ backgroundColor: 'var(--surface)' }}
              >
                <Calendar className="w-3 h-3" style={{ color: 'var(--info)' }} />
                <span
                  className="text-[10px] font-medium uppercase"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Planned Thru
                </span>
                <span className="text-xs font-bold" style={{ color: 'var(--card-foreground)' }}>
                  {simulation.runoutDate ? format(simulation.runoutDate, 'MMM d, yyyy') : '—'}
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                style={{ backgroundColor: 'var(--surface)' }}
              >
                <TrendingUp className="w-3 h-3" style={{ color: 'var(--success)' }} />
                <span
                  className="text-[10px] font-medium uppercase"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Avg $/Wk
                </span>
                <span className="text-xs font-bold" style={{ color: 'var(--card-foreground)' }}>
                  ${simulation.avgWeeklyCost.toFixed(2)}
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                style={{ backgroundColor: 'var(--surface)' }}
              >
                <AlertCircle className="w-3 h-3" style={{ color: 'var(--warning)' }} />
                <span
                  className="text-[10px] font-medium uppercase"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Next Reorder
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: nextReorderDate ? 'var(--warning)' : 'var(--card-foreground)' }}
                >
                  {nextReorderDate ? format(nextReorderDate, 'MMM d, yyyy') : '—'}
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                style={{ backgroundColor: 'var(--surface)' }}
              >
                <DollarSign className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                <span
                  className="text-[10px] font-medium uppercase"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Total Spend
                </span>
                <span className="text-xs font-bold" style={{ color: 'var(--card-foreground)' }}>
                  ${simulation.totalCashCost.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyToMarkdown}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--muted-foreground)';
              }}
              title={copied ? 'Copied!' : 'Copy to Markdown'}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 flex-1">
        <div className="relative flex gap-6 items-start">
          {/* Sidebar — sticky, self-sizing */}
          {isSettingsOpen && (
            <aside
              id="settings-sidebar"
              className="shrink-0 sticky top-[4rem]"
              style={{ width: '500px' }}
            >
              <InputSection
                vials={vials}
                setVials={setVials}
                bawInventory={bawInventory}
                setBawInventory={setBawInventory}
                syringeConfig={syringeConfig}
                syringeInventory={syringeInventory}
                setSyringeInventory={setSyringeInventory}
                setSyringeConfig={setSyringeConfig}
                protocolSteps={protocolSteps}
                setProtocolSteps={setProtocolSteps}
                startDate={startDate}
                setStartDate={setStartDate}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                discountPercent={discountPercent}
                setDiscountPercent={setDiscountPercent}
                reorderLeadWeeks={reorderLeadWeeks}
                setReorderLeadWeeks={setReorderLeadWeeks}
                resetDefaults={resetDefaults}
                onCollapse={() => setIsSettingsOpen(false)}
              />
            </aside>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Expand sidebar button (only when collapsed) */}
            {!isSettingsOpen && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors mb-2"
                style={{
                  color: 'var(--muted-foreground)',
                  backgroundColor: 'var(--muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }}
                aria-expanded={false}
                aria-controls="settings-sidebar"
              >
                <PanelLeft className="w-3.5 h-3.5" />
                Settings
              </button>
            )}

            {activeView === 'mixing' && (
              <MixingProtocol
                vials={vials}
                protocolSteps={protocolSteps}
                syringeSizeMl={activeSyringeSize}
                headerAction={
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveView('mixing')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors"
                      style={{
                        color:
                          activeView === 'mixing'
                            ? 'var(--primary-foreground)'
                            : 'var(--muted-foreground)',
                        backgroundColor: activeView === 'mixing' ? 'var(--primary)' : 'transparent',
                      }}
                    >
                      <Droplets className="w-3.5 h-3.5" /> Mixing
                    </button>
                    <button
                      onClick={() => setActiveView('dosing')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors"
                      style={{
                        color:
                          activeView === 'dosing'
                            ? 'var(--primary-foreground)'
                            : 'var(--muted-foreground)',
                        backgroundColor: activeView === 'dosing' ? 'var(--primary)' : 'transparent',
                      }}
                    >
                      <Activity className="w-3.5 h-3.5" /> Dosing
                    </button>
                  </div>
                }
              />
            )}
            {activeView === 'dosing' && simulation && (
              <ScheduleTable
                schedule={simulation.schedule}
                headerAction={
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveView('mixing')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors"
                      style={{
                        color:
                          activeView === 'mixing'
                            ? 'var(--primary-foreground)'
                            : 'var(--muted-foreground)',
                        backgroundColor: activeView === 'mixing' ? 'var(--primary)' : 'transparent',
                      }}
                    >
                      <Droplets className="w-3.5 h-3.5" /> Mixing
                    </button>
                    <button
                      onClick={() => setActiveView('dosing')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors"
                      style={{
                        color:
                          activeView === 'dosing'
                            ? 'var(--primary-foreground)'
                            : 'var(--muted-foreground)',
                        backgroundColor: activeView === 'dosing' ? 'var(--primary)' : 'transparent',
                      }}
                    >
                      <Activity className="w-3.5 h-3.5" /> Dosing
                    </button>
                  </div>
                }
              />
            )}
          </div>
        </div>
      </main>
      <footer
        className="mt-8 py-4"
        style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            © {new Date().getFullYear()} PeptideCalc
          </span>
          <a
            href="https://everydaypeptides.ltd/aff/17/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-slate-900/50 px-4 py-3 rounded-lg border border-slate-800 hover:border-emerald-500/30 transition-colors"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-slate-200 font-medium group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                Recommended: Everyday Peptides
                <ExternalLink className="w-3 h-3 opacity-50" />
              </span>
              <span className="text-xs text-slate-500">
                Third-party testing with batch-level reporting.
              </span>
            </div>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
