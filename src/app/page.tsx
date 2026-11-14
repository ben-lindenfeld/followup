"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Hourglass, CheckSquare, UserCheck, Phone, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { StatCard, Spinner, Badge, SampleBadge } from "@/components/ui";
import { fetchCustomers, fetchLeads, fetchTasks, fetchActivity, completeTask } from "@/lib/data";
import { ActivityLog, Customer, Lead, Task, formatDate, leadStatusLabel, priorityLabel, timeAgo } from "@/lib/types";
import AiAssistant from "@/components/AiAssistant";

export default function Dashboard() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, l, t, a] = await Promise.all([fetchCustomers(), fetchLeads(), fetchTasks(), fetchActivity(10)]);
      setCustomers(c); setLeads(l); setTasks(t); setActivity(a);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener("followup:data-changed", h); return () => window.removeEventListener("followup:data-changed", h); }, [load]);

  if (loading) return <Spinner text="טוען את הנתונים שלך..." />;

  const today = new Date().toDateString();
  const newLeads = leads.filter((l) => l.status === "new");
  const waiting = leads.filter((l) => l.status === "waiting");
  const todayTasks = tasks.filter((t) => !t.done && new Date(t.due_at).toDateString() === today);
  const activeCustomers = customers.filter((c) => c.status === "active");

  const handleToday = customers
    .filter((c) => c.next_follow_up && new Date(c.next_follow_up + "T23:59:59").getTime() <= Date.now() + 86400000 && c.status !== "inactive")
    .slice(0, 6);

  const customerLead = (cid: string) => leads.find((l) => l.customer_id === cid && !["closed_won", "irrelevant"].includes(l.status));

  return (
    <div className="anim-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">שלום, {profile?.owner_name || "שלום"}</h1>
        <p className="text-muted text-sm mt-0.5">הנה מה שקורה בעסק שלך היום.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <StatCard icon={Inbox} label="פניות חדשות" value={newLeads.length} color="#4F46E5" bg="#EEF2FF" />
        <StatCard icon={Hourglass} label="ממתינים לתשובה" value={waiting.length} color="#F59E0B" bg="#FEF3C7" />
        <StatCard icon={CheckSquare} label="משימות להיום" value={todayTasks.length} color="#0EA5E9" bg="#E0F2FE" />
        <StatCard icon={UserCheck} label="לקוחות פעילים" value={activeCustomers.length} color="#16A34A" bg="#DCFCE7" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <section className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">צריך לטפל היום</h2>
              <Link href="/tasks" className="text-xs text-primary font-medium">כל המשימות</Link>
            </div>
            {handleToday.length === 0 && todayTasks.length === 0 && (
              <div className="p-6 text-sm text-muted text-center">אין לקוחות שממתינים לחזרה היום 🎉</div>
            )}
            {handleToday.map((c) => {
              const lead = customerLead(c.id);
              const task = tasks.find((t) => t.customer_id === c.id && !t.done);
              return (
                <div key={c.id} className="px-5 py-3.5 border-b border-border last:border-0 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Link href={`/customer?id=${c.id}`} className="font-medium text-sm hover:text-primary">{c.full_name}</Link>
                      {c.is_sample && <SampleBadge />}
                    </div>
                    <div className="text-xs text-muted mt-0.5">{lead?.title ?? c.service_type ?? ""}</div>
                  </div>
                  {c.phone && <a href={`tel:${c.phone}`} className="text-xs text-muted flex items-center gap-1 hover:text-primary" dir="ltr"><Phone size={12} />{c.phone}</a>}
                  {c.next_follow_up && <div className="text-xs text-muted">{formatDate(c.next_follow_up)}</div>}
                  {task && <Badge label={priorityLabel(task.priority).label} color={priorityLabel(task.priority).color} bg={priorityLabel(task.priority).bg} />}
                  {task && (
                    <button className="btn btn-success-soft text-xs" onClick={async () => { await completeTask(task.id, task.title, task.customer_id); load(); }}>
                      <Check size={13} /> סמן כטופל
                    </button>
                  )}
                </div>
              );
            })}
          </section>

          <section className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">פניות אחרונות</h2>
              <Link href="/leads" className="text-xs text-primary font-medium">כל הפניות</Link>
            </div>
            {leads.length === 0 && <div className="p-6 text-sm text-muted text-center">עוד אין פניות</div>}
            {leads.slice(0, 5).map((l) => (
              <div key={l.id} className="px-5 py-3 border-b border-border last:border-0 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.title}</div>
                  <div className="text-xs text-muted">{l.customers?.full_name ?? "ללא שיוך"} · {timeAgo(l.received_at)}</div>
                </div>
                {l.is_sample && <SampleBadge />}
                <Badge label={leadStatusLabel(l.status).label} color={leadStatusLabel(l.status).color} bg={leadStatusLabel(l.status).bg} />
              </div>
            ))}
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">פעילות אחרונה</h2>
            </div>
            {activity.length === 0 && <div className="text-sm text-muted">עוד לא בוצעו פעולות</div>}
            <div className="flex flex-col gap-3">
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} className="flex gap-2.5 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="min-w-0">
                    <div className="leading-snug">{a.description}</div>
                    <div className="text-xs text-muted">{timeAgo(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button onClick={() => setAiOpen(true)} className="card p-5 text-right hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Sparkles size={17} className="text-primary" /> AI Assistant
            </div>
            <p className="text-xs text-muted leading-relaxed">נסח הודעות מעקב, סכם היסטוריית קשר ועוד — בלחיצה אחת.</p>
            <div className="text-[11px] text-warning mt-2">היכולת עדיין לא מחוברת</div>
          </button>
        </div>
      </div>
      <AiAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
