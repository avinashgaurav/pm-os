'use client';

import { motion } from 'framer-motion';
import { Star, Trash2, Download, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BaseDocument } from '@/types';

interface DocumentCardProps {
  document: BaseDocument;
  isActive?: boolean;
  onClick: () => void;
  onStar: () => void;
  onDelete: () => void;
  onExport: () => void;
}

export function DocumentCard({
  document,
  isActive,
  onClick,
  onStar,
  onDelete,
  onExport,
}: DocumentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'group flex flex-col gap-1.5 rounded-lg border border-border p-3 cursor-pointer transition-colors hover:bg-accent/50',
        isActive && 'border-primary/30 bg-primary/5'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium truncate pr-2">{document.title || 'Untitled'}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1 hover:bg-accent"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStar(); }}>
              <Star className="h-3.5 w-3.5 mr-2" />
              {document.starred ? 'Unstar' : 'Star'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport(); }}>
              <Download className="h-3.5 w-3.5 mr-2" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2">
        {document.starred && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
        <span className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
        </span>
        {document.tags.length > 0 && (
          <Badge variant="secondary" className="h-4 px-1 text-[9px]">
            {document.tags[0]}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
