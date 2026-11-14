"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Check, Sparkles, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/components/AuthProvider";
import { Spinner, Badge, SampleBadge, PageSkeleton } from "@/components/ui";
import { fetchCustomers, fetchLeads, fetchTasks, fetchActivity, completeTask } from "@/lib/data";
import { ActivityLog, Customer, Lead, Task, formatDate, leadStatusLabel, priorityLabel, timeAgo } from "@/lib/types";
import AiAssistant from "@/components/AiAssistant";

export default function Dashboard() {
  const { profile } = useAuth();
  const toast=useToast();
  const [busyId,setBusyId]=useState<string|null>(null);
  const [loadError,setLoadError]=useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(false);
      const [c, l, t, a] = await Promise.all([fetchCustomers(), fetchLeads(), fetchTasks(), fetchActivity(10)]);
      setCustomers(c); setLeads(l); setTasks(t); setActivity(a);
    } catch (e) { console.error(e);setLoadError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener("followup:data-changed", h); return () => window.removeEventListener("followup:data-changed", h); }, [load]);

  if (loading) return <PageSkeleton />;
  if(loadError)return <div className="card p-6"><p className="mb-3">לא הצלחנו לטעון את לוח הבקרה. נסה שוב בעוד רגע.</p><button className="btn btn-outline" onClick={load}>נסה שוב</button></div>;

  const today = new Date().toDateString();
  const newLeads = leads.filter((l) => l.status === "new");
  const waiting = leads.filter((l) => l.status === "waiting");
  const todayTasks = tasks.filter((t) => !t.done && new Date(t.due_at).toDateString() === today);
  const activeCustomers = customers.filter((c) => c.status === "active");

  const endToday=new Date();endToday.setHours(23,59,59,999);
  const dueTasks=tasks.filter(t=>!t.done&&new Date(t.due_at)<=endToday).sort((a,b)=>new Date(a.due_at).getTime()-new Date(b.due_at).getTime());
  const dueCustomers=customers.filter(c=>c.next_follow_up&&c.next_follow_up<=`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(new Date().getDate()).padStart(2,"0")}`&&c.status!=="inactive"&&!dueTasks.some(t=>t.customer_id===c.id));
  const actions=[...dueTasks.map(t=>({key:t.id,customer:customers.find(c=>c.id===t.customer_id),task:t,title:t.title,when:new Date(t.due_at).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"}),late:new Date(t.due_at)<new Date(),status:new Date(t.due_at)<new Date()?"באיחור":"להיום"})),...dueCustomers.map(c=>({key:c.id,customer:c,task:null,title:leads.find(l=>l.customer_id===c.id&&!['closed_won','irrelevant'].includes(l.status))?.title||"לחזור ללקוח",when:formatDate(c.next_follow_up),late:!!c.next_follow_up&&c.next_follow_up<`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(new Date().getDate()).padStart(2,"0")}`,status:"ממתין לחזרה"}))];

  const dateLine = new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });

  const summary: { n: number; label: string; href: string }[] = [
    { n: newLeads.length, label: "פניות חדשות", href: "/leads" },
    { n: waiting.length, label: "ממתינים לתשובה", href: "/leads" },
    { n: todayTasks.length, label: "משימות להיום", href: "/tasks" },
    { n: activeCustomers.length, label: "לקוחות פעילים", href: "/customers" },
  ];

  return (
    <div>
      {/* Work header */}
      <div className="mb-5">
        <div className="text-[13px] text-muted">{dateLine}</div>
        <h1 className="text-[22px] font-bold mt-0.5">{profile?.owner_name ? `שלום, ${profile.owner_name}` : "שלום"}</h1>
      </div>

      {/* Business state strip */}
      <div className="card mb-6 px-2 py-1 flex flex-wrap">
        {summary.map((s, i) => (
          <Link key={s.label} href={s.href} className={`flex items-baseline gap-2 px-4 py-2.5 hover:bg-[#F6F6F4] rounded-lg transition-colors ${i > 0 ? "border-r border-border" : ""}`}>
            <span className="text-lg font-bold leading-none">{s.n}</span>
            <span className="text-[13px] text-muted">{s.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Today's work */}
          <section className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-[15px]">מה דורש טיפול היום</h2>
              <Link href="/tasks" className="text-xs text-primary font-medium hover:underline">כל המשימות</Link>
            </div>
            {actions.length===0?<div className="p-8 text-sm text-muted text-center">אין משימות או חזרות פתוחות להיום. אפשר להוסיף משימה חדשה בלוח המשימות.</div>:<><div className="hidden sm:grid grid-cols-[1fr_1.4fr_.8fr_.7fr_auto] gap-3 px-5 py-2 text-xs text-muted bg-bg border-b border-border"><span>לקוח</span><span>מה צריך לעשות</span><span>מועד</span><span>סטטוס</span><span>המשך</span></div>{actions.map(a=><div key={a.key} className="px-4 sm:px-5 py-3 border-b border-border last:border-0 grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_.8fr_.7fr_auto] items-center gap-2 sm:gap-3 hover:bg-[#FAFAF8]"><div className="text-sm font-medium flex items-center gap-1 flex-wrap">{a.customer?<Link className="hover:text-primary" href={`/customer?id=${a.customer.id}`}>{a.customer.full_name}</Link>:<span className="text-muted">משימה כללית</span>}{a.customer?.is_sample&&<SampleBadge/>}</div><div className="text-sm">{a.title}</div><div className="text-xs text-muted">{a.task?formatDate(a.task.due_at)+" · ":""}{a.when}</div><div><Badge label={a.status} color={a.late?"#BE3B32":"#6E7480"} bg={a.late?"#F8E6E3":"#EFF0F2"}/></div><div className="flex gap-1 items-center">{a.task?<button title="סמן כהושלם" disabled={busyId===a.key} className="btn btn-success-soft !px-2 !py-1.5 text-xs" onClick={async()=>{setBusyId(a.key);try{await completeTask(a.task!.id,a.task!.title,a.task!.customer_id);toast("המשימה הושלמה");await load();}catch{toast("המשימה לא סומנה. נסה שוב.","error");}finally{setBusyId(null);}}}>{busyId===a.key?"שומר...":<><Check size={13}/>טופל</>}</button>:a.customer&&<Link className="btn btn-outline !px-2 !py-1.5 text-xs" href={`/customer?id=${a.customer.id}`}>פתיחה</Link>}{a.customer?.phone&&<a className="btn btn-ghost !p-2" href={`tel:${a.customer.phone}`} title="התקשר ללקוח"><Phone size={13}/></a>}</div></div>)}</>}

          </section>

          {/* Recent leads */}
          <section className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-[15px]">פניות אחרונות</h2>
              <Link href="/leads" className="text-xs text-primary font-medium hover:underline">כל הפניות</Link>
            </div>
            {leads.length === 0 && <div className="p-8 text-sm text-muted text-center">עוד אין פניות. פנייה חדשה שתוסיף תופיע כאן.</div>}
            {leads.slice(0, 5).map((l) => (
              <div key={l.id} className="px-5 py-2.5 border-b border-border last:border-0 flex items-center gap-3 hover:bg-[#FAFAF8] transition-colors">
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
          {/* Activity */}
          <section className="card p-5">
            <h2 className="font-semibold text-[15px] mb-3">פעילות אחרונה</h2>
            {activity.length === 0 && <div className="text-sm text-muted">עוד לא בוצעו פעולות במערכת.</div>}
            <div className="flex flex-col gap-3">
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} className="flex gap-2.5 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                  <div className="min-w-0">
                    <div className="leading-snug text-[13.5px]">{a.description}</div>
                    <div className="text-xs text-faint">{timeAgo(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI teaser - honest disconnected state */}
          <button onClick={() => setAiOpen(true)} className="card p-4 text-right hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2 font-semibold text-[14px] mb-1">
              <Sparkles size={15} className="text-primary" /> עוזר AI
              <ArrowLeft size={14} className="mr-auto text-faint" />
            </div>
            <p className="text-xs text-muted leading-relaxed">ניסוח הודעות מעקב וסיכומי קשר בלחיצה.</p>
            <div className="text-[11px] text-warning mt-1.5">היכולת עדיין לא מחוברת</div>
          </button>
        </div>
      </div>
      <AiAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
