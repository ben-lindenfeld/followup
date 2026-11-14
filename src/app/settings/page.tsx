"use client";
import { useState, useEffect } from "react";
import { PageHeader, Field, Spinner, PageSkeleton, Modal } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/components/AuthProvider";
import { getSupabase } from "@/lib/supabase";
import { loadSampleData, clearSampleData } from "@/lib/data";
import { LogOut, Database, Trash2, UserRound } from "lucide-react";

export default function SettingsPage() {
  const { profile, refreshProfile, signOut, session } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ owner_name: profile?.owner_name ?? "", business_name: profile?.business_name ?? "", phone: profile?.phone ?? "" });
  const [saving, setSaving] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);

  const [confirmClear,setConfirmClear]=useState(false);
  useEffect(()=>{if(profile)setF({owner_name:profile.owner_name||"",business_name:profile.business_name||"",phone:profile.phone||""});},[profile]);
  if (!profile) return <PageSkeleton />;

  const save = async () => {
    setSaving(true);
    const { error } = await getSupabase().from("business_profiles").update({
      owner_name: f.owner_name.trim(), business_name: f.business_name.trim(), phone: f.phone.trim() || null,
    }).eq("id", profile.id);
    setSaving(false);
    if (error) { toast("לא הצלחנו לשמור. נסה שוב בעוד רגע.", "error"); return; }
    await refreshProfile();
    toast("ההגדרות נשמרו");
  };

  return (
    <div className="anim-fade-up max-w-2xl">
      <PageHeader title="הגדרות" />

      <section className="card p-5 mb-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><UserRound size={17} className="text-primary" /> פרופיל עסקי</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="שם מלא">
            <input className="input" defaultValue={profile.owner_name ?? ""} onChange={(e) => setF((p) => ({ ...p, owner_name: e.target.value }))} />
          </Field>
          <Field label="שם העסק">
            <input className="input" defaultValue={profile.business_name ?? ""} onChange={(e) => setF((p) => ({ ...p, business_name: e.target.value }))} />
          </Field>
          <Field label="טלפון">
            <input className="input" dir="ltr" defaultValue={profile.phone ?? ""} onChange={(e) => setF((p) => ({ ...p, phone: e.target.value }))} />
          </Field>
          <Field label="אימייל">
            <input className="input bg-bg" dir="ltr" value={session?.user.email ?? ""} disabled />
          </Field>
        </div>
        <button className="btn btn-primary mt-4" onClick={save} disabled={saving}>{saving ? "שומר..." : "שמור שינויים"}</button>
      </section>

      <section className="card p-5 mb-5">
        <h2 className="font-semibold flex items-center gap-2 mb-2"><Database size={17} className="text-primary" /> נתוני דוגמה</h2>
        <p className="text-sm text-muted mb-4">נתוני דוגמה עוזרים לבדוק את המערכת. הם מסומנים בבירור כ״דוגמה״ ואינם לקוחות אמיתיים.</p>
        <div className="flex gap-2">
          <button className="btn btn-outline text-sm" disabled={sampleBusy} onClick={async () => {
            setSampleBusy(true);
            try { await loadSampleData(); toast("נתוני הדוגמה נטענו"); } catch { toast("לא הצלחנו לטעון את הנתונים. רענן את העמוד ונסה שוב.", "error"); }
            setSampleBusy(false);
          }}>טען נתוני דוגמה</button>
          <button className="btn btn-ghost text-sm text-danger" disabled={sampleBusy} onClick={()=>setConfirmClear(true)}><Trash2 size={14} /> מחק נתוני דוגמה</button>
        </div>
      </section>

      <Modal open={confirmClear} onClose={()=>setConfirmClear(false)} title="מחיקת נתוני דוגמה"><p className="text-sm mb-4">למחוק את כל נתוני הדוגמה? לקוחות אמיתיים לא יימחקו.</p><div className="flex gap-2"><button className="btn btn-danger-soft" disabled={sampleBusy} onClick={async()=>{setSampleBusy(true);try{await clearSampleData();toast("נתוני הדוגמה נמחקו");setConfirmClear(false);}catch{toast("המחיקה לא הצליחה. נסה שוב.","error");}finally{setSampleBusy(false);}}}>{sampleBusy?"מוחק...":"מחק נתוני דוגמה"}</button><button className="btn btn-ghost" onClick={()=>setConfirmClear(false)}>ביטול</button></div></Modal>
      <section className="card p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3"><LogOut size={17} className="text-danger" /> חשבון</h2>
        <button className="btn btn-danger-soft" onClick={signOut}>התנתקות מהחשבון</button>
      </section>
    </div>
  );
}
