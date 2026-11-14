"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, LayoutList, KanbanSquare, Search, Pencil, Trash2, Inbox, GripVertical } from "lucide-react";
import { PageSkeleton, PageHeader, Spinner, Badge, SampleBadge, EmptyState, Modal } from "@/components/ui";
import { useToast } from "@/components/Toast";
import LeadModal from "@/components/LeadModal";
import { Lead, LeadStatus, LEAD_STATUSES, formatDate, leadSourceLabel, leadStatusLabel, timeAgo } from "@/lib/types";
import { fetchLeads, updateLead, deleteLead } from "@/lib/data";

export default function LeadsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });
  const [deleting,setDeleting]=useState(false);
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);

  const load = useCallback(async () => {
    try { setLeads(await fetchLeads()); } catch (e) { console.error(e); toast("לא הצלחנו לטעון את הנתונים. רענן את העמוד ונסה שוב.", "error"); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener("followup:data-changed", h); return () => window.removeEventListener("followup:data-changed", h); }, [load]);

  const filtered = useMemo(() => {
    let list = leads;
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((l) => [l.title, l.description, l.customers?.full_name].some((v) => v?.toLowerCase().includes(s)));
    }
    if (statusFilter) list = list.filter((l) => l.status === statusFilter);
    return list;
  }, [leads, q, statusFilter]);

  const moveLead = async (lead: Lead, status: LeadStatus) => {
    if (lead.status === status) return;
    setLeads((p) => p.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    try { await updateLead(lead.id, { status }, lead.status); }
    catch { toast("העדכון לא נשמר. נסה שוב.", "error"); load(); }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="anim-fade-up">
      <PageHeader title="פניות" sub={`${leads.length} פניות בסך הכל`}>
        <div className="flex bg-white border border-border rounded-lg p-0.5">
          <button title="תצוגת רשימה" onClick={() => setView("table")} className={`p-2 rounded-lg ${view === "table" ? "bg-primary-soft text-primary" : "text-muted"}`}><LayoutList size={16} /></button>
          <button title="תצוגת לוח" onClick={() => setView("kanban")} className={`p-2 rounded-lg ${view === "kanban" ? "bg-primary-soft text-primary" : "text-muted"}`}><KanbanSquare size={16} /></button>
        </div>
        <button className="btn btn-primary text-sm" onClick={() => setModal({ open: true, lead: null })}><Plus size={15} /> פנייה חדשה</button>
      </PageHeader>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input input-icon" placeholder="חיפוש פניות..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">כל הסטטוסים</option>
          {LEAD_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Inbox} title="אין פניות להצגה" sub="פניות חדשות שתוסיף יופיעו כאן" action={<button className="btn btn-primary text-sm" onClick={() => setModal({ open: true, lead: null })}><Plus size={15} /> פנייה חדשה</button>} /></div>
      ) : view === "table" ? (
        <><div className="md:hidden card divide-y divide-border">{filtered.map(l=><div key={l.id} className="p-3" onClick={()=>setModal({open:true,lead:l})}><div className="flex gap-2 items-start"><div className="flex-1 min-w-0"><div className="font-medium text-sm">{l.title}</div><div className="text-xs text-muted mt-1">{l.customers?.full_name||"ללא שיוך"} · {leadSourceLabel(l.source)}</div></div><Badge label={leadStatusLabel(l.status).label} color={leadStatusLabel(l.status).color} bg={leadStatusLabel(l.status).bg}/></div><div className="flex items-center justify-between mt-1"><span className="text-xs text-muted">{l.next_follow_up?`חזרה: ${formatDate(l.next_follow_up)}`:""}</span><div className="flex items-center mobile-actions" onClick={e=>e.stopPropagation()}>{l.is_sample&&<SampleBadge/>}<button title="עריכת פנייה" className="btn btn-ghost !p-2" onClick={()=>setModal({open:true,lead:l})}><Pencil size={15}/></button><button title="מחיקת פנייה" className="btn btn-ghost !p-2 hover:text-danger" onClick={()=>setToDelete(l)}><Trash2 size={15}/></button></div></div></div>)}</div><div className="hidden md:block card overflow-x-auto">
          <table className="w-full md:min-w-[820px]">
            <thead>
              <tr className="bg-bg">
                <th className="th">נושא</th><th className="th">לקוח</th><th className="th hidden md:table-cell">מקור</th><th className="th hidden lg:table-cell">התקבלה</th><th className="th">סטטוס</th><th className="th hidden lg:table-cell">מעקב הבא</th><th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-[#FAFAF8] cursor-pointer" onClick={() => setModal({ open: true, lead: l })}>
                  <td className="td font-medium"><span className="flex items-center gap-2">{l.title}{l.is_sample && <SampleBadge />}</span></td>
                  <td className="td">{l.customers?.full_name ?? "-"}</td>
                  <td className="td text-muted hidden md:table-cell">{leadSourceLabel(l.source)}</td>
                  <td className="td text-muted hidden lg:table-cell">{timeAgo(l.received_at)}</td>
                  <td className="td" onClick={(e) => e.stopPropagation()}>
                    <select className="input !w-auto !py-1.5 text-xs" value={l.status} onChange={(e) => moveLead(l, e.target.value as LeadStatus)}>
                      {LEAD_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="td text-muted hidden lg:table-cell">{formatDate(l.next_follow_up)}</td>
                  <td className="td" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-[#EEEFEC] text-muted" onClick={() => setModal({ open: true, lead: l })}><Pencil size={15} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-danger-soft text-muted hover:text-danger" onClick={() => setToDelete(l)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {LEAD_STATUSES.map((col) => {
            const items = filtered.filter((l) => l.status === col.key);
            return (
              <div
                key={col.key}
                className={`flex-shrink-0 w-64 rounded-lg border p-2.5 transition-colors ${dragOver === col.key ? "border-primary bg-primary-soft/40" : "border-border bg-[#F1F1EF]/70"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                onDragLeave={() => setDragOver((d) => (d === col.key ? null : d))}
                onDrop={() => { const lead = leads.find((l) => l.id === dragId); if (lead) moveLead(lead, col.key); setDragId(null); setDragOver(null); }}
              >
                <div className="flex items-center justify-between px-1.5 py-1.5 mb-1">
                  <span className="text-xs font-semibold" style={{ color: col.color }}>{col.label}</span>
                  <span className="text-xs text-muted bg-white rounded-full px-2 py-0.5 border border-border">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2 min-h-[60px]">
                  {items.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onDragEnd={() => { setDragId(null); setDragOver(null); }}
                      onClick={() => setModal({ open: true, lead: l })}
                      className="card p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical size={14} className="text-[#C9CCD2] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium leading-snug">{l.title}</span>
                            {l.is_sample && <SampleBadge />}
                          </div>
                          <div className="text-xs text-muted mt-1">{l.customers?.full_name ?? "ללא שיוך"}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] text-muted">{leadSourceLabel(l.source)}</span>
                            {l.next_follow_up && <span className="text-[11px] text-warning font-medium">{formatDate(l.next_follow_up)}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LeadModal open={modal.open} lead={modal.lead} onClose={() => setModal({ open: false, lead: null })} onSaved={() => { setModal({ open: false, lead: null }); load(); }} />

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="מחיקת פנייה">
        <p className="text-sm mb-5">למחוק את הפנייה <b>{toDelete?.title}</b>?</p>
        <div className="flex gap-2">
          <button className="btn btn-danger-soft" disabled={deleting} onClick={async () => { setDeleting(true); try {await deleteLead(toDelete!.id); toast("הפנייה נמחקה"); setToDelete(null); load();} catch {toast("המחיקה לא הצליחה. נסה שוב.","error");} finally{setDeleting(false);} }}>{deleting?"מוחק...":"מחק"}</button>
          <button className="btn btn-ghost" onClick={() => setToDelete(null)}>ביטול</button>
        </div>
      </Modal>
    </div>
  );
}
