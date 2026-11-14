"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Phone, Mail, MapPin, Pencil, Plus, ArrowRight, StickyNote, Inbox, CheckSquare, History } from "lucide-react";
import { Spinner, PageSkeleton, Badge, SampleBadge } from "@/components/ui";
import { useToast } from "@/components/Toast";
import CustomerModal from "@/components/CustomerModal";
import LeadModal from "@/components/LeadModal";
import TaskModal from "@/components/TaskModal";
import { getSupabase } from "@/lib/supabase";
import { fetchNotes, addNote, fetchTasks, completeTask } from "@/lib/data";
import { ActivityLog, Customer, Lead, Note, Task, customerStatusLabel, formatDate, formatDateTime, leadStatusLabel, leadSourceLabel, priorityLabel, timeAgo } from "@/lib/types";

function CustomerProfileInner() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.get("id");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError,setLoadError]=useState(false);
  const [busyId,setBusyId]=useState<string|null>(null);
  const [newNote, setNewNote] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) {router.replace("/customers");return;}
    setLoadError(false);
    try {
    const sb = getSupabase();
    const { data: c, error: customerError } = await sb.from("customers").select("*").eq("id", id).maybeSingle();
    if(customerError)throw customerError;
    if (!c) { router.replace("/customers"); return; }
    setCustomer(c);
    const [{ data: l }, n, t, { data: a }] = await Promise.all([
      sb.from("leads").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      fetchNotes(id),
      fetchTasks(),
      sb.from("activity_logs").select("*").eq("customer_id", id).order("created_at", { ascending: false }).limit(20),
    ]);
    setLeads(l ?? []); setNotes(n); setTasks(t.filter((x) => x.customer_id === id)); setActivity(a ?? []);
    }catch{setLoadError(true);}
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener("followup:data-changed", h); return () => window.removeEventListener("followup:data-changed", h); }, [load]);

  const saveNote=async()=>{if(!customer||!newNote.trim()||busyId)return;setBusyId("note");try{await addNote(customer.id,newNote.trim());setNewNote("");await load();toast("ההערה נשמרה");}catch{toast("ההערה לא נשמרה. נסה שוב.","error");}finally{setBusyId(null);}};
  if (loading) return <PageSkeleton />;
  if(loadError)return <div className="card p-5 text-sm">לא הצלחנו לטעון את פרטי הלקוח. <button className="btn btn-outline" onClick={()=>load()}>נסה שוב</button></div>;
  if (!customer) return null;

  const status = customerStatusLabel(customer.status);

  return (
    <div className="anim-fade-up">
      <button onClick={() => router.push("/customers")} className="text-sm text-muted hover:text-primary flex items-center gap-1 mb-4"><ArrowRight size={15} /> חזרה ללקוחות</button>

      <div className="card p-5 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary-soft text-primary flex items-center justify-center font-bold text-lg">{customer.full_name[0]}</div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-bold text-lg">{customer.full_name}</h1>
                {customer.is_sample && <SampleBadge />}
                <Badge label={status.label} color={status.color} bg={status.bg} />
              </div>
              <div className="text-xs text-muted mt-0.5">לקוח מ-{formatDate(customer.created_at)} · קשר אחרון: {formatDate(customer.last_contact_at)}</div>
            </div>
          </div>
          <button className="btn btn-outline text-sm" onClick={() => setEditOpen(true)}><Pencil size={14} /> עריכה</button>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
          {customer.phone && <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-primary font-medium" dir="ltr"><Phone size={14} />{customer.phone}</a>}
          {customer.email && <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 text-muted hover:text-primary" dir="ltr"><Mail size={14} />{customer.email}</a>}
          {customer.address && <span className="flex items-center gap-1.5 text-muted"><MapPin size={14} />{customer.address}</span>}
          {customer.service_type && <span className="text-muted">שירות: {customer.service_type}</span>}
          {customer.next_follow_up && <span className="text-muted">חזרה הבאה: {formatDate(customer.next_follow_up)}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><Inbox size={16} className="text-primary" /> היסטוריית פניות</h2>
            <button className="btn btn-outline text-xs" onClick={() => setLeadOpen(true)}><Plus size={13} /> פנייה</button>
          </div>
          {leads.length === 0 && <div className="text-sm text-muted">אין פניות עדיין</div>}
          <div className="flex flex-col gap-2">
            {leads.map((l) => (
              <div key={l.id} className="p-3 rounded-lg bg-bg border border-border">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{l.title}</span>
                  <Badge label={leadStatusLabel(l.status).label} color={leadStatusLabel(l.status).color} bg={leadStatusLabel(l.status).bg} />
                </div>
                <div className="text-xs text-muted mt-1">{leadSourceLabel(l.source)} · {timeAgo(l.received_at)}{l.next_follow_up ? ` · מעקב: ${formatDate(l.next_follow_up)}` : ""}</div>
                {l.description && <div className="text-xs mt-1.5 leading-relaxed">{l.description}</div>}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><CheckSquare size={16} className="text-primary" /> משימות פתוחות</h2>
            <button className="btn btn-outline text-xs" onClick={() => setTaskOpen(true)}><Plus size={13} /> משימה</button>
          </div>
          {tasks.length === 0 && <div className="text-sm text-muted">אין משימות פתוחות</div>}
          <div className="flex flex-col gap-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg border border-border">
                <button className="w-5 h-5 rounded-md border-2 border-[#C9CCD2] hover:border-success hover:bg-success-soft shrink-0" title="סמן כהושלם" disabled={busyId===t.id} onClick={async () => {setBusyId(t.id);try{await completeTask(t.id, t.title, t.customer_id);toast("המשימה הושלמה");await load();}catch{toast("המשימה לא סומנה. נסה שוב.","error");}finally{setBusyId(null);}}} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted">{formatDateTime(t.due_at)}</div>
                </div>
                <Badge label={priorityLabel(t.priority).label} color={priorityLabel(t.priority).color} bg={priorityLabel(t.priority).bg} />
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><StickyNote size={16} className="text-primary" /> הערות</h2>
          <div className="flex gap-2 mb-3">
            <input className="input" placeholder="הוסף הערה..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={async (e) => {
              if (e.key === "Enter") saveNote();
            }} />
            <button className="btn btn-primary shrink-0" aria-label="שמור הערה" disabled={busyId==="note"} onClick={saveNote}><Plus size={15} /></button>
          </div>
          <div className="flex flex-col gap-2">
            {notes.map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-warning-soft/60 border border-warning/20 text-sm">
                <div className="leading-relaxed">{n.body}</div>
                <div className="text-xs text-muted mt-1">{timeAgo(n.created_at)}</div>
              </div>
            ))}
            {notes.length === 0 && <div className="text-sm text-muted">אין הערות</div>}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><History size={16} className="text-primary" /> היסטוריית פעולות</h2>
          {activity.length === 0 && <div className="text-sm text-muted">אין פעולות מתועדות</div>}
          <div className="flex flex-col gap-3">
            {activity.map((a) => (
              <div key={a.id} className="flex gap-2.5 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <div className="leading-snug">{a.description}</div>
                  <div className="text-xs text-muted">{timeAgo(a.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CustomerModal open={editOpen} customer={customer} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load(); }} />
      <LeadModal open={leadOpen} presetCustomerId={customer.id} onClose={() => setLeadOpen(false)} onSaved={() => { setLeadOpen(false); load(); }} />
      <TaskModal open={taskOpen} presetCustomerId={customer.id} onClose={() => setTaskOpen(false)} onSaved={() => { setTaskOpen(false); load(); }} />
    </div>
  );
}

export default function CustomerProfile() {
  return <Suspense fallback={<Spinner />}><CustomerProfileInner /></Suspense>;
}
