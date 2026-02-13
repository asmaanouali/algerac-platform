import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import AdminDashboard from "@/pages/admin/Dashboard";
import RADashboard from "@/pages/ra/Dashboard";
import OECDashboard from "@/pages/oec/Dashboard";
import DTDashboard from "@/pages/dt/Dashboard";
import CDDashboard from "@/pages/cd/Dashboard";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Non connecté. Veuillez vous connecter.</p>
      </div>
    );
  }

  // Route vers le dashboard approprié selon le rôle
  switch (user.role?.toUpperCase()) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'RA':
      return <RADashboard />;
    case 'CD':
      return <CDDashboard />;
    case 'OEC':
      return <OECDashboard />;
    case 'DT':
      return <DTDashboard />;
    default:
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium">Rôle non reconnu: {user.role}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Votre compte a le rôle "{user.role}" qui n'a pas encore de dashboard configuré.
            </p>
          </div>
        </div>
      );
  }
}
