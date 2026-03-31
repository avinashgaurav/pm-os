'use client';

import { getCategory } from '@/lib/constants';
import { CategoryOverview } from '@/components/shared/category-overview';

export default function PlanningPage() {
  const category = getCategory('planning');
  if (!category) return null;
  return <CategoryOverview category={category} />;
}
