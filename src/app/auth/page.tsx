"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Field } from "@/components/ui";
import Logo from "@/components/Logo";
import { Loader2, Check } from "lucide-react";

const POINTS = [
  "כל הלקוחות, הפניות והמשימות במקום אחד",
  "תזכורות מעקב שמונעות לקוחות שכוחים",
  "מעקב אחרי כל פנייה עד שהיא נסגרת",
];

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [f, setF] = useState({ email: "", password: "", full_name: "", business_name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) { setError("כתובת האימייל לא נראית תקינה. בדוק אותה ונסה שוב."); return; }
    if (f.password.length < 6) { setError("הסיסמה צריכה להכיל לפחות 6 תווים."); return; }
    if (mode === "signup" && !f.full_name.trim()) { setError("כדי לפתוח חשבון צריך גם שם מלא."); return; }
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
      setError(msg.includes("Invalid login") ? "האימייל או הסיסמה לא נכונים. נסה שוב." : msg.includes("already registered") ? "האימייל הזה כבר רשום. עבור להתחברות." : "ההתחברות נכשלה כרגע. נסה שוב בעוד רגע.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Brand panel - desktop only (start side in RTL) */}
      <div className="hidden md:flex w-[400px] lg:w-[440px] shrink-0 bg-[#232A4B] text-white flex-col justify-between p-10">
        <Logo size={30} onDark />
        <div>
          <h1 className="text-2xl font-bold leading-snug mb-3">המעקב אחרי הלקוחות שלך,<br />סוף סוף במקום אחד.</h1>
          <p className="text-[15px] text-white/70 leading-relaxed mb-8">
            FollowUp עוזר לבעלי עסקים קטנים לזכור למי לחזור, מתי, ובאיזה שלב כל פנייה עומדת.
          </p>
          <ul className="flex flex-col gap-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-[14px] text-white/85">
                <span className="w-5 h-5 rounded-full bg-white/12 flex items-center justify-center shrink-0"><Check size={12} /></span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-white/45">נבנה לעצמאים ולעסקים קטנים בישראל</div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm anim-page">
          <div className="flex justify-center mb-6 md:hidden"><Logo size={28} /></div>
          <div className="card p-6 sm:p-7">
            <h2 className="font-bold text-xl mb-1">{mode === "login" ? "ברוכים השבים" : "נפתח את העסק שלך"}</h2>
            <p className="text-sm text-muted mb-6">{mode === "login" ? "התחבר כדי לראות מה דורש תשומת לב היום." : "דקה אחת של הרשמה, ומתחילים לעקוב אחרי לקוחות."}</p>
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
              {error && <div className="text-danger text-[13px] bg-danger-soft border border-danger/20 rounded-lg px-3 py-2.5 leading-relaxed">{error}</div>}
              <button className="btn btn-primary w-full !py-2.5" onClick={submit} disabled={busy}>
                {busy && <Loader2 size={15} className="animate-spin" />}
                {mode === "login" ? "התחבר" : "צור חשבון"}
              </button>
            </div>
          </div>
          <button className="w-full text-center text-sm text-muted mt-4 hover:text-primary transition-colors" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
            {mode === "login" ? "אין לך עדיין חשבון? פתיחת חשבון" : "כבר יש לך חשבון? התחברות"}
          </button>
        </div>
      </div>
    </div>
  );
}
