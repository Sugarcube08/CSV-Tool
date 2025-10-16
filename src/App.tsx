"use client";

import { File, FileSpreadsheet, X } from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Progress } from "./components/ui/progress";

import { useCSV } from "./context/CSVContext";
import * as XLSX from "xlsx";

export default function App() {
  const [uploadState, setUploadState] = useState<{
    file: File | null;
    progress: number;
    uploading: boolean;
  }>({
    file: null,
    progress: 0,
    uploading: false,
  });

  const [isReadyToProceed, setIsReadyToProceed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setCSVData } = useCSV();

  const validFileTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-office",
    "application/octet-stream",
  ];

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeOK = validFileTypes.includes(file.type);
    const extOK = ["csv", "xlsx", "xls"].includes(ext);

    if (!mimeOK && !extOK) {
      toast.error("Please upload a CSV, XLSX, or XLS file.", {
        position: "bottom-right",
        duration: 3000,
      });
      return;
    }

    setUploadState({ file, progress: 0, uploading: true });
    setIsReadyToProceed(false);

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;

      try {
        let workbook: XLSX.WorkBook;
        if (data instanceof ArrayBuffer) {
          workbook = XLSX.read(data, { type: "array" });
        } else if (typeof data === "string") {
          workbook = XLSX.read(data, { type: "binary" });
        } else {
          workbook = XLSX.read(data as any, { type: "binary" });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData: object[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        const sheetAsArray: (string | number | null)[][] = XLSX.utils.sheet_to_json(
          worksheet,
          { header: 1, defval: null }
        );

        setCSVData({
          file,
          content: {
            json: jsonData,
            array: sheetAsArray,
          },
        });

        // Wait for upload simulation to complete before allowing proceed
        const interval = setInterval(() => {
          setUploadState((prev) => {
            const newProgress = prev.progress + 10;
            if (newProgress >= 100) {
              clearInterval(interval);
              setIsReadyToProceed(true);
              return { ...prev, progress: 100, uploading: false };
            }
            return { ...prev, progress: newProgress };
          });
        }, 100);
      } catch (err) {
        console.error("Error parsing file", err);
        toast.error("Failed to parse the spreadsheet file.");
        setUploadState({ file: null, progress: 0, uploading: false });
      }
    };

    if (ext === "csv") {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleProceed = () => {
    navigate("/upload");
  };

  const resetFile = () => {
    setUploadState({ file: null, progress: 0, uploading: false });
    setIsReadyToProceed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    if (!uploadState.file) return <File className="text-purple-400" />;
    const fileExt = uploadState.file.name.split(".").pop()?.toLowerCase() || "";
    return ["csv", "xlsx", "xls"].includes(fileExt) ? (
      <FileSpreadsheet className="h-5 w-5 text-purple-400" />
    ) : (
      <File className="h-5 w-5 text-purple-400" />
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const { file, progress, uploading } = uploadState;

  return (
    <div className="flex items-center justify-center p-10 w-full max-w-lg">
      <form className="w-full" onSubmit={(e) => e.preventDefault()}>
        <h3 className="text-2xl font-bold text-purple-300 mb-6 tracking-wide drop-shadow-lg">
          Upload Spreadsheet
        </h3>

        <div
          className="flex justify-center rounded-lg border-2 border-dashed border-purple-700 bg-purple-900/30 px-6 py-14
                     hover:border-purple-500 hover:bg-purple-900/50
                     transition duration-300 ease-in-out cursor-pointer select-none"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
        >
          <div className="text-center">
            <File className="mx-auto h-16 w-16 text-purple-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.9)]" />
            <div className="flex justify-center mt-4 space-x-1 text-sm text-purple-300 font-semibold">
              <p>Drag and drop or</p>
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-purple-400 hover:text-purple-300 hover:underline transition"
              >
                choose file
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
              <p>to upload</p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-purple-400 text-center">
          Accepts: CSV, XLSX, XLS — Max size: 10MB
        </p>

        {file && (
          <Card className="relative mt-10 bg-purple-900/50 p-5 gap-4 shadow-lg ring-1 ring-purple-700/80">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 text-purple-300 hover:text-purple-100"
              onClick={resetFile}
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-purple-800 shadow-md ring-1 ring-inset ring-purple-600">
                {getFileIcon()}
              </span>
              <div>
                <p className="text-sm font-semibold text-purple-300 truncate max-w-xs">
                  {file?.name}
                </p>
                <p className="mt-1 text-xs text-purple-400">{formatFileSize(file.size)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-4">
              <Progress value={progress} className="h-2 rounded-full bg-purple-700" />
              <span className="text-xs text-purple-300 font-semibold">{progress}%</span>
            </div>
          </Card>
        )}

        <div className="mt-10 flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={resetFile}
            disabled={!file || uploading}
            className="text-purple-400 border-purple-500 hover:border-purple-400 hover:text-purple-300 transition"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleProceed}
            disabled={!isReadyToProceed}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-800 disabled:text-purple-500 transition"
          >
            Upload
          </Button>
        </div>
      </form>
    </div>
  );
}
