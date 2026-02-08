import React from 'react';
import { Vial, BacWaterItem, SyringeConfig, ProtocolStep } from '../types';
import { RotateCcw, Settings2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui';
import { ParametersSection } from './sections/ParametersSection';
import { PeptidesSection } from './sections/PeptidesSection';
import { BacWaterSection } from './sections/BacWaterSection';
import { SyringesSection } from './sections/SyringesSection';
import { ProtocolSection } from './sections/ProtocolSection';

interface InputSectionProps {
  vials: Vial[];
  setVials: React.Dispatch<React.SetStateAction<Vial[]>>;
  bawInventory: BacWaterItem[];
  setBawInventory: React.Dispatch<React.SetStateAction<BacWaterItem[]>>;
  syringeConfig: SyringeConfig;
  setSyringeConfig: React.Dispatch<React.SetStateAction<SyringeConfig>>;
  protocolSteps: ProtocolStep[];
  setProtocolSteps: React.Dispatch<React.SetStateAction<ProtocolStep[]>>;
  startDate: string;
  setStartDate: (val: string) => void;
  startWeek: number;
  setStartWeek: (val: number) => void;
  discountPercent: number;
  setDiscountPercent: (val: number) => void;
  reorderLeadWeeks: number;
  setReorderLeadWeeks: (val: number) => void;
  resetDefaults: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  vials,
  setVials,
  bawInventory,
  setBawInventory,
  syringeConfig,
  setSyringeConfig,
  protocolSteps,
  setProtocolSteps,
  startDate,
  setStartDate,
  startWeek,
  setStartWeek,
  discountPercent,
  setDiscountPercent,
  reorderLeadWeeks,
  setReorderLeadWeeks,
  resetDefaults,
}) => {
  const Divider = () => (
    <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />
  );

  return (
    <Card className="h-full">
      <CardHeader
        title="Settings"
        icon={<Settings2 className="w-5 h-5" />}
        action={
          <button
            onClick={resetDefaults}
            className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors"
            style={{
              color: 'var(--muted-foreground)',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.backgroundColor = 'var(--card)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--muted-foreground)';
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        }
      />

      <CardContent className="space-y-6">
        <ParametersSection
          startDate={startDate}
          setStartDate={setStartDate}
          startWeek={startWeek}
          setStartWeek={setStartWeek}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
          reorderLeadWeeks={reorderLeadWeeks}
          setReorderLeadWeeks={setReorderLeadWeeks}
        />
        <Divider />
        <PeptidesSection vials={vials} setVials={setVials} />
        <Divider />
        <BacWaterSection bawInventory={bawInventory} setBawInventory={setBawInventory} />
        <Divider />
        <SyringesSection syringeConfig={syringeConfig} setSyringeConfig={setSyringeConfig} />
        <Divider />
        <ProtocolSection protocolSteps={protocolSteps} setProtocolSteps={setProtocolSteps} />
      </CardContent>
    </Card>
  );
};
