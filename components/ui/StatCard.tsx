import React from 'react';

/* ================================================================
   StatCard — Dashboard metric display
   Extracted from DashboardStats for reuse.
   ================================================================ */

interface StatCardProps {
  label: string;
  value: string | React.ReactNode;
  subtitle: string;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  valueColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  iconColor = 'var(--primary)',
  iconBg = 'var(--primary-subtle)',
  valueColor = 'var(--card-foreground)',
}) => (
  <div
    className="p-5 rounded-xl flex items-start justify-between"
    style={{
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <div>
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {label}
      </p>
      <h3
        className="text-2xl font-bold mt-1"
        style={{ color: valueColor }}
      >
        {value}
      </h3>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {subtitle}
      </p>
    </div>
    <div
      className="p-2 rounded-lg"
      style={{ backgroundColor: iconBg, color: iconColor }}
    >
      {icon}
    </div>
  </div>
);
