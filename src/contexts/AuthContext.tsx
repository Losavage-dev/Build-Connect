import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, pingSupabase } from "@/integrations/supabase/client";

import { toast } from "sonner";

type UserRole = "client" | "contractor" | "supplier" | "moderator" | "admin";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  city: string | null;
  last_role_change_at?: string | null;
  banned_until?: string | null;
  ban_reason?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[Auth] profile load:", error.message);
    return null;
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const finishLoading = async (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        const p = await loadProfile(nextSession.user.id);
        if (p?.banned_until && new Date(p.banned_until) > new Date()) {
          const until = new Date(p.banned_until).toLocaleString("ru-RU");
          toast.error(
            p.ban_reason
              ? `Аккаунт заблокирован до ${until}. Причина: ${p.ban_reason}`
              : `Аккаунт заблокирован до ${until}`,
          );
          await supabase.auth.signOut();
          if (mounted) {
            setProfile(null);
            setUser(null);
            setSession(null);
            setIsLoading(false);
          }
          return;
        }
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
      }

      if (mounted) setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void finishLoading(nextSession);
    });

    void (async () => {
      const ping = await pingSupabase();
      if (!ping.ok && ping.message) {
        console.error("[BuildConnect] Supabase ping failed:", ping.message);
      }

      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("[Auth] getSession:", error.message);
        await supabase.auth.signOut();
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
        return;
      }

      await finishLoading(initialSession);
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: name,
          role: role,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Проверьте почту для подтверждения регистрации");
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg =
        error.message === "Invalid login credentials"
          ? "Неверный email или пароль. Для moderator@test.com выполните seed_moderator_account.sql в Supabase."
          : error.message;
      toast.error(msg);
      throw error;
    }

    toast.success("Вы успешно вошли");
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Вы вышли из аккаунта");
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error("No user");

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    toast.success("Профиль обновлен");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
