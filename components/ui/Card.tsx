import React from 'react';

/* ================================================================
   Card — Composable card surface
   Usage:
     <Card>
       <CardHeader title="..." action={<button/>} />
       <CardContent>...</CardContent>
     </Card>
   ================================================================ */

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div
    className={`rounded-xl border overflow-hidden ${className}`}
    style={{
      backgroundColor: 'var(--card)',
      borderColor: 'var(--border)',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, icon, action }) => (
  <div
    className="px-5 py-4 flex justify-between items-center"
    style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--surface)',
    }}
  >
    <div className="flex items-center gap-2">
      {icon && <span style={{ color: 'var(--muted-foreground)' }}>{icon}</span>}
      <div>
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--card-foreground)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {action}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);
