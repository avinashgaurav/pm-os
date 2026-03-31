'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { categories } from '@/lib/constants';
import { useUIStore } from '@/stores/ui-store';

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const navigate = (path: string) => {
    setCommandPaletteOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search modules, categories..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigate('/')}>Dashboard</CommandItem>
          <CommandItem onSelect={() => navigate('/workflow')}>My Workflow</CommandItem>
          <CommandItem onSelect={() => navigate('/settings')}>Settings</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        {categories.map((category) => (
          <CommandGroup key={category.slug} heading={category.name}>
            {category.modules.map((mod) => (
              <CommandItem
                key={`${category.slug}-${mod.slug}`}
                onSelect={() => navigate(`/${category.slug}/${mod.slug}`)}
              >
                {mod.name}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
