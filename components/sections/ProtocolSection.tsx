import React from 'react';
import { ProtocolStep } from '../../types';
import { Plus, Trash2, FileText } from 'lucide-react';
import { inputStyles } from '../ui';

interface ProtocolSectionProps {
  protocolSteps: ProtocolStep[];
  setProtocolSteps: React.Dispatch<React.SetStateAction<ProtocolStep[]>>;
}

export const ProtocolSection: React.FC<ProtocolSectionProps> = ({ protocolSteps, setProtocolSteps }) => {
  const updateProtocol = (index: number, field: keyof ProtocolStep, value: any) => {
    const newSteps = [...protocolSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setProtocolSteps(newSteps);
  };

  const removeProtocolStep = (index: number) =>
    setProtocolSteps(protocolSteps.filter((_, i) => i !== index));

  const addProtocolStep = () => {
    const lastStep = protocolSteps[protocolSteps.length - 1];
    const newStart = lastStep
      ? lastStep.endWeek
        ? lastStep.endWeek + 1
        : lastStep.startWeek + 4
      : 1;

    setProtocolSteps([
      ...protocolSteps,
      {
        id: crypto.randomUUID?.() || String(Math.random() * 10000),
        startWeek: newStart,
        endWeek: newStart + 3,
        dosageMg: lastStep ? lastStep.dosageMg + 2.5 : 2.5,
      },
    ]);
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--card-foreground)' }}>
            Dosing Protocol
          </h3>
        </div>
        <button
          onClick={addProtocolStep}
          className="text-xs font-semibold px-2 py-1 rounded transition-colors flex items-center gap-1"
          style={{ color: 'var(--primary)' }}
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      <table className="w-full table-fixed">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="text-left py-2 text-xs font-semibold w-[25%]" style={{ color: 'var(--muted-foreground)' }}>Start Wk</th>
            <th className="text-left py-2 px-1 text-xs font-semibold w-[25%]" style={{ color: 'var(--muted-foreground)' }}>End Wk</th>
            <th className="text-left py-2 px-1 text-xs font-semibold w-[30%]" style={{ color: 'var(--muted-foreground)' }}>Dose (mg)</th>
            <th className="w-[15%]" />
          </tr>
        </thead>
        <tbody>
          {protocolSteps.map((step, idx) => (
            <tr key={step.id} className="group" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td className="py-2 pr-1">
                <input
                  type="number"
                  min="1"
                  value={step.startWeek}
                  onChange={(e) => updateProtocol(idx, 'startWeek', parseInt(e.target.value) || 1)}
                  style={inputStyles.table}
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  min={step.startWeek}
                  value={step.endWeek || ''}
                  placeholder="+"
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value);
                    updateProtocol(idx, 'endWeek', val);
                  }}
                  style={inputStyles.table}
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.1"
                  value={step.dosageMg}
                  onChange={(e) => updateProtocol(idx, 'dosageMg', parseFloat(e.target.value) || 0)}
                  style={inputStyles.table}
                />
              </td>
              <td className="py-2 text-right">
                <button
                  onClick={() => removeProtocolStep(idx)}
                  className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                  style={{ color: 'var(--muted-foreground)' }}
                  aria-label="Remove protocol step"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] mt-2 italic" style={{ color: 'var(--muted-foreground)' }}>
        Leave "End Wk" empty for ongoing dosage.
      </p>
    </section>
  );
};
