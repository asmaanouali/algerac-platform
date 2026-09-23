import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/sidebar-context";
import { NotificationBell } from "@/components/NotificationBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";

export function Navbar() {
  const { t } = useTranslation();
  const { user, activeRole, availableRoles, setActiveRole } = useAuth();
  const { toggleMobile } = useSidebar();
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const fullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || user?.fullName || 'Utilisateur';
  const roleLabel = user?.role ? t(`roles.${user.role}`, user.role) : 'Utilisateur';

  const handleSwitchRole = (role: string) => {
    setActiveRole(role);
    // Navigate to the default dashboard for the new role
    const rolePaths: Record<string, string> = {
      ADMIN: '/admin',
      OEC: '/oec/dashboard',
      RA: '/ra/dashboard',
      DT: '/dashboard',
      CD: '/cd/dashboard',
      DAG: '/dag/dashboard',
      EXPERT: '/expert/dashboard',
      REE: '/ree/dashboard',
      ET: '/et/dashboard',
      EQ: '/eq/dashboard',
      CAS_MEMBER: '/cas/dashboard',
      CAS_PRESIDENT: '/cas-president/dashboard',
      DG: '/dg/dashboard',
      GES_COMPETENCES: '/ges-competences/dashboard',
      RQ: '/rq/dashboard',
      SUP: '/sup/dashboard',
      CONSOLIDATION: '/consolidation/dashboard',
      EF: '/ef/dashboard',
    };
    setLocation(rolePaths[role] || '/dashboard');
  };

  return (
    <nav className="bg-white dark:bg-card border-b dark:border-slate-700/60 px-4 md:px-8 py-4 sticky top-0 z-20 transition-colors">
      <div className="flex items-center justify-between">
        {/* Hamburger -- mobile only */}
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
          {/* Role Switcher - only show if multiple roles */}
          {activeRole && availableRoles.length > 1 && (
            <RoleSwitcher
              currentRole={activeRole}
              availableRoles={availableRoles}
              onSwitchRole={handleSwitchRole}
            />
          )}
          <LanguageSwitcher variant="icon" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Changer de thème"
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <NotificationBell />
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{fullName}</p>
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