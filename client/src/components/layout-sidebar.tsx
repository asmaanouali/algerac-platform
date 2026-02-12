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
  Briefcase,
  UserCheck,
  FileCheck,
  Building2,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  if (!user) return null;

  const fullName = user.fullName || `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur';
  const role = (user as any).role || (user as any).typeRole || (user as any).roleId;

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
    dt: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/dt/candidatures-oec", label: "Candidatures OEC", icon: Building2 },
      { href: "/experts", label: "Experts Certifiés", icon: UserCheck },
      { href: "/evaluation", label: "Évaluation", icon: FileCheck },
      { href: "/rapports", label: "Rapports", icon: FileText },
    ],
    admin: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/users", label: "Utilisateurs", icon: Users },
      { href: "/admin/utilisateurs-pending", label: "OEC en Attente", icon: UserPlus },
      { href: "/roles", label: "Rôles", icon: User },
      { href: "/system", label: "Système", icon: Database },
      { href: "/security", label: "Sécurité", icon: ShieldAlert },
    ]
  };

  const currentNav = navItems[role as keyof typeof navItems] || [];

  return (
    <div className="hidden md:flex w-64 bg-white border-r h-screen flex-col fixed left-0 top-0 z-30 shadow-lg">
      <div className="p-6 border-b flex items-center justify-center">
        <div className="flex items-center gap-3 font-display text-2xl font-bold text-primary">
          <img src="/logoalgerac.png" alt="ALGERAC" className="w-10 h-10 object-contain" />
          ALGERAC
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
      
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

      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
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