"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronLeft, CalendarDays } from "lucide-react";
import { PageSkeleton, PageHeader, Spinner, EmptyState } from "@/components/ui";
import TaskModal from "@/components/TaskModal";
import { Task, priorityLabel } from "@/lib/types";
import { fetchTasks, fetchCustomers } from "@/lib/data";
import { Customer } from "@/lib/types";

const HEB_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HEB_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError,setLoadError]=useState(false);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [view, setView] = useState<"month" | "week">("month");
  const [weekStart, setWeekStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d; });
  const [customerFilter, setCustomerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<{ open: boolean; task: Task | null; date?: string }>({ open: false, task: null });

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [t, c] = await Promise.all([fetchTasks(true), fetchCustomers()]);
      setTasks(t); setCustomers(c);
    } catch (e) { console.error(e);setLoadError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener("followup:data-changed", h); return () => window.removeEventListener("followup:data-changed", h); }, [load]);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (customerFilter && t.customer_id !== customerFilter) return false;
    if (statusFilter === "done" && !t.done) return false;
    if (statusFilter === "open" && t.done) return false;
    return true;
  }), [tasks, customerFilter, statusFilter]);

  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    filtered.forEach((t) => {
      const k = dayKey(new Date(t.due_at));
      m.set(k, [...(m.get(k) ?? []), t]);
    });
    return m;
  }, [filtered]);

  if (loading) return <PageSkeleton />;
  if(loadError)return <div className="card p-5 text-sm">לא הצלחנו לטעון את לוח השנה. <button className="btn btn-outline mr-2" onClick={()=>{setLoading(true);load();}}>נסה שוב</button></div>;

  const renderDayCell = (d: Date, inMonth: boolean) => {
    const k = dayKey(d);
    const dayTasks = (byDay.get(k) ?? []).sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
    const isToday = k === dayKey(new Date());
    return (
      <div
        key={k}
        onClick={() => setModal({ open: true, task: null, date: k })}
        className={`min-h-[86px] md:min-h-[110px] ${!inMonth ? "" : ""} p-1.5 border border-border rounded-lg cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary-soft/20 ${inMonth ? "bg-white" : "bg-[#F1F1EF]/60 opacity-50"}`}
      >
        <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-primary text-white" : ""}`}>{d.getDate()}</div>
        <div className="flex flex-col gap-1">
          {dayTasks.slice(0, view === "week" ? 20 : 3).map((t) => {
            const p = priorityLabel(t.priority);
            return (
              <button
                key={t.id}
                onClick={(e) => { e.stopPropagation(); setModal({ open: true, task: t }); }}
                className={`text-[11px] text-right rounded-lg px-1.5 py-1 leading-tight truncate ${t.done ? "line-through opacity-50" : ""}`}
                style={{ background: p.bg, color: p.color }}
                title={t.title}
              >
                {new Date(t.due_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })} {t.title}
              </button>
            );
          })}
          {view === "month" && dayTasks.length > 3 && <div className="text-[10px] text-muted px-1">+{dayTasks.length - 3} נוספות</div>}
        </div>
      </div>
    );
  };

  const monthCells = () => {
    const first = new Date(cursor);
    const start = new Date(first); start.setDate(1 - first.getDay());
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); cells.push(d); }
    return cells;
  };

  const weekCells = () => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });

  return (
    <div className="anim-fade-up">
      <PageHeader title="לוח שנה" sub="כל משימות המעקב במקום אחד">
        <select className="input !w-auto text-sm" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
          <option value="">כל הלקוחות</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
        <select className="input !w-auto text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">הכל</option>
          <option value="open">פתוחות</option>
          <option value="done">הושלמו</option>
        </select>
        <div className="flex bg-white border border-border rounded-lg p-0.5">
          <button onClick={() => setView("month")} className={`px-3 py-1.5 rounded-lg text-sm ${view === "month" ? "bg-primary-soft text-primary" : "text-muted"}`}>חודשי</button>
          <button onClick={() => setView("week")} className={`px-3 py-1.5 rounded-lg text-sm ${view === "week" ? "bg-primary-soft text-primary" : "text-muted"}`}>שבועי</button>
        </div>
      </PageHeader>

      <div className="flex items-center justify-between mb-3">
        <button className="btn btn-ghost !p-2" onClick={() => {
          if (view === "month") { const d = new Date(cursor); d.setMonth(d.getMonth() - 1); setCursor(d); }
          else { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }
        }}><ChevronRight size={18} /></button>
        <div className="font-semibold">
          {view === "month" ? `${HEB_MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}` : `שבוע של ${weekCells()[0].getDate()}–${weekCells()[6].getDate()} ב${HEB_MONTHS[weekCells()[6].getMonth()]}`}
        </div>
        <button className="btn btn-ghost !p-2" onClick={() => {
          if (view === "month") { const d = new Date(cursor); d.setMonth(d.getMonth() + 1); setCursor(d); }
          else { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }
        }}><ChevronLeft size={18} /></button>
      </div>

      <div className="hidden sm:grid grid-cols-7 gap-1.5 mb-1">
        {HEB_DAYS.map((d) => <div key={d} className="text-center text-xs text-muted font-medium py-1">{d}</div>)}
      </div>
      <div className="hidden sm:grid grid-cols-7 gap-1.5">
        {view === "month" ? monthCells().map((d) => renderDayCell(d, d.getMonth() === cursor.getMonth())) : weekCells().map((d) => renderDayCell(d, true))}
      </div>

      <div className="sm:hidden card overflow-hidden">{(view==="month"?monthCells().filter(d=>d.getMonth()===cursor.getMonth()):weekCells()).map(d=>{
        const key=dayKey(d), list=(byDay.get(key)||[]).slice().sort((a,b)=>a.due_at.localeCompare(b.due_at));
        return <section key={key} className="border-b border-border last:border-0"><div className="flex items-center justify-between px-3 py-2 bg-bg"><span className={`text-xs font-medium ${key===dayKey(new Date())?"text-primary":"text-muted"}`}>{d.toLocaleDateString("he-IL",{weekday:"short",day:"numeric",month:"short"})}{key===dayKey(new Date())?" · היום":""}</span><button className="btn btn-ghost !p-1 text-xs" onClick={()=>setModal({open:true,task:null,date:key})}>+ משימה</button></div>{list.map(t=><button key={t.id} className="w-full text-right px-3 py-2.5 flex gap-3 items-start border-t border-border hover:bg-bg" onClick={()=>setModal({open:true,task:t})}><span className="text-xs text-muted pt-0.5 shrink-0">{new Date(t.due_at).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})}</span><span className={`text-sm break-words ${t.done?"line-through text-muted":""}`}>{t.title}</span></button>)}</section>;
      })}</div>
      {filtered.length === 0 && <div className="card mt-4"><EmptyState icon={CalendarDays} title="אין משימות להצגה" sub="לחץ על יום כדי להוסיף משימת מעקב" /></div>}

      <TaskModal open={modal.open} task={modal.task} presetDate={modal.date} onClose={() => setModal({ open: false, task: null })} onSaved={() => { setModal({ open: false, task: null }); load(); }} />
    </div>
  );
}
