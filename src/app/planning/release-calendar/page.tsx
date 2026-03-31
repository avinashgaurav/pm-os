'use client';

import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { getModule } from '@/lib/constants';

export default function Page() {
  const mod = getModule('planning', 'release-calendar');
  if (!mod) return null;
  return (
    <div>
      <PageHeader title={mod.name} description={mod.description} isNew={mod.isNew} />
      <div className="glass-card rounded-xl p-8 min-h-[400px] flex items-center justify-center">
        <EmptyState
          title="Tracker Board"
          description="Interactive tracker/board module coming soon. Track, filter, and manage items with kanban and table views."
        />
      </div>
    </div>
  );
}
