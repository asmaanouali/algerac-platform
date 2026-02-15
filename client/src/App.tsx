import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";  // Add this import
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import RegisterSelection from "@/pages/auth/RegisterSelection";
import ExpertRegister from "@/pages/auth/ExpertRegister";
import OECRegister from "@/pages/auth/OECRegister";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import OTPVerification from "@/pages/auth/OTPVerification";
import NewPassword from "@/pages/auth/NewPassword";
import RegistrationSuccess from "@/pages/auth/RegistrationSuccess";
import OECDashboard from "@/pages/oec/Dashboard";
import NewRequestPage from "@/pages/oec/NewRequestPage";
import PaymentPage from "@/pages/oec/PaymentPage";
import PaymentsListPage from "@/pages/oec/PaymentsListPage";
import MyRequestsPage from "@/pages/oec/MyRequestsPage";
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
import UtilisateursPendingPage from "@/pages/admin/UtilisateursPendingPage";
import UsersPage from "@/pages/admin/UsersPage";
import CDAccreditations from "@/pages/cd/Accreditations";
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
import ETDashboard from "@/pages/et/Dashboard";
import EQDashboard from "@/pages/eq/Dashboard";
import CASMemberDashboard from "@/pages/cas/MemberDashboard";
import CASPresidentDashboard from "@/pages/cas/PresidentDashboard";
import DGDashboard from "@/pages/dg/Dashboard";

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
      <Route path="/oec/demandes/:id/corriger" component={CorrectRequestPage} />
      <Route path="/oec/demandes/:id/equipe" component={ValidateTeamPage} />
      <Route path="/oec/demandes/:id/reponse-documentaire" component={DocumentaryResponsePage} />
      <Route path="/oec/demandes/:id/plans-actions" component={ActionPlansPage} />
      <Route path="/oec/demandes/:id/lever-obstacles" component={LiftObstaclesPage} />
      
      {/* RA Routes */}
      <Route path="/ra" component={RADashboard} />
      <Route path="/ra/dashboard" component={RADashboard} />
      <Route path="/ra/faisabilite" component={RAFeasibilityPage} />
      <Route path="/ra/demandes/:requestId/devis" component={QuotationConventionPage} />
      <Route path="/ra/equipes" component={TeamCompositionPage} />
      <Route path="/ra/revue-documentaire" component={DocumentaryReviewPage} />
      <Route path="/ra/preparation-evaluation" component={EvaluationPrepPage} />
      <Route path="/ra/gestion-ecarts" component={GapsManagementPage} />
      <Route path="/ra/rapports" component={ReportValidationPage} />
      <Route path="/ra/preparation-cas" component={CASPreparationPage} />
      
      {/* CD Routes */}
      <Route path="/cd" component={CDDashboard} />
      <Route path="/cd/dashboard" component={CDDashboard} />
      <Route path="/cd/manage-requests" component={CDManageRequestsPage} />
      <Route path="/cd/gerer-demandes" component={CDManageRequestsPage} />
      <Route path="/cd/accreditations" component={CDAccreditations} />
      
      {/* DAG Routes */}
      <Route path="/dag" component={DAGDashboard} />
      <Route path="/dag/dashboard" component={DAGDashboard} />
      
      {/* Admin & Other Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/dt/candidatures-oec" component={CandidaturesOECPage} />
      <Route path="/dt/ordres-mission" component={DTMissionOrdersPage} />
      <Route path="/admin/utilisateurs-pending" component={UtilisateursPendingPage} />
      
      {/* Expert Routes */}
      <Route path="/expert" component={ExpertDashboard} />
      <Route path="/expert/dashboard" component={ExpertDashboard} />
      <Route path="/expert/planning" component={ExpertPlanningPage} />
      <Route path="/expert/engagements" component={ExpertCommitmentsPage} />
      <Route path="/expert/revue-documentaire" component={ExpertDocumentaryAnalysisPage} />
      <Route path="/expert/evaluation" component={ExpertEvaluationDayPage} />
      <Route path="/expert/rapports" component={ExpertReportDraftingPage} />
      
      {/* REE Routes */}
      <Route path="/ree" component={REEDashboard} />
      <Route path="/ree/dashboard" component={REEDashboard} />
      <Route path="/ree/planning" component={ExpertPlanningPage} />
      <Route path="/ree/engagements" component={ExpertCommitmentsPage} />
      <Route path="/ree/revue-documentaire" component={ExpertDocumentaryAnalysisPage} />
      <Route path="/ree/evaluation" component={ExpertEvaluationDayPage} />
      <Route path="/ree/rapports" component={ExpertReportDraftingPage} />
      
      {/* ET Routes */}
      <Route path="/et" component={ETDashboard} />
      <Route path="/et/dashboard" component={ETDashboard} />
      <Route path="/et/planning" component={ExpertPlanningPage} />
      <Route path="/et/engagements" component={ExpertCommitmentsPage} />
      <Route path="/et/revue-documentaire" component={ExpertDocumentaryAnalysisPage} />
      <Route path="/et/evaluation" component={ExpertEvaluationDayPage} />
      
      {/* EQ Routes */}
      <Route path="/eq" component={EQDashboard} />
      <Route path="/eq/dashboard" component={EQDashboard} />
      <Route path="/eq/planning" component={ExpertPlanningPage} />
      <Route path="/eq/engagements" component={ExpertCommitmentsPage} />
      <Route path="/eq/revue-documentaire" component={ExpertDocumentaryAnalysisPage} />
      <Route path="/eq/evaluation" component={ExpertEvaluationDayPage} />
      
      {/* CAS Member Routes */}
      <Route path="/cas" component={CASMemberDashboard} />
      <Route path="/cas/dashboard" component={CASMemberDashboard} />
      <Route path="/cas/reunions" component={CASMemberDashboard} />
      
      {/* CAS President Routes */}
      <Route path="/cas-president" component={CASPresidentDashboard} />
      <Route path="/cas-president/dashboard" component={CASPresidentDashboard} />
      <Route path="/cas-president/reunions" component={CASPresidentDashboard} />
      <Route path="/cas-president/decisions" component={CASPresidentDashboard} />
      
      {/* DG Routes */}
      <Route path="/dg" component={DGDashboard} />
      <Route path="/dg/dashboard" component={DGDashboard} />
      <Route path="/dg/ordres-mission" component={DGDashboard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>  {/* Add this wrapper */}
          <Toaster />
          <Router />
        </AuthProvider>  {/* Close it here */}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;