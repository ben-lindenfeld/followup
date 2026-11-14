export type LeadStatus = "new" | "waiting" | "in_progress" | "quote_sent" | "closed_won" | "irrelevant";
export type LeadSource = "phone" | "whatsapp" | "website" | "other";
export type CustomerStatus = "potential" | "active" | "inactive";
export type Priority = "low" | "medium" | "high";

export interface BusinessProfile {
  id: string;
  owner_name: string | null;
  business_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  service_type: string | null;
  status: CustomerStatus;
  last_contact_at: string | null;
  next_follow_up: string | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  customer_id: string | null;
  customer_name?: string | null;
  title: string;
  description: string | null;
  source: LeadSource;
  status: LeadStatus;
  received_at: string;
  next_follow_up: string | null;
  notes: string | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
  customers?: { full_name: string; phone: string | null } | null;
}

export interface Task {
  id: string;
  user_id: string;
  customer_id: string | null;
  title: string;
  description: string | null;
  due_at: string;
  priority: Priority;
  done: boolean;
  done_at: string | null;
  is_sample: boolean;
  created_at: string;
  customers?: { full_name: string } | null;
}

export interface Note {
  id: string;
  user_id: string;
  customer_id: string;
  body: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  dedupe_key: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  type: string;
  description: string;
  customer_id: string | null;
  created_at: string;
}

export const LEAD_STATUSES: { key: LeadStatus; label: string; color: string; bg: string }[] = [
  { key: "new", label: "חדשה", color: "#3D4FC4", bg: "#ECEEF9" },
  { key: "waiting", label: "ממתינה לתשובה", color: "#B06A12", bg: "#F8EEDC" },
  { key: "in_progress", label: "בטיפול", color: "#3F6F87", bg: "#E8F0F3" },
  { key: "quote_sent", label: "נשלחה הצעת מחיר", color: "#625482", bg: "#EEEAF3" },
  { key: "closed_won", label: "נסגרה בהצלחה", color: "#2E7D4C", bg: "#E2F0E7" },
  { key: "irrelevant", label: "לא רלוונטית", color: "#6E7480", bg: "#EFF0F2" },
];

export const LEAD_SOURCES: { key: LeadSource; label: string }[] = [
  { key: "phone", label: "טלפון" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "website", label: "אתר" },
  { key: "other", label: "אחר" },
];

export const CUSTOMER_STATUSES: { key: CustomerStatus; label: string; color: string; bg: string }[] = [
  { key: "potential", label: "מתעניין", color: "#B06A12", bg: "#F8EEDC" },
  { key: "active", label: "פעיל", color: "#2E7D4C", bg: "#E2F0E7" },
  { key: "inactive", label: "לא פעיל", color: "#6E7480", bg: "#EFF0F2" },
];

export const PRIORITIES: { key: Priority; label: string; color: string; bg: string }[] = [
  { key: "high", label: "גבוהה", color: "#BE3B32", bg: "#F8E6E3" },
  { key: "medium", label: "בינונית", color: "#B06A12", bg: "#F8EEDC" },
  { key: "low", label: "נמוכה", color: "#2E7D4C", bg: "#E2F0E7" },
];

export const leadStatusLabel = (s: LeadStatus) => LEAD_STATUSES.find((x) => x.key === s)!;
export const leadSourceLabel = (s: LeadSource) => LEAD_SOURCES.find((x) => x.key === s)?.label ?? s;
export const customerStatusLabel = (s: CustomerStatus) => CUSTOMER_STATUSES.find((x) => x.key === s)!;
export const priorityLabel = (p: Priority) => PRIORITIES.find((x) => x.key === p)!;

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" }) + " " + d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דקות`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שעות`;
  const d = Math.floor(h / 24);
  if (d === 1) return "אתמול";
  if (d < 30) return `לפני ${d} ימים`;
  return formatDate(iso);
}
