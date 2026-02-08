import React, { useState, useEffect } from 'react';
import { Vial, SimulationResult, BacWaterItem, SyringeConfig, ProtocolStep } from './types';
import { generateSchedule } from './utils/calculations';
import { InputSection } from './components/InputSection';
import { ScheduleTable } from './components/ScheduleTable';
import { DashboardStats } from './components/DashboardStats';
import { ThemeToggle } from './components/ui';
import { useTheme } from './hooks/useTheme';
import { format } from 'date-fns';
import { Beaker, Copy, Check } from 'lucide-react';

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
  countPerBox: 100
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
  startWeek: number;
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
    return parsed;
  } catch {
    return null;
  }
};

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [vials, setVials] = useState<Vial[]>(() => loadSettings()?.vials ?? DEFAULT_VIALS);
  const [bawInventory, setBawInventory] = useState<BacWaterItem[]>(() => loadSettings()?.bawInventory ?? DEFAULT_BAW_INVENTORY);
  const [syringeConfig, setSyringeConfig] = useState<SyringeConfig>(() => loadSettings()?.syringeConfig ?? DEFAULT_SYRINGE);
  const [protocolSteps, setProtocolSteps] = useState<ProtocolStep[]>(() => loadSettings()?.protocolSteps ?? DEFAULT_PROTOCOL);
  
  const [startDate, setStartDate] = useState<string>(() => loadSettings()?.startDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [startWeek, setStartWeek] = useState<number>(() => loadSettings()?.startWeek ?? 1);
  const [discountPercent, setDiscountPercent] = useState<number>(() => loadSettings()?.discountPercent ?? 0);
  const [reorderLeadWeeks, setReorderLeadWeeks] = useState<number>(() => loadSettings()?.reorderLeadWeeks ?? 2);
  
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const resetDefaults = () => {
    setVials(DEFAULT_VIALS);
    setBawInventory(DEFAULT_BAW_INVENTORY);
    setSyringeConfig(DEFAULT_SYRINGE);
    setProtocolSteps(DEFAULT_PROTOCOL);
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setStartWeek(1);
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
    const result = generateSchedule(
        vials, 
        bawInventory, 
        syringeConfig, 
        protocolSteps, 
        start, 
        startWeek, 
        discountPercent, 
        reorderLeadWeeks
    );
    setSimulation(result);
  }, [vials, bawInventory, syringeConfig, protocolSteps, startDate, startWeek, discountPercent, reorderLeadWeeks]);

  useEffect(() => {
    const payload: SettingsPayload = {
      vials,
      bawInventory,
      syringeConfig,
      protocolSteps,
      startDate,
      startWeek,
      discountPercent,
      reorderLeadWeeks,
    };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // storage unavailable
    }
  }, [vials, bawInventory, syringeConfig, protocolSteps, startDate, startWeek, discountPercent, reorderLeadWeeks]);

  const handleCopyToMarkdown = () => {
    if (!simulation) return;

    let md = `# PeptideCalc Schedule Export\n\n`;
    md += `**Generated:** ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;
    
    md += `## Settings\n`;
    md += `**Start Date:** ${startDate} (Week ${startWeek})\n`;
    md += `**Syringes:** ${syringeConfig.sizeMl}mL ($${syringeConfig.costPerBox} / ${syringeConfig.countPerBox}ct)\n`;
    if (discountPercent > 0) {
        md += `**Discount Applied:** ${discountPercent}%\n`;
    }
    md += `**Reorder Lead Time:** ${reorderLeadWeeks} weeks\n`;
    md += `\n`;

    md += `### Inventory\n`;
    vials.forEach(v => md += `- **${v.name}**: ${v.mg}mg ($${v.cost}) + ${v.waterAddedMl}ml water\n`);
    bawInventory.forEach(b => md += `- **${b.name}**: ${b.sizeMl}ml ($${b.cost})\n`);
    
    md += `\n### Protocol\n`;
    protocolSteps.forEach(s => md += `- Weeks ${s.startWeek}-${s.endWeek || '+'}: ${s.dosageMg}mg\n`);

    md += `\n## Summary\n`;
    md += `- **Weeks Covered:** ${simulation.weeksCovered}\n`;
    md += `- **Total Cost:** $${simulation.totalCashCost.toLocaleString()}\n`;
    md += `- **Avg Weekly Cost:** $${simulation.avgWeeklyCost.toFixed(2)}\n`;
    md += `- **Runout Date:** ${simulation.runoutDate ? format(simulation.runoutDate, 'MMM d, yyyy') : 'N/A'}\n`;
    
    // --- Reorder & Actions Section ---
    md += `\n## Supply Actions & Reorder Dates\n`;
    let actionsFound = false;

    // 1. Reorder Peptides (Warning)
    const reorderRow = simulation.schedule.find(r => r.isReorderWarning);
    if (reorderRow) {
        md += `- **${format(reorderRow.date, 'MMM d, yyyy')}**: ⚠️ **Reorder Peptides** (Low stock warning - ${reorderLeadWeeks} week lead time)\n`;
        actionsFound = true;
    }

    // 2. Consumption Events
    simulation.schedule.forEach(row => {
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
    
    simulation.schedule.forEach(row => {
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

  return (
    <div className="min-h-screen font-sans pb-20" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: 'var(--card)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--primary)' }}>
              <Beaker className="w-6 h-6" style={{ color: 'var(--primary-foreground)' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                PeptideCalc
              </h1>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
                Dosing Schedule & Inventory Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyToMarkdown}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                color: 'var(--card-foreground)',
                backgroundColor: 'var(--muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
                e.currentTarget.style.color = 'var(--card-foreground)';
              }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy to Markdown'}</span>
            </button>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Stats Row */}
        {simulation && (
            <DashboardStats simulation={simulation} />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column: Configuration */}
          <div className="xl:col-span-4 space-y-6">
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
              startWeek={startWeek}
              setStartWeek={setStartWeek}
              discountPercent={discountPercent}
              setDiscountPercent={setDiscountPercent}
              reorderLeadWeeks={reorderLeadWeeks}
              setReorderLeadWeeks={setReorderLeadWeeks}
              resetDefaults={resetDefaults}
            />
          </div>

          {/* Right Column: Schedule Table */}
          <div className="xl:col-span-8 h-auto min-h-[800px]">
            {simulation && <ScheduleTable schedule={simulation.schedule} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
