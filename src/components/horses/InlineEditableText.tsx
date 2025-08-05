'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditableTextProps {
  value: string | null | undefined;
  onSave: (value: string) => Promise<void>;
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

export function InlineEditableText({
  value,
  onSave,
  placeholder,
  className,
  disabled = false,
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setEditValue(value || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (editValue.trim() === (value || '').trim()) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
      // Keep editing mode open on error
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-4", className)}>
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          rows={4}
          disabled={isSaving}
          className="resize-none text-base"
          autoFocus
        />
        <div className="flex gap-3 w-full">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 h-12"
          >
            <Check className="h-4 w-4 mr-2" />
            {isSaving ? 'Lagrer...' : 'Lagre'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 h-12"
          >
            <X className="h-4 w-4 mr-2" />
            Avbryt
          </Button>
        </div>
      </div>
    );
  }

  const displayValue = value?.trim();

  return (
    <div className={cn("", className)}>
      {displayValue ? (
        <div className="space-y-3">
          <p className="text-body whitespace-pre-wrap leading-relaxed">
            {displayValue}
          </p>
          {!disabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              className="w-full h-10 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Rediger instruksjoner
            </Button>
          )}
        </div>
      ) : (
        <div>
          {!disabled ? (
            <Button
              variant="outline"
              onClick={handleStartEdit}
              className="w-full min-h-12 py-3 px-4 text-gray-600 border-gray-200 hover:bg-gray-50 border-dashed text-left whitespace-normal"
            >
              <Edit2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{placeholder}</span>
            </Button>
          ) : (
            <div className="text-center py-6 text-gray-500 italic">
              <span className="text-body-sm">{placeholder}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}