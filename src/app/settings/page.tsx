'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, Trash2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { downloadJSON } from '@/lib/export';

export default function SettingsPage() {
  const [importing, setImporting] = useState(false);

  const handleExportAll = async () => {
    const data = {
      documents: await db.documents.toArray(),
      assumptions: await db.assumptions.toArray(),
      feedbackItems: await db.feedbackItems.toArray(),
      decisions: await db.decisions.toArray(),
      featureScores: await db.featureScores.toArray(),
      risks: await db.risks.toArray(),
      okrs: await db.okrs.toArray(),
      sprints: await db.sprints.toArray(),
      releases: await db.releases.toArray(),
      roadmapItems: await db.roadmapItems.toArray(),
      competitors: await db.competitors.toArray(),
      stakeholders: await db.stakeholders.toArray(),
      meetingNotes: await db.meetingNotes.toArray(),
      changelogEntries: await db.changelogEntries.toArray(),
      competencyScores: await db.competencyScores.toArray(),
      knowledgeItems: await db.knowledgeItems.toArray(),
      hypotheses: await db.hypotheses.toArray(),
      exportedAt: new Date().toISOString(),
    };
    downloadJSON(data, `pm-os-backup-${new Date().toISOString().slice(0, 10)}`);
    toast.success('All data exported');
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.documents) await db.documents.bulkPut(data.documents);
        if (data.assumptions) await db.assumptions.bulkPut(data.assumptions);
        if (data.feedbackItems) await db.feedbackItems.bulkPut(data.feedbackItems);
        if (data.decisions) await db.decisions.bulkPut(data.decisions);
        if (data.featureScores) await db.featureScores.bulkPut(data.featureScores);
        if (data.risks) await db.risks.bulkPut(data.risks);
        if (data.okrs) await db.okrs.bulkPut(data.okrs);
        if (data.sprints) await db.sprints.bulkPut(data.sprints);
        if (data.releases) await db.releases.bulkPut(data.releases);
        if (data.roadmapItems) await db.roadmapItems.bulkPut(data.roadmapItems);
        if (data.competitors) await db.competitors.bulkPut(data.competitors);
        if (data.stakeholders) await db.stakeholders.bulkPut(data.stakeholders);
        if (data.meetingNotes) await db.meetingNotes.bulkPut(data.meetingNotes);
        if (data.changelogEntries) await db.changelogEntries.bulkPut(data.changelogEntries);
        if (data.competencyScores) await db.competencyScores.bulkPut(data.competencyScores);
        if (data.knowledgeItems) await db.knowledgeItems.bulkPut(data.knowledgeItems);
        if (data.hypotheses) await db.hypotheses.bulkPut(data.hypotheses);
        toast.success('Data imported successfully');
      } catch {
        toast.error('Failed to import data. Check file format.');
      }
      setImporting(false);
    };
    input.click();
  };

  const handleReset = async () => {
    if (!confirm('Are you sure? This will delete ALL your data permanently.')) return;
    await db.delete();
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" description="Manage your PM OS data and preferences" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" /> Data Management
            </CardTitle>
            <CardDescription>Export, import, or reset your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExportAll}>
              <Download className="h-4 w-4" /> Export All Data (JSON)
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleImport} disabled={importing}>
              <Upload className="h-4 w-4" /> {importing ? 'Importing...' : 'Import Data (JSON)'}
            </Button>
            <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleReset}>
              <Trash2 className="h-4 w-4" /> Reset All Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">About PM OS</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>PM OS — The Product Management Operating System</p>
            <p>84 interactive modules across 10 categories</p>
            <p>All data stored locally in your browser (IndexedDB)</p>
            <p>No data is sent to any server</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
