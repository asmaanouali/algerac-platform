import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";

import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import RequestsListPage from "@/pages/requests-list-page";
import CreateRequestPage from "@/pages/create-request-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/requests" component={RequestsListPage} />
      <Route path="/requests/new" component={CreateRequestPage} />
      <Route path="/dossiers" component={RequestsListPage} /> {/* Alias for RA view */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
