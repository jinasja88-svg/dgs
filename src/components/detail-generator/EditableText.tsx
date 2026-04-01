'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'span';
  className?: string;
  multiline?: boolean;
}

export default function EditableText({
  value,
  onChange,
  as: Tag = 'p',
  className = '',
  multiline = false,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = () => {
    onChange(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="relative group">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            className={`w-full border border-primary/30 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[80px] ${className}`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            className={`w-full border border-primary/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
          />
        )}
        <button
          onClick={save}
          className="absolute top-1 right-1 p-1 bg-primary text-white rounded-md hover:bg-primary-60 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative group cursor-pointer" onClick={() => setEditing(true)}>
      <Tag className={className}>{value}</Tag>
      <button className="absolute -top-1 -right-1 p-1 bg-white border border-border-light rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil className="w-3 h-3 text-text-tertiary" />
      </button>
    </div>
  );
}
