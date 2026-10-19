import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getDefaultExamDate } from "../lib/planner";
import { validatePassword } from "../lib/auth-validation";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  target_exam: "NCLEX-RN" | "NLE";
  exam_date: string;
  daily_goal_minutes: number;
  streak_days: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, fullName: string, targetExam: "NCLEX-RN" | "NLE", examDate?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const emptyProfile: UserProfile = {
  id: "",
  email: "",
  full_name: "",
  target_exam: "NCLEX-RN",
  exam_date: getDefaultExamDate(),
  daily_goal_minutes: 60,
  streak_days: 0,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("real_nurse_profile");
    return saved ? JSON.parse(saved) : emptyProfile;
  });
  const [loading, setLoading] = useState(true);

  // Sync profile to localStorage for offline persistence
  const updateLocalProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem("real_nurse_profile", JSON.stringify(newProfile));
  };

  const fetchProfile = async (userId: string, userEmail: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data && !error) {
        updateLocalProfile({
          id: data.id,
          email: data.email || userEmail,
          full_name: data.full_name || "Reviewee",
          target_exam: data.target_exam || "NCLEX-RN",
          exam_date: data.exam_date || getDefaultExamDate(),
          daily_goal_minutes: data.daily_goal_minutes || 60,
          streak_days: data.streak_days || 0,
        });
      } else {
        // Automatically sync new profile into profiles table when user is authenticated
        const newRecord: UserProfile = {
          id: userId,
          email: userEmail,
          full_name: profile.full_name || "Reviewee",
          target_exam: profile.target_exam || "NCLEX-RN",
          exam_date: profile.exam_date || getDefaultExamDate(),
          daily_goal_minutes: 60,
          streak_days: 1,
        };
        await supabase.from("profiles").upsert(newRecord).catch(() => {});
      }
    } catch (err) {
      console.warn("Could not fetch remote profile, keeping local:", err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const savedUser = localStorage.getItem("real_nurse_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? "");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? "");
      } else {
        // Reset to empty profile on logout
        localStorage.removeItem("real_nurse_profile");
        updateLocalProfile(emptyProfile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    targetExam: "NCLEX-RN" | "NLE",
    examDate: string = getDefaultExamDate()
  ) => {
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return {
        error: `Password is too weak. Requirements: ${validation.errors.join(", ")}.`,
      };
    }

    if (!isSupabaseConfigured) {
      // Mock signup for local offline development
      const mockUser = {
        id: "offline-" + Date.now(),
        email,
        app_metadata: {},
        user_metadata: { full_name: fullName },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(mockUser);
      localStorage.setItem("real_nurse_user", JSON.stringify(mockUser));
      const mockProfile: UserProfile = {
        id: mockUser.id,
        email,
        full_name: fullName,
        target_exam: targetExam,
        exam_date: examDate,
        daily_goal_minutes: 60,
        streak_days: 1,
      };
      updateLocalProfile(mockProfile);
      return {};
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          target_exam: targetExam,
          exam_date: examDate,
        },
      },
    });

    if (error) return { error: error.message };

    if (data.user) {
      const newProf: UserProfile = {
        id: data.user.id,
        email,
        full_name: fullName,
        target_exam: targetExam,
        exam_date: examDate,
        daily_goal_minutes: 60,
        streak_days: 1,
      };
      updateLocalProfile(newProf);

      if (data.session) {
        setUser(data.user);
        setSession(data.session);
        await supabase.from("profiles").upsert(newProf).catch(() => {});
        return {};
      } else {
        // Email confirmation is required by Supabase settings
        return {
          notice: "Account registered! If email confirmation is enabled, check your inbox to confirm, or turn off 'Confirm email' in Supabase to login immediately.",
        };
      }
    }

    return {};
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const nameFromEmail = email.split("@")[0] || "Candidate";
      const displayName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      const newProf: UserProfile = {
        id: "local-user-" + Date.now(),
        email,
        full_name: displayName,
        target_exam: profile.target_exam || "NCLEX-RN",
        exam_date: profile.exam_date || getDefaultExamDate(),
        daily_goal_minutes: 60,
        streak_days: 1,
      };
      const mockUser = {
        id: newProf.id,
        email,
        app_metadata: {},
        user_metadata: { full_name: displayName },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(mockUser);
      localStorage.setItem("real_nurse_user", JSON.stringify(mockUser));
      updateLocalProfile(newProf);
      return {};
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    if (data?.user) {
      setUser(data.user);
      setSession(data.session);
    }
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem("real_nurse_user");
    localStorage.removeItem("real_nurse_profile");
    updateLocalProfile(emptyProfile);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    updateLocalProfile(updated);

    if (isSupabaseConfigured && user) {
      await supabase.from("profiles").update(updates).eq("id", user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isGuest: !user,
        signUp,
        signIn,
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
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
