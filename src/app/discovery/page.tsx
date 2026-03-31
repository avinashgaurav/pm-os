'use client';

import { getCategory } from '@/lib/constants';
import { CategoryOverview } from '@/components/shared/category-overview';

export default function DiscoveryPage() {
  const category = getCategory('discovery');
  if (!category) return null;
  return <CategoryOverview category={category} />;
}
