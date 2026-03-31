'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('pm-os-theme');
    if (saved === 'light') {
      setDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pm-os-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pm-os-theme', 'light');
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
