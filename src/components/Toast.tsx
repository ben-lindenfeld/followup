"use client";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

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
          <div key={t.id} className={`anim-fade-up pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white ${t.kind === "success" ? "bg-[#172033]" : "bg-danger"}`}>
            {t.kind === "success" ? <CheckCircle2 size={16} className="text-success" /> : <AlertCircle size={16} />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
