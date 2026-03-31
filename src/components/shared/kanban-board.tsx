'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface KanbanColumn {
  id: string;
  label: string;
  color: string;
}

export interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  tags?: string[];
  createdAt?: string;
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  items: KanbanItem[];
  onAddItem: (columnId: string, title: string, description?: string) => void;
  onEditItem: (id: string, title: string, description?: string) => void;
  onDeleteItem: (id: string) => void;
  onMoveItem: (id: string, toColumnId: string) => void;
}

interface AddCardFormProps {
  onSubmit: (title: string, description?: string) => void;
  onCancel: () => void;
}

function AddCardForm({ onSubmit, onCancel }: AddCardFormProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const titleRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit(trimmedTitle, description.trim() || undefined);
    setTitle('');
    setDescription('');
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      onSubmit={handleSubmit}
      className="rounded-lg bg-card ring-1 ring-foreground/10 p-3 space-y-2"
    >
      <Input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title..."
        className="h-7 text-xs"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)..."
        className="min-h-[48px] text-xs resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="flex items-center gap-1.5 justify-end">
        <Button type="button" variant="ghost" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="xs">
          Add
        </Button>
      </div>
    </motion.form>
  );
}

interface EditCardFormProps {
  item: KanbanItem;
  onSave: (title: string, description?: string) => void;
  onCancel: () => void;
}

function EditCardForm({ item, onSave, onCancel }: EditCardFormProps) {
  const [title, setTitle] = React.useState(item.title);
  const [description, setDescription] = React.useState(item.description || '');
  const titleRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSave(trimmedTitle, description.trim() || undefined);
  }

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      onSubmit={handleSubmit}
      className="rounded-lg bg-card ring-1 ring-ring/20 p-3 space-y-2"
    >
      <Input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-7 text-xs"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description..."
        className="min-h-[48px] text-xs resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="flex items-center gap-1.5 justify-end">
        <Button type="button" variant="ghost" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="xs">
          <Check className="h-3 w-3 mr-1" />
          Save
        </Button>
      </div>
    </motion.form>
  );
}

interface KanbanCardProps {
  item: KanbanItem;
  column: KanbanColumn;
  columns: KanbanColumn[];
  onEdit: (id: string, title: string, description?: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, toColumnId: string) => void;
}

function KanbanCard({ item, column, columns, onEdit, onDelete, onMove }: KanbanCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  const otherColumns = columns.filter((c) => c.id !== item.columnId);

  if (isEditing) {
    return (
      <EditCardForm
        item={item}
        onSave={(title, description) => {
          onEdit(item.id, title, description);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
      className="group/card relative rounded-lg bg-card ring-1 ring-foreground/10 p-3 hover:ring-foreground/20 transition-all cursor-default"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold leading-tight flex-1">{item.title}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover/card:opacity-100 shrink-0"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            {otherColumns.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Move to</DropdownMenuLabel>
                {otherColumns.map((col) => (
                  <DropdownMenuItem key={col.id} onClick={() => onMove(item.id, col.id)}>
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: col.color }}
                      />
                      {col.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {item.description && (
        <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Tags and status */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <Badge
          variant="secondary"
          className="text-[9px] px-1.5 h-4"
          style={{
            backgroundColor: `${column.color}15`,
            color: column.color,
          }}
        >
          {column.label}
        </Badge>
        {item.tags?.map((tag) => (
          <Badge key={tag} variant="outline" className="text-[9px] px-1.5 h-4">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Date */}
      {item.createdAt && (
        <p className="mt-1.5 text-[10px] text-muted-foreground/60">{item.createdAt}</p>
      )}
    </motion.div>
  );
}

export function KanbanBoard({
  columns,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onMoveItem,
}: KanbanBoardProps) {
  const [addingToColumn, setAddingToColumn] = React.useState<string | null>(null);

  function getColumnItems(columnId: string) {
    return items.filter((item) => item.columnId === columnId);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      className="flex gap-4 overflow-x-auto pb-4"
    >
      {columns.map((column, colIndex) => {
        const columnItems = getColumnItems(column.id);
        const isAdding = addingToColumn === column.id;

        return (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: colIndex * 0.05,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            className="flex flex-col w-72 min-w-[288px] shrink-0"
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span className="text-xs font-semibold tracking-wide uppercase text-foreground/80">
                  {column.label}
                </span>
                <span className="flex items-center justify-center h-4 min-w-[16px] rounded-full bg-muted px-1 text-[10px] font-medium text-muted-foreground tabular-nums">
                  {columnItems.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setAddingToColumn(column.id);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Column body */}
            <div
              className="flex-1 space-y-2 rounded-xl border border-border/40 bg-muted/20 p-2 min-h-[120px]"
              style={{
                borderTopColor: column.color,
                borderTopWidth: '2px',
              }}
            >
              {/* Add form */}
              <AnimatePresence>
                {isAdding && (
                  <AddCardForm
                    onSubmit={(title, description) => {
                      onAddItem(column.id, title, description);
                      setAddingToColumn(null);
                    }}
                    onCancel={() => setAddingToColumn(null)}
                  />
                )}
              </AnimatePresence>

              {/* Cards */}
              <AnimatePresence mode="popLayout">
                {columnItems.map((item) => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    column={column}
                    columns={columns}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
                    onMove={onMoveItem}
                  />
                ))}
              </AnimatePresence>

              {/* Empty state */}
              {columnItems.length === 0 && !isAdding && (
                <div className="flex items-center justify-center h-16">
                  <button
                    type="button"
                    onClick={() => setAddingToColumn(column.id)}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add a card
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
