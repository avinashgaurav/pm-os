'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  TableIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

// ---- Types ----

export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  width?: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface StatusDef {
  value: string;
  label: string;
  color: string;
}

interface TrackerBoardProps<T> {
  items: T[];
  columns: ColumnDef<T>[];
  statusField: keyof T;
  statuses: StatusDef[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  title: string;
  emptyMessage?: string;
}

type SortDir = 'asc' | 'desc';

// ---- Helpers ----

function getStatusColor(color: string): string {
  const map: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    yellow: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    red: 'bg-red-500/15 text-red-700 dark:text-red-400',
    purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
    orange: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
    gray: 'bg-muted text-muted-foreground',
    pink: 'bg-pink-500/15 text-pink-700 dark:text-pink-400',
    cyan: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
  };
  return map[color] ?? map.gray;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

// ---- Status Badge ----

function StatusBadge({ status, statuses }: { status: string; statuses: StatusDef[] }) {
  const def = statuses.find((s) => s.value === status);
  if (!def) return <Badge variant="secondary">{status}</Badge>;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        getStatusColor(def.color)
      )}
    >
      {def.label}
    </span>
  );
}

// ---- Row Actions ----

function RowActions<T extends { id: string }>({
  item,
  onEdit,
  onDelete,
}: {
  item: T;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-xs" />}
      >
        <MoreHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(item)}>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(item.id)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---- Table View ----

function TableView<T extends { id: string }>({
  items,
  columns,
  statuses,
  statusField,
  sortKey,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  items: T[];
  columns: ColumnDef<T>[];
  statuses: StatusDef[];
  statusField: keyof T;
  sortKey: keyof T | null;
  sortDir: SortDir;
  onSort: (key: keyof T) => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={String(col.key)}
              style={{ width: col.width }}
              className="cursor-pointer select-none"
              onClick={() => onSort(col.key)}
            >
              <span className="inline-flex items-center gap-1">
                {col.label}
                {sortKey === col.key ? (
                  sortDir === 'asc' ? (
                    <ArrowUp className="size-3 text-muted-foreground" />
                  ) : (
                    <ArrowDown className="size-3 text-muted-foreground" />
                  )
                ) : (
                  <ArrowUpDown className="size-3 text-muted-foreground/40" />
                )}
              </span>
            </TableHead>
          ))}
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.tr
              key={item.id}
              variants={itemVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              layout
              className="border-b transition-colors hover:bg-muted/50"
            >
              {columns.map((col) => (
                <TableCell key={String(col.key)}>
                  {col.key === statusField ? (
                    <Select
                      value={String(item[statusField])}
                      onValueChange={(val: string | null) => { if (val) onStatusChange(item.id, val); }}
                    >
                      <SelectTrigger className="h-6 w-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0">
                        <StatusBadge
                          status={String(item[statusField])}
                          statuses={statuses}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'size-2 rounded-full',
                                  getStatusColor(s.color).split(' ')[0]
                                )}
                              />
                              {s.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : col.render ? (
                    col.render(item[col.key], item)
                  ) : (
                    <span className="truncate max-w-[200px] inline-block">
                      {String(item[col.key] ?? '')}
                    </span>
                  )}
                </TableCell>
              ))}
              <TableCell>
                <RowActions item={item} onEdit={onEdit} onDelete={onDelete} />
              </TableCell>
            </motion.tr>
          ))}
        </AnimatePresence>
      </TableBody>
    </Table>
  );
}

// ---- Kanban Column ----

function KanbanColumn<T extends { id: string }>({
  status,
  items,
  columns,
  statuses,
  statusField,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  status: StatusDef;
  items: T[];
  columns: ColumnDef<T>[];
  statuses: StatusDef[];
  statusField: keyof T;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const titleCol = columns[0];

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30">
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'size-2.5 rounded-full',
              getStatusColor(status.color).split(' ')[0]
            )}
          />
          <span className="text-sm font-medium">{status.label}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[80px]">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              layout
              className="rounded-lg border bg-background p-3 shadow-xs cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => onEdit(item)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-tight line-clamp-2">
                  {titleCol
                    ? titleCol.render
                      ? titleCol.render(item[titleCol.key], item)
                      : String(item[titleCol.key] ?? '')
                    : String(item.id)}
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <RowActions item={item} onEdit={onEdit} onDelete={onDelete} />
                </div>
              </div>

              {columns.slice(1).map((col) => {
                if (col.key === statusField) return null;
                const val = item[col.key];
                if (val === undefined || val === null || val === '') return null;
                return (
                  <div key={String(col.key)} className="mt-1.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/60">{col.label}:</span>{' '}
                    {col.render ? col.render(val, item) : String(val)}
                  </div>
                );
              })}

              <div className="mt-2 flex items-center gap-1">
                <Select
                  value={String(item[statusField])}
                  onValueChange={(val: string | null) => { if (val) onStatusChange(item.id, val); }}
                >
                  <SelectTrigger
                    className="h-5 w-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusBadge
                      status={String(item[statusField])}
                      statuses={statuses}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              'size-2 rounded-full',
                              getStatusColor(s.color).split(' ')[0]
                            )}
                          />
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            No items
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Kanban View ----

function KanbanView<T extends { id: string }>({
  items,
  columns,
  statuses,
  statusField,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  items: T[];
  columns: ColumnDef<T>[];
  statuses: StatusDef[];
  statusField: keyof T;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {statuses.map((status) => {
        const grouped = items.filter(
          (item) => String(item[statusField]) === status.value
        );
        return (
          <KanbanColumn
            key={status.value}
            status={status}
            items={grouped}
            columns={columns}
            statuses={statuses}
            statusField={statusField}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        );
      })}
    </div>
  );
}

// ---- Main Component ----

export function TrackerBoard<T extends { id: string }>({
  items,
  columns,
  statusField,
  statuses,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
  title,
  emptyMessage = 'No items yet. Create one to get started.',
}: TrackerBoardProps<T>) {
  const [view, setView] = React.useState<'table' | 'kanban'>('table');
  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState<keyof T | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  // Filter
  const filtered = React.useMemo(() => {
    let result = items;

    if (statusFilter !== 'all') {
      result = result.filter(
        (item) => String(item[statusField]) === statusFilter
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        columns.some((col) => {
          const val = item[col.key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        })
      );
    }

    return result;
  }, [items, search, statusFilter, statusField, columns]);

  // Sort
  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="pl-8 h-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: string | null) => { if (v) setStatusFilter(v); }}>
            <SelectTrigger className="w-auto" size="sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        getStatusColor(s.color).split(' ')[0]
                      )}
                    />
                    {s.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted p-0.5">
            <button
              onClick={() => setView('table')}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors',
                view === 'table'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Table view"
            >
              <TableIcon className="size-3.5" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors',
                view === 'kanban'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Board view"
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>
          <Button size="sm" onClick={onAdd}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Content */}
      {sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <LayoutGrid className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">
            {search || statusFilter !== 'all' ? 'No results found' : 'No items yet'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : emptyMessage}
          </p>
          {!search && statusFilter === 'all' && (
            <Button size="sm" onClick={onAdd}>
              <Plus className="size-3.5" />
              Create first item
            </Button>
          )}
        </motion.div>
      ) : view === 'table' ? (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          <TableView
            items={sorted}
            columns={columns}
            statuses={statuses}
            statusField={statusField}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        </motion.div>
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          <KanbanView
            items={sorted}
            columns={columns}
            statuses={statuses}
            statusField={statusField}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        </motion.div>
      )}

      {/* Footer count */}
      {sorted.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Showing {sorted.length} of {items.length} item{items.length !== 1 ? 's' : ''}
        </div>
      )}
    </motion.div>
  );
}
