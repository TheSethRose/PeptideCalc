import React from 'react';
import { Vial } from '../../types';
import { Plus, Trash2, Syringe } from 'lucide-react';
import { inputStyles } from '../ui';

interface PeptidesSectionProps {
  vials: Vial[];
  setVials: React.Dispatch<React.SetStateAction<Vial[]>>;
}

export const PeptidesSection: React.FC<PeptidesSectionProps> = ({ vials, setVials }) => {
  const updateVial = (index: number, field: keyof Vial, value: any) => {
    const newVials = [...vials];
    newVials[index] = { ...newVials[index], [field]: value };
    setVials(newVials);
  };

  const removeVial = (index: number) => setVials(vials.filter((_, i) => i !== index));

  const addVial = () => {
    setVials([
      ...vials,
      {
        id: crypto.randomUUID?.() || String(Math.random() * 10000),
        name: `Vial ${vials.length + 1}`,
        cost: 0,
        mg: 60,
        waterAddedMl: 2.4,
        inUse: false,
      },
    ]);
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Syringe className="w-4 h-4" style={{ color: 'var(--success)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--card-foreground)' }}>
            Peptides
          </h3>
        </div>
        <button
          onClick={addVial}
          className="text-xs font-semibold px-2 py-1 rounded transition-colors flex items-center gap-1"
          style={{ color: 'var(--primary)' }}
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      <table className="w-full table-fixed">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="text-left py-2 text-xs font-semibold w-[35%]" style={{ color: 'var(--muted-foreground)' }}>Name</th>
            <th className="text-left py-2 px-1 text-xs font-semibold w-[20%]" style={{ color: 'var(--muted-foreground)' }}>Cost</th>
            <th className="text-left py-2 px-1 text-xs font-semibold w-[15%]" style={{ color: 'var(--muted-foreground)' }}>mg</th>
            <th className="text-left py-2 px-1 text-xs font-semibold w-[20%]" style={{ color: 'var(--muted-foreground)' }}>ml (H2O)</th>
            <th className="w-[10%]" />
          </tr>
        </thead>
        <tbody>
          {vials.map((vial, idx) => (
            <tr key={vial.id} className="group" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td className="py-2 pr-1">
                <input
                  type="text"
                  value={vial.name}
                  onChange={(e) => updateVial(idx, 'name', e.target.value)}
                  style={inputStyles.inline}
                  placeholder="Name"
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  value={vial.cost}
                  onChange={(e) => updateVial(idx, 'cost', parseFloat(e.target.value) || 0)}
                  style={inputStyles.table}
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  value={vial.mg}
                  onChange={(e) => updateVial(idx, 'mg', parseFloat(e.target.value) || 0)}
                  style={inputStyles.table}
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.1"
                  value={vial.waterAddedMl}
                  onChange={(e) => updateVial(idx, 'waterAddedMl', parseFloat(e.target.value) || 0)}
                  style={inputStyles.table}
                />
              </td>
              <td className="py-2 text-right">
                <button
                  onClick={() => removeVial(idx)}
                  className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                  style={{ color: 'var(--muted-foreground)' }}
                  aria-label={`Remove ${vial.name}`}
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
