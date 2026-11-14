"use client";
import { ReactNode, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, LucideIcon } from "lucide-react";

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => dialogRef.current?.focus());
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key === "Tab") {
        const list = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]') ?? [])];
        const first=list[0], last=list[list.length-1];
        if(e.shiftKey && (document.activeElement===first || document.activeElement===dialogRef.current)){e.preventDefault();last?.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    document.addEventListener("keydown", key);
    return () => {cancelAnimationFrame(frame);document.body.style.overflow=prev;document.removeEventListener("keydown",key);before?.focus();};
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-[#20242B]/45 anim-fade-in" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={dialogRef} className={`outline-none anim-pop relative bg-surface w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-lg border border-border shadow-[0_8px_30px_rgba(20,24,33,.18)]`}>
        <div className="sticky top-0 bg-surface flex items-center justify-between px-5 py-3.5 border-b border-border rounded-t-xl z-10">
          <h2 id={titleId} className="font-semibold text-base">{title}</h2>
          <button aria-label="סגירה" onClick={onClose} className="p-1.5 rounded-md hover:bg-[#EEEFEC] text-muted transition-colors"><X size={17} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>, document.body
  );
}

export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className="badge" style={{ color, background: bg }}>{label}</span>;
}

export function SampleBadge() {
  return <span className="badge" style={{ color: "#505662", background: "#EFF0F2", borderStyle: "dashed", borderColor: "#C9CCD2" }}>דוגמה</span>;
}

export function Spinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
      <Loader2 className="animate-spin" size={22} />
      {text && <div className="text-sm">{text}</div>}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="anim-fade-in">
      <div className="skeleton h-6 w-40 mb-2" />
      <div className="skeleton h-4 w-64 mb-6" />
      <div className="skeleton h-10 w-full mb-4" />
      <div className="card p-0 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0">
            <div className="skeleton h-4 w-4 rounded-full" />
            <div className="skeleton h-4 flex-1 max-w-52" />
            <div className="skeleton h-4 w-24 mr-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, sub, action }: { icon: LucideIcon; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-1.5 text-center px-4">
      <div className="w-10 h-10 rounded-lg bg-[#F0F1EE] border border-border flex items-center justify-center text-muted mb-1.5"><Icon size={18} /></div>
      <div className="font-medium text-[16.5px]">{title}</div>
      {sub && <div className="text-sm text-muted max-w-xs leading-relaxed">{sub}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color, bg }: { icon: LucideIcon; label: string; value: number | string; color: string; bg: string }) {
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ color, background: bg }}><Icon size={16} /></div>
      <div className="min-w-0">
        <div className="text-lg font-bold leading-6">{value}</div>
        <div className="text-xs text-muted truncate">{label}</div>
      </div>
    </div>
  );
}

export function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-danger"> *</span>}</label>
      {children}
      {error && <div className="text-danger text-xs mt-1">{error}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div>
        <h1 className="text-lg font-bold">{title}</h1>
        {sub && <div className="text-[14.5px] text-muted mt-0.5">{sub}</div>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
