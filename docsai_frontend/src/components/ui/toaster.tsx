"use client";

import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm animate-in fade-in slide-in-from-bottom-4 ${
            t.variant === "destructive"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-white border-black/10 text-[#0f0e0c]"
          }`}
        >
          <div className="flex-1">
            {t.title && <p className="font-medium">{t.title}</p>}
            {t.description && (
              <p className="text-xs opacity-70 mt-0.5">{t.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
