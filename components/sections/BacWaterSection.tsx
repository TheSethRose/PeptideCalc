import React from 'react';
import { BacWaterItem } from '../../types';
import { Plus, Trash2, Droplet } from 'lucide-react';
import { inputStyles } from '../ui';

interface BacWaterSectionProps {
  bawInventory: BacWaterItem[];
  setBawInventory: React.Dispatch<React.SetStateAction<BacWaterItem[]>>;
}

export const BacWaterSection: React.FC<BacWaterSectionProps> = ({
  bawInventory,
  setBawInventory,
}) => {
  const updateBaw = (
    index: number,
    field: keyof BacWaterItem,
    value: BacWaterItem[keyof BacWaterItem],
  ) => {
    const newBaw = [...bawInventory];
    newBaw[index] = { ...newBaw[index], [field]: value };
    setBawInventory(newBaw);
  };

  const removeBaw = (index: number) => setBawInventory(bawInventory.filter((_, i) => i !== index));

  const addBaw = () => {
    setBawInventory([
      ...bawInventory,
      {
        id: crypto.randomUUID?.() || String(Math.random() * 10000),
        name: `Bottle ${bawInventory.length + 1}`,
        sizeMl: 10,
        cost: 15,
      },
    ]);
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4" style={{ color: 'var(--info)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--card-foreground)' }}>
            Bac Water
          </h3>
        </div>
        <button
          onClick={addBaw}
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
              className="text-left py-2 text-xs font-semibold w-[45%]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Name
            </th>
            <th
              className="text-left py-2 px-1 text-xs font-semibold w-[20%]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Size (ml)
            </th>
            <th
              className="text-left py-2 px-1 text-xs font-semibold w-[20%]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Cost
            </th>
            <th className="w-[15%]" />
          </tr>
        </thead>
        <tbody>
          {bawInventory.map((item, idx) => (
            <tr
              key={item.id}
              className="group"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <td className="py-2 pr-1">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateBaw(idx, 'name', e.target.value)}
                  style={inputStyles.inline}
                  placeholder="Name"
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.1"
                  value={item.sizeMl}
                  onChange={(e) => updateBaw(idx, 'sizeMl', parseFloat(e.target.value) || 0)}
                  style={inputStyles.table}
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  value={item.cost}
                  onChange={(e) => updateBaw(idx, 'cost', parseFloat(e.target.value) || 0)}
                  style={inputStyles.table}
                />
              </td>
              <td className="py-2 text-right">
                <button
                  onClick={() => removeBaw(idx)}
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
};
