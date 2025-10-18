import { useCSV } from "./context/CSVContext";
import { NavLink } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { NumberFilter, DateFilter, CategoryFilter,StringFilter } from "./components/filterToolTips";


const ChevronUp = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);

const ChevronDown = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const ArrowLeft = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);

const ArrowRight = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 5 7 7-7 7"/><path d="M5 12h14"/>
  </svg>
);

const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);
type SortMode = "asc" | "desc" | "original" | null;
type RowType = (string | number | null)[];

const sortCSVRows = (
  rows: (string | number | null)[][],
  colIndex: number,
  mode: SortMode
) => {
  return [...rows].sort((a, b) => {
    const valA = a[colIndex];
    const valB = b[colIndex];

    if (valA == null && valB == null) return 0;
    if (valA == null) return mode === "asc" ? -1 : 1;
    if (valB == null) return mode === "asc" ? 1 : -1;

    const aStr = String(valA);
    const bStr = String(valB);
    const aNum = Number(aStr);
    const bNum = Number(bStr);

    const bothNumeric = !isNaN(aNum) && !isNaN(bNum);

    if (bothNumeric) {
      return mode === "asc" ? aNum - bNum : bNum - aNum;
    }

    const comparison = aStr.localeCompare(bStr, undefined, {
      sensitivity: "base",
      numeric: true,
    });

    return mode === "asc" ? comparison : -comparison;
  });
};

const arrayToJson = (header: RowType, rows: RowType[]) => {
  return rows.map((row) =>
    header.reduce((acc, col, i) => {
      acc[col] = row[i];
      return acc;
    }, {} as Record<string, any>)
  );
};  

const DataSheet = () => {
  const { csvData, setCSVData } = useCSV();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [originalArray, setOriginalArray] = useState(csvData.content?.array || []);

  if (!csvData?.content) {
    return (
      <div className="flex flex-col items-center justify-center text-white p-4">
        <p className="mb-4 text-lg">No data available.</p>
        <NavLink
          to="/"
          className="text-sm px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Go back to upload
        </NavLink>
      </div>
    );
  }

  const { array } = csvData.content;
  const header = array[0] as RowType;
  const body = array.slice(1) as RowType[];
  const filteredBody = useMemo(() => {
    if (!debouncedSearch) return body;

    const lowerCaseSearch = debouncedSearch.toLowerCase();
    return body.filter(row =>
      row.some(cell =>
        cell !== null && String(cell).toLowerCase().includes(lowerCaseSearch)
      )
    );
  }, [body, searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const totalRows = filteredBody.length; // Total rows is now based on filtered data
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  // Reset page to 1 whenever the filter changes (NEW)
  useEffect(() => {
    setPage(1);
  }, [searchTerm, totalPages]);


  // Sort Logic (Logic preserved)
  const handleSortClick = (colIndex: number) => {
    let newMode: SortMode;

    if (sortCol === colIndex) {
      if (sortMode === "asc") {
        newMode = "desc";
      } else if (sortMode === "desc") {
        newMode = "original";
      } else {
        newMode = "asc";
      }
    } else {
      newMode = "asc";
    }

    let newArray = originalArray;
    let newJson;
    const original = originalArray;

    if (newMode === "original" || newMode === null) {
      newArray = original;
      newJson = arrayToJson(original[0] as RowType, original.slice(1) as RowType[]);
    } else {
      const sorted = sortCSVRows(original.slice(1) as RowType[], colIndex, newMode);
      newArray = [original[0] as RowType, ...sorted];
      newJson = arrayToJson(original[0] as RowType, sorted);
    }

    setSortCol(newMode === "original" ? null : colIndex);
    setSortMode(newMode === "original" ? null : newMode);
    setPage(1);
    setCSVData({
      file: csvData.file,
      content: {
        array: newArray,
        json: newJson,
      },
    });
  };


  const paginatedRows = filteredBody.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="h-full w-full max-w-7xl mx-auto rounded-xl bg-gray-950 text-gray-200 p-8 flex flex-col shadow-2xl border border-gray-800">

      {/* --- Top Control Bar: File Info & Back Button --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-blue-600/50 pb-4 mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-extrabold text-blue-400 tracking-tight">
            Data Viewer
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            File: <span className="font-mono text-white">{csvData.file?.name || "Untitled"}</span> | Total Records: <span className="font-semibold text-white">{filteredBody.length.toLocaleString()}</span> (Filtered from {originalArray.length - 1})
          </p>
        </div>

        <NavLink
          to="/"
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-full text-sm font-medium hover:bg-gray-600 transition duration-200 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Upload
        </NavLink>
      </div>

      {/* --- Search Bar (NEW) --- */}
      <div className="w-full flex justify-center mb-6">
        <div className="relative w-full max-w-lg">
          <input
            type="text"
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-lg"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        </div>
      </div>

      {/* --- Data Table Container --- */}
      <section className="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-700 shadow-inner bg-gray-800/50">
        <table className="min-w-full border-collapse table-auto">
          <thead className="bg-gray-700/80 backdrop-blur-sm sticky top-0 z-10 shadow-md">
            <tr>
              {/* Row Number Column */}
              <th className="border-b border-gray-600 px-4 py-3 text-sm font-semibold sticky top-0 bg-gray-700/80 text-gray-300 w-16 text-center">
                #
              </th>
              {/* Data Columns */}
              {header.map((cell, i) => (
                <th
                  key={i}
                  onClick={() => handleSortClick(i)}
                  className="group cursor-pointer border-b border-gray-600 px-4 py-3 text-left text-sm font-semibold sticky top-0 bg-gray-700/80 text-gray-300 transition duration-150 hover:bg-gray-600/80"
                  style={{ minWidth: "120px" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{cell || <span className="text-gray-500 italic">No Header</span>}</span>
                    <span className={`ml-2 transition duration-200 ${sortCol === i ? 'text-blue-400' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}>
                      {sortCol === i ? (
                        // Show active sort icon
                        sortMode === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : (
                        // Show neutral placeholder icon on hover
                        <ChevronUp className="w-4 h-4 opacity-50" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, ri) => (
              <tr key={ri} className="transition duration-150 hover:bg-blue-900/20 odd:bg-gray-900/50 even:bg-gray-800/50">
                {/* Row Index */}
                <td className="border-b border-gray-700 px-4 py-2 text-sm text-gray-400 font-mono w-16 text-center">
                  {(page - 1) * rowsPerPage + ri + 1}
                </td>
                {/* Data Cells */}
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="border-b border-gray-700 px-4 py-2 text-sm break-words max-w-xs text-gray-300"
                  >
                    {cell ?? <span className="text-gray-500 italic">NULL</span>}
                  </td>
                ))}
              </tr>
            ))}
            {paginatedRows.length === 0 && (
                <tr>
                    <td colSpan={header.length + 1} className="py-8 text-center text-lg text-gray-500">
                        No data to display on this page.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* --- Footer Pagination Controls --- */}
      <div className="mt-6 pt-4 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
            <label htmlFor="rowsPerPage" className="text-sm text-gray-400">
              Rows per page:
            </label>
            <select
              id="rowsPerPage"
              className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
        </div>


        {/* Page status and navigation buttons */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-sm text-gray-400 hidden sm:inline">
            Showing rows <span className="font-semibold text-white">{(page - 1) * rowsPerPage + 1}</span> to <span className="font-semibold text-white">{Math.min(page * rowsPerPage, totalRows)}</span> of <span className="font-semibold text-white">{totalRows.toLocaleString()}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="px-4 py-1.5 text-white font-semibold rounded-lg bg-gray-700/70 text-sm">
            Page {page} of {totalPages === 0 ? 1 : totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition shadow-md"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSheet;
