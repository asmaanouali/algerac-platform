import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, Clock, Eye, Plus, FileText, Users, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { getOecStatusDisplay } from "@/lib/oec-request-display";

interface AccreditationRequest {
  id: number;
  referenceNumber: string;
  type: string;
  domain: string;
  status: string;
  progress: number;
  submissionDate: string;
  assignedToRaName?: string;
  receivabilityComments?: string;
  currentPhase?: string;
  currentStep?: string;
  nextAction?: string;
  pendingWith?: string;
  isReceivable?: boolean;
  receivabilityCorrectionNeeded?: string;
  correctionDeadline?: string;
  receivabilityAttempts?: number;
  dtReviewComments?: string;
}

// Prefer the authoritative backend progress (computed by WorkflowProgressService)
// so it matches the RequestDetailPage / WorkflowTimeline. Only fall back if absent.
const getProgress = (request: AccreditationRequest): number => {
  if (typeof request.progress === "number" && !Number.isNaN(request.progress)) return request.progress;
  return 0;
};

export default function MyRequestsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<AccreditationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("action");

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
    else if (user && !authLoading) loadRequests();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return null;

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/requests/my-requests");
      const data = await response.json();
      setRequests(data);
    } catch (err: any) {
      toast({ variant: "destructive", title: t("mrd.toasts.error"), description: err.message });
    } finally { setLoading(false); }
  };

  const handlePreliminaryVisitResponse = async (requestId: number, accepted: boolean) => {
    try {
      await apiRequest("POST", `/api/requests/${requestId}/preliminary-visit-response`, { accepted });
      toast({ title: t("mrd.toasts.responseRecorded"), description: accepted ? t("mrd.toasts.visitAccepted") : t("mrd.toasts.visitRefused") });
      loadRequests();
    } catch (err: any) { toast({ variant: "destructive", title: "Erreur", description: err.message }); }
  };

  const handleForeignExpertResponse = async (requestId: number, accepted: boolean) => {
    try {
      await apiRequest("POST", `/api/requests/${requestId}/foreign-expert-response`, { accepted });
      toast({ title: t("mrd.toasts.responseRecorded"), description: accepted ? t("mrd.toasts.expertAccepted") : t("mrd.toasts.expertRefused") });
      loadRequests();
    } catch (err: any) { toast({ variant: "destructive", title: "Erreur", description: err.message }); }
  };

  const handleResubmitAfterDT = async (requestId: number) => {
    try {
      await apiRequest("POST", `/api/requests/${requestId}/resubmit-after-dt`);
      toast({ title: t("mrd.toasts.resubmitted"), description: t("mrd.toasts.resubmittedDesc") });
      loadRequests();
    } catch (err: any) { toast({ variant: "destructive", title: "Erreur", description: err.message }); }
  };

  // Filter requests by action needed
  const actionNeeded = requests.filter((r) => [
    "DT_REJECTED", "PENDING_PAYMENT", "NOT_RECEIVABLE", "PRELIMINARY_VISIT_PROPOSED",
    "FOREIGN_EXPERT_PROPOSED", "QUOTATION_SENT_TO_OEC", "TEAM_SENT_TO_OEC",
    "DOC_REVIEW_RESULTS_SENT_TO_OEC", "AWAITING_OEC_DOC_RESPONSE", "PROCESS_SUSPENDED_OBSTACLES",
    "AWAITING_ACTION_PLANS", "OBSTACLES_IDENTIFIED",
  ].includes(r.status));
  const inProgress = requests.filter((r) => !["DRAFT","CLOSED","WITHDRAWN","SUSPENDED","CAS_DECISION_GRANT","CAS_DECISION_REFUSAL","CERTIFICATE_ISSUED","ACTIVE","DT_REJECTED","NOT_RECEIVABLE","PENDING_PAYMENT","PRELIMINARY_VISIT_PROPOSED","FOREIGN_EXPERT_PROPOSED","QUOTATION_SENT_TO_OEC","TEAM_SENT_TO_OEC","DOC_REVIEW_RESULTS_SENT_TO_OEC","AWAITING_OEC_DOC_RESPONSE","PROCESS_SUSPENDED_OBSTACLES","AWAITING_ACTION_PLANS","OBSTACLES_IDENTIFIED"].includes(r.status));
  const completed = requests.filter((r) => ["CAS_DECISION_GRANT","CERTIFICATE_ISSUED","ACTIVE","CAS_DECISION_REFUSAL","CLOSED","WITHDRAWN","SUSPENDED"].includes(r.status));

  const renderActions = (request: AccreditationRequest) => {
    const actions: JSX.Element[] = [];
    actions.push(
      <Button key="view" variant="outline" size="sm" onClick={() => setLocation(`/oec/demandes/${request.id}`)}>
        <Eye className="h-4 w-4 mr-1" />{t("mrd.actions.details")}
      </Button>
    );
    switch (request.status) {
      case "PENDING_PAYMENT":
        actions.push(<Button key="pay" size="sm" onClick={() => setLocation(`/oec/paiement/${request.id}`)}>{t("mrd.actions.makePayment")}</Button>);
        break;
      case "DT_REJECTED":
        actions.push(<Button key="resubmit-dt" size="sm" variant="destructive" onClick={() => handleResubmitAfterDT(request.id)}>{t("mrd.actions.correctResubmit")}</Button>);
        break;
      case "NOT_RECEIVABLE":
        actions.push(<Button key="correct" size="sm" variant="destructive" onClick={() => setLocation(`/oec/demandes/${request.id}/corriger`)}>{t("mrd.actions.correctResubmit")}</Button>);
        break;
      case "PRELIMINARY_VISIT_PROPOSED":
        actions.push(<Button key="accept-visit" size="sm" onClick={() => handlePreliminaryVisitResponse(request.id, true)}>{t("mrd.actions.acceptVisit")}</Button>);
        actions.push(<Button key="refuse-visit" size="sm" variant="outline" onClick={() => handlePreliminaryVisitResponse(request.id, false)}>{t("mrd.actions.refuseVisit")}</Button>);
        break;
      case "FOREIGN_EXPERT_PROPOSED":
        actions.push(<Button key="accept-exp" size="sm" onClick={() => handleForeignExpertResponse(request.id, true)}>{t("mrd.actions.acceptExpert")}</Button>);
        actions.push(<Button key="refuse-exp" size="sm" variant="outline" onClick={() => handleForeignExpertResponse(request.id, false)}>{t("mrd.actions.refuseExpert")}</Button>);
        break;
      case "QUOTATION_SENT_TO_OEC":
        actions.push(<Button key="validate-q" size="sm" onClick={() => setLocation(`/oec/demandes/${request.id}/validation`)}><FileText className="h-4 w-4 mr-1" />{t("mrd.actions.validateQuotation")}</Button>);
        break;
      case "TEAM_SENT_TO_OEC":
        actions.push(<Button key="validate-t" size="sm" onClick={() => setLocation(`/oec/demandes/${request.id}/equipe`)}><Users className="h-4 w-4 mr-1" />{t("mrd.actions.validateTeam")}</Button>);
        break;
      case "DOC_REVIEW_RESULTS_SENT_TO_OEC":
        actions.push(<Button key="doc-view" size="sm" onClick={() => setLocation(`/oec/demandes/${request.id}/reponse-documentaire`)}>{t("mrd.actions.viewResults")}</Button>);
        break;
      case "AWAITING_OEC_DOC_RESPONSE":
        actions.push(<Button key="doc-resp" size="sm" onClick={() => setLocation(`/oec/demandes/${request.id}/reponse-documentaire`)}>{t("mrd.actions.respondDeficiencies")}</Button>);
        break;
      case "PROCESS_SUSPENDED_OBSTACLES":
      case "OBSTACLES_IDENTIFIED":
        actions.push(<Button key="lift" size="sm" onClick={() => setLocation(`/oec/demandes/${request.id}/lever-obstacles`)}>{t("mrd.actions.notifyObstacles")}</Button>);
        break;
      case "AWAITING_ACTION_PLANS":
        actions.push(<Button key="plans" size="sm" onClick={() => setLocation(`/oec/demandes/${request.id}/plans-actions`)}>{t("mrd.actions.submitActionPlans")}</Button>);
        break;
    }
    return actions;
  };

  const renderRequestCard = (request: AccreditationRequest) => {
    const config = getOecStatusDisplay(request.status);
    const progress = getProgress(request);
    return (
      <Card key={request.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {["NOT_RECEIVABLE","PROCESS_SUSPENDED_OBSTACLES","CAS_DECISION_REFUSAL","SUSPENDED","WITHDRAWN"].includes(request.status) ? <XCircle className="h-5 w-5 text-destructive" /> : ["CAS_DECISION_GRANT","CERTIFICATE_ISSUED","ACTIVE","RECEIVABLE","QUOTATION_VALIDATED","TEAM_VALIDATED"].includes(request.status) ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                {request.referenceNumber || `Demande #${request.id}`}
              </CardTitle>
              <CardDescription>{request.domain} &mdash; {request.type}</CardDescription>
            </div>
            <div className="text-right space-y-1">
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("mrd.card.progression")}</span><span className="font-medium">{progress}%</span></div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} /></div>
          </div>
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground">{t("mrd.card.submissionDate")}</p><p className="font-medium">{request.submissionDate ? new Date(request.submissionDate).toLocaleDateString("fr-FR") : t("mrd.card.notSubmitted")}</p></div>
          </div>
          {/* Status-specific alerts */}
          {request.status === "DT_REJECTED" && (
            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription><strong>{t("mrd.alerts.dtRejected.title")}</strong>{request.dtReviewComments && <span className="block mt-1">{request.dtReviewComments}</span>}<span className="block mt-1">{t("mrd.alerts.dtRejected.cta")}</span></AlertDescription></Alert>
          )}
          {request.status === "NOT_RECEIVABLE" && (
            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription><strong>{t("mrd.alerts.notReceivable.title")}</strong>{request.receivabilityComments && <span className="block mt-1">{request.receivabilityComments}</span>}{request.correctionDeadline && <span className="block mt-1">{t("mrd.alerts.notReceivable.deadline")} {new Date(request.correctionDeadline).toLocaleDateString("fr-FR")}</span>}</AlertDescription></Alert>
          )}
          {request.status === "FOREIGN_EXPERT_PROPOSED" && (
            <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription><strong>{t("mrd.alerts.foreignExpert.label")}</strong> {t("mrd.alerts.foreignExpert.text")}</AlertDescription></Alert>
          )}
          {request.status === "PRELIMINARY_VISIT_PROPOSED" && (
            <Alert><AlertDescription><strong>{t("mrd.alerts.preliminaryVisit.label")}</strong> {t("mrd.alerts.preliminaryVisit.text")}</AlertDescription></Alert>
          )}
          {request.status === "QUOTATION_SENT_TO_OEC" && (
            <Alert><AlertDescription><strong>{t("mrd.alerts.quotation.label")}</strong> {t("mrd.alerts.quotation.text")} <strong>{t("mrd.alerts.quotation.deadline")}</strong></AlertDescription></Alert>
          )}
          {request.status === "TEAM_SENT_TO_OEC" && (
            <Alert><AlertDescription><strong>{t("mrd.alerts.team.label")}</strong> {t("mrd.alerts.team.text")} <strong>{t("mrd.alerts.team.deadline")}</strong></AlertDescription></Alert>
          )}
          {request.status === "AWAITING_OEC_DOC_RESPONSE" && (
            <Alert><AlertDescription><strong>{t("mrd.alerts.docResponse.label")}</strong> {t("mrd.alerts.docResponse.text")} <strong>{t("mrd.alerts.docResponse.deadline")}</strong></AlertDescription></Alert>
          )}
          {request.status === "DOC_REVIEW_RESULTS_SENT_TO_OEC" && (
            <Alert><AlertDescription><strong>{t("mrd.alerts.docResults.label")}</strong> {t("mrd.alerts.docResults.text")}</AlertDescription></Alert>
          )}
          {request.status === "PROCESS_SUSPENDED_OBSTACLES" && (
            <Alert variant="destructive"><AlertDescription><strong>{t("mrd.alerts.suspended.label")}</strong> {t("mrd.alerts.suspended.text")}</AlertDescription></Alert>
          )}
          {request.status === "CAS_DECISION_GRANT" && (
            <Alert className="border-green-500 bg-green-50"><AlertDescription><strong className="text-green-700">{t("mrd.alerts.casGrant")}</strong></AlertDescription></Alert>
          )}
          {/* Actions */}
          <div className="flex gap-2 pt-1 flex-wrap">{renderActions(request)}</div>
        </CardContent>
      </Card>
    );
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">{t("mrd.title")}</h1>
                <p className="text-muted-foreground mt-2">{t("mrd.subtitle")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={loadRequests} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  {t("common.refresh")}
                </Button>
                <Button onClick={() => setLocation("/oec/nouvelle-demande")}><Plus className="h-4 w-4 mr-2" />{t("mrd.newRequest")}</Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold">{requests.length}</p><p className="text-xs text-muted-foreground">{t("mrd.stats.total")}</p></CardContent></Card>
              <Card className="border-orange-200"><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-orange-600">{actionNeeded.length}</p><p className="text-xs text-muted-foreground">{t("mrd.stats.actionRequired")}</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-blue-600">{inProgress.length}</p><p className="text-xs text-muted-foreground">{t("mrd.stats.inProgress")}</p></CardContent></Card>
              <Card className="border-green-200"><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-green-600">{completed.length}</p><p className="text-xs text-muted-foreground">{t("mrd.stats.completed")}</p></CardContent></Card>
            </div>

            {requests.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground mb-4">{t("mrd.empty")}</p><Button onClick={() => setLocation("/oec/nouvelle-demande")}><Plus className="h-4 w-4 mr-2" />{t("mrd.create")}</Button></CardContent></Card>
            ) : (
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="action">{t("mrd.tabs.action")} ({actionNeeded.length})</TabsTrigger>
                  <TabsTrigger value="progress">{t("mrd.tabs.progress")} ({inProgress.length})</TabsTrigger>
                  <TabsTrigger value="done">{t("mrd.tabs.done")} ({completed.length})</TabsTrigger>
                  <TabsTrigger value="all">{t("mrd.tabs.all")} ({requests.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="action" className="space-y-4">
                  {actionNeeded.length === 0 ? <p className="text-center text-muted-foreground py-8">{t("mrd.noAction")}</p> : actionNeeded.map(renderRequestCard)}
                </TabsContent>
                <TabsContent value="progress" className="space-y-4">
                  {inProgress.length === 0 ? <p className="text-center text-muted-foreground py-8">{t("mrd.noProgress")}</p> : inProgress.map(renderRequestCard)}
                </TabsContent>
                <TabsContent value="done" className="space-y-4">
                  {completed.length === 0 ? <p className="text-center text-muted-foreground py-8">{t("mrd.noDone")}</p> : completed.map(renderRequestCard)}
                </TabsContent>
                <TabsContent value="all" className="space-y-4">
                  {requests.map(renderRequestCard)}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
