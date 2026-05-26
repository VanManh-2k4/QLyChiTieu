/**
 * ExportModal Component
 * Modal for data export with format selection
 * @module components/export/ExportModal
 */

import React, { useState, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import ExportFilters from './ExportFilters.jsx';

/**
 * @typedef {Object} ExportModalProps
 * @property {boolean} isOpen - Whether modal is open
 * @property {Function} onClose - Callback when modal closes
 * @property {boolean} isExporting - Whether export is in progress
 * @property {Function} onExportCsv - Callback for CSV export
 * @property {Function} onExportExcel - Callback for Excel export
 * @property {Function} onExportBackup - Callback for backup JSON export
 * @property {Object} filters - Current filter values
 * @property {Function} onFilterChange - Callback when filters change
 * @property {string} [error] - Error message from export
 * @property {boolean} [hasData] - Whether there is data to export
 */

/**
 * Validate filter values
 * @param {Object} filters
 * @returns {boolean}
 */
function areFiltersValid(filters) {
  if (!filters || typeof filters !== 'object') return false;

  const validModes = ['all', 'day', 'month', 'year'];
  if (!validModes.includes(filters.mode)) return false;

  if (filters.mode === 'day' && !filters.day) return false;
  if (filters.mode === 'month' && (!filters.month || !filters.year)) return false;
  if (filters.mode === 'year' && !filters.year) return false;

  // Validate date format
  if (filters.day) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(filters.day)) return false;
  }

  // Validate ranges
  if (filters.month && (filters.month < 1 || filters.month > 12)) return false;
  if (filters.year && (filters.year < 1900 || filters.year > 2100)) return false;

  return true;
}

/**
 * Export format options
 */
const EXPORT_FORMATS = [
  { id: 'csv', name: 'CSV', icon: FileText, description: 'UTF-8, tương thích Excel', color: 'from-indigo-500 to-violet-500' },
  { id: 'excel', name: 'Excel', icon: FileSpreadsheet, description: 'Định dạng chuyên nghiệp', color: 'from-emerald-500 to-teal-500' },
  { id: 'backup', name: 'Backup', icon: FileJson, description: 'JSON để khôi phục', color: 'from-amber-500 to-orange-500' },
];

/**
 * ExportModal component
 * @param {ExportModalProps} props
 * @returns {JSX.Element}
 */
export default function ExportModal({
  isOpen,
  onClose,
  isExporting,
  onExportCsv,
  onExportExcel,
  onExportBackup,
  filters,
  onFilterChange,
  error,
  hasData = true,
}) {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const isFiltersValid = areFiltersValid(filters);
  const canExport = !isExporting && isFiltersValid && hasData;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleExport = () => {
    switch (selectedFormat) {
      case 'csv':
        onExportCsv();
        break;
      case 'excel':
        onExportExcel();
        break;
      case 'backup':
        onExportBackup();
        break;
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 pb-2 shrink-0">
              <h3 className="text-lg font-semibold text-slate-900">
                Xuất báo cáo
              </h3>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 pt-2 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
              <div className="space-y-6">
                {/* Empty State */}
                {!hasData && (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Không có dữ liệu để xuất</h3>
                    <p className="text-sm text-slate-600 max-w-md">
                      Không có giao dịch trong phạm vi thời gian đã chọn. Vui lòng chọn phạm vi khác để xuất báo cáo.
                    </p>
                  </div>
                )}

                {/* Export Format Selection */}
                {hasData && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Chọn định dạng file</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {EXPORT_FORMATS.map((format) => {
                        const Icon = format.icon;
                        const isSelected = selectedFormat === format.id;
                        return (
                          <button
                            key={format.id}
                            type="button"
                            onClick={() => setSelectedFormat(format.id)}
                            disabled={isExporting}
                            className={`
                              relative p-4 rounded-xl border-2 transition-all duration-200
                              ${isSelected 
                                ? `border-transparent bg-gradient-to-br ${format.color} text-white shadow-lg scale-105` 
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md text-slate-700'
                              }
                              ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                              <span className="text-sm font-semibold">{format.name}</span>
                              <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                {format.description}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Time Range Filters */}
                {hasData && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Phạm vi thời gian</h3>
                    <ExportFilters
                      filters={filters}
                      onChange={onFilterChange}
                      disabled={isExporting}
                      error={error}
                    />
                  </div>
                )}

                {/* Info Box */}
                {hasData && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-3">Thông tin định dạng</p>
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span><strong>CSV:</strong> UTF-8, tương thích Excel</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        <span><strong>Excel:</strong> Định dạng chuyên nghiệp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-amber-500" />
                        <span><strong>Backup:</strong> JSON để khôi phục</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Export Button */}
            {hasData && (
              <div className="p-6 pt-2 border-t border-slate-200 shrink-0">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="text-sm text-slate-600">
                    {isFiltersValid ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Đã chọn phạm vi: {filters.mode === 'all' ? 'Tất cả dữ liệu' : filters.mode === 'month' ? `Tháng ${filters.month}/${filters.year}` : filters.mode === 'year' ? `Năm ${filters.year}` : filters.day}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Vui lòng chọn phạm vi thời gian</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!canExport}
                    onClick={handleExport}
                    className={`
                      w-full sm:w-auto h-12 px-8 rounded-xl font-semibold text-white shadow-lg transition-all duration-200
                      flex items-center justify-center gap-2
                      ${canExport 
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl' 
                        : 'bg-slate-300 cursor-not-allowed'
                      }
                    `}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang xuất…</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Xuất báo cáo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
