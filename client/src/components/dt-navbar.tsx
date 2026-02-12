import { useAuth } from "@/hooks/use-auth";

export function DTNavbar() {
  const { user } = useAuth();
  const fullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || user?.fullName || 'Utilisateur';

  return (
    <nav className="bg-white border-b px-4 md:px-8 py-4 sticky top-0 z-20">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-3">
            
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{fullName}</p>
            <p className="text-xs text-muted-foreground">Direction Technique</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </nav>
  );
}