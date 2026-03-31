'use client';

import { getCategory } from '@/lib/constants';
import { CategoryOverview } from '@/components/shared/category-overview';

export default function CommunicationPage() {
  const category = getCategory('communication');
  if (!category) return null;
  return <CategoryOverview category={category} />;
}
