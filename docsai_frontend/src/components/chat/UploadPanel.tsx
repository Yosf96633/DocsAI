"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { ingestDocument, readSSEStream } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface UploadPanelProps {
  threadId: string;
  onSuccess: (docName: string, docType: string, totalChunks: number) => void;
}

export default function UploadPanel({ threadId, onSuccess }: UploadPanelProps) {
  const { toast } = useToast();
  const { ingestionStatus, addIngestionStatus, clearIngestionStatus } = useChatStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rejected, setRejected] = useState<{ message: string; reason: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File) => {
    if (f.type !== "application/pdf") {
      toast({ title: "Only PDFs allowed", variant: "destructive" });
      return false;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "Max file size is 10MB", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setRejected(null);
    clearIngestionStatus();

    try {
      const res = await ingestDocument(threadId, file);
      await readSSEStream(res, (event) => {
        if (event.type === "status") {
          addIngestionStatus(event.message as string);
        } else if (event.type === "llm_check") {
          addIngestionStatus(
            `📋 ${event.document_type} detected — confidence: ${event.confidence}`
          );
        } else if (event.type === "rejected") {
          setRejected({
            message: event.message as string,
            reason: event.reason as string,
          });
          setUploading(false);
        } else if (event.type === "done") {
          addIngestionStatus(event.message as string);
          setTimeout(() => {
            onSuccess(file.name, "Legal Document", event.total_chunks as number);
          }, 1500);
        }
      });
    } catch (err: unknown) {
      const e = err as { detail?: string };
      toast({
        title: "Upload failed",
        description: e?.detail ?? "Something went wrong",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <h2 className="font-serif text-2xl text-[#0f0e0c] mb-1.5 text-center">
          Upload your legal document
        </h2>
        <p className="text-sm text-[#5a5852] text-center mb-8">
          PDF only · Max 10MB · Must be a legal or compliance document
        </p>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragging
              ? "border-[#2d5a3d] bg-[#2d5a3d]/5"
              : "border-black/15 hover:border-black/30 hover:bg-black/2"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText size={32} className="text-[#2d5a3d]" />
              <p className="font-medium text-sm text-[#0f0e0c]">{file.name}</p>
              <p className="text-xs text-[#9a9690]">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-[#9a9690]" />
              <p className="text-sm text-[#5a5852]">
                <span className="font-medium text-[#0f0e0c]">Drag & drop</span> or click to browse
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full mt-4 py-3 rounded-xl bg-[#2d5a3d] text-white text-sm font-medium hover:bg-[#4a8a5f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading && <Loader2 size={15} className="animate-spin" />}
          {uploading ? "Analyzing..." : "Upload & Analyze"}
        </button>

        {/* Rejection */}
        {rejected && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-600 font-medium text-sm mb-1">
              <XCircle size={15} />
              {rejected.message}
            </div>
            <p className="text-xs text-red-500">{rejected.reason}</p>
          </div>
        )}

        {/* Progress */}
        <AnimatePresence>
          {ingestionStatus.length > 0 && (
            <div className="mt-6 space-y-2">
              {ingestionStatus.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center gap-2.5 text-sm text-[#5a5852]"
                >
                  {i === ingestionStatus.length - 1 && uploading ? (
                    <Loader2 size={14} className="animate-spin text-[#2d5a3d] flex-shrink-0" />
                  ) : (
                    <CheckCircle size={14} className="text-[#2d5a3d] flex-shrink-0" />
                  )}
                  {msg}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
