'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/* DESIGN.md §6.7 — hairline outline, focus thickens to 2px ink (no glow) */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-3 border rounded-[var(--radius-sm)] text-base text-ink bg-canvas transition-colors',
            'placeholder:text-muted-soft',
            'focus:outline-none focus:border-2 focus:border-ink focus:px-[13px] focus:py-[11px]',
            'disabled:bg-surface-soft disabled:text-muted-soft disabled:cursor-not-allowed',
            error ? 'border-error' : 'border-hairline',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-error">{error}</p>}
        {helperText && !error && <p className="text-sm text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
