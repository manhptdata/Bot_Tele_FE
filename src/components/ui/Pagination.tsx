import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(0, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);
      
      if (start === 0) {
        end = 4;
      } else if (end === totalPages - 1) {
        start = totalPages - 5;
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-800/30 border-t border-slate-700/50">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-4 sm:mb-0">
        Hiển thị <span className="font-semibold text-white">{startItem}</span> - <span className="font-semibold text-white">{endItem}</span> trong tổng số <span className="font-semibold text-white">{totalElements}</span> bản ghi
        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Hiển thị
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Số bản ghi trên mỗi trang"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            / trang
          </label>
        )}
      </div>
      
      {totalPages > 1 && (
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            {page + 1}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
      )}
    </div>
  );
};
