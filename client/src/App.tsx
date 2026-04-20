import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";  // Add this import
import { SidebarProvider } from "@/components/sidebar-context";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import RegisterSelection from "@/pages/auth/RegisterSelection";
import ExpertRegister from "@/pages/auth/ExpertRegister";
import OECRegister from "@/pages/auth/OECRegister";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import OTPVerification from "@/pages/auth/OTPVerification";
import NewPassword from "@/pages/auth/NewPassword";
import RegistrationSuccess from "@/pages/auth/RegistrationSuccess";
import For28SubmissionPage from "@/pages/auth/For28SubmissionPage";
import OECDashboard from "@/pages/oec/Dashboard";
import NewRequestPage from "@/pages/oec/NewRequestPage";
import PaymentPage from "@/pages/oec/PaymentPage";
import PaymentsListPage from "@/pages/oec/PaymentsListPage";
import MyRequestsPage from "@/pages/oec/MyRequestsPage";
import RequestDetailPage from "@/pages/oec/RequestDetailPage";
import ValidateQuotationPage from "@/pages/oec/ValidateQuotationPage";
import CorrectRequestPage from "@/pages/oec/CorrectRequestPage";
import ValidateTeamPage from "@/pages/oec/ValidateTeamPage";
import DocumentaryResponsePage from "@/pages/oec/DocumentaryResponsePage";
import ActionPlansPage from "@/pages/oec/ActionPlansPage";
import LiftObstaclesPage from "@/pages/oec/LiftObstaclesPage";
import RADashboard from "@/pages/ra/Dashboard";
import RAFeasibilityPage from "@/pages/ra/FeasibilityPage";
import QuotationConventionPage from "@/pages/ra/QuotationConventionPage";
import CDDashboard from "@/pages/cd/Dashboard";
import CDManageRequestsPage from "@/pages/cd/ManageRequestsPage";
import DAGDashboard from "@/pages/dag/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import DashboardPage from "@/pages/dashboard-page";
import CandidaturesOECPage from "@/pages/dt/CandidaturesOECPage";
import CandidaturesPage from "@/pages/dt/CandidaturesPage";
import UsersManagementPage from "@/pages/admin/UsersManagementPage";
import UtilisateursPendingPage from "@/pages/admin/UtilisateursPendingPage";
import CDAccreditations from "@/pages/cd/Accreditations";
import CDDocumentaryDecisionPage from "@/pages/cd/DocumentaryDecisionPage";
import TeamCompositionPage from "@/pages/ra/TeamCompositionPage";
import DocumentaryReviewPage from "@/pages/ra/DocumentaryReviewPage";
import EvaluationPrepPage from "@/pages/ra/EvaluationPrepPage";
import GapsManagementPage from "@/pages/ra/GapsManagementPage";
import ReportValidationPage from "@/pages/ra/ReportValidationPage";
import CASPreparationPage from "@/pages/ra/CASPreparationPage";
import ExpertDashboard from "@/pages/exp/Dashboard";
import ExpertPlanningPage from "@/pages/exp/PlanningPage";
import ExpertCommitmentsPage from "@/pages/exp/CommitmentsPage";
import ExpertDocumentaryAnalysisPage from "@/pages/exp/DocumentaryAnalysisPage";
import ExpertEvaluationDayPage from "@/pages/exp/EvaluationDayPage";
import ExpertReportDraftingPage from "@/pages/exp/ReportDraftingPage";
import DTMissionOrdersPage from "@/pages/dt/MissionOrdersPage";
import REEDashboard from "@/pages/ree/Dashboard";
import REEEvaluationPlanPage from "@/pages/ree/EvaluationPlanPage";
import ETDashboard from "@/pages/et/Dashboard";
import ETGapEvaluationPage from "@/pages/et/GapEvaluationPage";
import EQDashboard from "@/pages/eq/Dashboard";
import CASMemberDashboard from "@/pages/cas/MemberDashboard";
import CASPresidentDashboard from "@/pages/cas/PresidentDashboard";
import DGDashboard from "@/pages/dg/Dashboard";
import DGMissionOrdersPage from "@/pages/dg/MissionOrdersPage";
import GesCompetencesDashboard from "@/pages/ges_competences/Dashboard";
import GCCandidaturesPage from "@/pages/ges_competences/CandidaturesPage";
import InterviewPlanningPage from "@/pages/ges_competences/InterviewPlanningPage";
import InterviewEvaluationPage from "@/pages/ges_competences/InterviewEvaluationPage";
import QualificationsPage from "@/pages/ges_competences/QualificationsPage";
import CommissionPage from "@/pages/ges_competences/CommissionPage";
import ObservationsPage from "@/pages/ges_competences/ObservationsPage";
import SurveillanceQualPage from "@/pages/ges_competences/SurveillancePage";

// Phase II - Évaluation sur site
import SiteEvaluationPage from "@/pages/ree/SiteEvaluationPage";
import GapResponsePage from "@/pages/oec/GapResponsePage";
import OECGapReviewPage from "@/pages/oec/OECGapReviewPage";
import EvaluationOversightPage from "@/pages/cd/EvaluationOversightPage";
import GapTreatmentPage from "@/pages/ree/GapTreatmentPage";

// Phase III - Décision d'accréditation & Certificat
import ReportDraftingPage from "@/pages/ree/ReportDraftingPage";
import AccreditationDecisionPage from "@/pages/ra/AccreditationDecisionPage";

// Phase IV - Surveillance périodique
import SurveillanceManagementPage from "@/pages/ra/SurveillanceManagementPage";
import ExpertDirectoryPage from "@/pages/ra/ExpertDirectoryPage";
import NotificationsPage from "@/pages/notifications-page";

// Complaints system
import PublicComplaintPage from "@/pages/complaints/PublicComplaintPage";
import InternalComplaintsPage from "@/pages/complaints/InternalComplaintsPage";
import RQComplaintsDashboard from "@/pages/rq/ComplaintsDashboard";

// DAG Payment Tracking
import DAGPaymentTracking from "@/pages/dag/PaymentTrackingPage";
import DAGOECApplicationsPage from "@/pages/dag/OECApplicationsPage";

// RA Recusation
import RecusationAnalysisPage from "@/pages/ra/RecusationAnalysisPage";

// Étape 6 - Préparation de l'Évaluation
import CDEvaluationPrepPage from "@/pages/cd/EvaluationPrepPage";
import MandateMeetingsPage from "@/pages/shared/MandateMeetingsPage";

// New procedure pages (PRO_13-1, PRO_17, PRO_18, PRO_19, PRO_26, PRO_29, PRO_30, PRO_31)
import SamplingPage from "@/pages/cd/SamplingPage";
import DomainDevelopmentPage from "@/pages/cd/DomainDevelopmentPage";
import TariffPage from "@/pages/dag/TariffPage";
import ReferenceRulesPage from "@/pages/cd/ReferenceRulesPage";
import MultiSitePage from "@/pages/cd/MultiSitePage";
import RemoteEvaluationPage from "@/pages/cd/RemoteEvaluationPage";
import RiskOpportunityPage from "@/pages/admin/RiskOpportunityPage";
import AccreditationTransferPage from "@/pages/cd/AccreditationTransferPage";
import OECTransferRequestPage from "@/pages/oec/TransferRequestPage";
import TransferDecisionPage from "@/pages/cas/TransferDecisionPage";

// Missing sidebar pages
import OECDocumentsPage from "@/pages/oec/DocumentsPage";
import OECCertificatesPage from "@/pages/oec/CertificatesPage";
import OECProfilePage from "@/pages/oec/ProfilePage";
import RAQuotesPage from "@/pages/ra/QuotesPage";
import RADossiersPage from "@/pages/ra/DossiersPage";
import RAPlanningPage from "@/pages/ra/PlanningPage";
import DTDashboard from "@/pages/dt/Dashboard";
import DTRequestReviewPage from "@/pages/dt/RequestReviewPage";
import CertificateSigningPage from "@/pages/shared/CertificateSigningPage";
import InterviewPanelPage from "@/pages/shared/InterviewPanelPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/auth/register" component={RegisterSelection} />
      <Route path="/auth/register/expert" component={ExpertRegister} />
      <Route path="/auth/register/oec" component={OECRegister} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/verify-otp" component={OTPVerification} />
      <Route path="/auth/new-password" component={NewPassword} />
      <Route path="/auth/success" component={RegistrationSuccess} />
      
      {/* Public routes (no auth required) */}
      <Route path="/complaints/public" component={PublicComplaintPage} />
      <Route path="/for28/:token" component={For28SubmissionPage} />
      
      {/* OEC Routes */}
      <Route path="/oec" component={OECDashboard} />
      <Route path="/oec/dashboard" component={OECDashboard} />
      <Route path="/oec/new-request" component={NewRequestPage} />
      <Route path="/oec/nouvelle-demande" component={NewRequestPage} />
      <Route path="/oec/mes-demandes" component={MyRequestsPage} />
      <Route path="/oec/payments" component={PaymentsListPage} />
      <Route path="/oec/payment/:requestId" component={PaymentPage} />
      <Route path="/oec/paiement/:requestId" component={PaymentPage} />
      <Route path="/oec/demandes/:requestId/validation" component={ValidateQuotationPage} />
      <Route path="/oec/demandes/:requestId/corriger" component={CorrectRequestPage} />
      <Route path="/oec/demandes/:requestId/equipe" component={ValidateTeamPage} />
      <Route path="/oec/demandes/:requestId/reponse-documentaire" component={DocumentaryResponsePage} />
      <Route path="/oec/demandes/:requestId/plans-actions" component={ActionPlansPage} />
      <Route path="/oec/demandes/:requestId/lever-obstacles" component={LiftObstaclesPage} />
      <Route path="/oec/demandes/:requestId" component={RequestDetailPage} />
      <Route path="/oec/reponse-ecarts" component={GapResponsePage} />
      <Route path="/oec/revue-ecarts" component={OECGapReviewPage} />
      <Route path="/oec/documents" component={OECDocumentsPage} />
      <Route path="/oec/certificates" component={OECCertificatesPage} />
      <Route path="/oec/transfert" component={OECTransferRequestPage} />
      <Route path="/oec/profile" component={OECProfilePage} />
      
      {/* RA Routes */}
      <Route path="/ra" component={RADashboard} />
      <Route path="/ra/dashboard" component={RADashboard} />
      <Route path="/ra/faisabilite" component={RAFeasibilityPage} />
      <Route path="/ra/demandes/:requestId/devis" component={QuotationConventionPage} />
      <Route path="/ra/equipes" component={TeamCompositionPage} />
      <Route path="/ra/recusations" component={RecusationAnalysisPage} />
      <Route path="/ra/revue-documentaire" component={DocumentaryReviewPage} />
      <Route path="/ra/preparation-evaluation" component={EvaluationPrepPage} />
      <Route path="/ra/gestion-ecarts" component={GapsManagementPage} />
      <Route path="/ra/rapports" component={ReportValidationPage} />
      <Route path="/ra/preparation-cas" component={CASPreparationPage} />
      <Route path="/ra/decision-accreditation" component={AccreditationDecisionPage} />
      <Route path="/ra/surveillance" component={SurveillanceManagementPage} />
      <Route path="/ra/experts" component={ExpertDirectoryPage} />
      <Route path="/ra/quotes" component={RAQuotesPage} />
      <Route path="/ra/dossiers" component={RADossiersPage} />
      <Route path="/ra/planning" component={RAPlanningPage} />
      <Route path="/ra/entretiens-candidats" component={InterviewPanelPage} />
      
      {/* CD Routes */}
      <Route path="/cd" component={CDDashboard} />
      <Route path="/cd/dashboard" component={CDDashboard} />
      <Route path="/cd/manage-requests" component={CDManageRequestsPage} />
      <Route path="/cd/gerer-demandes" component={CDManageRequestsPage} />
      <Route path="/cd/accreditations" component={CDAccreditations} />
      <Route path="/cd/pilotage-evaluation" component={EvaluationOversightPage} />
      <Route path="/cd/revue-documentaire" component={CDDocumentaryDecisionPage} />
      <Route path="/cd/preparation-evaluation" component={CDEvaluationPrepPage} />
      <Route path="/cd/traitement-ecarts" component={GapTreatmentPage} />
      <Route path="/cd/echantillonnage" component={SamplingPage} />
      <Route path="/cd/developpement-domaines" component={DomainDevelopmentPage} />
      <Route path="/cd/regles-reference" component={ReferenceRulesPage} />
      <Route path="/cd/multi-sites" component={MultiSitePage} />
      <Route path="/cd/evaluation-distance" component={RemoteEvaluationPage} />
      <Route path="/cd/transferts" component={AccreditationTransferPage} />
      <Route path="/cd/entretiens-candidats" component={InterviewPanelPage} />
      
      {/* DAG Routes */}
      <Route path="/dag" component={DAGDashboard} />
      <Route path="/dag/dashboard" component={DAGDashboard} />
      <Route path="/dag/paiements" component={DAGPaymentTracking} />
      <Route path="/dag/candidatures-oec" component={DAGOECApplicationsPage} />
      <Route path="/dag/tarifs" component={TariffPage} />
      
      {/* Admin & Other Routes */}
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/users" component={UsersManagementPage} />
      <Route path="/admin/utilisateurs" component={UsersManagementPage} />
      <Route path="/admin/utilisateurs-pending" component={UtilisateursPendingPage} />
      <Route path="/risques-opportunites" component={RiskOpportunityPage} />
      <Route path="/dt" component={DTDashboard} />
      <Route path="/dt/dashboard" component={DTDashboard} />
      <Route path="/dt/demandes-accreditation" component={DTRequestReviewPage} />
      <Route path="/dt/candidatures-oec" component={CandidaturesOECPage} />
      <Route path="/dt/candidatures" component={CandidaturesPage} />
      <Route path="/dt/ordres-mission" component={DTMissionOrdersPage} />
      <Route path="/dt/certificats" component={CertificateSigningPage} />
      <Route path="/dt/entretiens-candidats" component={InterviewPanelPage} />
      
      {/* Expert Routes */}
      <Route path="/expert" component={ExpertDashboard} />
      <Route path="/expert/dashboard" component={ExpertDashboard} />
      <Route path="/expert/planning" component={ExpertPlanningPage} />
      <Route path="/expert/engagements" component={ExpertCommitmentsPage} />
      <Route path="/expert/revue-documentaire" component={ExpertDocumentaryAnalysisPage} />
      <Route path="/expert/evaluation" component={ExpertEvaluationDayPage} />
      <Route path="/expert/rapports" component={ExpertReportDraftingPage} />
      <Route path="/expert/mandatements" component={MandateMeetingsPage} />
      
      {/* REE Routes */}
      <Route path="/ree" component={REEDashboard} />
      <Route path="/ree/dashboard" component={REEDashboard} />
      <Route path="/ree/planning" component={ExpertPlanningPage} />
      <Route path="/ree/engagements" component={ExpertCommitmentsPage} />
      <Route path="/ree/revue-documentaire" component={ExpertDocumentaryAnalysisPage} />
      <Route path="/ree/mandatements" component={MandateMeetingsPage} />
      <Route path="/ree/plan-evaluation" component={REEEvaluationPlanPage} />
      <Route path="/ree/rapports" component={ExpertReportDraftingPage} />
      <Route path="/ree/evaluation-site" component={SiteEvaluationPage} />
      <Route path="/ree/traitement-ecarts" component={GapTreatmentPage} />
      <Route path="/ree/redaction-rapport" component={ReportDraftingPage} />
      
      {/* ET Routes */}
      <Route path="/et" component={ETDashboard} />
      <Route path="/et/dashboard" component={ETDashboard} />
      <Route path="/et/planning" component={ExpertPlanningPage} />
      <Route path="/et/engagements" component={ExpertCommitmentsPage} />
      <Route path="/et/revue-documentaire" component={ExpertDocumentaryAnalysisPage} />
      <Route path="/et/mandatements" component={MandateMeetingsPage} />
      <Route path="/et/evaluation" component={ExpertEvaluationDayPage} />
      <Route path="/et/traitement-ecarts" component={GapTreatmentPage} />
      <Route path="/et/evaluation-plans" component={ETGapEvaluationPage} />
      
      {/* EQ Routes */}
      <Route path="/eq" component={EQDashboard} />
      <Route path="/eq/dashboard" component={EQDashboard} />
      <Route path="/eq/planning" component={ExpertPlanningPage} />
      <Route path="/eq/engagements" component={ExpertCommitmentsPage} />
      <Route path="/eq/revue-documentaire" component={ExpertDocumentaryAnalysisPage} />
      <Route path="/eq/mandatements" component={MandateMeetingsPage} />
      <Route path="/eq/evaluation" component={ExpertEvaluationDayPage} />
      <Route path="/eq/traitement-ecarts" component={GapTreatmentPage} />
      
      {/* CAS Member Routes */}
      <Route path="/cas" component={CASMemberDashboard} />
      <Route path="/cas/dashboard" component={CASMemberDashboard} />
      <Route path="/cas/reunions" component={CASMemberDashboard} />
      <Route path="/cas/transferts" component={TransferDecisionPage} />
      
      {/* CAS President Routes */}
      <Route path="/cas-president" component={CASPresidentDashboard} />
      <Route path="/cas-president/dashboard" component={CASPresidentDashboard} />
      <Route path="/cas-president/reunions" component={CASPresidentDashboard} />
      <Route path="/cas-president/decisions" component={CASPresidentDashboard} />
      <Route path="/cas-president/transferts" component={TransferDecisionPage} />
      
      {/* DG Routes */}
      <Route path="/dg" component={DGDashboard} />
      <Route path="/dg/dashboard" component={DGDashboard} />
      <Route path="/dg/ordres-mission" component={DGMissionOrdersPage} />
      <Route path="/dg/certificats" component={CertificateSigningPage} />
      
      {/* GES_COMPETENCES Routes */}
      <Route path="/ges-competences" component={GesCompetencesDashboard} />
      <Route path="/ges-competences/dashboard" component={GesCompetencesDashboard} />
      <Route path="/ges-competences/candidatures" component={GCCandidaturesPage} />
      <Route path="/ges-competences/entretiens" component={InterviewPlanningPage} />
      <Route path="/ges-competences/entretien/:id" component={InterviewEvaluationPage} />
      <Route path="/ges-competences/qualifications" component={QualificationsPage} />
      <Route path="/ges-competences/commission" component={CommissionPage} />
      <Route path="/ges-competences/observations" component={ObservationsPage} />
      <Route path="/ges-competences/surveillance" component={SurveillanceQualPage} />
      
      {/* RQ Routes */}
      <Route path="/rq" component={RQComplaintsDashboard} />
      <Route path="/rq/dashboard" component={RQComplaintsDashboard} />
      <Route path="/rq/plaintes" component={RQComplaintsDashboard} />
      <Route path="/rq/entretiens-candidats" component={InterviewPanelPage} />
      
      {/* Complaints (internal - for authenticated roles) */}
      <Route path="/complaints/internal" component={InternalComplaintsPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>  {/* Add this wrapper */}
          <SidebarProvider>
            <Toaster />
            <Router />
          </SidebarProvider>
        </AuthProvider>  {/* Close it here */}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;