"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, CheckSquare, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { PageHeader, Spinner, Badge, SampleBadge, EmptyState } from "@/components/ui";
import { useToast } from "@/components/Toast";
import TaskModal from "@/components/TaskModal";
import { Task, formatDateTime, priorityLabel } from "@/lib/types";
import { fetchTasks, completeTask, deleteTask } from "@/lib/data";

type GroupKey = "overdue" | "today" | "tomorrow" | "later";
const GROUPS: { key: GroupKey; label: string }[] = [
  { key: "overdue", label: "באיחור" },
  { key: "today", label: "להיום" },
  { key: "tomorrow", label: "למחר" },
  { key: "later", label: "בהמשך" },
];

function groupOf(t: Task): GroupKey {
  const due = new Date(t.due_at);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 86400000);
  const startOfAfter = new Date(startOfToday.getTime() + 2 * 86400000);
  if (due < startOfToday) return "overdue";
  if (due < startOfTomorrow) return "today";
  if (due < startOfAfter) return "tomorrow";
  return "later";
}

export default function TasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  const load = useCallback(async () => {
    try { setTasks(await fetchTasks()); } catch (e) { console.error(e); toast("טעינה נכשלה", "error"); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener("followup:data-changed", h); return () => window.removeEventListener("followup:data-changed", h); }, [load]);

  const grouped = useMemo(() => {
    const map: Record<GroupKey, Task[]> = { overdue: [], today: [], tomorrow: [], later: [] };
    tasks.forEach((t) => map[groupOf(t)].push(t));
    return map;
  }, [tasks]);

  if (loading) return <Spinner />;

  return (
    <div className="anim-fade-up">
      <PageHeader title="משימות ומעקב" sub={`${tasks.length} משימות פתוחות`}>
        <button className="btn btn-primary text-sm" onClick={() => setModal({ open: true, task: null })}><Plus size={15} /> משימה חדשה</button>
      </PageHeader>

      {tasks.length === 0 ? (
        <div className="card"><EmptyState icon={CheckSquare} title="אין משימות פתוחות" sub="צור משימת מעקב כדי לא לשכוח לחזור ללקוח" action={<button className="btn btn-primary text-sm" onClick={() => setModal({ open: true, task: null })}><Plus size={15} /> משימה חדשה</button>} /></div>
      ) : (
        <div className="flex flex-col gap-6">
          {GROUPS.map((g) => {
            const items = grouped[g.key];
            if (!items.length) return null;
            return (
              <section key={g.key}>
                <div className="flex items-center gap-2 mb-2">
                  {g.key === "overdue" && <AlertTriangle size={15} className="text-danger" />}
                  <h2 className={`font-semibold text-sm ${g.key === "overdue" ? "text-danger" : ""}`}>{g.label}</h2>
                  <span className="text-xs text-muted">{items.length}</span>
                </div>
                <div className="card divide-y divide-border">
                  {items.map((t) => {
                    const p = priorityLabel(t.priority);
                    return (
                      <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${g.key === "overdue" ? "bg-danger-soft/30" : ""}`}>
                        <button
                          className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-success hover:bg-success-soft shrink-0 transition-colors"
                          title="סמן כהושלם"
                          onClick={async () => { await completeTask(t.id, t.title, t.customer_id); toast("המשימה הושלמה"); load(); }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${g.key === "overdue" ? "text-danger" : ""}`}>{t.title}</span>
                            {t.is_sample && <SampleBadge />}
                          </div>
                          <div className="text-xs text-muted mt-0.5">
                            {formatDateTime(t.due_at)}
                            {t.customers?.full_name ? ` · ${t.customers.full_name}` : ""}
                            {t.description ? ` · ${t.description}` : ""}
                          </div>
                        </div>
                        <Badge label={p.label} color={p.color} bg={p.bg} />
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-muted" onClick={() => setModal({ open: true, task: t })}><Pencil size={15} /></button>
                        <button className="p-1.5 rounded-lg hover:bg-danger-soft text-muted hover:text-danger" onClick={async () => { await deleteTask(t.id); load(); }}><Trash2 size={15} /></button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <TaskModal open={modal.open} task={modal.task} onClose={() => setModal({ open: false, task: null })} onSaved={() => { setModal({ open: false, task: null }); load(); }} />
    </div>
  );
}
