"use client";

import { useState, useCallback } from "react";

export type ToastVariant = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let memToasts: Toast[] = [];

function dispatch(toasts: Toast[]) {
  memToasts = toasts;
  listeners.forEach((l) => l(toasts));
}

export function toast(t: Omit<Toast, "id">) {
  const id = crypto.randomUUID();
  const next = [...memToasts, { ...t, id }];
  dispatch(next);
  setTimeout(() => {
    dispatch(memToasts.filter((x) => x.id !== id));
  }, 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memToasts);

  const subscribe = useCallback((setter: (t: Toast[]) => void) => {
    listeners.push(setter);
    return () => {
      listeners = listeners.filter((l) => l !== setter);
    };
  }, []);

  useState(() => {
    const unsub = subscribe(setToasts);
    return unsub;
  });

  return { toasts, toast };
}
