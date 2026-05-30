"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const MAX_SIZE_MB = 10;

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.receipts.generateUploadUrl);
  const createReceipt = useMutation(api.receipts.create);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileType = file.type || "image/jpeg";
        if (!ACCEPTED_TYPES.includes(fileType)) {
          setError(`Type non supporté: ${file.name}. Acceptés: JPG, PNG, WEBP, GIF, PDF`);
          continue;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setError(`Fichier trop grand: ${file.name} (max ${MAX_SIZE_MB}MB)`);
          continue;
        }

        const uploadUrl = await generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": fileType },
          body: file,
        });

        if (!uploadResponse.ok) throw new Error("Erreur lors de l'upload");

        const { storageId } = await uploadResponse.json();
        await createReceipt({ storageId, fileName: file.name || "photo.jpg", fileType });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  function onDragOver(e: DragEvent) { e.preventDefault(); setIsDragging(true); }
  function onDragLeave(e: DragEvent) { e.preventDefault(); setIsDragging(false); }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }
  function onChange(e: ChangeEvent<HTMLInputElement>) { handleFiles(e.target.files); }

  return (
    <div className="w-full space-y-3">
      {/* Drag & drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 cursor-pointer transition-all ${uploading ? "pointer-events-none opacity-60" : ""} ${isDragging ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-emerald-600 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}`}
        style={isDragging ? {} : { background: "var(--bg-card)" }}
      >
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(",")} multiple onChange={onChange} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>Upload en cours…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
              <svg className="w-4.5 h-4.5" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Glissez ici ou <span style={{ color: "var(--accent)" }}>parcourez</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>JPG, PNG, WEBP, PDF — max {MAX_SIZE_MB}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Camera button — outlined comme le bouton Rapport */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50 border-2 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-black"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Prendre une photo
      </button>

      {error && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-3 py-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
