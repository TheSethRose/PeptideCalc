import React from 'react';
import { Moon, Sun } from 'lucide-react';

/* ================================================================
   ThemeToggle — Accessible dark mode switch
   ================================================================ */

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => (
  <button
    onClick={onToggle}
    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    className="p-2 rounded-lg transition-colors"
    style={{
      backgroundColor: 'var(--muted)',
      color: 'var(--muted-foreground)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--border)';
      e.currentTarget.style.color = 'var(--foreground)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--muted)';
      e.currentTarget.style.color = 'var(--muted-foreground)';
    }}
  >
    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
  </button>
);
