import { useAuth } from "@/hooks/use-auth";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/sidebar-context";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  RA: "Responsable Accréditation",
  DT: "Direction Technique",
  OEC: "Organisme d'Évaluation",
  EXPERT: "Expert"
};

export function Navbar() {
  const { user } = useAuth();
  const { toggleMobile } = useSidebar();
  const fullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || user?.fullName || 'Utilisateur';
  const roleLabel = user?.role ? roleLabels[user.role] || user.role : 'Utilisateur';

  return (
    <nav className="bg-white border-b px-4 md:px-8 py-4 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        {/* Hamburger — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobile}
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Spacer so user info stays right on desktop */}
        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{fullName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </nav>
  );
}