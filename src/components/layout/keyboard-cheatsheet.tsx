'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';

interface Shortcut {
  keys: string[];
  label: string;
}

interface Group {
  title: string;
  items: Shortcut[];
}

const groups: Group[] = [
  {
    title: 'Navigation',
    items: [
      { keys: ['⌘', 'K'], label: 'Open command palette' },
      { keys: ['?'], label: 'Show this cheatsheet' },
      { keys: ['esc'], label: 'Close any overlay' },
      { keys: ['G', 'D'], label: 'Go to dashboard' },
      { keys: ['G', 'W'], label: 'Go to workflow' },
      { keys: ['G', 'S'], label: 'Go to settings' },
    ],
  },
  {
    title: 'In the palette',
    items: [
      { keys: ['↑'], label: 'Previous item' },
      { keys: ['↓'], label: 'Next item' },
      { keys: ['↵'], label: 'Select' },
    ],
  },
  {
    title: 'In a module',
    items: [
      { keys: ['⌘', 'S'], label: 'Save (where applicable)' },
      { keys: ['⌘', 'E'], label: 'Export the current doc' },
      { keys: ['⌘', '↵'], label: 'Generate with AI' },
    ],
  },
];

// Superhuman-inspired keyboard cheatsheet overlay.
// Toggled by `?` globally, unless an input/textarea is focused.
export function KeyboardCheatsheet() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack `?` while typing.
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === '?' && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={close}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Keyboard shortcuts</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Press <Kbd size="sm">?</Kbd> anywhere to toggle this.
              </p>
            </div>
            <button onClick={close} className="p-1 rounded hover:bg-accent" aria-label="Close">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
                  {group.title}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-foreground/90">{item.label}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, i) => (
                          <Kbd key={i} size="sm">
                            {k}
                          </Kbd>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
