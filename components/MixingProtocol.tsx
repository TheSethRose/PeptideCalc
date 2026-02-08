import React, { useMemo } from 'react';
import { Vial, ProtocolStep } from '../types';
import { Card, CardHeader, CardContent, Badge } from './ui';
import { Droplets, AlertTriangle } from 'lucide-react';
import { SYRINGE_UNITS_PER_ML, formatUnits } from '../utils/calculations';

interface MixingProtocolProps {
  vials: Vial[];
  protocolSteps: ProtocolStep[];
  syringeSizeMl: number;
  headerAction?: React.ReactNode;
}

interface ConcentrationGroup {
  concentration: number;
  vials: Vial[];
}

const getUniqueSteps = (steps: ProtocolStep[]) => {
  const seen = new Set<number>();
  return steps.filter((step) => {
    if (seen.has(step.dosageMg)) return false;
    seen.add(step.dosageMg);
    return true;
  });
};

export const MixingProtocol: React.FC<MixingProtocolProps> = ({
  vials,
  protocolSteps,
  syringeSizeMl,
  headerAction,
}) => {
  // ── Group vials by concentration ──
  const groups: ConcentrationGroup[] = useMemo(() => {
    const byConc = new Map<string, Vial[]>();
    for (const vial of vials) {
      const conc = (vial.mg / vial.waterAddedMl).toFixed(2);
      if (!byConc.has(conc)) byConc.set(conc, []);
      byConc.get(conc)!.push(vial);
    }
    return Array.from(byConc.entries()).map(([conc, groupVials]) => ({
      concentration: parseFloat(conc),
      vials: groupVials,
    }));
  }, [vials]);

  const uniqueSteps = useMemo(() => getUniqueSteps(protocolSteps), [protocolSteps]);

  const maxConcentration = useMemo(() => {
    if (vials.length === 0) return 0;
    return Math.max(...vials.map((vial) => vial.mg / vial.waterAddedMl));
  }, [vials]);

  if (vials.length === 0 || protocolSteps.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title="Mixing & Conversion Reference"
        icon={<Droplets className="w-5 h-5" />}
        action={headerAction}
      />
      <CardContent className="space-y-5">
        {maxConcentration > 50 && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
            style={{
              backgroundColor: 'var(--warning-subtle)',
              color: 'var(--destructive)',
              border: '1px solid var(--destructive)',
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Concentration too high! Difficult to
            measure accurately.
          </div>
        )}

        <div className="text-xs space-y-1" style={{ color: 'var(--muted-foreground)' }}>
          <div>
            <strong style={{ color: 'var(--card-foreground)' }}>Preparation:</strong> Reconstitute
            your vial with the Mix Vol. shown below.
          </div>
          <div>
            <strong style={{ color: 'var(--card-foreground)' }}>Syringes:</strong> Calculations are
            based on U-100 Insulin Syringes ({syringeSizeMl} mL).
          </div>
          <div>
            <strong style={{ color: 'var(--card-foreground)' }}>Usage:</strong> Use this chart to
            convert your prescribed mg dose into syringe units.
          </div>
        </div>

        {/* ── Reconstitution Instructions ── */}
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--warning)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--card-foreground)' }}>
                Reconstitution Instructions
              </span>
            </div>
            {groups.length === 1 && (
              <Badge variant="info">{groups[0].concentration.toFixed(2)} mg/mL</Badge>
            )}
          </div>

          <div className="space-y-2">
            {groups.map((group) =>
              group.vials.map((vial) => (
                <div
                  key={`${group.concentration}-${vial.id}`}
                  className="rounded-md px-3 py-2.5"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    className="text-xs font-bold"
                    style={{ color: 'var(--card-foreground)' }}
                  >
                    {vial.name} ({vial.mg} mg)
                  </div>
                  <div
                    className="text-[11px] mt-0.5 leading-relaxed"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Inject{' '}
                    <strong style={{ color: 'var(--card-foreground)' }}>
                      {vial.waterAddedMl} mL
                    </strong>{' '}
                    of Bacteriostatic Water into your{' '}
                    <strong style={{ color: 'var(--card-foreground)' }}>{vial.mg} mg</strong>{' '}
                    vial. Result:{' '}
                    <strong style={{ color: 'var(--card-foreground)' }}>
                      Concentration: {group.concentration.toFixed(2)} mg/mL.
                    </strong>
                  </div>
                </div>
              )),
            )}
          </div>
        </div>

        {/* ── Dosage Reference Guide ── */}
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="text-sm font-bold mb-3" style={{ color: 'var(--card-foreground)' }}>
            Dosage Reference Guide (U-100 Syringe)
          </div>

          <div className="space-y-4">
            {groups.map((group) => {
              const perStep = uniqueSteps.map((step) => {
                const doseMl = step.dosageMg / group.concentration;
                const doseUnits = doseMl * SYRINGE_UNITS_PER_ML;
                const visualPercent = Math.min(100, (doseUnits / SYRINGE_UNITS_PER_ML) * 100);
                return { step, doseMl, doseUnits, visualPercent };
              });

              return (
                <div key={group.concentration}>
                  {groups.length > 1 && (
                    <div
                      className="text-[11px] font-semibold uppercase mb-2"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Concentration: {group.concentration.toFixed(2)} mg/mL
                    </div>
                  )}
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <th
                            className="text-left py-2 pr-2 text-xs"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            Target Dose
                          </th>
                          <th
                            className="text-left py-2 pr-2 text-xs"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            Draw Volume
                          </th>
                          <th
                            className="text-left py-2 pr-2 text-xs"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            Units (U-100)
                          </th>
                          <th
                            className="text-left py-2 pr-2 text-xs"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            Visual
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {perStep.map(({ step, doseMl, doseUnits, visualPercent }) => (
                          <tr
                            key={`dose-${step.dosageMg}`}
                            style={{ borderBottom: '1px solid var(--border-subtle)' }}
                          >
                            <td
                              className="py-2 pr-2 text-xs"
                              style={{ color: 'var(--card-foreground)' }}
                            >
                              {step.dosageMg} mg
                            </td>
                            <td
                              className="py-2 pr-2 text-xs"
                              style={{ color: 'var(--card-foreground)' }}
                            >
                              {doseMl.toFixed(2)} mL
                            </td>
                            <td
                              className="py-2 pr-2 text-xs"
                              style={{ color: 'var(--card-foreground)' }}
                            >
                              {formatUnits(doseUnits)}
                              {doseMl > syringeSizeMl && (
                                <span
                                  className="ml-2 text-[10px]"
                                  style={{ color: 'var(--warning)' }}
                                >
                                  (exceeds {syringeSizeMl} mL)
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-2 text-xs">
                              <div
                                className="w-24 h-2 rounded-full overflow-hidden"
                                style={{ backgroundColor: 'var(--border)' }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${visualPercent}%`,
                                    backgroundColor: 'var(--info)',
                                  }}
                                />
                              </div>
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
        </div>
      </CardContent>
    </Card>
  );
};
