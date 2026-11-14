"use client";
import { Modal } from "./ui";
import { Sparkles, MessageSquareText, FileText, History, MailQuestion, Unplug } from "lucide-react";

const TOOLS = [
  { icon: MessageSquareText, title: "ניסוח הודעת WhatsApp מקצועית", desc: "הודעה אישית ללקוח לפי ההקשר" },
  { icon: FileText, title: "הודעת מעקב אחרי הצעת מחיר", desc: "תזכורת מנומסת ללקוח שקיבל הצעה" },
  { icon: History, title: "סיכום היסטוריית קשר", desc: "תמצית של כל הפניות וההערות של לקוח" },
  { icon: MailQuestion, title: "ניסוח מנומס ללקוח שלא ענה", desc: "פינג'נט עדין שמחזיר לקוחות לעניינים" },
];

export default function AiAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="AI Assistant">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-warning-soft border border-warning/30 mb-4">
        <Unplug size={20} className="text-warning shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium mb-0.5">היכולת עדיין לא מחוברת</div>
          יצירת הודעות באמצעות AI דורשת חיבור למודל שפה חיצוני. החיבור טרם הוגדר, ולכן הכפתורים למטה לא פעילים כרגע - בכוונה, כדי לא להציג תוצאות מזויפות.
        </div>
      </div>
      <div className="flex flex-col gap-2 opacity-50 pointer-events-none">
        {TOOLS.map((t) => (
          <div key={t.title} className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-white">
            <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0"><t.icon size={17} /></div>
            <div>
              <div className="text-sm font-medium">{t.title}</div>
              <div className="text-xs text-muted">{t.desc}</div>
            </div>
            <Sparkles size={15} className="mr-auto text-muted" />
          </div>
        ))}
      </div>
    </Modal>
  );
}
