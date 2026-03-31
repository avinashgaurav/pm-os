'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { BaseDocument, CategorySlug } from '@/types';
import { nanoid } from 'nanoid';

export function useDocuments(category?: CategorySlug, moduleSlug?: string) {
  const documents = useLiveQuery(
    () => {
      let query = db.documents.orderBy('updatedAt').reverse();
      if (category && moduleSlug) {
        return db.documents
          .where('[category+moduleSlug]')
          .equals([category, moduleSlug])
          .reverse()
          .sortBy('updatedAt');
      }
      if (category) {
        return db.documents.where('category').equals(category).reverse().sortBy('updatedAt');
      }
      return query.toArray();
    },
    [category, moduleSlug]
  );

  const createDocument = async (
    data: Omit<BaseDocument, 'id' | 'createdAt' | 'updatedAt' | 'starred' | 'archived'>
  ) => {
    const now = new Date().toISOString();
    const doc: BaseDocument = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
      starred: false,
      archived: false,
    };
    await db.documents.add(doc);
    return doc;
  };

  const updateDocument = async (id: string, changes: Partial<BaseDocument>) => {
    await db.documents.update(id, { ...changes, updatedAt: new Date().toISOString() });
  };

  const deleteDocument = async (id: string) => {
    await db.documents.delete(id);
  };

  const toggleStar = async (id: string) => {
    const doc = await db.documents.get(id);
    if (doc) {
      await db.documents.update(id, { starred: !doc.starred });
    }
  };

  return {
    documents: documents ?? [],
    createDocument,
    updateDocument,
    deleteDocument,
    toggleStar,
  };
}

export function useRecentDocuments(limit = 10) {
  return useLiveQuery(
    () => db.documents.orderBy('updatedAt').reverse().limit(limit).toArray(),
    [limit]
  );
}

export function useStarredDocuments() {
  return useLiveQuery(() => db.documents.where('starred').equals(1).toArray());
}

export function useDocumentCount() {
  return useLiveQuery(() => db.documents.count());
}
