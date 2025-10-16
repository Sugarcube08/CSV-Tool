import { useCSV } from "./context/CSVContext";
import { NavLink } from "react-router-dom";
import { useState } from "react";

type SortMode = "asc" | "desc" | null;

const DataSheet = () => {
  const { csvData, setCSVData } = useCSV(); // Ensure setCSVData is exposed from context
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>(null);

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

  const { array, json } = csvData.content;

  const handleSortClick = (colIndex: number) => {
    let newSortMode: SortMode;

    if (sortCol !== colIndex) {
      newSortMode = "asc";
    } else {
      newSortMode = sortMode === "asc" ? "desc" : "asc";
    }

    setSortCol(colIndex);
    setSortMode(newSortMode);
    setPage(1);

    const header = array[0];
    const body = [...array.slice(1)];

    body.sort((a, b) => {
      const valA = a[colIndex];
      const valB = b[colIndex];

      // Null-safe comparison
      if (valA == null && valB == null) return 0;
      if (valA == null) return newSortMode === "asc" ? -1 : 1;
      if (valB == null) return newSortMode === "asc" ? 1 : -1;

      const aStr = String(valA);
      const bStr = String(valB);

      const aNum = Number(aStr);
      const bNum = Number(bStr);
      const aIsNum = !isNaN(aNum);
      const bIsNum = !isNaN(bNum);

      if (aIsNum && bIsNum) {
        return newSortMode === "asc" ? aNum - bNum : bNum - aNum;
      }

      const comparison = aStr.localeCompare(bStr, undefined, {
        sensitivity: "base",
        numeric: true,
      });

      return newSortMode === "asc" ? comparison : -comparison;
    });

    const newJson = body.map((row) => {
      const obj: Record<string, any> = {};
      header.forEach((hdr, idx) => {
        obj[hdr] = row[idx];
      });
      return obj;
    });

    setCSVData({
      file: csvData.file,
      content: {
        array: [header, ...body],
        json: newJson,
      },
    });
  };

  const totalRows = array.length - 1;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const paginatedRows = array
    .slice(1)
    .slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  return (
    <div className="min-h-screen w-full max-w-7xl rounded bg-gray-900 text-white p-6 flex flex-col">
      <nav className="mb-6">
        <NavLink
          to="/"
          className="inline-block border-muted-foreground drop-shadow-2xl border p-2 rounded text-sm font-medium text-blue-400 hover:text-blue-600 transition"
        >
          ← Back to Upload
        </NavLink>
      </nav>

      <section className="flex-1 overflow-auto rounded border border-gray-700 shadow-lg bg-gray-800">
        <table className="min-w-full border-collapse table-auto">
          <thead className="bg-gray-700 sticky top-0 z-10">
            <tr className="text-left">
              <th className="border border-gray-600 px-4 py-2 text-sm font-semibold sticky top-0 bg-gray-700">
                #
              </th>
              {array[0].map((cell, i) => (
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
                    {cell !== null && cell !== undefined ? cell : <span className="text-gray-500">—</span>}
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
            onChange={handleRowsPerPageChange}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
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

      {/* JSON Preview */}
      <section className="mt-8 bg-gray-800 rounded p-4 shadow-inner max-h-64 overflow-auto">
        <h3 className="text-lg font-semibold mb-2">JSON Preview (first 5 rows)</h3>
        <pre className="text-xs whitespace-pre-wrap text-gray-200 font-mono max-h-56 overflow-auto">
          {JSON.stringify(json.slice(0, 5), null, 2)}
        </pre>
      </section>
    </div>
  );
};

export default DataSheet;
