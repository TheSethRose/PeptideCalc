import React, { useState } from 'react';
import { Vial, BacWaterItem, SyringeConfig, SyringeBoxItem, ProtocolStep } from '../types';
import { RotateCcw, Settings2, PanelLeftClose } from 'lucide-react';
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
  syringeInventory: SyringeBoxItem[];
  setSyringeInventory: React.Dispatch<React.SetStateAction<SyringeBoxItem[]>>;
  protocolSteps: ProtocolStep[];
  setProtocolSteps: React.Dispatch<React.SetStateAction<ProtocolStep[]>>;
  startDate: string;
  setStartDate: (val: string) => void;
  currentDate: string;
  setCurrentDate: (val: string) => void;
  discountPercent: number;
  setDiscountPercent: (val: number) => void;
  reorderLeadWeeks: number;
  setReorderLeadWeeks: (val: number) => void;
  resetDefaults: () => void;
  onCollapse?: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  vials,
  setVials,
  bawInventory,
  setBawInventory,
  syringeConfig,
  setSyringeConfig,
  syringeInventory,
  setSyringeInventory,
  protocolSteps,
  setProtocolSteps,
  startDate,
  setStartDate,
  currentDate,
  setCurrentDate,
  discountPercent,
  setDiscountPercent,
  reorderLeadWeeks,
  setReorderLeadWeeks,
  resetDefaults,
  onCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'parameters' | 'inventory'>('parameters');

  const Divider = () => (
    <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />
  );

  return (
    <Card>
      <CardHeader
        title="Settings"
        icon={<Settings2 className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-1">
            <button
              onClick={resetDefaults}
              className="text-xs font-medium flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors"
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
            {onCollapse && (
              <button
                onClick={onCollapse}
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
                aria-label="Collapse settings"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      />

      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('parameters')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
            style={{
              backgroundColor: activeTab === 'parameters' ? 'var(--primary)' : 'var(--muted)',
              color:
                activeTab === 'parameters' ? 'var(--primary-foreground)' : 'var(--card-foreground)',
            }}
          >
            Parameters
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
            style={{
              backgroundColor: activeTab === 'inventory' ? 'var(--primary)' : 'var(--muted)',
              color:
                activeTab === 'inventory' ? 'var(--primary-foreground)' : 'var(--card-foreground)',
            }}
          >
            Inventory
          </button>
        </div>

        {activeTab === 'parameters' && (
          <div className="space-y-6">
            <ParametersSection
              startDate={startDate}
              setStartDate={setStartDate}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              discountPercent={discountPercent}
              setDiscountPercent={setDiscountPercent}
              reorderLeadWeeks={reorderLeadWeeks}
              setReorderLeadWeeks={setReorderLeadWeeks}
            />
            <Divider />
            <ProtocolSection protocolSteps={protocolSteps} setProtocolSteps={setProtocolSteps} />
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <PeptidesSection vials={vials} setVials={setVials} />
            <Divider />
            <BacWaterSection bawInventory={bawInventory} setBawInventory={setBawInventory} />
            <Divider />
            <SyringesSection
              syringeConfig={syringeConfig}
              syringeInventory={syringeInventory}
              setSyringeInventory={setSyringeInventory}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
