"use client";
import { ReactNode } from "react";
import { X, Loader2, LucideIcon } from "lucide-react";

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-[#172033]/40 anim-fade-in" onClick={onClose} />
      <div className={`anim-fade-up relative bg-white w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl`}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-border rounded-t-2xl">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-muted"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className="badge" style={{ color, background: bg }}>{label}</span>;
}

export function SampleBadge() {
  return <span className="badge" style={{ color: "#9333EA", background: "#F3E8FF" }}>דוגמה</span>;
}

export function Spinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
      <Loader2 className="animate-spin" size={26} />
      {text && <div className="text-sm">{text}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, sub, action }: { icon: LucideIcon; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-2 text-center">
      <div className="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center text-primary mb-1"><Icon size={22} /></div>
      <div className="font-medium">{title}</div>
      {sub && <div className="text-sm text-muted max-w-xs">{sub}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color, bg }: { icon: LucideIcon; label: string; value: number | string; color: string; bg: string }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ color, background: bg }}><Icon size={19} /></div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-7">{value}</div>
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
        <h1 className="text-xl font-bold">{title}</h1>
        {sub && <div className="text-sm text-muted mt-0.5">{sub}</div>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
