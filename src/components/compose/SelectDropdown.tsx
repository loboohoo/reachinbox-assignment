import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  label: string;
  value: string;
}

interface SelectDropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options,
  selectedValue,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === selectedValue) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs cursor-pointer transition-colors"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-8 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 font-sans">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                option.value === selectedValue
                  ? 'bg-emerald-50 text-[#00A859] font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === selectedValue && (
                <Check className="w-3.5 h-3.5 text-[#00A859] shrink-0 ml-1" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
