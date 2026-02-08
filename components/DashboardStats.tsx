import React from 'react';
import { SimulationResult } from '../types';
import { Calendar, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { StatCard } from './ui';

interface DashboardStatsProps {
  simulation: SimulationResult;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ simulation }) => {
  const { totalCashCost, weeksCovered, avgWeeklyCost } = simulation;

  const reorderRow = simulation.schedule.find((r) => r.isReorderWarning);
  const reorderDate = reorderRow ? reorderRow.date : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        label="Coverage"
        value={`${weeksCovered} Weeks`}
        subtitle="Until stock depletion"
        icon={<Calendar className="w-5 h-5" />}
        iconColor="var(--info)"
        iconBg="var(--info-subtle)"
      />
      <StatCard
        label="Avg Weekly"
        value={`$${avgWeeklyCost.toFixed(2)}`}
        subtitle="Est. value consumed"
        icon={<TrendingUp className="w-5 h-5" />}
        iconColor="var(--success)"
        iconBg="var(--success-subtle)"
      />
      <StatCard
        label="Reorder By"
        value={reorderDate ? format(reorderDate, 'MMM d') : '—'}
        subtitle="2-week buffer"
        icon={<AlertCircle className="w-5 h-5" />}
        iconColor="var(--warning)"
        iconBg="var(--warning-subtle)"
        valueColor={reorderDate ? 'var(--warning)' : 'var(--card-foreground)'}
      />
      <StatCard
        label="Total Spend"
        value={`$${totalCashCost.toLocaleString()}`}
        subtitle="Cash required"
        icon={<DollarSign className="w-5 h-5" />}
        iconColor="var(--muted-foreground)"
        iconBg="var(--muted)"
      />
    </div>
  );
};
