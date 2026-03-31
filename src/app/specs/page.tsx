'use client';

import { getCategory } from '@/lib/constants';
import { CategoryOverview } from '@/components/shared/category-overview';

export default function SpecsPage() {
  const category = getCategory('specs');
  if (!category) return null;
  return <CategoryOverview category={category} />;
}
