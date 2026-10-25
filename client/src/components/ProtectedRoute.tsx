import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  component: React.ComponentType;
  allowedRoles?: string[];
}

// Nouvel OEC dont le dossier est à compléter : seule cette page est accessible
const DOSSIER_COMPLETION_PATH = "/oec/completer-dossier";

export default function ProtectedRoute({ component: Component, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if ((user as any).role?.toLowerCase() === "oec" && (user as any).dossierPending && location !== DOSSIER_COMPLETION_PATH) {
    return <Redirect to={DOSSIER_COMPLETION_PATH} />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user as any).role?.toLowerCase();
    const rawRoles = (user as any).roles ?? (user as any).role ?? "";
    const userRoles: string[] = (Array.isArray(rawRoles)
      ? rawRoles
      : String(rawRoles).split(","))
      .map((r: any) => String(r).trim().toLowerCase())
      .filter(Boolean);
    const allowed = allowedRoles.map((r) => r.toLowerCase());
    const hasAccess = allowed.includes(userRole) || userRoles.some((r) => allowed.includes(r));
    if (!hasAccess) {
      return <Redirect to="/" />;
    }
  }

  return <Component />;
}
