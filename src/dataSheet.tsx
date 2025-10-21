// --- Mock Imports (To satisfy single-file mandate) ---
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import React from 'react';
import { useCSV } from "./context/CSVContext";
import { filterClassifier, applyFilter } from "./components/filterOnHoverOrClick";

// Mock NavLink as a simple anchor tag
const NavLink = ({ to, className, children }: any) => <a href={to} className={className}>{children}</a>;

// --- Type Definitions (Needed by both main component and classifier) ---
type SortMode = "asc" | "desc" | "original" | null;
type RowType = (string | number | null)[];
type ColumnData = (string | number | Date | null | undefined)[];

/** Defines the criteria structure sent from a filter component to the parent. */
type FilterCriteria = {
  type: string;
  value: string | string[] | null;
};

// --- CONSTANTS ---
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Google Sheets/Excel base date: Dec 30, 1899 (adjusted for JS Date constructor)
const GSHEETS_DATE_OFFSET = new Date(1899, 11, 30).getTime();

const gsheetsToDate = (value: number): string => {
  // The value is guaranteed to be a number by the classifier logic.

  const totalMs = value * MS_PER_DAY;
  const date = new Date(GSHEETS_DATE_OFFSET + totalMs);

  // Format the date string in UTC to prevent timezone issues shifting the day
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  // Format the time part
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  // Return full date-time string (YYYY-MM-DD HH:MM:SS)
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const displayDateValue = (value: number | string | null, isDateColumn: boolean): string | number | null => {
  if (typeof value === 'number' && isDateColumn) {
    return gsheetsToDate(value);
  }
  return value;
};
// --- SVG Components ---
const ChevronUp = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>;
const ChevronDown = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>;
const ArrowRight = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5 7 7-7 7" /><path d="M5 12h14" /></svg>;
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const HamburgerIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;


// --- UTILITY FUNCTIONS ---
const sortCSVRows = (rows: RowType[], colIndex: number, mode: SortMode) => {
  return [...rows].sort((a, b) => {
    const valA = a[colIndex], valB = b[colIndex];
    if (valA == null && valB == null) return 0;
    if (valA == null) return mode === "asc" ? -1 : 1;
    if (valB == null) return mode === "asc" ? 1 : -1;

    // Check if both values are GSheets serials and the column is classified as a date.
    // NOTE: Sorting logic is simplified here to avoid passing column type. We rely on standard numeric/string sorting.
    const aNum = Number(valA), bNum = Number(valB);

    // If both are plausible numbers, sort numerically. This covers GSheets serials and regular numbers.
    if (!isNaN(aNum) && !isNaN(bNum)) return mode === "asc" ? aNum - bNum : bNum - aNum;

    // Otherwise, sort as strings.
    const aStr = String(valA), bStr = String(valB);
    const comparison = aStr.localeCompare(bStr, undefined, { sensitivity: "base", numeric: true });
    return mode === "asc" ? comparison : -comparison;
  });
};

const arrayToJson = (header: RowType, rows: RowType[]) =>
  rows.map((row) =>
    header.reduce((acc, col, i) => { acc[col as string] = row[i]; return acc; }, {} as Record<string, any>)
  );


// --- Main Component ---
const DataSheet = () => {
  const { csvData, setCSVData } = useCSV();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [columnFilters, setColumnFilters] = useState<Record<number, FilterCriteria>>({});
  const [activeFilterCol, setActiveFilterCol] = useState<number | null>(null);
  const [filterPosition, setFilterPosition] = useState<{ top: number, left: number } | null>(null);

  const filterMenuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  if (!csvData?.content) {
    return (
      <div className="flex flex-col items-center justify-center text-white p-4">
        <p className="mb-4 text-lg">No data available.</p>
        <NavLink to="/" className="text-sm px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">Go back to upload</NavLink>
      </div>
    );
  }

  const { array } = csvData.content;
  const header = array[0] as RowType;
  const body = array.slice(1) as RowType[];

  const dataCleaner = (data: RowType[]) => data.filter(row => row.some(cell => cell !== null && cell !== ''));
  const cleanedBody = useMemo(() => dataCleaner(body), [body]);
  // Store an immutable deep copy of the original uploaded array.
  // This ensures sorting and filtering never mutate the true original.
  const [originalArray] = useState(() =>
    csvData.content?.array ? JSON.parse(JSON.stringify(csvData.content.array)) : []
  );

  // Memoized function to get column data for the filterClassifier
  const getColumnData = (colIndex: number): ColumnData => {
    return cleanedBody.map(row => row[colIndex]);
  };

  // Cache the classification results (string name) for each column
  const columnTypes = useMemo(() => {
    // Helper to get the component name from the filterClassifier's return value
    const getComponentName = (colIndex: number) => {
      // We call the classifier just to get the type, and rely on the name property of the function component
      const element = filterClassifier(getColumnData(colIndex), undefined, () => { });
      return element?.type?.name || 'StringFilter';
    };

    return header.map((_, i) => getComponentName(i));
  }, [cleanedBody, header, getColumnData]);

  // Memoized Body filtered by search and column filters
  const filteredBody = useMemo(() => {
    let currentBody = cleanedBody;

    // 1. Apply global search filter
    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      currentBody = currentBody.filter(row => row.some(cell => cell !== null && String(cell).toLowerCase().includes(lower)));
    }

    // 2. Apply column filters
    const filterCols = Object.keys(columnFilters).map(Number).filter(colIndex => {
      const criteria = columnFilters[colIndex];
      return criteria && (
        (criteria.value !== null && (Array.isArray(criteria.value) ? criteria.value.length > 0 : String(criteria.value).length > 0)) ||
        criteria.type === 'empty' ||
        criteria.type === 'not empty'
      );
    });

    if (filterCols.length > 0) {
      currentBody = currentBody.filter(row =>
        filterCols.every(colIndex =>
          applyFilter(row, colIndex, columnFilters[colIndex])
        )
      );
    }

    return currentBody;
  }, [cleanedBody, debouncedSearch, columnFilters]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page on filter/search change
  useEffect(() => setPage(1), [debouncedSearch, columnFilters, rowsPerPage]);

  // Handle outside click for filter menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeFilterCol !== null && filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setActiveFilterCol(null);
        setFilterPosition(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeFilterCol]);

  const totalRows = filteredBody.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const handleSortClick = (colIndex: number) => {
    setActiveFilterCol(null);
    setFilterPosition(null);

    let newMode: SortMode;
    if (sortCol === colIndex) newMode = sortMode === "asc" ? "desc" : sortMode === "desc" ? "original" : "asc";
    else newMode = "asc";

    let newArray: RowType[];

    if (newMode !== "original" && newMode !== null) {
      // Always sort based on the immutable original array (excluding header)
      const sorted = sortCSVRows(originalArray.slice(1) as RowType[], colIndex, newMode);
      newArray = [originalArray[0], ...sorted];
    } else {
      // Reset to original order (unsorted)
      newArray = [...originalArray];
    }

    setSortCol(newMode === "original" ? null : colIndex);
    setSortMode(newMode === "original" ? null : newMode);

    // Update only the working CSV data
    setCSVData({
      file: csvData.file,
      content: {
        array: newArray,
        json: arrayToJson(newArray[0] as RowType, newArray.slice(1) as RowType[]),
      },
    });
    setPage(1);
  };

  // Function to calculate and set the position of the filter menu (Fixes cutting issue)
  const openFilterMenu = (colIndex: number) => {
    if (activeFilterCol === colIndex) {
      setActiveFilterCol(null);
      setFilterPosition(null);
      return;
    }

    const buttonElement = buttonRefs.current[colIndex];
    if (!buttonElement) return;

    const rect = buttonElement.getBoundingClientRect();
    const menuWidth = 288; // w-72 = 288px

    setActiveFilterCol(colIndex);

    const calculatedLeft = rect.right - menuWidth;
    const left = Math.max(16, calculatedLeft);

    setFilterPosition({
      top: rect.bottom + 8,
      left: left
    });
  };

  // Handle filter change callback
  const handleFilterChange = (colIndex: number) => (criteria: FilterCriteria) => {
    const isCleared = criteria.value === null && criteria.type !== 'empty' && criteria.type !== 'not empty';

    if (isCleared) {
      setColumnFilters(prev => {
        const newState = { ...prev };
        delete newState[colIndex];
        return newState;
      });
    } else {
      setColumnFilters(prev => ({
        ...prev,
        [colIndex]: criteria
      }));
    }
  };

  // Helper to check if a column has an active filter (for button styling)
  const isColumnFiltered = (colIndex: number) => {
    const criteria = columnFilters[colIndex];
    if (!criteria) return false;
    return criteria.type === 'empty' || criteria.type === 'not empty' ||
      (criteria.value !== null && (Array.isArray(criteria.value) ? criteria.value.length > 0 : String(criteria.value).length > 0));
  };

  const isDateColumn = (colIndex: number): boolean => {
    const typeName = columnTypes[colIndex];
    return typeName === 'DateFilter';
  }

  const paginatedRows = filteredBody.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="h-full w-full max-w-7xl mx-auto rounded-xl bg-gray-950 text-gray-200 p-8 flex flex-col shadow-2xl border border-gray-800">
      {/* --- Top Bar --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-blue-600/50 pb-4 mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-extrabold text-blue-400 tracking-tight">Data Viewer</h1>
          <p className="text-sm text-gray-400 mt-1">
            File: <span className="font-mono text-white">{csvData.file?.name || "Untitled"}</span> | Total Records: <span className="font-semibold text-white">{filteredBody.length.toLocaleString()}</span> (Filtered from {originalArray.length - 1})
          </p>
        </div>
        <NavLink to="/" className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-full text-sm font-medium hover:bg-gray-600 transition duration-200 shadow-md">
          <ArrowLeft className="w-4 h-4" /> Back to Upload
        </NavLink>
      </div>

      {/* --- Search Bar --- */}
      <div className="w-full flex justify-center mb-6">
        <div className="relative w-full max-w-lg">
          <input type="text" placeholder="Search data..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-lg" />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        </div>
      </div>

      {/* --- Data Table --- */}
      <section className="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-700 shadow-inner bg-gray-800/50">
        <table className="min-w-full border-collapse table-auto">
          <thead className="bg-gray-700/80 backdrop-blur-sm sticky top-0 z-20 shadow-md">
            <tr>
              <th className="border-b border-gray-600 px-4 py-3 text-sm font-semibold sticky top-0 bg-gray-700/80 text-gray-300 w-16 text-center">#</th>
              {header.map((cell, i) => (
                <th key={i} className="group border-b border-gray-600 px-4 py-3 text-left text-sm font-semibold sticky top-0 bg-gray-700/80 text-gray-300 transition duration-150" style={{ minWidth: "140px" }}>
                  <div className="flex items-center justify-between">
                    {/* Sort Button Wrapper */}
                    <button onClick={() => handleSortClick(i)} className="flex items-center flex-1 cursor-pointer py-1 -ml-4 pl-4 transition hover:bg-gray-600/50 rounded-lg">
                      <span className="truncate">{cell || <span className="text-gray-500 italic">No Header</span>}</span>
                      <span className={`ml-2 transition duration-200 ${sortCol === i ? 'text-blue-400' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}>
                        {sortCol === i ? (sortMode === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : <ChevronUp className="w-4 h-4 opacity-50" />}
                      </span>
                    </button>

                    {/* Hamburger Button (Ref used for position calculation) */}
                    <div className="z-30 ml-2">
                      <button
                        onClick={e => { e.stopPropagation(); openFilterMenu(i); }}
                        ref={el => buttonRefs.current[i] = el}
                        className={`flex items-center justify-center p-1 rounded-full transition ${isColumnFiltered(i) ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-600'}`}>
                        <HamburgerIcon className={`w-4 h-4 ${isColumnFiltered(i) ? 'text-white' : 'text-gray-300'}`} />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, ri) => (
              <tr key={ri} className="transition duration-150 hover:bg-blue-900/20 odd:bg-gray-900/50 even:bg-gray-800/50">
                <td className="border-b border-gray-700 px-4 py-2 text-sm text-gray-400 font-mono w-16 text-center">{(page - 1) * rowsPerPage + ri + 1}</td>
                {row.map((cell, ci) => (
                  <td key={ci} className="border-b border-gray-700 px-4 py-2 text-sm break-words max-w-xs text-gray-300">
                    {displayDateValue(cell, isDateColumn(ci)) ?? <span className="text-gray-500 italic">NULL</span>}
                  </td>
                ))}
              </tr>
            ))}
            {paginatedRows.length === 0 && (
              <tr><td colSpan={header.length + 1} className="py-8 text-center text-lg text-gray-500">No data to display on this page.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* --- Footer Pagination --- */}
      <div className="mt-6 pt-4 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="rowsPerPage" className="text-sm text-gray-400">Rows per page:</label>
          <select id="rowsPerPage" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer">
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-sm text-gray-400 hidden sm:inline">Showing rows <span className="font-semibold text-white">{(page - 1) * rowsPerPage + 1}</span> to <span className="font-semibold text-white">{Math.min(page * rowsPerPage, totalRows)}</span> of <span className="font-semibold text-white">{totalRows.toLocaleString()}</span></span>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition shadow-md"><ArrowLeft className="w-4 h-4" /> Previous</button>
          <span className="px-4 py-1.5 text-white font-semibold rounded-lg bg-gray-700/70 text-sm">Page {page} of {totalPages === 0 ? 1 : totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition shadow-md">Next <ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* --- Filter Menu Portal (Fixed Position) --- */}
      {activeFilterCol !== null && filterPosition && (
        <div
          ref={filterMenuRef}
          className="fixed z-[100] transition-all"
          style={{
            top: `${filterPosition.top}px`,
            left: `${filterPosition.left}px`,
          }}
        >
          {filterClassifier(
            getColumnData(activeFilterCol) as ColumnData,
            columnFilters[activeFilterCol],
            handleFilterChange(activeFilterCol)
          )}
        </div>
      )}
    </div>
  );
};

export default DataSheet;
