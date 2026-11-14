"use client";
import { useEffect, useState } from "react";
import { Modal, Field } from "./ui";
import { useToast } from "./Toast";
import { Customer, PRIORITIES, Priority, Task } from "@/lib/types";
import { addTask, updateTask, fetchCustomers } from "@/lib/data";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  task?: Task | null;
  presetCustomerId?: string;
  presetDate?: string;
}

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function TaskModal({ open, onClose, onSaved, task, presetCustomerId, presetDate }: Props) {
  const toast = useToast();
  const editing = !!task;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [f, setF] = useState({ customer_id: "", title: "", description: "", due_at: "", priority: "medium" as Priority });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCustomers().then(setCustomers).catch(() => {});
      setErrors({});
      const defDate = presetDate ? presetDate + "T09:00" : toLocalInput(new Date(Date.now() + 3600000).toISOString());
      setF(task ? {
        customer_id: task.customer_id ?? "", title: task.title, description: task.description ?? "",
        due_at: toLocalInput(task.due_at), priority: task.priority,
      } : { customer_id: presetCustomerId ?? "", title: "", description: "", due_at: defDate, priority: "medium" });
    }
  }, [open, task, presetCustomerId, presetDate]);

  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = "כותרת היא שדה חובה";
    if (!f.due_at) e.due_at = "יש לבחור תאריך ושעה";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const payload = { customer_id: f.customer_id || null, title: f.title.trim(), description: f.description || null, due_at: new Date(f.due_at).toISOString(), priority: f.priority };
      if (editing) {
        await updateTask(task!.id, payload);
        toast("המשימה עודכנה");
      } else {
        await addTask(payload);
        toast("המשימה נוצרה");
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
    <Modal open={open} onClose={onClose} title={editing ? "עריכת משימה" : "משימת מעקב חדשה"}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="כותרת" required error={errors.title}>
          <input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="לחזור לדני לגבי..." />
        </Field>
        <Field label="לקוח קשור">
          <select className="input" value={f.customer_id} onChange={(e) => set("customer_id", e.target.value)}>
            <option value="">- ללא -</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </Field>
        <Field label="תאריך ושעה" required error={errors.due_at}>
          <input type="datetime-local" className="input" value={f.due_at} onChange={(e) => set("due_at", e.target.value)} />
        </Field>
        <Field label="רמת דחיפות">
          <select className="input" value={f.priority} onChange={(e) => set("priority", e.target.value)}>
            {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-4">
        <Field label="תיאור">
          <textarea className="input" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-start gap-2 mt-5">
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "שומר..." : editing ? "שמור שינויים" : "צור משימה"}</button>
        <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
      </div>
    </Modal>
  );
}
