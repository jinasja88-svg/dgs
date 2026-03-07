'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

/* KRDS Button Styles */
const variantStyles: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-60 active:bg-primary-70',
  secondary: 'bg-primary-5 text-primary border border-primary hover:bg-primary-10 active:bg-primary-20',
  tertiary: 'bg-transparent text-text-secondary border border-border-dark hover:bg-gray-5 active:bg-gray-10',
  ghost: 'text-text-secondary hover:bg-secondary-5 active:bg-secondary-10',
  danger: 'bg-danger text-white hover:bg-danger-60 active:bg-danger-60',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[15px] rounded-[var(--radius-sm)]',
  md: 'px-5 py-2.5 text-[15px] rounded-[var(--radius-md)]',
  lg: 'px-7 py-3 text-[17px] rounded-[var(--radius-md)]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-bold leading-[150%] transition-colors duration-200 cursor-pointer',
          'disabled:bg-gray-20 disabled:text-gray-50 disabled:border-gray-30 disabled:cursor-not-allowed',
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
