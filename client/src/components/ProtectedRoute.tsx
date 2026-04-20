import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  component: React.ComponentType;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ component: Component, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

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

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user as any).role?.toLowerCase();
    const hasAccess = allowedRoles.some(r => r.toLowerCase() === userRole);
    if (!hasAccess) {
      return <Redirect to="/" />;
    }
  }

  return <Component />;
}
