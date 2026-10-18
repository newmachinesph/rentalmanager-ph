'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  onClick,
  className,
  type = 'button',
}: ButtonProps) {
  const variants = {
    primary: cn(
      'bg-blue-600 text-white shadow-sm shadow-blue-600/25',
      'hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30',
      'active:bg-blue-800',
      'dark:bg-blue-500 dark:hover:bg-blue-600 dark:shadow-blue-500/20'
    ),
    secondary: cn(
      'bg-gray-100 text-gray-700',
      'hover:bg-gray-200',
      'active:bg-gray-300',
      'dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
    ),
    outline: cn(
      'border border-gray-300 text-gray-700 bg-white',
      'hover:bg-gray-50 hover:border-gray-400',
      'active:bg-gray-100',
      'dark:border-gray-700 dark:text-gray-300 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:border-gray-600'
    ),
    ghost: cn(
      'text-gray-700',
      'hover:bg-gray-100',
      'active:bg-gray-200',
      'dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700'
    ),
    danger: cn(
      'bg-red-600 text-white shadow-sm shadow-red-600/25',
      'hover:bg-red-700 hover:shadow-md hover:shadow-red-600/30',
      'active:bg-red-800',
      'dark:bg-red-500 dark:hover:bg-red-600 dark:shadow-red-500/20'
    ),
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1',
        'dark:focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {Icon && <Icon size={iconSizes[size]} className="shrink-0" />}
      {children}
    </button>
  );
}
