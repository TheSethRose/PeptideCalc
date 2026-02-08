/* ================================================================
   Shared style constants using design tokens.
   Keep in one place so InputSection sub-sections stay consistent.
   ================================================================ */

export const inputStyles = {
  base: {
    width: '100%',
    backgroundColor: 'var(--input)',
    color: 'var(--input-foreground)',
    border: '1px solid var(--input-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color var(--transition), box-shadow var(--transition)',
    boxShadow: 'var(--shadow-sm)',
  } as React.CSSProperties,

  table: {
    width: '100%',
    backgroundColor: 'var(--surface)',
    color: 'var(--input-foreground)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '0.25rem',
    padding: '0.25rem 0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color var(--transition), background-color var(--transition)',
  } as React.CSSProperties,

  inline: {
    width: '100%',
    backgroundColor: 'transparent',
    color: 'var(--card-foreground)',
    border: 'none',
    padding: 0,
    fontSize: '0.875rem',
    fontWeight: 500,
    outline: 'none',
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.375rem',
    color: 'var(--muted-foreground)',
  } as React.CSSProperties,
};

import React from 'react';
