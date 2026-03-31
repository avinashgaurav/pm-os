'use client';

import { getCategory } from '@/lib/constants';
import { CategoryOverview } from '@/components/shared/category-overview';

export default function LaunchPage() {
  const category = getCategory('launch');
  if (!category) return null;
  return <CategoryOverview category={category} />;
}
