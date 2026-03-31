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
import { Badge } from '@/components/ui/badge';
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
          <CommandItem onSelect={() => navigate('/')}>
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate('/settings')}>
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        {categories.map((category) => (
          <CommandGroup key={category.slug} heading={category.name}>
            {category.modules.map((mod) => (
              <CommandItem
                key={`${category.slug}-${mod.slug}`}
                onSelect={() => navigate(`/${category.slug}/${mod.slug}`)}
                className="flex items-center justify-between"
              >
                <span>{mod.name}</span>
                {mod.isNew && (
                  <Badge variant="secondary" className="h-4 px-1 text-[9px] font-medium bg-primary/15 text-primary border-0">
                    NEW
                  </Badge>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
