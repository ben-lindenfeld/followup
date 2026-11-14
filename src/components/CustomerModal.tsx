"use client";
import { useEffect, useState } from "react";
import { Modal, Field } from "./ui";
import { useToast } from "./Toast";
import { Customer, CUSTOMER_STATUSES, LEAD_SOURCES, LeadSource } from "@/lib/types";
import { addCustomer, updateCustomer, findDuplicateCustomer, addLead, addTask } from "@/lib/data";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (c: Customer) => void;
  customer?: Customer | null;
}

export default function CustomerModal({ open, onClose, onSaved, customer }: Props) {
  const toast = useToast();
  const editing = !!customer;
  const [f, setF] = useState({ full_name: "", phone: "", email: "", address: "", service_type: "", status: "potential", next_follow_up: "", lead_desc: "", lead_source: "phone" as LeadSource, create_lead: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dup, setDup] = useState<Customer | null>(null);

  useEffect(() => {
    if (open) {
      setDup(null);
      setErrors({});
      setF(customer ? {
        full_name: customer.full_name, phone: customer.phone ?? "", email: customer.email ?? "",
        address: customer.address ?? "", service_type: customer.service_type ?? "", status: customer.status,
        next_follow_up: customer.next_follow_up ?? "", lead_desc: "", lead_source: "phone", create_lead: false,
      } : { full_name: "", phone: "", email: "", address: "", service_type: "", status: "potential", next_follow_up: "", lead_desc: "", lead_source: "phone", create_lead: true });
    }
  }, [open, customer]);

  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.full_name.trim()) e.full_name = "שם מלא הוא שדה חובה";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = "כתובת אימייל לא תקינה";
    if (f.phone && !/^[0-9+\-\s()]{7,15}$/.test(f.phone)) e.phone = "מספר טלפון לא תקין";
    if (!editing && f.create_lead && !f.lead_desc.trim()) e.lead_desc = "תיאור הפנייה הוא שדה חובה כאשר יוצרים פנייה";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (ignoreDup = false) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const phone = f.phone ? f.phone.replace(/[^\d+\-]/g, "") : null;
      if (!editing && !ignoreDup) {
        const existing = await findDuplicateCustomer(f.full_name.trim(), phone);
        if (existing) { setDup(existing); setSaving(false); return; }
      }
      const payload = {
        full_name: f.full_name.trim(), phone, email: f.email || null, address: f.address || null,
        service_type: f.service_type || null, status: f.status as Customer["status"],
        next_follow_up: f.next_follow_up || null,
      };
      let saved: Customer;
      if (editing) {
        await updateCustomer(customer!.id, payload);
        saved = { ...customer!, ...payload } as Customer;
        toast("פרטי הלקוח עודכנו");
      } else {
        saved = await addCustomer(payload);
        if (f.create_lead && f.lead_desc.trim()) {
          await addLead({ customer_id: saved.id, title: f.lead_desc.trim().slice(0, 60), description: f.lead_desc.trim(), source: f.lead_source, status: "new", next_follow_up: f.next_follow_up || null });
        }
        if (f.next_follow_up) {
          await addTask({ customer_id: saved.id, title: `לחזור ל${saved.full_name}`, due_at: new Date(f.next_follow_up + "T09:00:00").toISOString(), priority: "medium" });
        }
        toast("הלקוח נוסף בהצלחה");
      }
      onSaved(saved);
    } catch (err) {
      console.error(err);
      toast("לא הצלחנו לשמור. הפרטים נשארו בטופס, נסה שוב.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "עריכת לקוח" : "הוספת לקוח חדש"}>
      {dup && (
        <div className="mb-4 p-3 rounded-lg bg-warning-soft text-sm">
          לקוח בשם <b>{dup.full_name}</b> כבר קיים במערכת.{" "}
          <button className="underline font-medium" onClick={() => { setDup(null); save(true); }}>צור בכל זאת</button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="שם מלא" required error={errors.full_name}>
          <input className="input" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="ישראל ישראלי" />
        </Field>
        <Field label="טלפון" error={errors.phone}>
          <input className="input" dir="ltr" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="050-0000000" />
        </Field>
        <Field label="אימייל" error={errors.email}>
          <input className="input" dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@email.com" />
        </Field>
        <Field label="כתובת">
          <input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="רחוב, עיר" />
        </Field>
        <Field label="סוג שירות">
          <input className="input" value={f.service_type} onChange={(e) => set("service_type", e.target.value)} placeholder="חשמל, אינסטלציה..." />
        </Field>
        <Field label="סטטוס">
          <select className="input" value={f.status} onChange={(e) => set("status", e.target.value)}>
            {CUSTOMER_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="תאריך למעקב הבא">
          <input type="date" className="input" value={f.next_follow_up} onChange={(e) => set("next_follow_up", e.target.value)} />
        </Field>
      </div>
      {!editing && (
        <div className="mt-4 p-4 rounded-lg bg-bg border border-border">
          <label className="flex items-center gap-2 text-sm font-medium mb-3">
            <input type="checkbox" checked={f.create_lead} onChange={(e) => set("create_lead", e.target.checked)} className="w-4 h-4 accent-[#3D4FC4]" />
            צור גם פנייה חדשה עבור לקוח זה
          </label>
          {f.create_lead && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="מקור הפנייה">
                <select className="input" value={f.lead_source} onChange={(e) => set("lead_source", e.target.value)}>
                  {LEAD_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="תיאור הפנייה" required error={errors.lead_desc}>
                <input className="input" value={f.lead_desc} onChange={(e) => set("lead_desc", e.target.value)} placeholder="מה הלקוח ביקש?" />
              </Field>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-start gap-2 mt-5">
        <button className="btn btn-primary" disabled={saving} onClick={() => save()}>{saving ? "שומר..." : editing ? "שמור שינויים" : "הוסף לקוח"}</button>
        <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
      </div>
    </Modal>
  );
}
