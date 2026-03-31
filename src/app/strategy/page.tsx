'use client';

import { getCategory } from '@/lib/constants';
import { CategoryOverview } from '@/components/shared/category-overview';

export default function StrategyPage() {
  const category = getCategory('strategy');
  if (!category) return null;
  return <CategoryOverview category={category} />;
}
