import React from 'react';
import { Vial, ProtocolStep, SyringeConfig } from '../types';
import { Card, CardHeader, CardContent, Badge } from './ui';
import { Droplets } from 'lucide-react';
import { SYRINGE_UNITS_PER_ML } from '../utils/calculations';

interface MixingProtocolProps {
  vials: Vial[];
  protocolSteps: ProtocolStep[];
  syringeConfig: SyringeConfig;
}

const formatRange = (step: ProtocolStep) => {
  if (step.endWeek === null) return `Week ${step.startWeek}+`;
  if (step.startWeek === step.endWeek) return `Week ${step.startWeek}`;
  return `Weeks ${step.startWeek}-${step.endWeek}`;
};

export const MixingProtocol: React.FC<MixingProtocolProps> = ({
  vials,
  protocolSteps,
  syringeConfig,
}) => {
  if (vials.length === 0 || protocolSteps.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title="Mixing Protocol"
        subtitle="Reconstitution and per-dose volumes based on your inputs"
        icon={<Droplets className="w-5 h-5" />}
      />
      <CardContent className="space-y-5">
        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Ingredients: peptide vial(s), bacteriostatic water, and {syringeConfig.sizeMl} mL syringes.
        </div>

        <div className="space-y-4">
          {vials.map((vial) => {
            const concentration = vial.mg / vial.waterAddedMl; // mg per mL
            const perStep = protocolSteps.map((step) => {
              const doseMl = step.dosageMg / concentration;
              const doseUnits = doseMl * SYRINGE_UNITS_PER_ML;
              return { step, doseMl, doseUnits };
            });

            return (
              <div
                key={vial.id}
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--card-foreground)' }}>
                      {vial.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Add <strong>{vial.waterAddedMl} mL</strong> Bac Water to <strong>{vial.mg} mg</strong> powder
                      → {concentration.toFixed(2)} mg/mL
                    </div>
                  </div>
                  <Badge variant="info">{concentration.toFixed(2)} mg/mL</Badge>
                </div>

                <div className="mt-3 overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <th className="text-left py-2 pr-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          Protocol
                        </th>
                        <th className="text-left py-2 pr-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          Dose
                        </th>
                        <th className="text-left py-2 pr-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          Draw Volume
                        </th>
                        <th className="text-left py-2 pr-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          Syringe Units
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {perStep.map(({ step, doseMl, doseUnits }) => (
                        <tr key={step.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td className="py-2 pr-2 text-xs" style={{ color: 'var(--card-foreground)' }}>
                            {formatRange(step)}
                          </td>
                          <td className="py-2 pr-2 text-xs" style={{ color: 'var(--card-foreground)' }}>
                            {step.dosageMg} mg
                          </td>
                          <td className="py-2 pr-2 text-xs" style={{ color: 'var(--card-foreground)' }}>
                            {doseMl.toFixed(2)} mL
                          </td>
                          <td className="py-2 pr-2 text-xs" style={{ color: 'var(--card-foreground)' }}>
                            {Math.round(doseUnits)} units
                            {doseMl > syringeConfig.sizeMl && (
                              <span className="ml-2 text-[10px]" style={{ color: 'var(--warning)' }}>
                                (exceeds {syringeConfig.sizeMl} mL)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
