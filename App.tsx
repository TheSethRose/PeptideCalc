import React, { useState, useEffect } from 'react';
import { Vial, SimulationResult, BacWaterItem, SyringeConfig, ProtocolStep } from './types';
import { generateSchedule } from './utils/calculations';
import { InputSection } from './components/InputSection';
import { MixingProtocol } from './components/MixingProtocol';
import { ScheduleTable } from './components/ScheduleTable';
import { ThemeToggle } from './components/ui';
import { useTheme } from './hooks/useTheme';
import { addWeeks, differenceInCalendarWeeks, format } from 'date-fns';
import {
  Beaker,
  Copy,
  Check,
  PanelLeft,
  Activity,
  Droplets,
  Calendar,
  TrendingUp,
  AlertCircle,
  DollarSign,
} from 'lucide-react';

const DEFAULT_VIALS: Vial[] = [
  { id: '1', name: 'Vial 1 (Current)', cost: 109, mg: 30, waterAddedMl: 1.2, inUse: false },
  { id: '2', name: 'Vial 2', cost: 225, mg: 60, waterAddedMl: 2.4, inUse: false },
  { id: '3', name: 'Vial 3', cost: 225, mg: 60, waterAddedMl: 2.4, inUse: false },
];

const DEFAULT_BAW_INVENTORY: BacWaterItem[] = [
  { id: '1', name: 'Current Bottle', sizeMl: 3, cost: 7 },
  { id: '2', name: 'Next Bottle', sizeMl: 10, cost: 15 },
];

const DEFAULT_SYRINGE: SyringeConfig = {
  sizeMl: 1.0,
  costPerBox: 20,
  countPerBox: 100,
};

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
    if (
      !parsed ||
      !parsed.vials ||
      !parsed.bawInventory ||
      !parsed.syringeConfig ||
      !parsed.protocolSteps
    ) {
      return null;
    }
    return parsed;
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

  const resetDefaults = () => {
    setVials(DEFAULT_VIALS);
    setBawInventory(DEFAULT_BAW_INVENTORY);
    setSyringeConfig(DEFAULT_SYRINGE);
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
    md += `**Syringes:** ${syringeConfig.sizeMl}mL ($${syringeConfig.costPerBox} / ${syringeConfig.countPerBox}ct)\n`;
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
      md += `- **${format(reorderRow.date, 'MMM d, yyyy')}**: ⚠️ **Reorder Peptides** (Low stock warning - ${reorderLeadWeeks} week lead time)\n`;
      actionsFound = true;
    }

    // 2. Consumption Events
    simulation.schedule.forEach((row) => {
      if (row.isNewBaw) {
        md += `- **${format(row.date, 'MMM d, yyyy')}**: Need by / Open New Bac Water\n`;
        actionsFound = true;
      }
      if (row.isNewSyringeBox) {
        md += `- **${format(row.date, 'MMM d, yyyy')}**: Need by / Open New Syringe Box\n`;
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
      const doseStr = `${row.doseMg}mg (${row.doseUnits}u)`;
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
    .filter((r) => r.isReorderWarning && r.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const nextReorderDate = nextReorderRow ? nextReorderRow.date : null;
  const startDateValue = new Date(startDate + 'T00:00:00');
  const currentDateValue = new Date(currentDate + 'T00:00:00');
  const computedStartWeek = Math.max(
    1,
    differenceInCalendarWeeks(currentDateValue, startDateValue) + 1,
  );

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
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--primary)' }}>
              <Beaker className="w-4 h-4" style={{ color: 'var(--primary-foreground)' }} />
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
              style={{ width: '440px' }}
            >
              <InputSection
                vials={vials}
                setVials={setVials}
                bawInventory={bawInventory}
                setBawInventory={setBawInventory}
                syringeConfig={syringeConfig}
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
                syringeConfig={syringeConfig}
                startDate={startDateValue}
                startWeek={computedStartWeek}
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
        <div
          className="w-full px-4 sm:px-6 lg:px-8 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <span>© {new Date().getFullYear()} PeptideCalc</span>
          <a
            href="https://everydaypeptides.ltd/aff/17/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'var(--primary)' }}
          >
            Support PeptideCalc — shop Everyday Peptides
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
