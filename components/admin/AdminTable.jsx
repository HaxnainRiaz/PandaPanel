"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminTable({
  columns = [],
  data = [],
  rowSelection = {},
  setRowSelection = () => { },
  onRowClick,
  initialSorting = [],
  emptyMessage = "No records found matching criteria.",
  getRowId,
}) {
  const safeColumns = useMemo(() => {
    if (!Array.isArray(columns)) return [];
    return columns.filter(Boolean).map((col, i) => {
      const id = col.id || col.accessorKey || (typeof col.header === 'string' ? col.header.toLowerCase().replace(/\s+/g, '_') : `col_${i}`);
      return { ...col, id };
    });
  }, [columns]);

  const safeData = useMemo(() => {
    return Array.isArray(data) ? data.filter(Boolean) : [];
  }, [data]);

  const validColumnIds = useMemo(() => new Set(safeColumns.map(c => c.id)), [safeColumns]);

  const [sorting, setSorting] = useState([]);

  // Sync sorting with initialSorting and valid columns
  useEffect(() => {
    if (Array.isArray(initialSorting) && initialSorting.length > 0) {
      const valid = initialSorting.filter(s => s && s.id && validColumnIds.has(s.id));
      setSorting(valid);
    }
  }, [validColumnIds, initialSorting]);

  const table = useReactTable({
    data: safeData,
    columns: safeColumns,
    getRowId: getRowId || ((row) => String(row._id || row.id)),
    enableRowSelection: true,
    state: {
      sorting: sorting || [],
      rowSelection: rowSelection || {}
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  const headerGroups = table.getHeaderGroups() || [];
  const rows = table.getRowModel()?.rows || [];
  const tableState = table.getState();
  const pagination = tableState?.pagination || { pageIndex: 0, pageSize: 25 };

  const startRow = safeData.length === 0 ? 0 : (pagination.pageIndex || 0) * (pagination.pageSize || 25) + 1;
  const endRow = Math.min(((pagination.pageIndex || 0) + 1) * (pagination.pageSize || 25), safeData.length);

  if (safeColumns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#F5F3F0] shadow-sm p-8 text-center text-sm text-neutral-400 font-medium">
        No table columns configured.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#F5F3F0] shadow-sm overflow-hidden flex flex-col min-h-[200px]">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#FDFCFB] border-b border-[#F5F3F0]">
            {(headerGroups || []).map((headerGroup) => (
              <tr key={headerGroup?.id || Math.random()}>
                {(headerGroup?.headers || []).map((header) => {
                  if (!header || !header.column) return null;

                  const column = header.column;
                  const isSortable = typeof column.getCanSort === 'function' ? column.getCanSort() : false;
                  
                  // Extremely safe sorted state lookup
                  let sortedState = false;
                  try {
                    if (isSortable && validColumnIds.has(column.id)) {
                      sortedState = column.getIsSorted?.() || false;
                    }
                  } catch (e) {
                    console.error("Sorting lookup failed for column", column.id);
                  }

                  const sortingHandler = isSortable
                    ? column.getToggleSortingHandler?.()
                    : undefined;

                  return (
                    <th
                      key={header.id || Math.random()}
                      className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-neutral-500 whitespace-nowrap select-none group"
                    >
                      <div
                        className={`flex items-center gap-1 ${isSortable ? "cursor-pointer hover:text-[#0a4019]" : ""}`}
                        onClick={sortingHandler}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            column.columnDef?.header,
                            header.getContext?.()
                          )}

                        {isSortable && (
                          <div className="w-4">
                            {sortedState === "asc" && <ChevronUp size={14} className="text-[#0a4019]" />}
                            {sortedState === "desc" && <ChevronDown size={14} className="text-[#0a4019]" />}
                            {!sortedState && <ChevronUp size={14} className="text-transparent group-hover:text-neutral-300" />}
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-[#F5F3F0]">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    if (typeof onRowClick === "function") {
                      onRowClick(row.original);
                    }
                  }}
                  className={`hover:bg-[#FDFCFB]/80 transition-colors group ${typeof onRowClick === "function" ? "cursor-pointer" : ""
                    } ${row.getIsSelected?.() ? "bg-[#0a4019]/5" : ""}`}
                >
                  {(row.getVisibleCells?.() || []).filter(Boolean).map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 whitespace-nowrap"
                      onClick={(event) => {
                        if (
                          cell.column?.id === "select" ||
                          cell.column?.columnDef?.id === "select"
                        ) {
                          event.stopPropagation();
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={safeColumns.length || 1}
                  className="px-6 py-16 text-center text-neutral-400 font-medium"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-t border-[#F5F3F0] bg-[#FDFCFB] text-xs text-neutral-500 font-bold tracking-wide">
        <div>
          Showing {startRow} to {endRow} of {safeData.length} rows
        </div>

        <div className="flex items-center gap-4">
          <select
            value={pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="bg-transparent border-none font-bold text-[#0a4019] focus:outline-none cursor-pointer"
          >
            {[10, 25, 50, 100, 250].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-[#F5F3F0] bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-[#F5F3F0] bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}