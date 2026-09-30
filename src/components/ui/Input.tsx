import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-[8px] text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A859] focus:bg-white transition-all duration-150',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && <span className="text-[10px] text-red-500 mt-1 block">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
