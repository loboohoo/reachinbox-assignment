import React from 'react';
import { Filter, RefreshCw } from 'lucide-react';

interface FilterButtonProps {
  onFilterClick?: () => void;
  onRefreshClick?: () => void;
  isRefreshing?: boolean;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  onFilterClick,
  onRefreshClick,
  isRefreshing = false,
}) => {
  return (
    <div className="flex items-center space-x-1">
      <button
        type="button"
        onClick={onFilterClick}
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        title="Filter emails"
      >
        <Filter className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onRefreshClick}
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        title="Refresh list"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#00A859]' : ''}`} />
      </button>
    </div>
  );
};
