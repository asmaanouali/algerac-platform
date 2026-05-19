import { createContext, ReactNode, useContext, useState, useCallback, useEffect } from "react";
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
    mutationFn: async (credentials: LoginRequest) => {
      try {
        const res = await apiRequest("POST", "/api/auth/login", credentials);
        return await res.json();
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
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.welcomeUser", { name: user.fullName }),
      });
    },
    onError: (error: Error) => {
      const code = error.message;
      let description: string;
      if (code === "EMAIL_NOT_FOUND") {
        description = t("auth.emailNotFound");
      } else if (code === "WRONG_PASSWORD") {
        description = t("auth.wrongPassword");
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

  // Parse available roles from user data
  // Backend returns roles as comma-separated string or single role
  const availableRoles: string[] = (() => {
    if (!user) return [];
    const u = user as any;
    // Check if user has multiple roles (comma-separated in role field or a roles array)
    if (u.roles && Array.isArray(u.roles)) return u.roles;
    if (u.role && typeof u.role === 'string') {
      const roles = u.role.split(',').map((r: string) => r.trim()).filter(Boolean);
      return roles;
    }
    return [];
  })();

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

  // Create a user object with the effective role for downstream consumers
  const effectiveUser = user && effectiveRole ? { ...user, role: effectiveRole } as User : user;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        activeRole: effectiveRole,
        availableRoles,
        setActiveRole,
        needsRoleSelection,
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
