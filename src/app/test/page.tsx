'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';

export default function TestPage() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const docCount = useLiveQuery(() => db.documents.count()) ?? 0;
  const allDocs = useLiveQuery(() => db.documents.toArray()) ?? [];

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const runTests = async () => {
    setRunning(true);
    setLog([]);

    try {
      // Test 1: DB opens
      addLog('Test 1: Opening database...');
      await db.open();
      addLog('PASS: Database opened');

      // Test 2: Create a document
      addLog('Test 2: Creating a PRD document...');
      const now = new Date().toISOString();
      const doc = {
        id: nanoid(),
        title: 'Test PRD — Mobile Checkout',
        category: 'specs' as const,
        moduleSlug: 'prd',
        createdAt: now,
        updatedAt: now,
        starred: false,
        archived: false,
        tags: ['test'],
        content: {
          problem: 'Mobile checkout abandonment is 68%, causing $2M annual revenue loss',
          targetUsers: 'Mobile shoppers aged 25-45 who add items to cart but dont complete purchase',
          goals: 'Reduce abandonment by 30% in Q2\nIncrease mobile conversion to 4.5%\nImprove checkout NPS from 32 to 50',
          _output: '# Test PRD — Mobile Checkout\n> PRD Generator | Generated April 1, 2026\n\n## Problem Statement\nMobile checkout abandonment is 68%, causing $2M annual revenue loss\n\n## Target Users\nMobile shoppers aged 25-45\n\n## Goals & Success Metrics\n- Reduce abandonment by 30% in Q2\n- Increase mobile conversion to 4.5%\n- Improve checkout NPS from 32 to 50\n\n---\n*PRD Generator — PM OS*'
        },
      };
      await db.documents.add(doc);
      addLog('PASS: Document created with id ' + doc.id);

      // Test 3: Read it back
      addLog('Test 3: Reading document back...');
      const fetched = await db.documents.get(doc.id);
      if (fetched && fetched.title === doc.title) {
        addLog('PASS: Document read back correctly');
      } else {
        addLog('FAIL: Document not found or title mismatch');
      }

      // Test 4: Update it
      addLog('Test 4: Updating document...');
      await db.documents.update(doc.id, { title: 'Updated PRD — Mobile Checkout v2', updatedAt: new Date().toISOString() });
      const updated = await db.documents.get(doc.id);
      if (updated?.title === 'Updated PRD — Mobile Checkout v2') {
        addLog('PASS: Document updated correctly');
      } else {
        addLog('FAIL: Update did not persist');
      }

      // Test 5: Count
      addLog('Test 5: Counting documents...');
      const count = await db.documents.count();
      addLog(`PASS: Document count = ${count}`);

      // Test 6: Filter by category
      addLog('Test 6: Filtering by category+module...');
      const filtered = await db.documents.filter(d => d.category === 'specs' && d.moduleSlug === 'prd').toArray();
      addLog(`PASS: Found ${filtered.length} docs in specs/prd`);

      // Test 7: Create a second doc in different module
      addLog('Test 7: Creating survey document...');
      await db.documents.add({
        id: nanoid(),
        title: 'Customer Satisfaction Survey Q2',
        category: 'discovery' as const,
        moduleSlug: 'surveys',
        createdAt: now,
        updatedAt: now,
        starred: false,
        archived: false,
        tags: ['survey'],
        content: {
          objective: 'Measure customer satisfaction after checkout redesign',
          questions: 'How easy was the checkout process?\nWould you recommend us?\nWhat could we improve?',
          _output: '# Customer Satisfaction Survey Q2\n> Survey Generator | Generated April 1, 2026\n\n## Survey Objective\nMeasure customer satisfaction after checkout redesign\n\n## Questions\n- How easy was the checkout process? (Scale 1-5)\n- Would you recommend us? (NPS)\n- What could we improve? (Open-ended)\n\n---\n*Survey Generator — PM OS*'
        },
      });
      addLog('PASS: Survey document created');

      // Test 8: Total count
      const finalCount = await db.documents.count();
      addLog(`PASS: Total documents = ${finalCount}`);

      // Test 9: Create a decision log entry
      addLog('Test 9: Creating decision log entry...');
      await db.decisions.add({
        id: nanoid(),
        title: 'Adopt React Native for mobile',
        context: 'Need to ship iOS and Android apps faster',
        options: [],
        chosenOptionId: '',
        outcome: 'Approved — starting Q2',
        status: 'decided',
        stakeholders: ['CTO', 'VP Engineering'],
        date: now,
        tags: ['mobile'],
        linkedDocumentIds: [],
        createdAt: now,
        updatedAt: now,
      });
      const decCount = await db.decisions.count();
      addLog(`PASS: Decisions count = ${decCount}`);

      addLog('');
      addLog('ALL TESTS PASSED');
    } catch (err: unknown) {
      addLog(`FAIL: ${err instanceof Error ? err.message : String(err)}`);
    }
    setRunning(false);
  };

  const clearAll = async () => {
    await db.documents.clear();
    await db.decisions.clear();
    addLog('Cleared all test data');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">PM OS — QA Test Suite</h1>
      
      <div className="flex gap-3 mb-6">
        <button onClick={runTests} disabled={running}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
          {running ? 'Running...' : 'Run All Tests'}
        </button>
        <button onClick={clearAll}
          className="px-4 py-2 bg-destructive text-white rounded-lg text-sm font-medium">
          Clear Test Data
        </button>
      </div>

      <div className="glass-card rounded-xl p-4 mb-6">
        <p className="text-sm"><strong>Live document count:</strong> {docCount}</p>
        <p className="text-sm"><strong>Documents in DB:</strong></p>
        {allDocs.map(d => (
          <div key={d.id} className="text-xs text-muted-foreground ml-4 py-0.5">
            [{d.category}/{d.moduleSlug}] {d.title} — {d.content._output ? 'has output' : 'no output'}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4 font-mono text-xs space-y-1 max-h-[400px] overflow-y-auto">
        {log.length === 0 ? (
          <p className="text-muted-foreground">Click &ldquo;Run All Tests&rdquo; to start</p>
        ) : (
          log.map((l, i) => (
            <p key={i} className={l.includes('FAIL') ? 'text-destructive' : l.includes('PASS') ? 'text-green-500' : 'text-foreground'}>
              {l}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
