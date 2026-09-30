import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'google' | 'outline';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = true,
  className,
  children,
  ...props
}) => {
  const baseStyles =
    'py-2.5 px-4 rounded-[8px] text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-[#00A859] hover:bg-[#00964F] text-white shadow-2xs active:scale-[0.99]',
    google:
      'bg-[#E6F4EA] hover:bg-[#DCEFE2] text-[#1F2937] active:scale-[0.99]',
    outline:
      'bg-white text-[#00A859] border border-[#00A859] hover:bg-[#E6F4EA] active:scale-[0.99]',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
