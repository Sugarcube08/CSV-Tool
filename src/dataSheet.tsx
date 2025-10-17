import { useCSV } from "./context/CSVContext";
import { NavLink } from "react-router-dom";
import { useState } from "react";

type SortMode = "asc" | "desc" | "original" | null;

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

const arrayToJson = (header: any[], rows: any[][]) => {
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

  // keep a original array to clear sorting on 2nd click  
  const [originalArray, setOriginalArray] = useState(csvData.content?.array);


  if (!csvData?.content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
        <p className="mb-4 text-lg">No data available.</p>
        <NavLink
          to="/"
          className="text-sm px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
        >
          Go back to upload
        </NavLink>
      </div>
    );
  }

  const { array } = csvData.content;
  const header = array[0];
  const body = array.slice(1);
  const totalRows = body.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const handleSortClick = (colIndex: number) => {
    let newMode: SortMode;

    if (sortCol !== colIndex) {
      newMode = "asc";
    } else if (sortMode === "asc") {
      newMode = "desc";
    } else if (sortMode === "desc") {
      newMode = "original";
    } else {
      newMode = "asc";
    }

    let newArray = array;
    let newJson;

    const original = originalArray || array;

    if (newMode === "original") {
      newArray = original;
      newJson = arrayToJson(original[0], original.slice(1));
    } else {
      const sorted = sortCSVRows(original.slice(1), colIndex, newMode);
      newArray = [original[0], ...sorted];
      newJson = arrayToJson(original[0], sorted);
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


  const paginatedRows = body.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="h-full w-full max-w-7xl rounded bg-gray-900 text-white p-6 flex flex-col">
      <nav className="mb-6">
        <NavLink
          to="/"
          className="inline-block border-muted-foreground drop-shadow-2xl border p-2 rounded text-sm font-medium text-blue-400 hover:text-blue-600 transition"
        >
          ← Back to Upload
        </NavLink>
      </nav>

      <section className="flex-1 min-h-fit h-fit overflow-auto rounded border border-gray-700 shadow-lg bg-gray-800">
        <table className="min-w-full border-collapse table-auto">
          <thead className="bg-gray-700 sticky top-0 z-10">
            <tr className="text-left">
              <th className="border border-gray-600 px-4 py-2 text-sm font-semibold sticky top-0 bg-gray-700">
                #
              </th>
              {header.map((cell, i) => (
                <th
                  key={i}
                  onClick={() => handleSortClick(i)}
                  className="cursor-pointer border border-gray-600 px-4 py-2 text-sm font-semibold sticky top-0 bg-gray-700"
                  style={{ minWidth: "100px" }}
                >
                  {cell || <span className="text-gray-400">—</span>}
                  {sortCol === i && (
                    <span className="ml-1 text-xs">
                      {sortMode === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-gray-900" : "bg-gray-800"}>
                <td className="border border-gray-700 px-4 py-2 text-sm text-gray-400 font-mono">
                  {(page - 1) * rowsPerPage + ri + 1}
                </td>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="border border-gray-700 px-4 py-2 text-sm break-words max-w-xs"
                  >
                    {cell ?? <span className="text-gray-500">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="rowsPerPage" className="text-sm">
            Rows per page:
          </label>
          <select
            id="rowsPerPage"
            className="bg-gray-700 text-white px-2 py-1 rounded"
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

        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSheet;
