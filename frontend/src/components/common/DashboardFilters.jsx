import React from 'react';
import { Filter, Calendar, BookOpen, Layers, RefreshCw, Download } from 'lucide-react';

const DashboardFilters = ({ filters, onFilterChange, onReset, onExport, availableBatches = [] }) => {
  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear-1}/${currentYear}`,
    `${currentYear}/${currentYear+1}`,
    `${currentYear+1}/${currentYear+2}`
  ];
  return (
    <div className="glass-card p-4 rounded-2xl mb-6 shadow-sm border border-slate-100/80 bg-white/70 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Title / Filter Icon */}
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Filter className="w-4 h-4" />
          </div>
          <span>Filters & Scope</span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Academic Year */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={filters?.academicYear || 'All'}
              onChange={(e) => onFilterChange?.('academicYear', e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Academic Years</option>
              {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Batch */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
            <Layers className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={filters?.batch || 'All'}
              onChange={(e) => onFilterChange?.('batch', e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Batches</option>
              {availableBatches.length > 0 ? (
                availableBatches.map(b => (
                  <option key={b.id || b.name} value={b.name}>{b.name}</option>
                ))
              ) : (
                <>
                  <option value="Batch 2021">Batch 2021</option>
                  <option value="Batch 2022">Batch 2022</option>
                  <option value="Batch 2023">Batch 2023</option>
                  <option value="Batch 2024">Batch 2024</option>
                </>
              )}
            </select>
          </div>

          {/* Date Range Quick Select */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <select
              value={filters?.dateRange || '30days'}
              onChange={(e) => onFilterChange?.('dateRange', e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Reset Button */}
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium transition-colors"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Export Button */}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-all active:scale-95 ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardFilters;
