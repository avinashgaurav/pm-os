'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { CommandPalette } from './command-palette';
import { KeyboardCheatsheet } from './keyboard-cheatsheet';
import { RouteVisitTracker } from './route-visit-tracker';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div
          className={cn(
            'flex-1 flex flex-col transition-all duration-300',
            sidebarCollapsed ? 'ml-[60px]' : 'ml-[260px]'
          )}
        >
          <Topbar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
      <CommandPalette />
      <KeyboardCheatsheet />
      <RouteVisitTracker />
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  );
}
