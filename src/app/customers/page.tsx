"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { PageSkeleton, PageHeader, Spinner, Badge, SampleBadge, EmptyState, Modal } from "@/components/ui";
import { useToast } from "@/components/Toast";
import CustomerModal from "@/components/CustomerModal";
import { Customer, customerStatusLabel, formatDate } from "@/lib/types";
import { fetchCustomers, deleteCustomer } from "@/lib/data";

export default function CustomersPage() {
  const router = useRouter();
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });
  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try { setCustomers(await fetchCustomers()); } catch (e) { console.error(e); toast("לא הצלחנו לטעון את הנתונים. רענן את העמוד ונסה שוב.", "error"); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener("followup:data-changed", h); return () => window.removeEventListener("followup:data-changed", h); }, [load]);

  const filtered = useMemo(() => {
    let list = customers;
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((c) => [c.full_name, c.phone, c.email, c.service_type].some((v) => v?.toLowerCase().includes(s)));
    }
    if (status) list = list.filter((c) => c.status === status);
    return [...list].sort((a, b) => {
      const da = new Date(a.last_contact_at ?? a.created_at).getTime();
      const db = new Date(b.last_contact_at ?? b.created_at).getTime();
      return sortDesc ? db - da : da - db;
    });
  }, [customers, q, status, sortDesc]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="anim-fade-up">
      <PageHeader title="לקוחות" sub={`${customers.length} לקוחות במערכת`}>
        <button className="btn btn-primary text-sm" onClick={() => setModal({ open: true, customer: null })}><Plus size={15} /> הוסף לקוח</button>
      </PageHeader>

      <div className="filter-bar gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input input-icon" placeholder="חיפוש לפי שם, טלפון, שירות..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">כל הסטטוסים</option>
          <option value="potential">מתעניין</option>
          <option value="active">פעיל</option>
          <option value="inactive">לא פעיל</option>
        </select>
        <button className="btn btn-outline text-sm" onClick={() => setSortDesc(!sortDesc)}>
          תאריך {sortDesc ? "↓" : "↑"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Users} title={q || status ? "לא נמצאו לקוחות" : "עוד אין לקוחות"} sub={q || status ? "נסה חיפוש אחר" : "הוסף את הלקוח הראשון שלך"} action={<button className="btn btn-primary text-sm" onClick={() => setModal({ open: true, customer: null })}><Plus size={15} /> הוסף לקוח</button>} /></div>
      ) : (
        <><div className="md:hidden card divide-y divide-border">{filtered.map(c=><div key={c.id} className="px-3 py-3" onClick={()=>router.push(`/customer?id=${c.id}`)}><div className="flex items-center gap-2"><span className="font-medium flex-1">{c.full_name}</span>{c.is_sample&&<SampleBadge/>}<Badge label={customerStatusLabel(c.status).label} color={customerStatusLabel(c.status).color} bg={customerStatusLabel(c.status).bg}/></div><div className="flex items-center justify-between gap-2 mt-1.5"><div className="text-xs text-muted"><span dir="ltr" className="inline-block">{c.phone||"ללא טלפון"}</span><div>{c.service_type||""}{c.next_follow_up?` · חזרה: ${formatDate(c.next_follow_up)}`:""}</div></div><div className="flex mobile-actions" onClick={e=>e.stopPropagation()}><button title="עריכת לקוח" className="btn btn-ghost !p-2" onClick={()=>setModal({open:true,customer:c})}><Pencil size={15}/></button><button title="מחיקת לקוח" className="btn btn-ghost !p-2 hover:text-danger" onClick={()=>setToDelete(c)}><Trash2 size={15}/></button></div></div></div>)}</div><div className="hidden md:block card overflow-x-auto">
          <table className="w-full md:min-w-[760px]">
            <thead>
              <tr className="bg-bg">
                <th className="th">שם</th><th className="th">טלפון</th><th className="th hidden md:table-cell">אימייל</th><th className="th hidden md:table-cell">סוג שירות</th><th className="th">סטטוס</th><th className="th hidden lg:table-cell">פנייה אחרונה</th><th className="th hidden lg:table-cell">חזרה הבאה</th><th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAFAF8] cursor-pointer" onClick={() => router.push(`/customer?id=${c.id}`)}>
                  <td className="td font-medium">
                    <span className="flex items-center gap-2">{c.full_name} {c.is_sample && <SampleBadge />}</span>
                  </td>
                  <td className="td" dir="ltr">{c.phone ?? "-"}</td>
                  <td className="td text-muted hidden md:table-cell" dir="ltr">{c.email ?? "-"}</td>
                  <td className="td hidden md:table-cell">{c.service_type ?? "-"}</td>
                  <td className="td"><Badge label={customerStatusLabel(c.status).label} color={customerStatusLabel(c.status).color} bg={customerStatusLabel(c.status).bg} /></td>
                  <td className="td text-muted hidden lg:table-cell">{formatDate(c.last_contact_at)}</td>
                  <td className="td text-muted hidden lg:table-cell">{formatDate(c.next_follow_up)}</td>
                  <td className="td" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-[#EEEFEC] text-muted" onClick={() => setModal({ open: true, customer: c })}><Pencil size={15} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-danger-soft text-muted hover:text-danger" onClick={() => setToDelete(c)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></>
      )}

      <CustomerModal open={modal.open} customer={modal.customer} onClose={() => setModal({ open: false, customer: null })} onSaved={() => { setModal({ open: false, customer: null }); load(); }} />

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="מחיקת לקוח">
        <p className="text-sm mb-1">למחוק את <b>{toDelete?.full_name}</b>?</p>
        <p className="text-sm text-muted mb-5">גם הפניות, המשימות וההערות שלו יימחקו. אי אפשר לבטל.</p>
        <div className="flex gap-2">
          <button className="btn btn-danger-soft" disabled={deleting} onClick={async () => {
            setDeleting(true);
            try { await deleteCustomer(toDelete!.id, toDelete!.full_name); toast("הלקוח נמחק"); setToDelete(null); load(); }
            catch { toast("המחיקה לא הצליחה. הנתונים לא נמחקו, נסה שוב.", "error"); }
            setDeleting(false);
          }}>{deleting ? "מוחק..." : "מחק לקוח"}</button>
          <button className="btn btn-ghost" onClick={() => setToDelete(null)}>ביטול</button>
        </div>
      </Modal>
    </div>
  );
}
