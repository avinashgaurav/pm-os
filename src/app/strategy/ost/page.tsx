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
  type: string;
  children: TreeNode[];
}
const levels = [
  { type: 'outcome', label: 'Outcome', color: '#00C68C' },
  { type: 'opportunity', label: 'Opportunity', color: '#13BBCA' },
  { type: 'solution', label: 'Solution', color: '#D0F255' },
  { type: 'experiment', label: 'Experiment', color: '#a855f7' },
];
function OSTNode({
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
  onUpdate: (id: string, v: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const level = levels[Math.min(depth, levels.length - 1)];
  return (
    <div className="ml-5">
      <div className="group flex items-center gap-2 py-1">
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
        <span
          className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
          style={{ backgroundColor: level.color + '15', color: level.color }}
        >
          {level.label}
        </span>
        <Input
          value={node.label}
          onChange={(e) => onUpdate(node.id, e.target.value)}
          className="h-7 text-xs flex-1 max-w-[280px]"
          placeholder={level.label + '...'}
        />
        {depth < 3 && (
          <button
            onClick={() => onAdd(node.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent"
          >
            <Plus className="h-3 w-3 text-primary" />
          </button>
        )}
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
        node.children.map((c) => (
          <OSTNode
            key={c.id}
            node={c}
            depth={depth + 1}
            onAdd={onAdd}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
    </div>
  );
}
export default function OSTPage() {
  const [root, setRoot] = useState<TreeNode>({
    id: 'root',
    label: '',
    type: 'outcome',
    children: [],
  });
  const addChild = (pid: string) => {
    const add = (nd: TreeNode, d: number): TreeNode => {
      if (nd.id === pid) {
        const ct = levels[Math.min(d + 1, levels.length - 1)].type;
        return {
          ...nd,
          children: [...nd.children, { id: nanoid(), label: '', type: ct, children: [] }],
        };
      }
      return { ...nd, children: nd.children.map((c) => add(c, d + 1)) };
    };
    setRoot(add(root, 0));
  };
  const del = (id: string) => {
    const rm = (nd: TreeNode): TreeNode => ({
      ...nd,
      children: nd.children.filter((c) => c.id !== id).map(rm),
    });
    setRoot(rm(root));
  };
  const upd = (id: string, v: string) => {
    const u = (nd: TreeNode): TreeNode =>
      nd.id === id ? { ...nd, label: v } : { ...nd, children: nd.children.map(u) };
    setRoot(u(root));
  };
  return (
    <div>
      <PageHeader
        title="Opportunity Solution Tree"
        description="Map outcomes to opportunities to solutions (Teresa Torres)"
        actions={
          <AIAnalysisButton
            category="strategy"
            moduleSlug="ost"
            buttonLabel="AI: Review Tree"
            getData={() => JSON.stringify(root)}
          />
        }
      />
      <div className="surface hairline rounded-2xl p-6">
        <div className="flex gap-3 mb-4">
          {levels.map((l) => (
            <div
              key={l.type}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
        <OSTNode node={root} depth={0} onAdd={addChild} onDelete={del} onUpdate={upd} />
      </div>
    </div>
  );
}
