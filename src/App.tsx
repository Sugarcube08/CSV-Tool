"use client";

import { File, FileSpreadsheet, X, UploadCloud } from "lucide-react";
import { useRef, useState, ChangeEvent, DragEvent } from "react";
import { toast } from "sonner";

import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Progress } from "./components/ui/progress";

import { Link } from "react-router";

export default function FileUploadUI() {
  const [uploadState, setUploadState] = useState<{
    file: File | null;
    progress: number;
    uploading: boolean;
  }>({
    file: null,
    progress: 0,
    uploading: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validFileTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const handleFile = (file?: File) => {
    if (!file) return;

    if (!validFileTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a CSV, XLSX, or XLS file.", {
        position: "bottom-right",
        duration: 3000,
      });
      return;
    }

    setUploadState({ file, progress: 0, uploading: true });

    const interval = setInterval(() => {
      setUploadState((prev) => {
        const newProgress = prev.progress + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          return { ...prev, progress: 100, uploading: false };
        }
        return { ...prev, progress: newProgress };
      });
    }, 200);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const resetFile = () => {
    setUploadState({ file: null, progress: 0, uploading: false });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    if (!uploadState.file) return <File />;
    const ext = uploadState.file.name.split(".").pop()?.toLowerCase();
    return ["csv", "xlsx", "xls"].includes(ext || "")
      ? <FileSpreadsheet className="h-5 w-5 text-foreground" />
      : <File className="h-5 w-5 text-foreground" />;
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
    <div className="min-h-screen bg-[#0C102E] flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-4xl bg-[#11152f] p-8 rounded-xl shadow-xl border border-[#1c2142]">
        <h2 className="text-2xl font-semibold mb-6 text-center">Upload Your File</h2>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center gap-3 px-6 py-10 border-2 border-dashed border-[#2b315a] rounded-md bg-[#10142d] transition-colors hover:border-primary"
        >
          <UploadCloud className="w-12 h-12 text-muted-foreground mb-1" />
          <p className="text-sm text-muted-foreground">
            Drag and drop your file here or{" "}
            <label htmlFor="file-upload" className="text-primary cursor-pointer underline hover:opacity-80">
              browse
              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </label>
          </p>
          <span className="text-xs text-muted-foreground mt-1">
            Accepted: .csv, .xlsx, .xls | Max size: 10MB
          </span>
        </div>

        {file && (
          <Card className="relative mt-6 p-4 bg-[#1a1f3c] border border-[#2b315a] rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-white"
              onClick={resetFile}
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center bg-[#0d122b] rounded shadow-inner ring-1 ring-inset ring-border">
                {getFileIcon()}
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-white truncate max-w-[200px]">
                  {file.name}
                </p>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Progress value={progress} className="h-2" />
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          </Card>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={resetFile}
            disabled={!file}
            className="disabled:opacity-50"
          >
            Cancel
          </Button>

          <Link to={"/upload"}>
            <Button
              type="submit"
              disabled={!file || uploading || progress < 100}
              className="disabled:opacity-50"
            >
              Open DataSheet
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
