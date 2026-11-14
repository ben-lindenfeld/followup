"use client";
import { getSupabase } from "./supabase";
import { ActivityLog, AppNotification, Customer, Lead, Task, Note } from "./types";

const sb = () => getSupabase();

export async function logActivity(type: string, description: string, customerId?: string | null) {
  await sb().from("activity_logs").insert({ type, description, customer_id: customerId ?? null });
}

export async function pushNotification(type: string, title: string, body?: string, dedupeKey?: string) {
  const { error } = await sb().from("notifications").insert({ type, title, body: body ?? null, dedupe_key: dedupeKey ?? null });
  if (error && error.code !== "23505") console.error("notify", error);
}

// ---- Customers ----
export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await sb().from("customers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function findDuplicateCustomer(name: string, phone: string | null): Promise<Customer | null> {
  let q = sb().from("customers").select("*").eq("full_name", name).limit(1);
  const { data: byName } = await q;
  if (byName && byName.length) return byName[0];
  if (phone) {
    const clean = phone.replace(/[^\d+]/g, "");
    const { data: byPhone } = await sb().from("customers").select("*").eq("phone", clean).limit(1);
    if (byPhone && byPhone.length) return byPhone[0];
  }
  return null;
}

export async function addCustomer(c: Partial<Customer>): Promise<Customer> {
  const { data, error } = await sb().from("customers").insert(c).select().single();
  if (error) throw error;
  await logActivity("customer_added", `לקוח חדש נוסף: ${data.full_name}`, data.id);
  await pushNotification("customer_added", "לקוח חדש נוסף", data.full_name);
  return data;
}

export async function updateCustomer(id: string, c: Partial<Customer>) {
  const { error } = await sb().from("customers").update({ ...c, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: string, name: string) {
  const { error } = await sb().from("customers").delete().eq("id", id);
  if (error) throw error;
  await logActivity("customer_deleted", `הלקוח ${name} נמחק`);
}

// ---- Leads ----
export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await sb().from("leads").select("*, customers(full_name, phone)").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addLead(l: Partial<Lead>): Promise<Lead> {
  const { data, error } = await sb().from("leads").insert(l).select().single();
  if (error) throw error;
  await logActivity("lead_added", `פנייה חדשה: ${l.title}`, l.customer_id);
  await pushNotification("new_lead", "פנייה חדשה התקבלה", l.title ?? undefined);
  if (l.customer_id) {
    await sb().from("customers").update({ last_contact_at: new Date().toISOString() }).eq("id", l.customer_id);
  }
  return data;
}

export async function updateLead(id: string, l: Partial<Lead>, oldStatus?: string) {
  const { error } = await sb().from("leads").update({ ...l, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  if (l.status && oldStatus && l.status !== oldStatus) {
    const { data: lead } = await sb().from("leads").select("title, customer_id").eq("id", id).single();
    await logActivity("lead_status_changed", `סטטוס הפנייה "${lead?.title}" השתנה`, lead?.customer_id);
  }
}

export async function deleteLead(id: string) {
  const { error } = await sb().from("leads").delete().eq("id", id);
  if (error) throw error;
}

// ---- Tasks ----
export async function fetchTasks(includeDone = false): Promise<Task[]> {
  let q = sb().from("tasks").select("*, customers(full_name)").order("due_at", { ascending: true });
  if (!includeDone) q = q.eq("done", false);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function addTask(t: Partial<Task>): Promise<Task> {
  const { data, error } = await sb().from("tasks").insert(t).select().single();
  if (error) throw error;
  await logActivity("task_added", `משימת מעקב נוצרה: ${t.title}`, t.customer_id);
  return data;
}

export async function updateTask(id: string, t: Partial<Task>) {
  const { error } = await sb().from("tasks").update(t).eq("id", id);
  if (error) throw error;
}

export async function completeTask(id: string, title: string, customerId?: string | null) {
  const { error } = await sb().from("tasks").update({ done: true, done_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  await logActivity("task_completed", `משימת מעקב הושלמה: ${title}`, customerId);
}

export async function deleteTask(id: string) {
  const { error } = await sb().from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// ---- Notes ----
export async function fetchNotes(customerId: string): Promise<Note[]> {
  const { data, error } = await sb().from("notes").select("*").eq("customer_id", customerId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addNote(customerId: string, body: string) {
  const { error } = await sb().from("notes").insert({ customer_id: customerId, body });
  if (error) throw error;
  await logActivity("note_added", "הערה חדשה נוספה", customerId);
}

// ---- Notifications ----
export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await sb().from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  await sb().from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllNotificationsRead() {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) return;
  await sb().from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
}

// ---- Activity ----
export async function fetchActivity(limit = 20): Promise<ActivityLog[]> {
  const { data, error } = await sb().from("activity_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ---- Notification sweep: due/overdue tasks, waiting leads ----
export async function sweepNotifications() {
  const now = new Date();
  const tasks = await fetchTasks();
  for (const t of tasks) {
    const due = new Date(t.due_at);
    if (due.getTime() <= now.getTime()) {
      const isOverdue = due.toDateString() !== now.toDateString() && due.getTime() < now.getTime();
      await pushNotification(
        isOverdue ? "task_overdue" : "task_due",
        isOverdue ? "משימה באיחור" : "הגיע מועד משימה",
        t.title,
        `task-${isOverdue ? "overdue" : "due"}-${t.id}-${due.toDateString()}`
      );
    }
  }
  const leads = await fetchLeads();
  for (const l of leads) {
    if (l.status === "waiting") {
      await pushNotification("customer_waiting", "לקוח ממתין לתשובה", l.title, `lead-waiting-${l.id}-${now.toDateString()}`);
    }
  }
}

// ---- Sample data ----
export async function loadSampleData() {
  const sbx = sb();
  const today = new Date();
  const iso = (d: Date) => d.toISOString();
  const day = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

  const c1 = (await sbx.from("customers").insert({ full_name: "דני כהן", phone: "050-1234567", email: "dani@example.com", address: "רחוב הרצל 12, תל אביב", service_type: "תיקון מזגן", status: "potential", next_follow_up: day(0).toISOString().slice(0, 10), is_sample: true }).select().single()).data;
  const c2 = (await sbx.from("customers").insert({ full_name: "רועי לוי", phone: "052-7654321", email: "roi@example.com", address: "שדרות בן גוריון 4, חולון", service_type: "התקנת דוד", status: "potential", next_follow_up: day(1).toISOString().slice(0, 10), is_sample: true }).select().single()).data;
  const c3 = (await sbx.from("customers").insert({ full_name: "מאיה ישראלי", phone: "054-5556677", email: "maya@example.com", address: "רחוב אלנבי 30, תל אביב", service_type: "תיקון חשמל", status: "active", is_sample: true }).select().single()).data;

  await sbx.from("leads").insert([
    { customer_id: c1!.id, title: "תיקון מזגן", description: "המזגן לא מקרר, צריך טכנאי דחוף", source: "whatsapp", status: "waiting", next_follow_up: day(0).toISOString().slice(0, 10), is_sample: true },
    { customer_id: c2!.id, title: "התקנת דוד שמש", description: "מעוניין בהצעת מחיר לדוד 150 ליטר", source: "phone", status: "quote_sent", next_follow_up: day(1).toISOString().slice(0, 10), is_sample: true },
    { customer_id: c3!.id, title: "תיקון נקודת חשמל", description: "קצר במטבח, נדרש טיפול", source: "website", status: "in_progress", is_sample: true },
  ]);

  await sbx.from("tasks").insert([
    { customer_id: c1!.id, title: "לחזור לדני לגבי תיקון מזגן", due_at: iso(day(0)), priority: "high", is_sample: true },
    { customer_id: c2!.id, title: "לשלוח הצעת מחיר לרועי", due_at: iso(day(1)), priority: "medium", is_sample: true },
    { customer_id: c3!.id, title: "לבדוק אם מאיה מעוניינת להמשיך", due_at: iso(day(3)), priority: "low", is_sample: true },
  ]);

  await logActivity("sample_loaded", "נטענו נתוני דוגמה");
}

export async function clearSampleData() {
  const sbx = sb();
  await sbx.from("tasks").delete().eq("is_sample", true);
  await sbx.from("leads").delete().eq("is_sample", true);
  await sbx.from("notes").delete().eq("is_sample", true);
  await sbx.from("customers").delete().eq("is_sample", true);
  await logActivity("sample_cleared", "נתוני הדוגמה נמחקו");
}
