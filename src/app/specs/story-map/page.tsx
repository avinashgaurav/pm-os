'use client';

import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { getModule } from '@/lib/constants';

export default function Page() {
  const mod = getModule('specs', 'story-map');
  if (!mod) return null;
  return (
    <div>
      <PageHeader title={mod.name} description={mod.description} />
      <div className="glass-card rounded-xl p-8 min-h-[500px] flex items-center justify-center">
        <EmptyState
          title="Visual Canvas"
          description="Interactive canvas module coming soon. This will be a drag-and-drop visual workspace."
        />
      </div>
    </div>
  );
}
