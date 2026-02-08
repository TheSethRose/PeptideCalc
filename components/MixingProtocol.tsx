import React, { useEffect, useMemo, useState } from 'react';
import { addWeeks, format } from 'date-fns';
import { Vial, ProtocolStep, SyringeConfig } from '../types';
import { Card, CardHeader, CardContent, Badge } from './ui';
import { Droplets, AlertTriangle } from 'lucide-react';
import { SYRINGE_UNITS_PER_ML } from '../utils/calculations';

interface MixingProtocolProps {
  vials: Vial[];
  protocolSteps: ProtocolStep[];
  syringeConfig: SyringeConfig;
  startDate: Date;
  startWeek: number;
  headerAction?: React.ReactNode;
}

const GROUPS_PER_PAGE = 2;

/** Resolve which protocol step covers a given week. */
const getDoseForWeek = (pWeek: number, steps: ProtocolStep[]): number => {
  const step = steps.find(
    (s) => pWeek >= s.startWeek && (s.endWeek === null || pWeek <= s.endWeek),
  );
  if (!step) {
    const lastStep = steps[steps.length - 1];
    if (lastStep && pWeek > lastStep.startWeek) return lastStep.dosageMg;
    return 0;
  }
  return step.dosageMg;
};

const formatRange = (step: ProtocolStep, startDate: Date, startWeek: number) => {
  const start = addWeeks(startDate, step.startWeek - startWeek);
  const startLabel = format(start, 'MMM d, yyyy');

  if (step.endWeek === null) return `${startLabel}+`;

  const end = addWeeks(startDate, step.endWeek - startWeek);
  const endLabel = format(end, 'MMM d, yyyy');

  if (startLabel === endLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
};

interface ConcentrationGroup {
  concentration: number;
  vials: Vial[];
}

interface VialCoverage {
  vialId: string;
  vialName: string;
  mg: number;
  startWeek: number;
  endWeek: number;
  weeksCount: number;
}

export const MixingProtocol: React.FC<MixingProtocolProps> = ({
  vials,
  protocolSteps,
  syringeConfig,
  startDate,
  startWeek,
  headerAction,
}) => {
  const [page, setPage] = useState(1);

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

  // ── Compute per-vial coverage (how many weeks each vial lasts) ──
  const vialCoverage: VialCoverage[] = useMemo(() => {
    const coverage: VialCoverage[] = [];
    let currentWeek = startWeek;

    for (const vial of vials) {
      let remaining = vial.mg;
      const vialStartWeek = currentWeek;

      while (remaining > 0) {
        const dose = getDoseForWeek(currentWeek, protocolSteps);
        if (dose <= 0) break;
        if (remaining < dose) {
          currentWeek++;
          break;
        }
        remaining -= dose;
        currentWeek++;
      }

      coverage.push({
        vialId: vial.id,
        vialName: vial.name,
        mg: vial.mg,
        startWeek: vialStartWeek,
        endWeek: currentWeek - 1,
        weeksCount: currentWeek - vialStartWeek,
      });
    }

    return coverage;
  }, [vials, protocolSteps, startWeek]);

  // ── Pagination over concentration groups ──
  const totalPages = Math.max(1, Math.ceil(groups.length / GROUPS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [vials.length]);

  const pagedGroups = useMemo(() => {
    const idx = (currentPage - 1) * GROUPS_PER_PAGE;
    return groups.slice(idx, idx + GROUPS_PER_PAGE);
  }, [currentPage, groups]);

  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  const paginationControls = totalPages > 1 && (
    <div className="flex items-center justify-end gap-2 text-[11px]">
      <span style={{ color: 'var(--muted-foreground)' }}>
        Page {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        className="px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors"
        style={{
          backgroundColor: 'var(--muted)',
          color: 'var(--muted-foreground)',
          opacity: isPrevDisabled ? 0.6 : 1,
          cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
        }}
        onClick={() => !isPrevDisabled && setPage((prev) => Math.max(1, prev - 1))}
        disabled={isPrevDisabled}
        aria-label="Previous page"
      >
        Prev
      </button>
      <button
        type="button"
        className="px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors"
        style={{
          backgroundColor: 'var(--muted)',
          color: 'var(--muted-foreground)',
          opacity: isNextDisabled ? 0.6 : 1,
          cursor: isNextDisabled ? 'not-allowed' : 'pointer',
        }}
        onClick={() => !isNextDisabled && setPage((prev) => Math.min(totalPages, prev + 1))}
        disabled={isNextDisabled}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );

  if (vials.length === 0 || protocolSteps.length === 0) {
    return null;
  }

  const maxCoverageWeeks = Math.max(...vialCoverage.map((c) => c.weeksCount), 1);

  return (
    <Card>
      <CardHeader
        title="Mixing Protocol"
        subtitle="Reconstitution and per-dose volumes based on your inputs"
        icon={<Droplets className="w-5 h-5" />}
        action={headerAction}
      />
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Ingredients: peptide vial(s), bacteriostatic water, and {syringeConfig.sizeMl} mL U-100
            insulin syringes.
          </div>
          {paginationControls}
        </div>

        <div className="space-y-4">
          {pagedGroups.map((group) => {
            const { concentration, vials: groupVials } = group;

            // Dosing reference — shared for all vials at this concentration
            const perStep = protocolSteps.map((step) => {
              const doseMl = step.dosageMg / concentration;
              const doseUnits = doseMl * SYRINGE_UNITS_PER_ML;
              return { step, doseMl, doseUnits };
            });

            // Furthest week any vial in this group covers
            const maxGroupEndWeek = Math.max(
              ...groupVials.map((v) => vialCoverage.find((c) => c.vialId === v.id)?.endWeek ?? 0),
            );

            return (
              <div
                key={concentration}
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {/* ── Reconstitution Recipe ── */}
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--warning)' }}
                      />
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--card-foreground)' }}
                      >
                        Reconstitution Recipe
                      </span>
                    </div>
                    <Badge variant="info">{concentration.toFixed(2)} mg/mL</Badge>
                  </div>

                  <div className="space-y-2">
                    {groupVials.map((vial, idx) => {
                      const cov = vialCoverage.find((c) => c.vialId === vial.id);
                      const coverageLabel = cov
                        ? `Weeks ${cov.startWeek}–${cov.endWeek} (~${cov.weeksCount} wk)`
                        : '';
                      const coverageDateStart = cov
                        ? format(addWeeks(startDate, cov.startWeek - startWeek), 'MMM d')
                        : '';
                      const coverageDateEnd = cov
                        ? format(addWeeks(startDate, cov.endWeek - startWeek), 'MMM d, yyyy')
                        : '';

                      return (
                        <div
                          key={vial.id}
                          className="rounded-md px-3 py-2.5"
                          style={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div
                                className="text-xs font-bold"
                                style={{ color: 'var(--card-foreground)' }}
                              >
                                {idx + 1}. {vial.name} ({vial.mg} mg)
                              </div>
                              <div
                                className="text-[11px] mt-0.5 leading-relaxed"
                                style={{ color: 'var(--muted-foreground)' }}
                              >
                                Inject{' '}
                                <strong style={{ color: 'var(--card-foreground)' }}>
                                  {vial.waterAddedMl} mL
                                </strong>{' '}
                                Bac Water → solution is{' '}
                                <strong style={{ color: 'var(--card-foreground)' }}>
                                  {concentration.toFixed(2)} mg/mL
                                </strong>
                              </div>
                            </div>
                            {cov && (
                              <div className="text-right shrink-0">
                                <div
                                  className="text-[10px] font-semibold uppercase"
                                  style={{ color: 'var(--muted-foreground)' }}
                                >
                                  Covers
                                </div>
                                <div
                                  className="text-[11px] font-bold"
                                  style={{ color: 'var(--info)' }}
                                >
                                  {coverageLabel}
                                </div>
                                <div
                                  className="text-[10px]"
                                  style={{ color: 'var(--muted-foreground)' }}
                                >
                                  {coverageDateStart} – {coverageDateEnd}
                                </div>
                                <div
                                  className="text-[10px] font-semibold mt-1"
                                  style={{ color: 'var(--card-foreground)' }}
                                >
                                  Total doses: {cov.weeksCount}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Capacity bar */}
                          {cov && (
                            <div className="mt-2">
                              <div
                                className="w-full h-1.5 rounded-full overflow-hidden"
                                style={{ backgroundColor: 'var(--border)' }}
                              >
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, (cov.weeksCount / maxCoverageWeeks) * 100)}%`,
                                    backgroundColor: 'var(--info)',
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Dosing Reference Table ── */}
                <div>
                  <div
                    className="text-[11px] font-semibold uppercase mb-2"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Dosing Reference ({concentration.toFixed(2)} mg/mL)
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <th
                            className="text-left py-2 pr-2 text-xs"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            Protocol Period
                          </th>
                          <th
                            className="text-left py-2 pr-2 text-xs"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            Dose
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
                            U-100 Units
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {perStep.map(({ step, doseMl, doseUnits }) => {
                          const exceedsCapacity = step.startWeek > maxGroupEndWeek;

                          return (
                            <tr
                              key={step.id}
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                opacity: exceedsCapacity ? 0.4 : 1,
                              }}
                            >
                              <td
                                className="py-2 pr-2 text-xs"
                                style={{ color: 'var(--card-foreground)' }}
                              >
                                {formatRange(step, startDate, startWeek)}
                                {exceedsCapacity && (
                                  <div
                                    className="text-[10px] mt-0.5"
                                    style={{ color: 'var(--warning)' }}
                                  >
                                    Requires new vial
                                  </div>
                                )}
                              </td>
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
                                {Math.round(doseUnits)}
                                {doseMl > syringeConfig.sizeMl && (
                                  <span
                                    className="ml-2 text-[10px]"
                                    style={{ color: 'var(--warning)' }}
                                  >
                                    (exceeds {syringeConfig.sizeMl} mL)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {paginationControls}
      </CardContent>
    </Card>
  );
};
