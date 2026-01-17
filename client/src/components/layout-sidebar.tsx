import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  FileText,
  Files,
  AlertCircle,
  CreditCard,
  Award,
  User,
  LogOut,
  ShieldAlert,
  Users,
  Database,
  CalendarDays,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  if (!user) return null;

  const role = user.role;

  const navItems = {
    oec: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/requests/new", label: "Nouvelle Demande", icon: FileText },
      { href: "/requests", label: "Mes Demandes", icon: Files },
      { href: "/documents", label: "Mes Documents", icon: Briefcase },
      { href: "/actions", label: "Écarts & Actions", icon: AlertCircle },
      { href: "/billing", label: "Facturation", icon: CreditCard },
      { href: "/certificates", label: "Mes Certificats", icon: Award },
      { href: "/profile", label: "Profil OEC", icon: User },
    ],
    ra: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/requests", label: "Nouvelles Demandes", icon: FileText },
      { href: "/receivability", label: "Recevabilité", icon: ShieldAlert },
      { href: "/quotes", label: "Conventions & Devis", icon: CreditCard },
      { href: "/dossiers", label: "Dossiers", icon: Files },
      { href: "/planning", label: "Planning", icon: CalendarDays },
      { href: "/evaluators", label: "Évaluateurs", icon: Users },
    ],
    admin: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/users", label: "Utilisateurs", icon: Users },
      { href: "/roles", label: "Rôles", icon: User },
      { href: "/system", label: "Système", icon: Database },
      { href: "/security", label: "Sécurité", icon: ShieldAlert },
    ]
  };

  const currentNav = navItems[role as keyof typeof navItems] || [];

  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col fixed left-0 top-0 z-30 shadow-lg">
      <div className="p-6 border-b flex items-center justify-center">
        <div className="flex items-center gap-2 font-display text-2xl font-bold text-primary">
          <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center">A</div>
          ALGERAC
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
          Menu Principal
        </div>
        {currentNav.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "sidebar-link cursor-pointer",
                location === item.href && "active"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t bg-slate-50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-900">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
