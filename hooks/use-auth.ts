"use client";

import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const supabase = createClient();

    // 初期セッションを取得
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setAuthState({
        user: session?.user ?? null,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });
    };

    getInitialSession();

    // 認証状態の変更をリッスン
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}
