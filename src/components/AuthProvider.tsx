"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { BusinessProfile } from "@/lib/types";

interface AuthCtx {
  session: Session | null;
  profile: BusinessProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ session: null, profile: null, loading: true, refreshProfile: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await getSupabase().from("business_profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data);
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  useEffect(() => {
    if (!loading && !session && pathname !== "/auth") router.replace("/auth");
    if (!loading && session && pathname === "/auth") router.replace("/");
  }, [loading, session, pathname, router]);

  const signOut = async () => {
    await getSupabase().auth.signOut();
    router.replace("/auth");
  };

  return (
    <Ctx.Provider value={{ session, profile, loading, refreshProfile: async () => { if (session) await loadProfile(session.user.id); }, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
