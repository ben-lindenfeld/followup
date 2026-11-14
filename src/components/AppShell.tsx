"use client";
import { ReactNode, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Inbox, CheckSquare, CalendarDays, Settings, Bell, Plus, LogOut, Sparkles, CheckCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { AppNotification } from "@/lib/types";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, sweepNotifications } from "@/lib/data";
import { timeAgo } from "@/lib/types";
import CustomerModal from "./CustomerModal";
import AiAssistant from "./AiAssistant";

const NAV = [
  { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/customers", label: "לקוחות", icon: Users },
  { href: "/leads", label: "פניות", icon: Inbox },
  { href: "/tasks", label: "משימות ומעקב", icon: CheckSquare },
  { href: "/calendar", label: "לוח שנה", icon: CalendarDays },
  { href: "/settings", label: "הגדרות", icon: Settings },
];

const NOTIF_ICON: Record<string, string> = { task_overdue: "🔴", task_due: "🟠", new_lead: "🟣", customer_added: "🟢", customer_waiting: "🟡" };

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, signOut, session } = useAuth();
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const loadNotifs = useCallback(async () => {
    if (!session) return;
    try { setNotifs(await fetchNotifications()); } catch { /* ignore */ }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const tick = () => sweepNotifications().then(loadNotifs).catch(() => {});
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [session, loadNotifs]);

  const unread = notifs.filter((n) => !n.read).length;
  const title = NAV.find((n) => n.href === pathname)?.label ?? "FollowUp";

  if (pathname === "/auth") return <>{children}</>;

  return (
    <div className="min-h-screen">
      {/* Sidebar - desktop, right side in RTL */}
      <aside className="hidden md:flex flex-col fixed top-0 right-0 h-full w-60 bg-white border-l border-border z-40">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm">F</div>
          <span className="font-bold text-lg">FollowUp</span>
        </div>
        <nav className="flex-1 px-3 flex flex-col gap-1 mt-2">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? "bg-primary-soft text-primary" : "text-muted hover:bg-slate-50 hover:text-ink"}`}>
                <n.icon size={18} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Link href="/settings" className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50">
            <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm">
              {(profile?.business_name || profile?.owner_name || "ע")[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{profile?.business_name || "העסק שלי"}</div>
              <div className="text-xs text-muted truncate">{profile?.owner_name}</div>
            </div>
          </Link>
          <button onClick={signOut} className="mt-1 w-full flex items-center gap-3 px-2 py-2 rounded-xl text-sm text-muted hover:bg-slate-50 hover:text-danger">
            <LogOut size={16} /> התנתקות
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-border z-40 flex justify-around px-1 py-1.5">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] ${active ? "text-primary" : "text-muted"}`}>
              <n.icon size={19} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      {/* Main */}
      <div className="md:mr-60 pb-24 md:pb-8">
        <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur border-b border-border px-4 md:px-8 py-3 flex items-center justify-between gap-2">
          <div className="font-semibold md:hidden">FollowUp</div>
          <div className="hidden md:block font-semibold text-muted text-sm">{title}</div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setAiOpen(true)} className="btn btn-ghost !p-2.5 relative" title="AI Assistant">
              <Sparkles size={19} />
            </button>
            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifs(); }} className="btn btn-ghost !p-2.5 relative" title="התראות">
                <Bell size={19} />
                {unread > 0 && <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute left-0 top-12 z-50 w-80 max-w-[85vw] card shadow-lg anim-fade-up overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <span className="font-semibold text-sm">התראות</span>
                      {unread > 0 && (
                        <button className="text-xs text-primary flex items-center gap-1" onClick={async () => { await markAllNotificationsRead(); loadNotifs(); }}>
                          <CheckCheck size={13} /> סמן הכל כנקרא
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.length === 0 && <div className="p-6 text-center text-sm text-muted">אין התראות</div>}
                      {notifs.map((n) => (
                        <button key={n.id} onClick={async () => { if (!n.read) { await markNotificationRead(n.id); loadNotifs(); } }} className={`w-full text-right px-4 py-3 border-b border-border last:border-0 hover:bg-slate-50 ${n.read ? "opacity-60" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span>{NOTIF_ICON[n.type] ?? "🔵"}</span>
                            <span className="text-sm font-medium flex-1">{n.title}</span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          </div>
                          {n.body && <div className="text-xs text-muted mt-0.5 pr-6">{n.body}</div>}
                          <div className="text-[11px] text-muted mt-0.5 pr-6">{timeAgo(n.created_at)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setCustomerModal(true)} className="btn btn-primary text-sm">
              <Plus size={16} /> <span className="hidden sm:inline">הוסף לקוח</span><span className="sm:hidden">לקוח</span>
            </button>
          </div>
        </header>
        <main className="px-4 md:px-8 py-5 max-w-6xl mx-auto">{children}</main>
      </div>

      <CustomerModal open={customerModal} onClose={() => setCustomerModal(false)} onSaved={() => { setCustomerModal(false); window.dispatchEvent(new CustomEvent("followup:data-changed")); }} />
      <AiAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
