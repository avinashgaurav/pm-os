'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface MatrixItem {
  id: string;
  text: string;
  quadrant: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export interface MatrixGridProps {
  xAxisLabel: string;
  yAxisLabel: string;
  quadrants: {
    topLeft: { label: string; color: string };
    topRight: { label: string; color: string };
    bottomLeft: { label: string; color: string };
    bottomRight: { label: string; color: string };
  };
  items: MatrixItem[];
  onAddItem: (quadrant: string, text: string) => void;
  onEditItem?: (id: string, text: string) => void;
  onDeleteItem: (id: string) => void;
}

type QuadrantKey = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

const quadrantOrder: QuadrantKey[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

const gridPositions: Record<QuadrantKey, string> = {
  topLeft: 'col-start-1 row-start-1',
  topRight: 'col-start-2 row-start-1',
  bottomLeft: 'col-start-1 row-start-2',
  bottomRight: 'col-start-2 row-start-2',
};

export function MatrixGrid({
  xAxisLabel,
  yAxisLabel,
  quadrants,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: MatrixGridProps) {
  const [addingTo, setAddingTo] = React.useState<QuadrantKey | null>(null);
  const [newText, setNewText] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (addingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addingTo]);

  React.useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  function handleAdd(quadrant: QuadrantKey) {
    const trimmed = newText.trim();
    if (!trimmed) return;
    onAddItem(quadrant, trimmed);
    setNewText('');
    setAddingTo(null);
  }

  function handleStartEdit(item: MatrixItem) {
    setEditingId(item.id);
    setEditText(item.text);
  }

  function handleSaveEdit(id: string) {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onEditItem?.(id, trimmed);
    setEditingId(null);
    setEditText('');
  }

  function getQuadrantItems(quadrant: QuadrantKey) {
    return items.filter((item) => item.quadrant === quadrant);
  }

  return (
    <div className="relative">
      {/* Y-axis label */}
      <div className="absolute -left-2 top-1/2 -translate-x-full -translate-y-1/2 -rotate-90 whitespace-nowrap">
        <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
          {yAxisLabel}
        </span>
      </div>

      {/* X-axis label */}
      <div className="text-center mt-3">
        <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
          {xAxisLabel}
        </span>
      </div>

      {/* Grid */}
      <div className="ml-4 grid grid-cols-2 grid-rows-2 gap-2">
        {quadrantOrder.map((key) => {
          const q = quadrants[key];
          const qItems = getQuadrantItems(key);
          const isAdding = addingTo === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
              className={cn(
                'group/quadrant relative flex flex-col rounded-xl border border-border/50 p-4 min-h-[220px]',
                gridPositions[key]
              )}
              style={{
                backgroundColor: `${q.color}08`,
                borderColor: `${q.color}25`,
              }}
            >
              {/* Quadrant header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: q.color }}
                  />
                  <span className="text-xs font-semibold tracking-wide uppercase text-foreground/80">
                    {q.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                    {qItems.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover/quadrant:opacity-100 transition-opacity"
                  onClick={() => {
                    setAddingTo(key);
                    setNewText('');
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Items */}
              <div className="flex flex-wrap gap-1.5 flex-1 content-start">
                <AnimatePresence mode="popLayout">
                  {qItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
                      className="group/item relative"
                    >
                      {editingId === item.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveEdit(item.id);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Input
                            ref={editInputRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditText('');
                              }
                            }}
                            className="h-6 text-xs px-2 w-28"
                          />
                          <Button type="submit" variant="ghost" size="icon-xs">
                            <Check className="h-3 w-3" />
                          </Button>
                        </form>
                      ) : (
                        <div
                          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-foreground/10 bg-card text-card-foreground hover:ring-foreground/20 transition-all cursor-default"
                          style={{
                            borderLeftWidth: '2px',
                            borderLeftColor: q.color,
                          }}
                        >
                          <span className="max-w-[140px] truncate">{item.text}</span>
                          <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            {onEditItem && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="p-0.5 rounded hover:bg-muted transition-colors"
                              >
                                <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item.id)}
                              className="p-0.5 rounded hover:bg-destructive/10 transition-colors"
                            >
                              <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Add form */}
              <AnimatePresence>
                {isAdding && (
                  <motion.form
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAdd(key);
                    }}
                    className="mt-2 flex items-center gap-1.5"
                  >
                    <Input
                      ref={inputRef}
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Type and press Enter..."
                      className="h-7 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setAddingTo(null);
                          setNewText('');
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
                        setAddingTo(null);
                        setNewText('');
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
