import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type User, type LoginRequest } from "@shared/schema";
import { api } from "@shared/routes";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLogin>;
  logoutMutation: ReturnType<typeof useLogout>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useLogin() {
  const { toast } = useToast();
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
        title: "Connexion réussie",
        description: `Bienvenue, ${user.fullName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de connexion",
        description: error.message,
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

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
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
