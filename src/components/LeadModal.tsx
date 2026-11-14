"use client";
import { useEffect, useState } from "react";
import { Modal, Field } from "./ui";
import { useToast } from "./Toast";
import { Customer, Lead, LEAD_SOURCES, LEAD_STATUSES, LeadSource, LeadStatus } from "@/lib/types";
import { addLead, updateLead, fetchCustomers, addTask } from "@/lib/data";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  lead?: Lead | null;
  presetCustomerId?: string;
}

export default function LeadModal({ open, onClose, onSaved, lead, presetCustomerId }: Props) {
  const toast = useToast();
  const editing = !!lead;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [f, setF] = useState({ customer_id: "", title: "", description: "", source: "phone" as LeadSource, status: "new" as LeadStatus, next_follow_up: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCustomers().then(setCustomers).catch(() => {});
      setErrors({});
      setF(lead ? {
        customer_id: lead.customer_id ?? "", title: lead.title, description: lead.description ?? "",
        source: lead.source, status: lead.status, next_follow_up: lead.next_follow_up ?? "", notes: lead.notes ?? "",
      } : { customer_id: presetCustomerId ?? "", title: "", description: "", source: "phone", status: "new", next_follow_up: "", notes: "" });
    }
  }, [open, lead, presetCustomerId]);

  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = "נושא הפנייה הוא שדה חובה";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const payload = {
        customer_id: f.customer_id || null, title: f.title.trim(), description: f.description || null,
        source: f.source, status: f.status, next_follow_up: f.next_follow_up || null, notes: f.notes || null,
      };
      if (editing) {
        await updateLead(lead!.id, payload, lead!.status);
        toast("הפנייה עודכנה");
      } else {
        const created = await addLead(payload);
        if (f.next_follow_up) {
          const custName = customers.find((c) => c.id === f.customer_id)?.full_name;
          await addTask({ customer_id: f.customer_id || null, title: `מעקב: ${created.title}${custName ? ` (${custName})` : ""}`, due_at: new Date(f.next_follow_up + "T09:00:00").toISOString(), priority: "medium" });
        }
        toast("הפנייה נוספה");
      }
      onSaved();
    } catch (err) {
      console.error(err);
      toast("לא הצלחנו לשמור. נסה שוב בעוד רגע.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "עריכת פנייה" : "פנייה חדשה"}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="לקוח">
          <select className="input" value={f.customer_id} onChange={(e) => set("customer_id", e.target.value)}>
            <option value="">- ללא שיוך -</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </Field>
        <Field label="נושא הפנייה" required error={errors.title}>
          <input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="תיקון מזגן" />
        </Field>
        <Field label="מקור הפנייה">
          <select className="input" value={f.source} onChange={(e) => set("source", e.target.value)}>
            {LEAD_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="סטטוס">
          <select className="input" value={f.status} onChange={(e) => set("status", e.target.value)}>
            {LEAD_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="תאריך למעקב הבא">
          <input type="date" className="input" value={f.next_follow_up} onChange={(e) => set("next_follow_up", e.target.value)} />
        </Field>
        <Field label="הערות">
          <input className="input" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
      <Field label="תיאור הבקשה">
        <textarea className="input mt-4" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="פרטים על הפנייה..." />
      </Field>
      <div className="flex justify-start gap-2 mt-5">
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "שומר..." : editing ? "שמור שינויים" : "הוסף פנייה"}</button>
        <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
      </div>
    </Modal>
  );
}
