import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import RADashboard from "@/pages/ra/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";

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
      
      <Route path="/oec" component={OECDashboard} />
      <Route path="/ra" component={RADashboard} />
      <Route path="/admin" component={AdminDashboard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
