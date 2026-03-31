'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldDef[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
}

export function ItemDialog({
  open,
  onOpenChange,
  title,
  fields,
  values,
  onChange,
  onSave,
}: ItemDialogProps) {
  const handleSave = () => {
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {fields.map((field) => (
            <div key={field.key} className="grid gap-1.5">
              <Label htmlFor={field.key}>
                {field.label}
                {field.required && (
                  <span className="text-destructive ml-0.5">*</span>
                )}
              </Label>

              {field.type === 'text' && (
                <Input
                  id={field.key}
                  value={values[field.key] ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'number' && (
                <Input
                  id={field.key}
                  type="number"
                  value={values[field.key] ?? ''}
                  onChange={(e) =>
                    onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}

              {field.type === 'date' && (
                <Input
                  id={field.key}
                  type="date"
                  value={values[field.key] ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  required={field.required}
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  id={field.key}
                  value={values[field.key] ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={3}
                />
              )}

              {field.type === 'select' && field.options && (
                <Select
                  value={values[field.key] ?? ''}
                  onValueChange={(val) => onChange(field.key, val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={field.placeholder ?? 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
