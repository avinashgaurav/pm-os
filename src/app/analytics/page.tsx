'use client';

import { getCategory } from '@/lib/constants';
import { CategoryOverview } from '@/components/shared/category-overview';

export default function AnalyticsPage() {
  const category = getCategory('analytics');
  if (!category) return null;
  return <CategoryOverview category={category} />;
}
