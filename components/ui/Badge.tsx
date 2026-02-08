import React from 'react';

/* ================================================================
   Badge — Status indicator pill
   Variants map to design tokens for consistent theming.
   ================================================================ */

type BadgeVariant = 'info' | 'purple' | 'warning' | 'success' | 'destructive';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; fg: string; border: string }> = {
  info: {
    bg: 'var(--info-subtle)',
    fg: 'var(--info-foreground)',
    border: 'var(--info)',
  },
  purple: {
    bg: 'var(--purple-subtle)',
    fg: 'var(--purple-foreground)',
    border: 'var(--purple)',
  },
  warning: {
    bg: 'var(--warning-subtle)',
    fg: 'var(--warning-foreground)',
    border: 'var(--warning)',
  },
  success: {
    bg: 'var(--success-subtle)',
    fg: 'var(--success-foreground)',
    border: 'var(--success)',
  },
  destructive: {
    bg: 'var(--destructive)',
    fg: 'var(--destructive-foreground)',
    border: 'var(--destructive)',
  },
};

export const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  const s = variantStyles[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${className}`}
      style={{
        backgroundColor: s.bg,
        color: s.fg,
        border: `1px solid color-mix(in srgb, ${s.border} 30%, transparent)`,
      }}
    >
      {children}
    </span>
  );
};
