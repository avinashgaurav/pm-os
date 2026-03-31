'use client';

import { getCategory } from '@/lib/constants';
import { CategoryOverview } from '@/components/shared/category-overview';

export default function OperationsPage() {
  const category = getCategory('operations');
  if (!category) return null;
  return <CategoryOverview category={category} />;
}
