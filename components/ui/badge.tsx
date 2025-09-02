import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        modern:
          'relative border-transparent bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 ease-out transform hover:scale-105 backdrop-blur-sm border border-white/10',
        elegant:
          'relative border-transparent bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-md shadow-slate-900/30 hover:shadow-lg hover:shadow-slate-900/50 transition-all duration-300 border border-slate-700/50 backdrop-blur-sm',
        minimal:
          'relative border-transparent bg-blue-600 text-white shadow-sm hover:shadow-md hover:bg-blue-700 transition-all duration-200 border border-blue-500/20 font-medium',
        premium:
          'relative border-transparent bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 border border-orange-400/30 backdrop-blur-sm',
        soft:
          'relative border border-blue-200 bg-blue-50 text-blue-700 shadow-sm hover:shadow-md hover:bg-blue-100 hover:border-blue-300 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 transition-all duration-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
