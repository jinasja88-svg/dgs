'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'pillRausch' | 'pillGhost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

/* DESIGN.md §6.1 — Rausch primary, ink secondary, hairline ghost */
const variantStyles: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-active rounded-[var(--radius-sm)]',
  secondary: 'bg-canvas text-ink border border-ink hover:bg-surface-soft rounded-[var(--radius-sm)]',
  tertiary: 'bg-transparent text-ink hover:underline rounded-[var(--radius-sm)]',
  ghost: 'bg-transparent text-ink hover:bg-surface-soft rounded-[var(--radius-sm)]',
  danger: 'bg-error text-on-primary hover:bg-error-hover rounded-[var(--radius-sm)]',
  pillRausch: 'bg-primary text-on-primary hover:bg-primary-active rounded-full',
  pillGhost: 'bg-canvas text-ink border border-hairline hover:border-ink rounded-full',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-[15px]',
  lg: 'px-6 py-3 text-base h-12',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium leading-[1.25] transition-colors duration-200 cursor-pointer',
          'disabled:bg-primary-disabled disabled:text-on-primary disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
