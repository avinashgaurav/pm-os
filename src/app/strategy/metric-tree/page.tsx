'use client';
import { useState } from 'react';
import { Plus, X, ChevronRight, ChevronDown } from 'lucide-react';
import { nanoid } from 'nanoid';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { Input } from '@/components/ui/input';
interface TreeNode {
  id: string;
  label: string;
  value: string;
  children: TreeNode[];
}
const colors = ['#00C68C', '#13BBCA', '#D0F255', '#a855f7'];
function NodeComp({
  node,
  depth,
  onAdd,
  onDelete,
  onUpdate,
}: {
  node: TreeNode;
  depth: number;
  onAdd: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, f: 'label' | 'value', v: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const c = colors[Math.min(depth, colors.length - 1)];
  return (
    <div className="ml-4">
      <div className="group flex items-center gap-2 py-1.5">
        {node.children.length > 0 ? (
          <button onClick={() => setCollapsed(!collapsed)} className="p-0.5">
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c }} />
        <Input
          value={node.label}
          onChange={(e) => onUpdate(node.id, 'label', e.target.value)}
          className="h-7 text-xs flex-1 max-w-[200px]"
          placeholder="Metric name"
        />
        <Input
          value={node.value}
          onChange={(e) => onUpdate(node.id, 'value', e.target.value)}
          className="h-7 text-xs w-24 font-mono"
          placeholder="Value"
        />
        <button
          onClick={() => onAdd(node.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent"
          title="Add child"
        >
          <Plus className="h-3 w-3 text-primary" />
        </button>
        {depth > 0 && (
          <button
            onClick={() => onDelete(node.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
      {!collapsed &&
        node.children.map((ch) => (
          <NodeComp
            key={ch.id}
            node={ch}
            depth={depth + 1}
            onAdd={onAdd}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
    </div>
  );
}
export default function MetricTreePage() {
  const [root, setRoot] = useState<TreeNode>({
    id: 'root',
    label: 'North Star Metric',
    value: '',
    children: [],
  });
  const addChild = (pid: string) => {
    const n: TreeNode = { id: nanoid(), label: '', value: '', children: [] };
    const add = (nd: TreeNode): TreeNode =>
      nd.id === pid
        ? { ...nd, children: [...nd.children, n] }
        : { ...nd, children: nd.children.map(add) };
    setRoot(add(root));
  };
  const del = (id: string) => {
    const rm = (nd: TreeNode): TreeNode => ({
      ...nd,
      children: nd.children.filter((c) => c.id !== id).map(rm),
    });
    setRoot(rm(root));
  };
  const upd = (id: string, f: 'label' | 'value', v: string) => {
    const u = (nd: TreeNode): TreeNode =>
      nd.id === id ? { ...nd, [f]: v } : { ...nd, children: nd.children.map(u) };
    setRoot(u(root));
  };
  return (
    <div>
      <PageHeader
        title="Metric Tree"
        description="Visual north star metric decomposition tree"
        actions={
          <AIAnalysisButton
            category="strategy"
            moduleSlug="metric-tree"
            buttonLabel="AI: Review Metrics"
            getData={() => JSON.stringify(root)}
          />
        }
      />
      <div className="surface hairline rounded-2xl p-6">
        <div className="flex gap-2 mb-4">
          {['North Star', 'Input Metrics', 'Levers', 'Initiatives'].map((l, i) => (
            <div key={l} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
              {l}
            </div>
          ))}
        </div>
        <NodeComp node={root} depth={0} onAdd={addChild} onDelete={del} onUpdate={upd} />
      </div>
    </div>
  );
}
