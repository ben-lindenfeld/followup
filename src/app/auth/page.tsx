"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Field } from "@/components/ui";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [f, setF] = useState({ email: "", password: "", full_name: "", business_name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) { setError("כתובת אימייל לא תקינה"); return; }
    if (f.password.length < 6) { setError("הסיסמה חייבת להכיל לפחות 6 תווים"); return; }
    if (mode === "signup" && !f.full_name.trim()) { setError("יש להזין שם מלא"); return; }
    setBusy(true);
    const sb = getSupabase();
    try {
      if (mode === "signup") {
        const { error } = await sb.auth.signUp({
          email: f.email, password: f.password,
          options: { data: { full_name: f.full_name.trim(), business_name: f.business_name.trim() } },
        });
        if (error) throw error;
      } else {
        const { error } = await sb.auth.signInWithPassword({ email: f.email, password: f.password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg.includes("Invalid login") ? "אימייל או סיסמה שגויים" : msg.includes("already registered") ? "האימייל כבר רשום, נסה להתחבר" : "משהו השתבש, נסה שוב");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-bold">F</div>
          <span className="font-bold text-2xl">FollowUp</span>
        </div>
        <div className="card p-6">
          <h1 className="font-bold text-lg mb-1">{mode === "login" ? "התחברות" : "יצירת חשבון"}</h1>
          <p className="text-sm text-muted mb-5">{mode === "login" ? "ברוכים השבים לעסק שלך" : "מתחילים לנהל לקוחות בדקה"}</p>
          <div className="flex flex-col gap-4">
            {mode === "signup" && (
              <>
                <Field label="שם מלא" required>
                  <input className="input" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="ישראל ישראלי" />
                </Field>
                <Field label="שם העסק">
                  <input className="input" value={f.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="ישראל חשמל בע״מ" />
                </Field>
              </>
            )}
            <Field label="אימייל" required>
              <input className="input" dir="ltr" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@email.com" />
            </Field>
            <Field label="סיסמה" required>
              <input className="input" dir="ltr" type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submit()} />
            </Field>
            {error && <div className="text-danger text-sm bg-danger-soft rounded-xl px-3 py-2">{error}</div>}
            <button className="btn btn-primary w-full" onClick={submit} disabled={busy}>
              {busy && <Loader2 size={16} className="animate-spin" />}
              {mode === "login" ? "התחבר" : "צור חשבון"}
            </button>
          </div>
        </div>
        <button className="w-full text-center text-sm text-muted mt-4 hover:text-primary" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
          {mode === "login" ? "אין לך חשבון? להרשמה" : "כבר יש לך חשבון? להתחברות"}
        </button>
      </div>
    </div>
  );
}
