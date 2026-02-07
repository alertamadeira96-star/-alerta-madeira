import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/services/supabase';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const queryClient = useQueryClient();

  // Short delay so Supabase init doesn't race with getUser
  useEffect(() => {
    const t = setTimeout(() => setAuthReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await supabaseService.getCurrentUser();
        return userData.user;
      } catch (error) {
        return null;
      }
    },
    enabled: authReady,
  });

  useEffect(() => {
    if (currentUserQuery.data !== undefined) {
      setUser(currentUserQuery.data);
      setIsLoading(false);
    }
  }, [currentUserQuery.data]);

  // Listen for auth state changes – avoid calling getCurrentUser() on SIGNED_IN
  // to prevent race with login mutation (two getUser() calls = auth-js lock abort)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        setUser(null);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        return;
      }
      // On SIGNED_IN: do nothing – login/register mutation sets user in onSuccess.
      // On INITIAL_SESSION: currentUserQuery already fetches – don't call getCurrentUser again.
      // Only refetch on TOKEN_REFRESHED.
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') return;

      if (event === 'TOKEN_REFRESHED') {
        try {
          const userData = await supabaseService.getCurrentUser();
          setUser(userData.user);
        } catch {
          setUser(null);
        }
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const data = await supabaseService.login(email, password);
      return data.user;
    },
    onSuccess: (data) => {
      setUser(data);
      // Don't invalidate here – avoids triggering another getCurrentUser() and auth lock race
      queryClient.setQueryData(['currentUser'], data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const data = await supabaseService.register(email, password, name);
      return data.user;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['currentUser'], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await supabaseService.logout();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const login = (email: string, password: string) => {
    return loginMutation.mutateAsync({ email, password });
  };

  const register = (email: string, password: string, name: string) => {
    return registerMutation.mutateAsync({ email, password, name });
  };

  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  return {
    user,
    isLoading: isLoading || currentUserQuery.isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loginPending: loginMutation.isPending,
    registerPending: registerMutation.isPending,
    logoutPending: logoutMutation.isPending,
  };
});
