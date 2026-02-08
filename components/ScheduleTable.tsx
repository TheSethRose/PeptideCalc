import React from 'react';
import { ScheduleRow } from '../types';
import { format } from 'date-fns';
import { AlertTriangle, Droplets, ArrowRight } from 'lucide-react';
import { Card, CardHeader, Badge } from './ui';

interface ScheduleTableProps {
  schedule: ScheduleRow[];
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ schedule }) => {
  if (schedule.length === 0) {
    return (
      <Card className="h-full">
        <div className="p-12 text-center flex flex-col justify-center items-center h-full">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--muted)' }}
          >
            <Droplets className="w-8 h-8" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--card-foreground)' }}>
            No Schedule
          </h3>
          <p className="mt-2 max-w-sm mx-auto" style={{ color: 'var(--muted-foreground)' }}>
            Configure your inventory and protocol settings to generate a projection.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader
        title="Dosing Schedule"
        subtitle="Projected inventory usage and costs"
        action={
          <div className="flex gap-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--info)' }} />
              New Vial
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--purple)' }} />
              Buy Supplies
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--warning)' }} />
              Reorder
            </div>
          </div>
        }
      />

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm">
          <thead
            className="sticky top-0 z-10"
            style={{ backgroundColor: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}
          >
            <tr>
              <th className="text-left py-3 px-4 font-semibold w-28" style={{ color: 'var(--surface-foreground)' }}>Date</th>
              <th className="text-center py-3 px-2 font-semibold w-12" style={{ color: 'var(--surface-foreground)' }}>Wk</th>
              <th className="text-left py-3 px-4 font-semibold w-32" style={{ color: 'var(--surface-foreground)' }}>Dose</th>
              <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--surface-foreground)' }}>Inventory State</th>
              <th className="text-right py-3 px-4 font-semibold w-28" style={{ color: 'var(--surface-foreground)' }} title="Estimated value of goods consumed">Val/Wk</th>
              <th className="text-right py-3 px-4 font-semibold w-28" style={{ color: 'var(--surface-foreground)' }} title="Cumulative cash spent">Total Spend</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr
                key={row.week}
                className="group transition-colors"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--surface)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <td className="py-3 px-4 whitespace-nowrap font-medium" style={{ color: 'var(--card-foreground)' }}>
                  {format(row.date, 'MMM d')}
                  <span className="text-xs ml-1 font-normal" style={{ color: 'var(--muted-foreground)' }}>
                    '{format(row.date, 'yy')}
                  </span>
                </td>
                <td className="py-3 px-2 text-center font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {row.protocolWeek}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-bold" style={{ color: 'var(--card-foreground)' }}>
                      {row.doseMg} mg
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                      {row.doseUnits} units ({row.doseMl.toFixed(2)}mL)
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2" style={{ color: 'var(--card-foreground)' }}>
                      <span className="truncate max-w-[120px] font-medium text-xs" title={row.vialName}>
                        {row.vialName}
                      </span>
                      <ArrowRight className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-xs font-medium"
                          style={{
                            color: row.vialMgRemainingAfter === 0
                              ? 'var(--destructive)'
                              : 'var(--card-foreground)',
                          }}
                        >
                          {Math.max(0, row.vialMgRemainingAfter).toFixed(1)} mg
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                          / {Math.max(0, row.vialMlRemainingAfter).toFixed(2)} mL left
                        </span>
                      </div>
                    </div>
                    {/* Event Badges */}
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {row.isNewVial && <Badge variant="info">New Vial</Badge>}
                      {row.isNewBaw && <Badge variant="purple">New Water</Badge>}
                      {row.isNewSyringeBox && <Badge variant="purple">New Syringes</Badge>}
                      {row.isReorderWarning && (
                        <Badge variant="warning">
                          <AlertTriangle className="w-3 h-3" /> Reorder
                        </Badge>
                      )}
                    </div>
                    {/* Warnings */}
                    {row.warnings.map((w, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium flex items-center gap-1"
                        style={{ color: 'var(--destructive)' }}
                      >
                        <AlertTriangle className="w-3 h-3" /> {w}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1" style={{ color: 'var(--surface-foreground)' }}>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>$</span>
                    {row.weeklyAmortizedCost.toFixed(2)}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 font-medium" style={{ color: 'var(--card-foreground)' }}>
                    <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>$</span>
                    {row.cumulativeCost.toLocaleString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
