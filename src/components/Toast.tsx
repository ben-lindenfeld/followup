"use client";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Toast { id: number; text: string; kind: "success" | "error"; }
const Ctx = createContext<(text: string, kind?: "success" | "error") => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`anim-pop pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium ${
            t.kind === "success"
              ? "bg-surface border-border text-ink shadow-[0_4px_16px_rgba(20,24,33,.10)]"
              : "bg-surface border-danger/40 text-danger shadow-[0_4px_16px_rgba(20,24,33,.10)]"
          }`}>
            {t.kind === "success" ? <CheckCircle2 size={16} className="text-success" /> : <AlertCircle size={16} />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
