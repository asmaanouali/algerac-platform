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
  Beaker,
  Network,
  ArrowRightLeft,
  ClipboardCheck,
  BarChart3,
  Eye,
  RefreshCw,
  Expand,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebar } from "@/components/sidebar-context";
import { useTranslation } from "react-i18next";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t, i18n } = useTranslation();
  
  if (!user) return null;

  const fullName = user.fullName || `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur';
  const role = (user as any).role || (user as any).typeRole || (user as any).roleId;
  const roleLabel: string = role ? (t(`roles.${role}`, { defaultValue: String(role) }) as string) : '';

  const navItems = {
    oec: [
      { href: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/oec/new-request", label: t('nav.newRequest'), icon: FileText },
      { href: "/oec/mes-demandes", label: t('nav.myRequests'), icon: Files },
      { href: "/oec/documents", label: t('nav.documents'), icon: Briefcase },
      { href: "/oec/payments", label: t('nav.billing'), icon: CreditCard },
      { href: "/oec/revue-ecarts", label: t('nav.gapReview'), icon: ShieldCheck },
      { href: "/oec/reponse-ecarts", label: t('nav.actionPlans'), icon: AlertCircle },
      { href: "/oec/certificates", label: t('nav.certificates'), icon: Award },
      { href: "/oec/surveillance", label: t('nav.mySurveillances'), icon: Eye },
      { href: "/complaints/internal", label: t('nav.complaints'), icon: MessageSquareWarning },
    ],
    ra: [
      { href: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/ra/entretiens-candidats", label: t('nav.interviewCandidates'), icon: Users },
      { href: "/ra/experts", label: t('nav.expertDirectory'), icon: UserCheck },
      { href: "/ra/faisabilite", label: t('nav.receivability'), icon: ShieldAlert },
      { href: "/ra/quotes", label: t('nav.quotations'), icon: CreditCard },
      { href: "/ra/equipes", label: t('nav.teams'), icon: Users },
      { href: "/ra/recusations", label: t('nav.recusations'), icon: UserMinus },
      { href: "/ra/revue-documentaire", label: t('nav.documentaryReview'), icon: FileSearch },
      { href: "/ra/preparation-evaluation", label: t('nav.evaluationPrep'), icon: CalendarDays },
      { href: "/ra/gestion-ecarts", label: t('nav.gapsManagement'), icon: AlertCircle },
      { href: "/ra/rapports", label: t('nav.reportValidation'), icon: FileCheck },
      { href: "/ra/preparation-cas", label: t('nav.casPrep'), icon: Gavel },
      { href: "/ra/decision-accreditation", label: t('nav.decisionCertificate'), icon: Award },
      { href: "/ra/surveillance", label: t('nav.surveillance'), icon: Eye },
      { href: "/ra/planning", label: t('nav.planning'), icon: CalendarDays },
    ],
    dt: [
      { href: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/dt/demandes-accreditation", label: t('nav.accreditations'), icon: FileCheck },
      { href: "/dt/entretiens-candidats", label: t('nav.interviewCandidates'), icon: Users },
      { href: "/dt/certificats", label: t('nav.certificates'), icon: Award },
      { href: "/dt/ordres-mission", label: t('nav.missionOrders'), icon: Stamp },
    ],
    cd: [
      { href: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/cd/entretiens-candidats", label: t('nav.interviewCandidates'), icon: Users },
      { href: "/cd/manage-requests", label: t('nav.manageRequests'), icon: Files },
      { href: "/cd/ra-workload", label: t('nav.raTeam'), icon: UserCheck },
      { href: "/cd/accreditations", label: t('nav.accreditations'), icon: FileCheck },
      { href: "/cd/revue-documentaire", label: t('nav.documentaryReview'), icon: FileSearch },
      { href: "/cd/preparation-evaluation", label: t('nav.evaluationPrep'), icon: CalendarDays },
      { href: "/cd/traitement-ecarts", label: t('nav.gapTreatment'), icon: AlertCircle },
      { href: "/cd/echantillonnage", label: t('nav.samplingPage'), icon: Beaker },
      { href: "/cd/transferts", label: t('nav.transfers'), icon: ArrowRightLeft },
      { href: "/cd/surveillance", label: t('nav.surveillance'), icon: Eye },
    ],
    dag: [
      { href: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/dag/candidatures-oec", label: t('nav.oecCandidatures'), icon: Building2 },
      { href: "/dag/frais-enregistrement", label: t('nav.registrationFees'), icon: FileText },
      { href: "/dag/fixation-devis", label: t('nav.quotationFixing', { defaultValue: 'Fixation des devis' }), icon: DollarSign },
      { href: "/dag/paiements", label: t('nav.paymentTracking'), icon: DollarSign },
    ],
    admin: [
      { href: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/users", label: t('nav.users'), icon: Users },
      { href: "/admin/utilisateurs-pending", label: t('nav.candidatures'), icon: UserPlus },
    ],
    expert: [
      { href: "/expert/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/expert/planning", label: t('nav.planning'), icon: CalendarDays },
      { href: "/expert/engagements", label: t('nav.commitments'), icon: FileSignature },
      { href: "/expert/revue-documentaire", label: t('nav.documentaryReview'), icon: FileSearch },
      { href: "/expert/mandatements", label: t('nav.mandatesMeetings'), icon: ClipboardList },
      { href: "/expert/evaluation", label: t('nav.evaluationDay'), icon: ClipboardList },
      { href: "/expert/rapports", label: t('nav.reports'), icon: FileText },
    ],
    ree: [
      { href: "/ree/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/ree/planning", label: t('nav.planning'), icon: CalendarDays },
      { href: "/ree/engagements", label: t('nav.commitments'), icon: FileSignature },
      { href: "/ree/revue-documentaire", label: t('nav.documentaryReview'), icon: FileSearch },
      { href: "/ree/mandatements", label: t('nav.mandatesMeetings'), icon: ClipboardList },
      { href: "/ree/plan-evaluation", label: t('nav.evalPlan'), icon: FileCheck },
      { href: "/ree/evaluation-site", label: t('nav.siteEvaluation'), icon: ShieldCheck },
      { href: "/ree/traitement-ecarts", label: t('nav.gapTreatment'), icon: AlertCircle },
      { href: "/ree/rapports", label: t('nav.reports'), icon: FileText },
    ],
    et: [
      { href: "/et/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/et/planning", label: t('nav.planning'), icon: CalendarDays },
      { href: "/et/engagements", label: t('nav.commitments'), icon: FileSignature },
      { href: "/et/revue-documentaire", label: t('nav.documentaryReview'), icon: FileSearch },
      { href: "/et/mandatements", label: t('nav.mandatesMeetings'), icon: ClipboardList },
      { href: "/et/evaluation", label: t('nav.evaluationDay'), icon: ClipboardList },
      { href: "/et/traitement-ecarts", label: t('nav.gapTreatment'), icon: AlertCircle },
      { href: "/et/evaluation-plans", label: t('nav.actionPlans'), icon: AlertCircle },
    ],
    eq: [
      { href: "/eq/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/eq/planning", label: t('nav.planning'), icon: CalendarDays },
      { href: "/eq/engagements", label: t('nav.commitments'), icon: FileSignature },
      { href: "/eq/revue-documentaire", label: t('nav.documentaryReview'), icon: FileSearch },
      { href: "/eq/mandatements", label: t('nav.mandatesMeetings'), icon: ClipboardList },
      { href: "/eq/evaluation", label: t('nav.siteEvaluation'), icon: ShieldCheck },
      { href: "/eq/traitement-ecarts", label: t('nav.gapTreatment'), icon: AlertCircle },
    ],
    cas_member: [
      { href: "/cas/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/cas/reunions", label: t('nav.casReunions'), icon: Gavel },
      { href: "/cas/transferts", label: t('nav.transfers'), icon: ArrowRightLeft },
    ],
    cas_president: [
      { href: "/cas-president/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/cas-president/reunions", label: t('nav.casReunions'), icon: Gavel },
      { href: "/cas-president/decisions", label: t('nav.casDecisions'), icon: Crown },
      { href: "/cas-president/transferts", label: t('nav.transfers'), icon: ArrowRightLeft },
    ],
    dg: [
      { href: "/dg/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/dg/certificats", label: t('nav.certificates'), icon: Award },
      { href: "/dg/ordres-mission", label: t('nav.missionOrders'), icon: Stamp },
      { href: "/dg/transferts", label: t('nav.transfers'), icon: ArrowRightLeft },
    ],
    ges_competences: [
      { href: "/ges-competences/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/ges-competences/candidatures", label: t('nav.candidatures'), icon: UserPlus },
      { href: "/ges-competences/entretiens", label: t('nav.interviewPlanning'), icon: CalendarDays },
      { href: "/ges-competences/qualifications", label: t('nav.qualifications'), icon: Award },
      { href: "/ges-competences/ef-pipeline", label: t('nav.efPipeline'), icon: GraduationCap },
      { href: "/ges-competences/observations", label: t('nav.observations'), icon: ClipboardCheck },
      { href: "/ges-competences/surveillance", label: t('nav.kpiSurveillance'), icon: BarChart3 },
    ],
    sup: [
      { href: "/sup/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/sup/my-plan", label: t('nav.mySupervisions'), icon: CalendarDays },
    ],
    rq: [
      { href: "/rq/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: "/rq/plaintes", label: t('nav.complaints'), icon: MessageSquareWarning },
      { href: "/rq/entretiens-candidats", label: t('nav.interviewCandidates'), icon: Users },
    ],
    consolidation: [
      { href: "/consolidation/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
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
    'SUP': 'sup',
    'CONSOLIDATION': 'consolidation',
  };

  const normalizedRole = role?.toUpperCase() || '';
  const navKey = roleMapping[normalizedRole] || normalizedRole.toLowerCase();
  const currentNav = navItems[navKey as keyof typeof navItems] || [];

  const { isMobileOpen, closeMobile } = useSidebar();

  const sidebarContent = (
    <>
      <div className="p-6 border-b dark:border-slate-700/60 flex items-center justify-center">
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

      <div className="p-4 border-t dark:border-slate-700/60">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
          {t('nav.logout')}
        </Button>
      </div>
    </>
  );

  const isRtl = i18n.dir() === 'rtl';

  return (
    <>
      {/* Desktop sidebar */}
      <div className={cn(
        "hidden md:flex w-64 bg-white dark:bg-[#0e1118] h-screen flex-col fixed top-0 z-30 shadow-lg dark:shadow-slate-950/50",
        isRtl
          ? "border-l dark:border-slate-700/60 right-0"
          : "border-r dark:border-slate-700/60 left-0"
      )}>
        {sidebarContent}
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={isMobileOpen} onOpenChange={(open) => !open && closeMobile()}>
        <SheetContent side={isRtl ? "right" : "left"} className="w-64 p-0 flex flex-col">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}