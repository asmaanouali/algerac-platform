import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";  // Add this import
import { SidebarProvider } from "@/components/sidebar-context";
import { ThemeProvider } from "@/hooks/use-theme";
import { HardcodedI18nBridge } from "@/components/HardcodedI18nBridge";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import CDRAWorkloadPage from "@/pages/cd/RAWorkloadPage";
import DAGDashboard from "@/pages/dag/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import DashboardPage from "@/pages/dashboard-page";
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
import DGTransferOverviewPage from "@/pages/dg/TransferOverviewPage";
import GesCompetencesDashboard from "@/pages/ges_competences/Dashboard";
import GCCandidaturesPage from "@/pages/ges_competences/CandidaturesPage";
import CandidatureDetailPage from "@/pages/ges_competences/CandidatureDetailPage";
import InterviewPlanningPage from "@/pages/ges_competences/InterviewPlanningPage";
import InterviewEvaluationPage from "@/pages/ges_competences/InterviewEvaluationPage";
import QualificationsPage from "@/pages/ges_competences/QualificationsPage";
import ObservationsPage from "@/pages/ges_competences/ObservationsPage";
import SurveillanceQualPage from "@/pages/ges_competences/SurveillancePage";

import EFPipelinePage from "@/pages/ges_competences/EFPipelinePage";
import MyQualificationJourneyPage from "@/pages/shared/MyQualificationJourneyPage";
import SupDashboard from "@/pages/sup/Dashboard";
import SupMyPlanPage from "@/pages/sup/MyPlanPage";
import SupervisionFormPage from "@/pages/sup/SupervisionFormPage";
import EFDashboard from "@/pages/ef/Dashboard";

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
import OECSurveillancePage from "@/pages/oec/SurveillancePage";
import CDSurveillancePage from "@/pages/cd/SurveillancePage";
import ExpertDirectoryPage from "@/pages/ra/ExpertDirectoryPage";
import NotificationsPage from "@/pages/notifications-page";

// Complaints system
import PublicComplaintPage from "@/pages/complaints/PublicComplaintPage";
import PublicTrackingPage from "@/pages/complaints/PublicTrackingPage";
import InternalComplaintsPage from "@/pages/complaints/InternalComplaintsPage";
import RQComplaintsDashboard from "@/pages/rq/ComplaintsDashboard";
import RQDashboard from "@/pages/rq/Dashboard";
import ConsolidationDashboard from "@/pages/consolidation/Dashboard";

// DAG Payment Tracking
import DAGPaymentTracking from "@/pages/dag/PaymentTrackingPage";
import DAGOECApplicationsPage from "@/pages/dag/OECApplicationsPage";
import DAGRegistrationFeesPage from "@/pages/dag/RegistrationFeesPage";
import DAGQuotationFixingPage from "@/pages/dag/QuotationFixingPage";

// RA Recusation
import RecusationAnalysisPage from "@/pages/ra/RecusationAnalysisPage";

// Étape 6 - Préparation de l'Évaluation
import CDEvaluationPrepPage from "@/pages/cd/EvaluationPrepPage";
import MandateMeetingsPage from "@/pages/shared/MandateMeetingsPage";

// New procedure pages (PRO_13-1, PRO_17, PRO_18, PRO_19, PRO_26, PRO_29, PRO_30, PRO_31)
import SamplingPage from "@/pages/cd/SamplingPage";
import TariffPage from "@/pages/dag/TariffPage";
import AccreditationTransferPage from "@/pages/cd/AccreditationTransferPage";

import TransferDecisionPage from "@/pages/cas/TransferDecisionPage";
import CommitteeManagementPage from "@/pages/admin/CommitteeManagementPage";

// Missing sidebar pages
import OECDocumentsPage from "@/pages/oec/DocumentsPage";
import OECCertificatesPage from "@/pages/oec/CertificatesPage";
import RAQuotesPage from "@/pages/ra/QuotesPage";
import RAPlanningPage from "@/pages/ra/PlanningPage";
import DTDashboard from "@/pages/dt/Dashboard";
import DTRequestReviewPage from "@/pages/dt/RequestReviewPage";
import DTAccreditationRequestsPage from "@/pages/dt/AccreditationRequestsPage";
import DTRequestDetailPage from "@/pages/dt/RequestDetailPage";
import CDRequestDetailPage from "@/pages/cd/RequestDetailPage";
import DTOECApplicationDetailPage from "@/pages/dt/OECApplicationDetailPage";
import CertificateSigningPage from "@/pages/shared/CertificateSigningPage";
import InterviewPanelPage from "@/pages/shared/InterviewPanelPage";
import { usePageTitle } from "@/hooks/use-page-title";

function Router() {
  usePageTitle();
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
      <Route path="/complaints/track" component={PublicTrackingPage} />
      <Route path="/for28/:token" component={For28SubmissionPage} />
      
      {/* OEC Routes */}
      <Route path="/oec">{() => <ProtectedRoute component={OECDashboard} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/dashboard">{() => <ProtectedRoute component={OECDashboard} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/new-request">{() => <ProtectedRoute component={NewRequestPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/nouvelle-demande">{() => <ProtectedRoute component={NewRequestPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/mes-demandes">{() => <ProtectedRoute component={MyRequestsPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/payments">{() => <ProtectedRoute component={PaymentsListPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/payment/:requestId">{() => <ProtectedRoute component={PaymentPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/paiement/:requestId">{() => <ProtectedRoute component={PaymentPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/demandes/:requestId/validation">{() => <ProtectedRoute component={ValidateQuotationPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/demandes/:requestId/corriger">{() => <ProtectedRoute component={CorrectRequestPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/demandes/:requestId/equipe">{() => <ProtectedRoute component={ValidateTeamPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/demandes/:requestId/reponse-documentaire">{() => <ProtectedRoute component={DocumentaryResponsePage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/demandes/:requestId/plans-actions">{() => <ProtectedRoute component={ActionPlansPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/demandes/:requestId/lever-obstacles">{() => <ProtectedRoute component={LiftObstaclesPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/demandes/:requestId">{() => <ProtectedRoute component={RequestDetailPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/reponse-ecarts">{() => <ProtectedRoute component={GapResponsePage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/revue-ecarts">{() => <ProtectedRoute component={OECGapReviewPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/documents">{() => <ProtectedRoute component={OECDocumentsPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/certificates">{() => <ProtectedRoute component={OECCertificatesPage} allowedRoles={["oec"]} />}</Route>
      <Route path="/oec/surveillance">{() => <ProtectedRoute component={OECSurveillancePage} allowedRoles={["oec"]} />}</Route>
      
      {/* RA Routes */}
      <Route path="/ra">{() => <ProtectedRoute component={RADashboard} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/dashboard">{() => <ProtectedRoute component={RADashboard} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/faisabilite">{() => <ProtectedRoute component={RAFeasibilityPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/demandes/:requestId/devis">{() => <ProtectedRoute component={QuotationConventionPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/equipes">{() => <ProtectedRoute component={TeamCompositionPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/recusations">{() => <ProtectedRoute component={RecusationAnalysisPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/revue-documentaire">{() => <ProtectedRoute component={DocumentaryReviewPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/preparation-evaluation">{() => <ProtectedRoute component={EvaluationPrepPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/gestion-ecarts">{() => <ProtectedRoute component={GapsManagementPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/rapports">{() => <ProtectedRoute component={ReportValidationPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/preparation-cas">{() => <ProtectedRoute component={CASPreparationPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/decision-accreditation">{() => <ProtectedRoute component={AccreditationDecisionPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/surveillance">{() => <ProtectedRoute component={SurveillanceManagementPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/experts">{() => <ProtectedRoute component={ExpertDirectoryPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/quotes">{() => <ProtectedRoute component={RAQuotesPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/planning">{() => <ProtectedRoute component={RAPlanningPage} allowedRoles={["ra"]} />}</Route>
      <Route path="/ra/entretiens-candidats">{() => <ProtectedRoute component={InterviewPanelPage} allowedRoles={["ra"]} />}</Route>
      
      {/* CD Routes */}
      <Route path="/cd">{() => <ProtectedRoute component={CDDashboard} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/dashboard">{() => <ProtectedRoute component={CDDashboard} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/manage-requests">{() => <ProtectedRoute component={CDManageRequestsPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/gerer-demandes">{() => <ProtectedRoute component={CDManageRequestsPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/ra-workload">{() => <ProtectedRoute component={CDRAWorkloadPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/responsables">{() => <ProtectedRoute component={CDRAWorkloadPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/accreditations">{() => <ProtectedRoute component={CDAccreditations} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/pilotage-evaluation">{() => <ProtectedRoute component={EvaluationOversightPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/revue-documentaire">{() => <ProtectedRoute component={CDDocumentaryDecisionPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/preparation-evaluation">{() => <ProtectedRoute component={CDEvaluationPrepPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/traitement-ecarts">{() => <ProtectedRoute component={GapTreatmentPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/echantillonnage">{() => <ProtectedRoute component={SamplingPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/transferts">{() => <ProtectedRoute component={AccreditationTransferPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/surveillance">{() => <ProtectedRoute component={CDSurveillancePage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/entretiens-candidats">{() => <ProtectedRoute component={InterviewPanelPage} allowedRoles={["cd"]} />}</Route>
      <Route path="/cd/demande/:requestId">{() => <ProtectedRoute component={CDRequestDetailPage} allowedRoles={["cd"]} />}</Route>
      
      {/* DAG Routes */}
      <Route path="/dag">{() => <ProtectedRoute component={DAGDashboard} allowedRoles={["dag"]} />}</Route>
      <Route path="/dag/dashboard">{() => <ProtectedRoute component={DAGDashboard} allowedRoles={["dag"]} />}</Route>
      <Route path="/dag/paiements">{() => <ProtectedRoute component={DAGPaymentTracking} allowedRoles={["dag"]} />}</Route>
      <Route path="/dag/frais-enregistrement">{() => <ProtectedRoute component={DAGRegistrationFeesPage} allowedRoles={["dag"]} />}</Route>
      <Route path="/dag/fixation-devis">{() => <ProtectedRoute component={DAGQuotationFixingPage} allowedRoles={["dag"]} />}</Route>
      <Route path="/dag/candidatures-oec">{() => <ProtectedRoute component={DAGOECApplicationsPage} allowedRoles={["dag"]} />}</Route>
      <Route path="/dag/tarifs">{() => <ProtectedRoute component={TariffPage} allowedRoles={["dag"]} />}</Route>
      
      {/* Admin & Other Routes */}
      <Route path="/notifications">{() => <ProtectedRoute component={NotificationsPage} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}</Route>
      <Route path="/dashboard">{() => <ProtectedRoute component={DashboardPage} />}</Route>
      <Route path="/users">{() => <ProtectedRoute component={UsersManagementPage} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/utilisateurs">{() => <ProtectedRoute component={UsersManagementPage} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/utilisateurs-pending">{() => <ProtectedRoute component={UtilisateursPendingPage} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/comites-cas">{() => <ProtectedRoute component={CommitteeManagementPage} allowedRoles={["admin", "cd"]} />}</Route>
      <Route path="/dt">{() => <ProtectedRoute component={DTDashboard} allowedRoles={["dt"]} />}</Route>
      <Route path="/dt/dashboard">{() => <ProtectedRoute component={DTDashboard} allowedRoles={["dt"]} />}</Route>
      <Route path="/dt/demandes-accreditation">{() => <ProtectedRoute component={DTAccreditationRequestsPage} allowedRoles={["dt"]} />}</Route>
      <Route path="/dt/demande/:requestId">{() => <ProtectedRoute component={DTRequestDetailPage} allowedRoles={["dt"]} />}</Route>
      <Route path="/dt/candidature-oec/:id">{() => <ProtectedRoute component={DTOECApplicationDetailPage} allowedRoles={["dt"]} />}</Route>
      <Route path="/dt/candidatures-oec">{() => <ProtectedRoute component={DTAccreditationRequestsPage} allowedRoles={["dt"]} />}</Route>
      <Route path="/dt/demandes-accreditation-legacy">{() => <ProtectedRoute component={DTRequestReviewPage} allowedRoles={["dt"]} />}</Route>
      <Route path="/dt/candidatures">{() => <ProtectedRoute component={CandidaturesPage} allowedRoles={["dt"]} />}</Route>
      <Route path="/dt/ordres-mission">{() => <ProtectedRoute component={DTMissionOrdersPage} allowedRoles={["dt"]} />}</Route>
      <Route path="/dt/certificats">{() => <ProtectedRoute component={CertificateSigningPage} allowedRoles={["dt"]} />}</Route>
      <Route path="/dt/entretiens-candidats">{() => <ProtectedRoute component={InterviewPanelPage} allowedRoles={["dt"]} />}</Route>
      
      {/* Expert Routes */}
      <Route path="/expert">{() => <ProtectedRoute component={ExpertDashboard} allowedRoles={["expert"]} />}</Route>
      <Route path="/expert/dashboard">{() => <ProtectedRoute component={ExpertDashboard} allowedRoles={["expert"]} />}</Route>
      <Route path="/expert/planning">{() => <ProtectedRoute component={ExpertPlanningPage} allowedRoles={["expert"]} />}</Route>
      <Route path="/expert/engagements">{() => <ProtectedRoute component={ExpertCommitmentsPage} allowedRoles={["expert"]} />}</Route>
      <Route path="/expert/revue-documentaire">{() => <ProtectedRoute component={ExpertDocumentaryAnalysisPage} allowedRoles={["expert"]} />}</Route>
      <Route path="/expert/evaluation">{() => <ProtectedRoute component={ExpertEvaluationDayPage} allowedRoles={["expert"]} />}</Route>
      <Route path="/expert/rapports">{() => <ProtectedRoute component={ExpertReportDraftingPage} allowedRoles={["expert"]} />}</Route>
      <Route path="/expert/mandatements">{() => <ProtectedRoute component={MandateMeetingsPage} allowedRoles={["expert"]} />}</Route>
      
      {/* REE Routes */}
      <Route path="/ree">{() => <ProtectedRoute component={REEDashboard} allowedRoles={["ree"]} />}</Route>
      <Route path="/ree/dashboard">{() => <ProtectedRoute component={REEDashboard} allowedRoles={["ree"]} />}</Route>
      <Route path="/ree/planning">{() => <ProtectedRoute component={ExpertPlanningPage} allowedRoles={["ree"]} />}</Route>
      <Route path="/ree/engagements">{() => <ProtectedRoute component={ExpertCommitmentsPage} allowedRoles={["ree"]} />}</Route>
      <Route path="/ree/revue-documentaire">{() => <ProtectedRoute component={ExpertDocumentaryAnalysisPage} allowedRoles={["ree"]} />}</Route>
      <Route path="/ree/mandatements">{() => <ProtectedRoute component={MandateMeetingsPage} allowedRoles={["ree"]} />}</Route>
      <Route path="/ree/plan-evaluation">{() => <ProtectedRoute component={REEEvaluationPlanPage} allowedRoles={["ree"]} />}</Route>
      <Route path="/ree/rapports">{() => <ProtectedRoute component={ExpertReportDraftingPage} allowedRoles={["ree"]} />}</Route>
      <Route path="/ree/evaluation-site">{() => <ProtectedRoute component={SiteEvaluationPage} allowedRoles={["ree"]} />}</Route>
      <Route path="/ree/traitement-ecarts">{() => <ProtectedRoute component={GapTreatmentPage} allowedRoles={["ree"]} />}</Route>
      <Route path="/ree/redaction-rapport">{() => <ProtectedRoute component={ReportDraftingPage} allowedRoles={["ree"]} />}</Route>
      
      {/* ET Routes */}
      <Route path="/et">{() => <ProtectedRoute component={ETDashboard} allowedRoles={["et"]} />}</Route>
      <Route path="/et/dashboard">{() => <ProtectedRoute component={ETDashboard} allowedRoles={["et"]} />}</Route>
      <Route path="/et/planning">{() => <ProtectedRoute component={ExpertPlanningPage} allowedRoles={["et"]} />}</Route>
      <Route path="/et/engagements">{() => <ProtectedRoute component={ExpertCommitmentsPage} allowedRoles={["et"]} />}</Route>
      <Route path="/et/revue-documentaire">{() => <ProtectedRoute component={ExpertDocumentaryAnalysisPage} allowedRoles={["et"]} />}</Route>
      <Route path="/et/mandatements">{() => <ProtectedRoute component={MandateMeetingsPage} allowedRoles={["et"]} />}</Route>
      <Route path="/et/evaluation">{() => <ProtectedRoute component={ExpertEvaluationDayPage} allowedRoles={["et"]} />}</Route>
      <Route path="/et/traitement-ecarts">{() => <ProtectedRoute component={GapTreatmentPage} allowedRoles={["et"]} />}</Route>
      <Route path="/et/evaluation-plans">{() => <ProtectedRoute component={ETGapEvaluationPage} allowedRoles={["et"]} />}</Route>
      
      {/* EQ Routes */}
      <Route path="/eq">{() => <ProtectedRoute component={EQDashboard} allowedRoles={["eq"]} />}</Route>
      <Route path="/eq/dashboard">{() => <ProtectedRoute component={EQDashboard} allowedRoles={["eq"]} />}</Route>
      <Route path="/eq/planning">{() => <ProtectedRoute component={ExpertPlanningPage} allowedRoles={["eq"]} />}</Route>
      <Route path="/eq/engagements">{() => <ProtectedRoute component={ExpertCommitmentsPage} allowedRoles={["eq"]} />}</Route>
      <Route path="/eq/revue-documentaire">{() => <ProtectedRoute component={ExpertDocumentaryAnalysisPage} allowedRoles={["eq"]} />}</Route>
      <Route path="/eq/mandatements">{() => <ProtectedRoute component={MandateMeetingsPage} allowedRoles={["eq"]} />}</Route>
      <Route path="/eq/evaluation">{() => <ProtectedRoute component={ExpertEvaluationDayPage} allowedRoles={["eq"]} />}</Route>
      <Route path="/eq/traitement-ecarts">{() => <ProtectedRoute component={GapTreatmentPage} allowedRoles={["eq"]} />}</Route>
      
      {/* CAS Member Routes */}
      <Route path="/cas">{() => <ProtectedRoute component={CASMemberDashboard} allowedRoles={["cas_member"]} />}</Route>
      <Route path="/cas/dashboard">{() => <ProtectedRoute component={CASMemberDashboard} allowedRoles={["cas_member"]} />}</Route>
      <Route path="/cas/reunions">{() => <ProtectedRoute component={CASMemberDashboard} allowedRoles={["cas_member"]} />}</Route>
      <Route path="/cas/transferts">{() => <ProtectedRoute component={TransferDecisionPage} allowedRoles={["cas_member", "cas_president"]} />}</Route>
      
      {/* CAS President Routes */}
      <Route path="/cas-president">{() => <ProtectedRoute component={CASPresidentDashboard} allowedRoles={["cas_president"]} />}</Route>
      <Route path="/cas-president/dashboard">{() => <ProtectedRoute component={CASPresidentDashboard} allowedRoles={["cas_president"]} />}</Route>
      <Route path="/cas-president/reunions">{() => <ProtectedRoute component={CASPresidentDashboard} allowedRoles={["cas_president"]} />}</Route>
      <Route path="/cas-president/decisions">{() => <ProtectedRoute component={CASPresidentDashboard} allowedRoles={["cas_president"]} />}</Route>
      <Route path="/cas-president/transferts">{() => <ProtectedRoute component={TransferDecisionPage} allowedRoles={["cas_president"]} />}</Route>
      <Route path="/cas-president/comites">{() => <ProtectedRoute component={CommitteeManagementPage} allowedRoles={["cas_president", "admin", "cd"]} />}</Route>
      
      {/* DG Routes */}
      <Route path="/dg">{() => <ProtectedRoute component={DGDashboard} allowedRoles={["dg"]} />}</Route>
      <Route path="/dg/dashboard">{() => <ProtectedRoute component={DGDashboard} allowedRoles={["dg"]} />}</Route>
      <Route path="/dg/ordres-mission">{() => <ProtectedRoute component={DGMissionOrdersPage} allowedRoles={["dg"]} />}</Route>
      <Route path="/dg/certificats">{() => <ProtectedRoute component={CertificateSigningPage} allowedRoles={["dg"]} />}</Route>
      <Route path="/dg/transferts">{() => <ProtectedRoute component={DGTransferOverviewPage} allowedRoles={["dg"]} />}</Route>
      
      {/* GES_COMPETENCES Routes */}
      <Route path="/ges-competences">{() => <ProtectedRoute component={GesCompetencesDashboard} allowedRoles={["ges_competences"]} />}</Route>
      <Route path="/ges-competences/dashboard">{() => <ProtectedRoute component={GesCompetencesDashboard} allowedRoles={["ges_competences"]} />}</Route>
      <Route path="/ges-competences/candidatures">{() => <ProtectedRoute component={GCCandidaturesPage} allowedRoles={["ges_competences"]} />}</Route>
      <Route path="/ges-competences/candidatures/:id">{() => <ProtectedRoute component={CandidatureDetailPage} allowedRoles={["ges_competences"]} />}</Route>
      <Route path="/ges-competences/entretiens">{() => <ProtectedRoute component={InterviewPlanningPage} allowedRoles={["ges_competences"]} />}</Route>
      <Route path="/ges-competences/entretien/:id">{() => <ProtectedRoute component={InterviewEvaluationPage} allowedRoles={["ges_competences"]} />}</Route>
      <Route path="/ges-competences/qualifications">{() => <ProtectedRoute component={QualificationsPage} allowedRoles={["ges_competences"]} />}</Route>
      <Route path="/ges-competences/observations">{() => <ProtectedRoute component={ObservationsPage} allowedRoles={["ges_competences"]} />}</Route>
      <Route path="/ges-competences/surveillance">{() => <ProtectedRoute component={SurveillanceQualPage} allowedRoles={["ges_competences"]} />}</Route>
      <Route path="/ges-competences/ef-pipeline">{() => <ProtectedRoute component={EFPipelinePage} allowedRoles={["ges_competences"]} />}</Route>

      {/* SUP (Superviseur) Routes */}
      <Route path="/sup">{() => <ProtectedRoute component={SupDashboard} allowedRoles={["sup"]} />}</Route>
      <Route path="/sup/dashboard">{() => <ProtectedRoute component={SupDashboard} allowedRoles={["sup"]} />}</Route>
      <Route path="/sup/my-plan">{() => <ProtectedRoute component={SupMyPlanPage} allowedRoles={["sup"]} />}</Route>
      <Route path="/sup/supervision/:id">{() => <ProtectedRoute component={SupervisionFormPage} allowedRoles={["sup"]} />}</Route>

      {/* EF (Évaluateurs en Formation) — accessible to evaluator roles */}
      <Route path="/ef">{() => <ProtectedRoute component={EFDashboard} allowedRoles={["ef"]} />}</Route>
      <Route path="/ef/dashboard">{() => <ProtectedRoute component={EFDashboard} allowedRoles={["ef"]} />}</Route>
      <Route path="/exp/qualification">{() => <ProtectedRoute component={MyQualificationJourneyPage} allowedRoles={["expert", "ef"]} />}</Route>
      <Route path="/et/qualification">{() => <ProtectedRoute component={MyQualificationJourneyPage} allowedRoles={["et"]} />}</Route>
      <Route path="/ree/qualification">{() => <ProtectedRoute component={MyQualificationJourneyPage} allowedRoles={["ree"]} />}</Route>
      <Route path="/eq/qualification">{() => <ProtectedRoute component={MyQualificationJourneyPage} allowedRoles={["eq"]} />}</Route>
      
      {/* RQ Routes */}
      <Route path="/rq">{() => <ProtectedRoute component={RQDashboard} allowedRoles={["rq"]} />}</Route>
      <Route path="/rq/dashboard">{() => <ProtectedRoute component={RQDashboard} allowedRoles={["rq"]} />}</Route>
      <Route path="/rq/plaintes">{() => <ProtectedRoute component={RQComplaintsDashboard} allowedRoles={["rq"]} />}</Route>
      <Route path="/rq/entretiens-candidats">{() => <ProtectedRoute component={InterviewPanelPage} allowedRoles={["rq"]} />}</Route>

      {/* Consolidation Routes */}
      <Route path="/consolidation">{() => <ProtectedRoute component={ConsolidationDashboard} allowedRoles={["consolidation"]} />}</Route>
      <Route path="/consolidation/dashboard">{() => <ProtectedRoute component={ConsolidationDashboard} allowedRoles={["consolidation"]} />}</Route>
      
      {/* Complaints (internal - for authenticated roles) */}
      <Route path="/complaints/internal">{() => <ProtectedRoute component={InternalComplaintsPage} />}</Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>  {/* Add this wrapper */}
            <SidebarProvider>
              <HardcodedI18nBridge />
              <Toaster />
              <Router />
            </SidebarProvider>
          </AuthProvider>  {/* Close it here */}
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;