import React, { useState } from "react";
import Papa from "papaparse";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CSVReaderProps {
  onFileLoaded: (data: any[], file: File) => void;
  onError?: (error: string) => void;
  accept?: string;
  className?: string;
}

export function CSVReader({
  onFileLoaded,
  onError,
  accept = ".csv",
  className,
}: CSVReaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    const incrementProgress = () => {
      setUploadProgress((prev) => {
        const increment = Math.floor(Math.random() * 15) + 10;
        return Math.min(prev + increment, 95);
      });
    };

    // Start progress simulation
    const progressInterval = setInterval(incrementProgress, 200);

    Papa.parse(file, {
      header: true,
      delimiter: ";", // Using semicolon as delimiter for Brazilian CSVs
      skipEmptyLines: true,
      dynamicTyping: true,
      encoding: "UTF-8",
      complete: (results) => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (results.errors.length > 0) {
          const errorMsg = `Error parsing CSV: ${results.errors[0].message}`;
          setError(errorMsg);
          if (onError) onError(errorMsg);
        } else {
          onFileLoaded(results.data, file);
        }
        
        setTimeout(() => {
          setIsLoading(false);
          setUploadProgress(0);
        }, 1000);
      },
      error: (error) => {
        clearInterval(progressInterval);
        const errorMsg = `Error parsing CSV: ${error.message}`;
        setError(errorMsg);
        if (onError) onError(errorMsg);
        setIsLoading(false);
        setUploadProgress(0);
      },
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        processFile(file);
      } else {
        const errorMsg = "Please upload a CSV file";
        setError(errorMsg);
        if (onError) onError(errorMsg);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Upload CSV File</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border bg-background hover:bg-accent/10",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <div className="w-full">
              <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Processing file...
              </p>
              <Progress value={uploadProgress} className="h-2 w-full" />
            </div>
          ) : error ? (
            <div>
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                onClick={handleButtonClick}
                className="mt-4"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div>
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop a CSV file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supports: pedidosXXX.csv, adsXXX.csv
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleButtonClick}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Select File"}
        </Button>
      </CardFooter>
    </Card>
  );
}
