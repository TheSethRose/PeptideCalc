import React from 'react';
import { SyringeConfig } from '../../types';
import { Syringe } from 'lucide-react';
import { inputStyles } from '../ui';

interface SyringesSectionProps {
  syringeConfig: SyringeConfig;
  setSyringeConfig: React.Dispatch<React.SetStateAction<SyringeConfig>>;
}

export const SyringesSection: React.FC<SyringesSectionProps> = ({ syringeConfig, setSyringeConfig }) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <Syringe className="w-4 h-4" style={{ color: 'var(--purple)' }} />
      <h3 className="text-sm font-bold" style={{ color: 'var(--card-foreground)' }}>
        Syringes
      </h3>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label style={inputStyles.label}>Size</label>
        <select
          value={syringeConfig.sizeMl}
          onChange={(e) =>
            setSyringeConfig({ ...syringeConfig, sizeMl: parseFloat(e.target.value) })
          }
          style={inputStyles.base}
        >
          <option value={1.0}>1.0 mL</option>
          <option value={0.5}>0.5 mL</option>
          <option value={0.3}>0.3 mL</option>
        </select>
      </div>
      <div>
        <label style={inputStyles.label}>Cost / Box Qty</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={syringeConfig.costPerBox}
            onChange={(e) =>
              setSyringeConfig({ ...syringeConfig, costPerBox: parseFloat(e.target.value) || 0 })
            }
            style={inputStyles.base}
            placeholder="$"
          />
          <input
            type="number"
            value={syringeConfig.countPerBox}
            onChange={(e) =>
              setSyringeConfig({ ...syringeConfig, countPerBox: parseFloat(e.target.value) || 1 })
            }
            style={inputStyles.base}
            placeholder="#"
          />
        </div>
      </div>
    </div>
  </section>
);
