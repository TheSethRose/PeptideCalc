import React, { useEffect, useMemo, useState } from 'react';
import { ScheduleRow } from '../types';
import { format } from 'date-fns';
import { AlertTriangle, Droplets, ArrowRight } from 'lucide-react';
import { Card, CardHeader, Badge } from './ui';

interface ScheduleTableProps {
  schedule: ScheduleRow[];
  headerAction?: React.ReactNode;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ schedule, headerAction }) => {
  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 8;

  const totalPages = Math.max(1, Math.ceil(schedule.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [schedule.length]);

  const pagedSchedule = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return schedule.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [currentPage, schedule]);

  const startItem = schedule.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ROWS_PER_PAGE, schedule.length);
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  const paginationControls = (
    <div className="flex items-center gap-2 text-[11px]">
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

  if (schedule.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center flex flex-col justify-center items-center">
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
    <Card className="flex flex-col">
      <CardHeader
        title="Dosing Schedule"
        subtitle="Projected inventory usage and costs"
        action={
          <div className="flex items-center gap-4 justify-end" style={{ minWidth: '360px' }}>
            <div
              className="flex items-center gap-4 text-xs whitespace-nowrap"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--info)' }} />
                New Vial
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--purple)' }}
                />
                Buy Supplies
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--warning)' }}
                />
                Reorder
              </div>
            </div>
            {headerAction}
          </div>
        }
      />

      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span style={{ color: 'var(--muted-foreground)' }}>
          Showing {startItem}-{endItem} of {schedule.length}
        </span>
        {paginationControls}
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm">
          <thead
            className="sticky top-0 z-10"
            style={{ backgroundColor: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}
          >
            <tr>
              <th
                className="text-left py-3 px-4 font-semibold w-40"
                style={{ color: 'var(--surface-foreground)' }}
              >
                Date
              </th>
              <th
                className="text-center py-3 px-2 font-semibold w-12"
                style={{ color: 'var(--surface-foreground)' }}
              >
                Wk
              </th>
              <th
                className="text-left py-3 px-4 font-semibold w-24"
                style={{ color: 'var(--surface-foreground)' }}
              >
                Dose (mg)
              </th>
              <th
                className="text-right py-3 px-4 font-semibold w-24"
                style={{ color: 'var(--surface-foreground)' }}
              >
                U-100 Units
              </th>
              <th
                className="text-right py-3 px-4 font-semibold w-24"
                style={{ color: 'var(--surface-foreground)' }}
              >
                Draw (mL)
              </th>
              <th
                className="text-left py-3 px-4 font-semibold"
                style={{ color: 'var(--surface-foreground)' }}
              >
                Inventory State
              </th>
              <th
                className="text-right py-3 px-4 font-semibold w-28"
                style={{ color: 'var(--surface-foreground)' }}
                title="Estimated value of goods consumed"
              >
                Val/Wk
              </th>
              <th
                className="text-right py-3 px-4 font-semibold w-28"
                style={{ color: 'var(--surface-foreground)' }}
                title="Cumulative cash spent"
              >
                Total Spend
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedSchedule.map((row) => (
              <tr
                key={row.week}
                className="group transition-colors"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-medium" style={{ color: 'var(--card-foreground)' }}>
                      {format(row.date, 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {format(row.date, 'EEEE')}
                    </span>
                  </div>
                </td>
                <td
                  className="py-3 px-2 text-center font-mono text-xs tabular-nums"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {row.protocolWeek}
                </td>
                <td className="py-3 px-4 tabular-nums">
                  <span className="font-bold" style={{ color: 'var(--card-foreground)' }}>
                    {row.doseMg}
                  </span>
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                    {row.doseUnits}
                  </span>
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  <span className="text-xs" style={{ color: 'var(--card-foreground)' }}>
                    {row.doseMl.toFixed(2)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <div
                      className="flex items-center gap-2"
                      style={{ color: 'var(--card-foreground)' }}
                    >
                      <span
                        className="truncate max-w-[120px] font-medium text-xs"
                        title={row.vialName}
                      >
                        {row.vialName}
                      </span>
                      <ArrowRight
                        className="w-3 h-3"
                        style={{ color: 'var(--muted-foreground)' }}
                      />
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-xs font-medium"
                          style={{
                            color:
                              row.vialMgRemainingAfter === 0
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
                <td className="py-3 px-4 text-right tabular-nums">
                  <div
                    className="flex items-center justify-end gap-1"
                    style={{ color: 'var(--surface-foreground)' }}
                  >
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      $
                    </span>
                    {row.weeklyAmortizedCost.toFixed(2)}
                  </div>
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  <div
                    className="flex items-center justify-end gap-1 font-medium"
                    style={{ color: 'var(--card-foreground)' }}
                  >
                    <span
                      className="text-xs font-normal"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      $
                    </span>
                    {row.cumulativeCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <span style={{ color: 'var(--muted-foreground)' }}>
          Showing {startItem}-{endItem} of {schedule.length}
        </span>
        {paginationControls}
      </div>
    </Card>
  );
};
