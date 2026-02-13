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
      
      {/* RA Routes */}
      <Route path="/ra" component={RADashboard} />
      <Route path="/ra/dashboard" component={RADashboard} />
      <Route path="/ra/faisabilite" component={RAFeasibilityPage} />
      <Route path="/ra/feasibility" component={RAFeasibilityPage} />
      <Route path="/ra/demandes/:requestId/devis" component={QuotationConventionPage} />
      
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
      <Route path="/admin/utilisateurs-pending" component={UtilisateursPendingPage} />
      
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