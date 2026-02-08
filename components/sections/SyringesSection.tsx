import React from 'react';
import { SyringeConfig, SyringeBoxItem } from '../../types';
import { Plus, Trash2, Syringe } from 'lucide-react';
import { inputStyles } from '../ui';

interface SyringesSectionProps {
  syringeConfig: SyringeConfig;
  syringeInventory: SyringeBoxItem[];
  setSyringeInventory: React.Dispatch<React.SetStateAction<SyringeBoxItem[]>>;
}

export const SyringesSection: React.FC<SyringesSectionProps> = ({
  syringeConfig,
  syringeInventory,
  setSyringeInventory,
}) => (
  <section>
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-2">
        <Syringe className="w-4 h-4" style={{ color: 'var(--purple)' }} />
        <h3 className="text-sm font-bold" style={{ color: 'var(--card-foreground)' }}>
          Syringes
        </h3>
      </div>
      <button
        onClick={() =>
          setSyringeInventory([
            ...syringeInventory,
            {
              id: crypto.randomUUID?.() || String(Math.random() * 10000),
              name: `Syringe Box ${syringeInventory.length + 1}`,
              cost: 20,
              countPerBox: 100,
              sizeMl: syringeConfig.sizeMl,
              onHand: false,
            },
          ])
        }
        className="text-xs font-semibold px-2 py-1 rounded transition-colors flex items-center gap-1"
        style={{ color: 'var(--primary)' }}
      >
        <Plus className="w-3 h-3" /> Add
      </button>
    </div>

    <table className="w-full table-fixed">
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <th
            className="text-left py-2 text-xs font-semibold w-[32%]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Name
          </th>
          <th
            className="text-left py-2 px-1 text-xs font-semibold w-[20%]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Cost
          </th>
          <th
            className="text-left py-2 px-1 text-xs font-semibold w-[20%]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Box Qty
          </th>
          <th
            className="text-left py-2 px-1 text-xs font-semibold w-[13%]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Size
          </th>
          <th
            className="text-center py-2 px-1 text-xs font-semibold w-[10%]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            On Hand
          </th>
          <th className="w-[5%]" />
        </tr>
      </thead>
      <tbody>
        {syringeInventory.map((item, idx) => (
          <tr
            key={item.id}
            className="group"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <td className="py-2 pr-1">
              <input
                type="text"
                value={item.name}
                onChange={(e) => {
                  const next = [...syringeInventory];
                  next[idx] = { ...next[idx], name: e.target.value };
                  setSyringeInventory(next);
                }}
                style={inputStyles.inline}
                placeholder="Name"
              />
            </td>
            <td className="py-2 px-1">
              <input
                type="number"
                value={item.cost}
                onChange={(e) => {
                  const next = [...syringeInventory];
                  next[idx] = { ...next[idx], cost: parseFloat(e.target.value) || 0 };
                  setSyringeInventory(next);
                }}
                style={inputStyles.table}
              />
            </td>
            <td className="py-2 px-1">
              <input
                type="number"
                value={item.countPerBox}
                onChange={(e) => {
                  const next = [...syringeInventory];
                  next[idx] = { ...next[idx], countPerBox: parseFloat(e.target.value) || 1 };
                  setSyringeInventory(next);
                }}
                style={inputStyles.table}
              />
            </td>
            <td className="py-2 px-1">
              <select
                value={item.sizeMl}
                onChange={(e) => {
                  const next = [...syringeInventory];
                  next[idx] = { ...next[idx], sizeMl: parseFloat(e.target.value) };
                  setSyringeInventory(next);
                }}
                style={inputStyles.table}
              >
                <option value={1.0}>1.0 mL</option>
                <option value={0.5}>0.5 mL</option>
                <option value={0.3}>0.3 mL</option>
              </select>
            </td>
            <td className="py-2 px-1 text-center">
              <input
                type="checkbox"
                checked={item.onHand ?? true}
                onChange={(e) => {
                  const next = [...syringeInventory];
                  next[idx] = { ...next[idx], onHand: e.target.checked };
                  setSyringeInventory(next);
                }}
                aria-label={`Mark ${item.name} as on hand`}
              />
            </td>
            <td className="py-2 text-right">
              <button
                onClick={() => setSyringeInventory(syringeInventory.filter((_, i) => i !== idx))}
                className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--muted-foreground)' }}
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);
