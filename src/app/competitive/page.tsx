'use client';

import { getCategory } from '@/lib/constants';
import { CategoryOverview } from '@/components/shared/category-overview';

export default function CompetitivePage() {
  const category = getCategory('competitive');
  if (!category) return null;
  return <CategoryOverview category={category} />;
}
