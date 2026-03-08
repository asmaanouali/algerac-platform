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
  UserPlus,
  ClipboardList,
  FileSearch,
  CheckCircle2,
  Gavel,
  Stamp,
  FileSignature,
  Wrench,
  ShieldCheck,
  Crown,
  Vote,
  MessageSquareWarning,
  DollarSign,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebar } from "@/components/sidebar-context";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  if (!user) return null;

  const fullName = user.fullName || `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur';
  const role = (user as any).role || (user as any).typeRole || (user as any).roleId;

  const navItems = {
    oec: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/oec/new-request", label: "Nouvelle Demande", icon: FileText },
      { href: "/oec/mes-demandes", label: "Mes Demandes", icon: Files },
      { href: "/documents", label: "Mes Documents", icon: Briefcase },
      { href: "/oec/payments", label: "Facturation", icon: CreditCard },
      { href: "/oec/revue-ecarts", label: "Revue des Écarts", icon: ShieldCheck },
      { href: "/oec/reponse-ecarts", label: "Plans d'Action", icon: AlertCircle },
      { href: "/certificates", label: "Mes Certificats", icon: Award },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
      { href: "/profile", label: "Profil OEC", icon: User },
    ],
    ra: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/ra/experts", label: "Répertoire Experts", icon: UserCheck },
      { href: "/ra/faisabilite", label: "Recevabilité", icon: ShieldAlert },
      { href: "/quotes", label: "Conventions & Devis", icon: CreditCard },
      { href: "/ra/equipes", label: "Équipes d'Évaluation", icon: Users },
      { href: "/ra/recusations", label: "Récusations", icon: UserMinus },
      { href: "/ra/revue-documentaire", label: "Revue Documentaire", icon: FileSearch },
      { href: "/ra/preparation-evaluation", label: "Préparation Évaluation", icon: CalendarDays },
      { href: "/ra/gestion-ecarts", label: "Gestion des Écarts", icon: AlertCircle },
      { href: "/ra/rapports", label: "Validation Rapports", icon: FileCheck },
      { href: "/ra/preparation-cas", label: "Préparation CAS", icon: Gavel },
      { href: "/dossiers", label: "Dossiers", icon: Files },
      { href: "/planning", label: "Planning", icon: CalendarDays },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    dt: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/dt/candidatures-oec", label: "Candidatures OEC", icon: Building2 },
      { href: "/dt/ordres-mission", label: "Ordres de Mission", icon: Stamp },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    cd: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/cd/manage-requests", label: "Gérer Demandes", icon: Files },
      { href: "/cd/accreditations", label: "Accréditations", icon: FileCheck },
      { href: "/cd/revue-documentaire", label: "Revue Documentaire", icon: FileSearch },
      { href: "/cd/preparation-evaluation", label: "Préparation Évaluation", icon: CalendarDays },
      { href: "/cd/traitement-ecarts", label: "Traitement Écarts", icon: AlertCircle },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    dag: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/dag/candidatures-oec", label: "Candidatures OEC", icon: Building2 },
      { href: "/dag/paiements", label: "Suivi Paiements", icon: DollarSign },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    admin: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/users", label: "Utilisateurs", icon: Users },
      { href: "/admin/utilisateurs-pending", label: "Candidatures", icon: UserPlus },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    expert: [
      { href: "/expert/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/expert/planning", label: "Mon Planning", icon: CalendarDays },
      { href: "/expert/engagements", label: "Engagements", icon: FileSignature },
      { href: "/expert/revue-documentaire", label: "Revue Documentaire", icon: FileSearch },
      { href: "/expert/mandatements", label: "Mandatements & Réunions", icon: ClipboardList },
      { href: "/expert/evaluation", label: "Évaluation sur Site", icon: ClipboardList },
      { href: "/expert/rapports", label: "Rapports", icon: FileText },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    ree: [
      { href: "/ree/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/ree/planning", label: "Mon Planning", icon: CalendarDays },
      { href: "/ree/engagements", label: "Engagements", icon: FileSignature },
      { href: "/ree/revue-documentaire", label: "Revue Documentaire", icon: FileSearch },
      { href: "/ree/mandatements", label: "Mandatements & Réunions", icon: ClipboardList },
      { href: "/ree/plan-evaluation", label: "Plan FOR 32", icon: FileCheck },
      { href: "/ree/evaluation-site", label: "Évaluation sur Site", icon: ShieldCheck },
      { href: "/ree/traitement-ecarts", label: "Traitement Écarts", icon: AlertCircle },
      { href: "/ree/rapports", label: "Rapports", icon: FileText },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    et: [
      { href: "/et/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/et/planning", label: "Mon Planning", icon: CalendarDays },
      { href: "/et/engagements", label: "Engagements", icon: FileSignature },
      { href: "/et/revue-documentaire", label: "Revue Documentaire", icon: FileSearch },
      { href: "/et/mandatements", label: "Mandatements & Réunions", icon: ClipboardList },
      { href: "/et/evaluation", label: "Évaluation sur Site", icon: ClipboardList },
      { href: "/et/traitement-ecarts", label: "Traitement Écarts", icon: AlertCircle },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    eq: [
      { href: "/eq/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/eq/planning", label: "Mon Planning", icon: CalendarDays },
      { href: "/eq/engagements", label: "Engagements", icon: FileSignature },
      { href: "/eq/revue-documentaire", label: "Revue Documentaire", icon: FileSearch },
      { href: "/eq/mandatements", label: "Mandatements & Réunions", icon: ClipboardList },
      { href: "/eq/evaluation", label: "Évaluation sur Site", icon: ShieldCheck },
      { href: "/eq/traitement-ecarts", label: "Traitement Écarts", icon: AlertCircle },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    cas_member: [
      { href: "/cas/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/cas/reunions", label: "Réunions CAS", icon: Gavel },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    cas_president: [
      { href: "/cas-president/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/cas-president/reunions", label: "Réunions CAS", icon: Gavel },
      { href: "/cas-president/decisions", label: "Décisions", icon: Crown },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    dg: [
      { href: "/dg/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/dg/ordres-mission", label: "Ordres de Mission", icon: Stamp },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    ges_competences: [
      { href: "/ges-competences/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/ges-competences/candidatures", label: "Candidatures", icon: UserPlus },
      { href: "/ges-competences/entretiens", label: "Planning Entretiens", icon: CalendarDays },
      { href: "/complaints/internal", label: "Plaintes", icon: MessageSquareWarning },
    ],
    rq: [
      { href: "/rq/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/rq/plaintes", label: "Gestion Plaintes", icon: MessageSquareWarning },
    ],
  };

  const roleMapping: Record<string, keyof typeof navItems> = {
    'ADMIN': 'admin',
    'OEC': 'oec',
    'RA': 'ra',
    'DT': 'dt',
    'CD': 'cd',
    'DAG': 'dag',
    'EXPERT': 'expert',
    'REE': 'ree',
    'ET': 'et',
    'EQ': 'eq',
    'CAS_MEMBER': 'cas_member',
    'CAS_PRESIDENT': 'cas_president',
    'DG': 'dg',
    'GES_COMPETENCES': 'ges_competences',
    'RQ': 'rq',
  };

  const normalizedRole = role?.toUpperCase() || '';
  const navKey = roleMapping[normalizedRole] || normalizedRole.toLowerCase();
  const currentNav = navItems[navKey as keyof typeof navItems] || [];

  const { isMobileOpen, closeMobile } = useSidebar();

  const sidebarContent = (
    <>
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
              onClick={closeMobile}
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
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 bg-white border-r h-screen flex-col fixed left-0 top-0 z-30 shadow-lg">
        {sidebarContent}
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={isMobileOpen} onOpenChange={(open) => !open && closeMobile()}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}