'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { BaseDocument, CategorySlug } from '@/types';
import { BaseDocumentSchema } from '@/lib/schemas';
import { safeRows } from '@/lib/schemas/safe-read';
import { nanoid } from 'nanoid';

export function useDocuments(category?: CategorySlug, moduleSlug?: string) {
  const documents = useLiveQuery(async () => {
    const rawResults = await db.documents.toArray();
    // Drop rows that don't match the current schema. Older versions / corrupt
    // local data may yield shapes that would crash the editor downstream.
    let results = safeRows(BaseDocumentSchema, rawResults, 'documents');
    if (category && moduleSlug) {
      results = results.filter((d) => d.category === category && d.moduleSlug === moduleSlug);
    } else if (category) {
      results = results.filter((d) => d.category === category);
    }
    return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [category, moduleSlug]);

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
  return useLiveQuery(async () => {
    const all = safeRows(BaseDocumentSchema, await db.documents.toArray(), 'documents');
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
  }, [limit]);
}

export function useStarredDocuments() {
  return useLiveQuery(async () => {
    const all = safeRows(BaseDocumentSchema, await db.documents.toArray(), 'documents');
    return all.filter((d) => d.starred);
  });
}

export function useDocumentCount() {
  return useLiveQuery(() => db.documents.count());
}
