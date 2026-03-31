'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface TreeNode {
  id: string;
  label: string;
  description?: string;
  children: TreeNode[];
  color?: string;
  type?: string;
}

export interface VisualTreeProps {
  root: TreeNode;
  onAddChild: (parentId: string, label: string) => void;
  onEditNode: (id: string, label: string) => void;
  onDeleteNode: (id: string) => void;
}

const defaultColors = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#eab308', // yellow
];

function getNodeColor(node: TreeNode, depth: number): string {
  return node.color || defaultColors[depth % defaultColors.length];
}

interface TreeNodeComponentProps {
  node: TreeNode;
  depth: number;
  isRoot?: boolean;
  onAddChild: (parentId: string, label: string) => void;
  onEditNode: (id: string, label: string) => void;
  onDeleteNode: (id: string) => void;
}

function TreeNodeComponent({
  node,
  depth,
  isRoot = false,
  onAddChild,
  onEditNode,
  onDeleteNode,
}: TreeNodeComponentProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [editLabel, setEditLabel] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const childrenRef = React.useRef<HTMLDivElement>(null);

  const color = getNodeColor(node, depth);
  const hasChildren = node.children.length > 0;

  React.useEffect(() => {
    if (isAdding && inputRef.current) inputRef.current.focus();
  }, [isAdding]);

  React.useEffect(() => {
    if (isEditing && editInputRef.current) editInputRef.current.focus();
  }, [isEditing]);

  function handleAdd() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    onAddChild(node.id, trimmed);
    setNewLabel('');
    setIsAdding(false);
    setIsCollapsed(false);
  }

  function handleSaveEdit() {
    const trimmed = editLabel.trim();
    if (!trimmed) return;
    onEditNode(node.id, trimmed);
    setIsEditing(false);
    setEditLabel('');
  }

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <motion.div
        ref={nodeRef}
        layout
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
        className={cn(
          'group/node relative flex items-center gap-2 rounded-xl px-4 py-2.5 ring-1 ring-foreground/10 bg-card text-card-foreground',
          isRoot && 'px-5 py-3'
        )}
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: color,
        }}
      >
        {/* Collapse toggle */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-0.5 rounded hover:bg-muted transition-colors -ml-1"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Label */}
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }}
            className="flex items-center gap-1"
          >
            <Input
              ref={editInputRef}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditLabel('');
                }
              }}
              className="h-6 text-xs px-2 w-32"
            />
            <Button type="submit" variant="ghost" size="icon-xs">
              <Check className="h-3 w-3" />
            </Button>
          </form>
        ) : (
          <div className="flex flex-col">
            <span
              className={cn(
                'text-xs font-semibold leading-tight',
                isRoot && 'text-sm'
              )}
            >
              {node.label}
            </span>
            {node.description && (
              <span className="text-[10px] text-muted-foreground mt-0.5 max-w-[160px] truncate">
                {node.description}
              </span>
            )}
            {node.type && (
              <span
                className="text-[9px] font-medium uppercase tracking-wider mt-1 opacity-70"
                style={{ color }}
              >
                {node.type}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover/node:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => {
                setIsAdding(true);
                setNewLabel('');
              }}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Add child"
            >
              <Plus className="h-3 w-3 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setEditLabel(node.label);
              }}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Edit"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
            {!isRoot && (
              <button
                type="button"
                onClick={() => onDeleteNode(node.id)}
                className="p-1 rounded hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Add child form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="mt-2 flex items-center gap-1.5 overflow-hidden"
          >
            <Input
              ref={inputRef}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Child label..."
              className="h-7 text-xs w-32"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewLabel('');
                }
              }}
            />
            <Button type="submit" size="icon-xs" variant="ghost">
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewLabel('');
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && !isCollapsed && (
          <motion.div
            ref={childrenRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
            className="overflow-hidden"
          >
            <div className="relative mt-4 flex gap-6">
              {/* SVG connector lines */}
              <SVGConnectors
                parentRef={nodeRef}
                childrenContainerRef={childrenRef}
                childCount={node.children.length}
                color={color}
              />
              {node.children.map((child) => (
                <TreeNodeComponent
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  onAddChild={onAddChild}
                  onEditNode={onEditNode}
                  onDeleteNode={onDeleteNode}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SVGConnectors({
  parentRef,
  childrenContainerRef,
  childCount,
  color,
}: {
  parentRef: React.RefObject<HTMLDivElement | null>;
  childrenContainerRef: React.RefObject<HTMLDivElement | null>;
  childCount: number;
  color: string;
}) {
  const [lines, setLines] = React.useState<{ x1: number; y1: number; x2: number; y2: number }[]>(
    []
  );
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    function calculateLines() {
      if (!parentRef.current || !childrenContainerRef.current || !svgRef.current) return;

      const svgRect = svgRef.current.getBoundingClientRect();
      const parentRect = parentRef.current.getBoundingClientRect();

      const parentCenterX = parentRect.left + parentRect.width / 2 - svgRect.left;
      const parentBottomY = 0;

      const childNodes = childrenContainerRef.current.querySelectorAll(':scope > div > div:first-child');
      const newLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

      childNodes.forEach((childEl) => {
        const childRect = childEl.getBoundingClientRect();
        const childCenterX = childRect.left + childRect.width / 2 - svgRect.left;
        const childTopY = childRect.top - svgRect.top;

        newLines.push({
          x1: parentCenterX,
          y1: parentBottomY,
          x2: childCenterX,
          y2: childTopY,
        });
      });

      setLines(newLines);
    }

    calculateLines();

    const observer = new ResizeObserver(calculateLines);
    if (childrenContainerRef.current) {
      observer.observe(childrenContainerRef.current);
    }

    return () => observer.disconnect();
  }, [parentRef, childrenContainerRef, childCount]);

  if (lines.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: -1 }}
    >
      {lines.map((line, i) => {
        const midY = (line.y1 + line.y2) / 2;
        return (
          <path
            key={i}
            d={`M ${line.x1} ${line.y1} C ${line.x1} ${midY}, ${line.x2} ${midY}, ${line.x2} ${line.y2}`}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={0.3}
          />
        );
      })}
    </svg>
  );
}

export function VisualTree({ root, onAddChild, onEditNode, onDeleteNode }: VisualTreeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      className="w-full overflow-x-auto pb-8"
    >
      <div className="inline-flex justify-center min-w-full px-8 pt-4">
        <TreeNodeComponent
          node={root}
          depth={0}
          isRoot
          onAddChild={onAddChild}
          onEditNode={onEditNode}
          onDeleteNode={onDeleteNode}
        />
      </div>
    </motion.div>
  );
}
