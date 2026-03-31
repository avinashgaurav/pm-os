'use client';

import { getCategory } from '@/lib/constants';
import { CategoryOverview } from '@/components/shared/category-overview';

export default function GrowthPage() {
  const category = getCategory('growth');
  if (!category) return null;
  return <CategoryOverview category={category} />;
}
