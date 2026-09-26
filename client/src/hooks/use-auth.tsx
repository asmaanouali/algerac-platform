import { createContext, ReactNode, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type User, type LoginRequest } from "@shared/schema";
import { api } from "@shared/routes";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLogin>;
  logoutMutation: ReturnType<typeof useLogout>;
  // Multi-role support
  activeRole: string | null;
  availableRoles: string[];
  setActiveRole: (role: string) => void;
  needsRoleSelection: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useLogin() {
  const { toast } = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<User | { twoFactorRequired: true }> => {
      try {
        const res = await apiRequest("POST", "/api/auth/login", credentials);
        const json = await res.json();
        // Login is gated behind email-OTP 2FA: backend wraps the response in
        // ApiResponse ({ data: { twoFactorRequired: true } }) instead of returning the user directly.
        if (json && json.data && json.data.twoFactorRequired) {
          return { twoFactorRequired: true };
        }
        return json as User;
      } catch (err: any) {
        // Essayer d'extraire le message d'erreur du backend
        let msg = err.message;
        try {
          // Cherche un JSON dans le message d'erreur
          const match = msg.match(/\{.*\}/);
          if (match) {
            const json = JSON.parse(match[0]);
            msg = json.error || json.message || msg;
          }
        } catch {}
        throw new Error(msg);
      }
    },
    onSuccess: (result) => {
      if ("twoFactorRequired" in result) return;
      queryClient.setQueryData(["/api/auth/me"], result);
      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.welcomeUser", { name: result.fullName }),
      });
    },
    onError: (error: Error) => {
      const code = error.message;
      let description: string;
      if (code === "INVALID_CREDENTIALS") {
        description = t("auth.invalidCredentials");
      } else {
        description = code;
      }
      toast({
        title: t("auth.loginError"),
        description,
        variant: "destructive",
      });
    },
  });
}

export function useVerifyLoginOtp() {
  const { toast } = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (otp: string): Promise<User> => {
      const res = await apiRequest("POST", "/api/auth/verify-login-otp", { otp });
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.welcomeUser", { name: user.fullName }),
      });
    },
  });
}

export function useResendLoginOtp() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/resend-login-otp");
      return await res.json();
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      // Fire-and-forget — redirect immediately
      fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    },
    onMutate: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      window.location.replace("/");
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  // Multi-role support
  const [activeRole, setActiveRoleState] = useState<string | null>(() => {
    return localStorage.getItem('algerac-active-role');
  });

  // Parse available roles from user data.
  // Backend returns roles as comma-separated string or single role. Memoized on
  // the underlying primitive fields so the array keeps a stable identity across
  // re-renders (an inline IIFE would otherwise create a new array every render,
  // which cascades into unstable `user`/context values and re-triggers effects
  // that depend on them across the app).
  const availableRoles: string[] = useMemo(() => {
    if (!user) return [];
    const u = user as any;
    if (u.roles && Array.isArray(u.roles)) return u.roles;
    if (u.role && typeof u.role === 'string') {
      return u.role.split(',').map((r: string) => r.trim()).filter(Boolean);
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user && (user as any).roles ? JSON.stringify((user as any).roles) : (user as any)?.role]);

  const needsRoleSelection = availableRoles.length > 1 && !activeRole;

  // Determine the effective active role
  const effectiveRole = (() => {
    if (availableRoles.length === 0) return null;
    if (availableRoles.length === 1) return availableRoles[0];
    if (activeRole && availableRoles.includes(activeRole)) return activeRole;
    return null; // needs selection
  })();

  const setActiveRole = useCallback((role: string) => {
    setActiveRoleState(role);
    localStorage.setItem('algerac-active-role', role);
    // Update the user in query cache with the active role for sidebar/nav
    if (user) {
      const updatedUser = { ...user, role: role } as User;
      queryClient.setQueryData(["/api/auth/me"], updatedUser);
    }
    // Notify backend of role switch
    fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
      credentials: 'include',
    }).catch(() => {}); // fire and forget
  }, [user]);

  // Clear active role on logout
  useEffect(() => {
    if (!user) {
      setActiveRoleState(null);
      localStorage.removeItem('algerac-active-role');
    }
  }, [user]);

  // Auto-select if single role
  useEffect(() => {
    if (availableRoles.length === 1 && !activeRole) {
      setActiveRole(availableRoles[0]);
    }
  }, [availableRoles, activeRole, setActiveRole]);

  // Create a user object with the effective role for downstream consumers.
  // Memoized so its identity only changes when the underlying user or role
  // actually changes — otherwise every AuthProvider render (e.g. triggered by
  // an unrelated mutation elsewhere) produces a brand-new object, which
  // re-triggers any page effect declared as `useEffect(() => {...}, [user])`.
  const effectiveUser = useMemo(() => {
    return user && effectiveRole ? ({ ...user, role: effectiveRole } as User) : user ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, effectiveRole]);

  const value = useMemo<AuthContextType>(() => ({
    user: effectiveUser,
    isLoading,
    error,
    loginMutation,
    logoutMutation,
    activeRole: effectiveRole,
    availableRoles,
    setActiveRole,
    needsRoleSelection,
  }), [effectiveUser, isLoading, error, loginMutation, logoutMutation, effectiveRole, availableRoles, setActiveRole, needsRoleSelection]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
