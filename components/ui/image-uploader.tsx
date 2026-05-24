"use client";

import React, { useState, useRef, DragEvent } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  className?: string;
}

export function ImageUploader({ onUploadSuccess, className }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP, or GIF).");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("File is too large. Image must be smaller than 4MB.");
      return;
    }

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUploadSuccess(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "group relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ease-in-out",
          isDragging
            ? "border-gold bg-gold/5 scale-[1.01]"
            : "border-gray-200 hover:border-gold hover:bg-gold/[0.02]",
          isUploading ? "pointer-events-none opacity-70 bg-gray-50/50" : ""
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          {isUploading ? (
            <>
              <div className="rounded-full bg-gold/10 p-3 animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-navy">Uploading to Vercel Blob...</p>
                <p className="text-xs text-gray-500">Your secure image URL will be ready shortly.</p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-gray-50 p-3 group-hover:bg-gold/10 transition-colors duration-300">
                <UploadCloud className="h-8 w-8 text-gray-400 group-hover:text-gold transition-colors duration-300" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-navy">
                  Drag & drop image or{" "}
                  <span className="text-gold font-bold group-hover:underline">browse files</span>
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP, or GIF up to 4MB</p>
              </div>
            </>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 rounded-md px-3 py-1.5 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
}
