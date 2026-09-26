import { useEffect, useState } from "react";
import { useLocation, Link, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, UserPlus, CheckCircle, FolderOpen, Archive, XCircle, Users, ClipboardCheck, Eye, Send, AlertTriangle, Shield, Calendar, Download, FileSignature, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";

interface AccreditationRequest {
  id: number;
  referenceNumber: string;
  type: string;
  domain: string;
  status: string;
  progress: number;
  submissionDate: string;
  oecId: number;
  oec: { organizationName: string; email: string; fullName: string };
  assignedToRa?: { id: number; fullName: string; email?: string; domaineExpertise?: string };
  raRefusalReason?: string;
  raRefusalDate?: string;
  refusedByRaName?: string;
}

interface RAWorkload {
  id: number;
  fullName: string;
  email: string;
  specialite: string;
  domaineExpertise: string;
  sousDomaineExpertise: string;
  assignedDossiers: number;
  activeDossiers: number;
}

const MANAGE_TABS = [
  "pending",
  "receivability-review",
  "cd-validation",
  "non-receivable",
  "team-validation",
  "recusations",
  "all",
] as const;

type ManageTab = (typeof MANAGE_TABS)[number];

function resolveManageTab(search: string): ManageTab {
  const tab = new URLSearchParams(search).get("tab");
  return MANAGE_TABS.includes(tab as ManageTab) ? (tab as ManageTab) : "pending";
}

export default function CDManageRequestsPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ManageTab>(() => resolveManageTab(search));
  const [pendingRequests, setPendingRequests] = useState<AccreditationRequest[]>([]);
  const [allRequests, setAllRequests] = useState<AccreditationRequest[]>([]);
  const [rasWorkload, setRasWorkload] = useState<RAWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccreditationRequest | null>(null);
  const [selectedRaId, setSelectedRaId] = useState("");
  const [closeReason, setCloseReason] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [closing, setClosing] = useState(false);

  // Receivability review
  const [receivabilityRequests, setReceivabilityRequests] = useState<AccreditationRequest[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<AccreditationRequest | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // Quotation/Convention validation
  const [pendingCDValidation, setPendingCDValidation] = useState<any[]>([]);
  const [cdValidationDialogOpen, setCdValidationDialogOpen] = useState(false);
  const [cdModifDialogOpen, setCdModifDialogOpen] = useState(false);
  const [cdSelectedQuotation, setCdSelectedQuotation] = useState<any>(null);
  const [cdModifComments, setCdModifComments] = useState("");
  const [cdValidating, setCdValidating] = useState(false);
  const [cdRequesting, setCdRequesting] = useState(false);
  const [cdConventionDialogOpen, setCdConventionDialogOpen] = useState(false);
  const [cdConvention, setCdConvention] = useState<any>(null);
  const [cdConventionLoading, setCdConventionLoading] = useState(false);

  // Team composition validation (RA → CD → OEC)
  const [pendingTeamValidation, setPendingTeamValidation] = useState<any[]>([]);
  const [teamValidDialogOpen, setTeamValidDialogOpen] = useState(false);
  const [teamChangesDialogOpen, setTeamChangesDialogOpen] = useState(false);
  const [selectedTeamRequest, setSelectedTeamRequest] = useState<any>(null);
  const [teamChangesComments, setTeamChangesComments] = useState("");
  const [teamValidating, setTeamValidating] = useState(false);
  const [teamRequesting, setTeamRequesting] = useState(false);

  // Recusation examination (OEC recused member → CD examines)
  const [pendingRecusations, setPendingRecusations] = useState<any[]>([]);
  const [recusDialogOpen, setRecusDialogOpen] = useState(false);
  const [selectedRecusation, setSelectedRecusation] = useState<any>(null);
  const [recusDecisionReason, setRecusDecisionReason] = useState("");
  const [recusProcessing, setRecusProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
    else if (user && !authLoading) loadData();
  }, [user, authLoading]);

  useEffect(() => {
    setActiveTab(resolveManageTab(search));
  }, [search]);

  const handleTabChange = (tab: string) => {
    const next = resolveManageTab(`?tab=${tab}`);
    setActiveTab(next);
    setLocation(next === "pending" ? "/cd/manage-requests" : `/cd/manage-requests?tab=${next}`);
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return null;

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingRes, refusedRes, allRes, raRes, recevRes, cdValRes] = await Promise.all([
        apiRequest("GET", "/api/requests/status/PENDING_CD_ASSIGNMENT"),
        apiRequest("GET", "/api/requests/status/RA_ASSIGNMENT_REFUSED").catch(() => ({ json: () => [] } as any)),
        apiRequest("GET", "/api/requests"),
        apiRequest("GET", "/api/workflow/ra-workload"),
        apiRequest("GET", "/api/requests/status/RECEIVABILITY_PENDING_CD_REVIEW"),
        apiRequest("GET", "/api/quotations/pending-cd-validation").catch(() => ({ json: () => [] })),
      ]);
      const pendingAssignment = await pendingRes.json();
      const refusedByRa = await refusedRes.json();
      // Dossiers refusés par un RA remontent en tête de la liste "En attente" pour réassignation prioritaire.
      setPendingRequests([...(refusedByRa || []), ...(pendingAssignment || [])]);
      const allData = await allRes.json();
      const allReqs = allData.data || allData;
      setAllRequests(allReqs);
      setRasWorkload(await raRes.json());
      setReceivabilityRequests(await recevRes.json());
      setPendingCDValidation(await cdValRes.json());

      // Filter team composition pending CD validation
      const teamPending = allReqs.filter((r: any) => r.status === "TEAM_SENT_TO_CD");
      setPendingTeamValidation(teamPending);
      
      // Filter recusations pending CD examination
      const recusPending = allReqs.filter((r: any) => r.status === "TEAM_MEMBER_RECUSED" || r.status === "TEAM_RECUSED");
      setPendingRecusations(recusPending);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openAssignDialog = (r: AccreditationRequest) => { setSelectedRequest(r); setSelectedRaId(""); setAssignDialogOpen(true); };

  const handleAssign = async () => {
    if (!selectedRequest || !selectedRaId) { toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner un RA" }); return; }
    try {
      setAssigning(true);
      const res = await apiRequest("POST", `/api/requests/${selectedRequest.id}/assign`, { raId: parseInt(selectedRaId) });
      const raName = rasWorkload.find(r => r.id === parseInt(selectedRaId))?.fullName || "RA";
      const result = await res.json();
      const refNumber = result.data?.referenceNumber || "";
      toast({ title: "Assignation réussie", description: `Demande assignée à ${raName}. N° dossier : ${refNumber}` });
      setAssignDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setAssigning(false); }
  };

  const openCloseDialog = (r: AccreditationRequest) => { setSelectedRequest(r); setCloseReason(""); setCloseDialogOpen(true); };
  const openReviewDialog = (r: AccreditationRequest) => { setReviewRequest(r); setReviewComments(""); setReviewDialogOpen(true); };

  const handleReviewReceivability = async (approved: boolean) => {
    if (!reviewRequest) return;
    if (!approved && !reviewComments.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Indiquez les modifications à apporter" });
      return;
    }
    try {
      setReviewing(true);
      await apiRequest("POST", `/api/requests/${reviewRequest.id}/cd-review-receivability`, {
        approved,
        comments: reviewComments,
      });
      toast({
        title: approved ? "Étude approuvée" : "Modifications demandées",
        description: approved ? "La décision a été communiquée à l'OEC." : "Le RA a été notifié des modifications.",
      });
      setReviewDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setReviewing(false); }
  };

  const handleClose = async () => {
    if (!selectedRequest || !closeReason.trim()) { toast({ variant: "destructive", title: "Erreur", description: "Indiquez la raison" }); return; }
    try {
      setClosing(true);
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/close`, { reason: closeReason });
      toast({ title: "Dossier classé", description: "Le dossier a été classé" });
      setCloseDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setClosing(false); }
  };

  const openConventionView = async (q: any) => {
    const requestId = q.request?.id || q.requestId;
    if (!requestId) {
      toast({ variant: "destructive", title: "Erreur", description: "Demande introuvable pour cette convention" });
      return;
    }
    setCdSelectedQuotation(q);
    setCdConvention(null);
    setCdConventionDialogOpen(true);
    setCdConventionLoading(true);
    try {
      const res = await apiRequest("GET", `/api/conventions/by-request/${requestId}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCdConvention(list[0] || null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message || "Impossible de charger la convention" });
      setCdConvention(null);
    } finally {
      setCdConventionLoading(false);
    }
  };

  const handleCDValidate = async () => {
    if (!cdSelectedQuotation) return;
    try {
      setCdValidating(true);
      await apiRequest("POST", `/api/quotations/cd-validate/${cdSelectedQuotation.request?.id || cdSelectedQuotation.requestId}`);
      toast({ title: "Validé et envoyé", description: "Le devis et la convention ont été validés et envoyés à l'OEC." });
      setCdValidationDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setCdValidating(false); }
  };

  const handleCDRequestModifications = async () => {
    if (!cdSelectedQuotation || !cdModifComments.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Indiquez les modifications à apporter" });
      return;
    }
    try {
      setCdRequesting(true);
      await apiRequest("POST", `/api/quotations/cd-request-modifications/${cdSelectedQuotation.request?.id || cdSelectedQuotation.requestId}`, {
        comments: cdModifComments,
      });
      toast({ title: "Modifications demandées", description: "Le RA a été notifié des modifications à apporter." });
      setCdModifDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setCdRequesting(false); }
  };

  // ===== Team Composition Validation (RA → CD → OEC) =====
  const handleTeamApprove = async () => {
    if (!selectedTeamRequest) return;
    try {
      setTeamValidating(true);
      // Find teamId for this request
      const teamRes = await fetch(`/api/workflow/teams/by-request/${selectedTeamRequest.id}`, { credentials: "include" });
      const teams = await teamRes.json();
      if (!teams.length) throw new Error("Équipe non trouvée");
      
      await apiRequest("POST", `/api/workflow/teams/${teams[0].id}/cd-approve`);
      toast({ title: "Composition approuvée", description: "La composition et la date ont été envoyées à l'OEC." });
      setTeamValidDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setTeamValidating(false); }
  };

  const handleTeamRequestChanges = async () => {
    if (!selectedTeamRequest || !teamChangesComments.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Indiquez les modifications à apporter" });
      return;
    }
    try {
      setTeamRequesting(true);
      const teamRes = await fetch(`/api/workflow/teams/by-request/${selectedTeamRequest.id}`, { credentials: "include" });
      const teams = await teamRes.json();
      if (!teams.length) throw new Error("Équipe non trouvée");
      
      await apiRequest("POST", `/api/workflow/teams/${teams[0].id}/cd-request-changes`, {
        comments: teamChangesComments,
      });
      toast({ title: "Modifications demandées", description: "Le RA a été notifié des changements à apporter." });
      setTeamChangesDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setTeamRequesting(false); }
  };

  // ===== Recusation Examination =====
  const handleRecusationDecision = async (accepted: boolean) => {
    if (!selectedRecusation || !recusDecisionReason.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Indiquez la raison de votre décision" });
      return;
    }
    try {
      setRecusProcessing(true);
      const teamRes = await fetch(`/api/workflow/teams/by-request/${selectedRecusation.id}`, { credentials: "include" });
      const teams = await teamRes.json();
      if (!teams.length) throw new Error("Équipe non trouvée");
      
      await apiRequest("POST", `/api/workflow/teams/${teams[0].id}/examine-recusation`, {
        accepted,
        decisionReason: recusDecisionReason,
      });
      
      if (accepted) {
        toast({ title: "Récusation acceptée", description: "Le RA doit remplacer le membre, faire signer l'engagement, et renvoyer la composition." });
      } else {
        toast({ title: "Récusation rejetée", description: "L'équipe est maintenue. L'OEC a été notifié." });
      }
      setRecusDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setRecusProcessing(false); }
  };

  const assignedCount = allRequests.filter(r => !["DRAFT","PENDING_DT_REVIEW","DT_REJECTED","PENDING_CD_ASSIGNMENT","RA_ASSIGNMENT_REFUSED","PENDING_PAYMENT","PAYMENT_COMPLETED","CLOSED","REJECTED"].includes(r.status)).length;
  const closedCount = allRequests.filter(r => r.status === "CLOSED").length;
  const nonReceivableRequests = allRequests.filter(r => r.status === "NOT_RECEIVABLE");

  const getBestRAs = (domain: string) => [...rasWorkload].sort((a, b) => {
    const am = a.domaineExpertise?.toLowerCase().includes(domain?.toLowerCase()) ? 1 : 0;
    const bm = b.domaineExpertise?.toLowerCase().includes(domain?.toLowerCase()) ? 1 : 0;
    return am !== bm ? bm - am : a.activeDossiers - b.activeDossiers;
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50/50"><Sidebar /><div className="md:ml-64"><Navbar /><div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div></div></div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold">Chef de Département — Gestion des Demandes</h1>
                <p className="text-muted-foreground mt-2">Assignez les demandes aux RAs compétents et gérez les dossiers</p>
              </div>
              <Button variant="outline" onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {t("common.refresh")}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">En attente</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{pendingRequests.length}</div></CardContent></Card>
              <Card className={receivabilityRequests.length > 0 ? "ring-2 ring-blue-400" : ""}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Études à valider</CardTitle><ClipboardCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{receivabilityRequests.length}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Assignés</CardTitle><FolderOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{assignedCount}</div></CardContent></Card>
              <Card className={pendingCDValidation.length > 0 ? "ring-2 ring-purple-400" : ""}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Devis/Conv. à valider</CardTitle><Send className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{pendingCDValidation.length}</div></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Classés</CardTitle><Archive className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-slate-500">{closedCount}</div></CardContent></Card>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1 justify-start w-full p-1">
                <TabsTrigger value="pending" className="text-xs md:text-sm">En attente ({pendingRequests.length})</TabsTrigger>
                <TabsTrigger value="receivability-review" className="text-xs md:text-sm"><ClipboardCheck className="h-4 w-4 mr-1" />Études à valider ({receivabilityRequests.length})</TabsTrigger>
                <TabsTrigger value="cd-validation" className="text-xs md:text-sm"><Send className="h-4 w-4 mr-1" />Devis & Convention ({pendingCDValidation.length})</TabsTrigger>
                <TabsTrigger value="non-receivable" className="text-xs md:text-sm">Non recevables ({nonReceivableRequests.length})</TabsTrigger>
                <TabsTrigger value="team-validation" className="text-xs md:text-sm"><Shield className="h-4 w-4 mr-1" />Équipes ({pendingTeamValidation.length})</TabsTrigger>
                <TabsTrigger value="recusations" className="text-xs md:text-sm"><AlertTriangle className="h-4 w-4 mr-1" />Récusations ({pendingRecusations.length})</TabsTrigger>
                <TabsTrigger value="all" className="text-xs md:text-sm">Tous ({allRequests.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <Card>
                  <CardHeader><CardTitle>Demandes en attente d'assignation</CardTitle><CardDescription>Assignez chaque demande à un RA selon son expertise et sa charge</CardDescription></CardHeader>
                  <CardContent>
                    {pendingRequests.length === 0 ? (
                      <div className="text-center py-8"><CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" /><p className="text-muted-foreground">Aucune demande en attente</p></div>
                    ) : (
                      <div className="space-y-4">
                        {pendingRequests.map((request) => (
                          <div key={request.id} className={`p-4 border rounded-lg hover:bg-accent transition-colors ${request.status === "RA_ASSIGNMENT_REFUSED" ? "border-red-200 bg-red-50/40" : ""}`}>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold">{request.oec?.organizationName || request.oec?.fullName}</h3>
                                  <Badge variant="outline">{request.type}</Badge>
                                  {request.status === "RA_ASSIGNMENT_REFUSED" && (
                                    <Badge className="bg-red-100 text-red-700 border-red-200" variant="outline">Refusée par le RA</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">Domaine : {request.domain}</p>
                                <p className="text-sm text-muted-foreground">Soumise le : {new Date(request.submissionDate).toLocaleDateString("fr-FR")}</p>
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/cd/demande/${request.id}`}>
                                  <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" />Voir</Button>
                                </Link>
                                <Button onClick={() => openAssignDialog(request)}><UserPlus className="h-4 w-4 mr-2" />{request.status === "RA_ASSIGNMENT_REFUSED" ? "Réassigner" : "Assigner"}</Button>
                              </div>
                            </div>
                            {request.status === "RA_ASSIGNMENT_REFUSED" && request.raRefusalReason && (
                              <Alert variant="destructive" className="mt-3">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>{request.refusedByRaName || "Le RA"}</strong> a refusé ce dossier{request.raRefusalDate ? ` le ${new Date(request.raRefusalDate).toLocaleDateString("fr-FR")}` : ""} — <em>{request.raRefusalReason}</em>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="receivability-review">
                <Card>
                  <CardHeader>
                    <CardTitle>Études de recevabilité à valider</CardTitle>
                    <CardDescription>Vérifiez le travail du RA et approuvez ou demandez des modifications avant que la décision ne soit communiquée à l'OEC</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {receivabilityRequests.length === 0 ? (
                      <div className="text-center py-8"><CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" /><p className="text-muted-foreground">Aucune étude en attente de validation</p></div>
                    ) : (
                      <div className="space-y-4">
                        {receivabilityRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{request.oec?.organizationName || request.oec?.fullName}</h3>
                                <Badge variant="outline">{request.domain}</Badge>
                                <Badge className={(request as any).isReceivable ? "bg-green-500" : "bg-red-500"}>
                                  Proposition : {(request as any).isReceivable ? "Recevable" : "Non recevable"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">Réf : {request.referenceNumber || `#${request.id}`}</p>
                              <p className="text-sm text-muted-foreground">RA : {request.assignedToRa?.fullName || "—"}</p>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/cd/demande/${request.id}`}>
                                <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" />Voir</Button>
                              </Link>
                              <Button onClick={() => openReviewDialog(request)}><Eye className="h-4 w-4 mr-2" />Examiner</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cd-validation">
                <Card>
                  <CardHeader>
                    <CardTitle>Devis & Convention à valider</CardTitle>
                    <CardDescription>
                      Consultez le devis et la convention, puis validez avant l&apos;envoi à l&apos;OEC — ou demandez des modifications au RA.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingCDValidation.length === 0 ? (
                      <div className="text-center py-8"><CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" /><p className="text-muted-foreground">Aucun devis/convention en attente de validation</p></div>
                    ) : (
                      <div className="space-y-4">
                        {pendingCDValidation.map((q: any) => (
                          <div key={q.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="font-semibold">{q.quotationNumber}</h3>
                                  <Badge variant="outline">{q.request?.type}</Badge>
                                  <Badge className="bg-purple-100 text-purple-800 border-purple-300">En attente CD</Badge>
                                </div>
                                <p className="text-sm font-medium">Demande : {q.request?.referenceNumber}</p>
                                <p className="text-sm text-muted-foreground">OEC : {q.request?.oec?.organizationName}</p>
                                <p className="text-sm text-muted-foreground">Domaine : {q.request?.domain}</p>
                                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <h4 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-1"><Users className="w-4 h-4" /> Composition d&apos;équipe</h4>
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>REE : <strong>{q.reeCount || 1}</strong></div>
                                    <div>Évl. Tech : <strong>{q.etCount || 0}</strong></div>
                                    {(q.eqCount > 0) && <div>Évl. Qualité : <strong>{q.eqCount}</strong></div>}
                                    {(q.obsCount > 0) && <div>Observateur : <strong>{q.obsCount}</strong></div>}
                                    {(q.supCount > 0) && <div>Superviseur : <strong>{q.supCount}</strong></div>}
                                    {(q.expCount > 0) && <div>Expert : <strong>{q.expCount}</strong></div>}
                                  </div>
                                  <div className="mt-2 text-sm">Durée totale : <strong>{q.evaluationDurationDays} H/j</strong></div>
                                </div>

                                <div className="mt-2 p-3 rounded-lg border bg-emerald-50/60 border-emerald-200 space-y-2">
                                  <h4 className="text-sm font-medium text-emerald-900 flex items-center gap-1">
                                    <FileText className="w-4 h-4" /> Documents à consulter
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    <a href={`/api/quotations/${q.id}/devis.pdf`} target="_blank" rel="noopener noreferrer">
                                      <Button size="sm" variant="outline">
                                        <Download className="h-3.5 w-3.5 mr-1" /> Voir le devis (PDF)
                                      </Button>
                                    </a>
                                    <Button size="sm" variant="outline" onClick={() => openConventionView(q)}>
                                      <FileSignature className="h-3.5 w-3.5 mr-1" /> Voir la convention
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 mt-2">
                                  <div><p className="text-xs text-muted-foreground">Préparé par</p><p className="text-sm font-medium">{q.preparedByRaName}</p></div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 shrink-0">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setCdSelectedQuotation(q); setCdValidationDialogOpen(true); }}>
                                  <CheckCircle className="h-4 w-4 mr-1" />Valider
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => { setCdSelectedQuotation(q); setCdModifComments(""); setCdModifDialogOpen(true); }}>
                                  <AlertTriangle className="h-4 w-4 mr-1" />Modifier
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="non-receivable">
                <Card>
                  <CardHeader><CardTitle>Dossiers non recevables</CardTitle><CardDescription>Classez les dossiers déclarés non recevables</CardDescription></CardHeader>
                  <CardContent>
                    {nonReceivableRequests.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Aucun dossier non recevable</p>
                    ) : (
                      <Table>
                        <TableHeader><TableRow><TableHead>Réf.</TableHead><TableHead>OEC</TableHead><TableHead>Domaine</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {nonReceivableRequests.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono">{r.referenceNumber || `#${r.id}`}</TableCell>
                              <TableCell>{r.oec?.organizationName || r.oec?.fullName}</TableCell>
                              <TableCell>{r.domain}</TableCell>
                              <TableCell><Button size="sm" variant="destructive" onClick={() => openCloseDialog(r)}><Archive className="h-4 w-4 mr-1" />Classer</Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all">
                <Card>
                  <CardHeader><CardTitle>Tous les dossiers</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader><TableRow><TableHead>Réf.</TableHead><TableHead>OEC</TableHead><TableHead>Domaine</TableHead><TableHead>Statut</TableHead><TableHead>RA</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {allRequests.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono">{r.referenceNumber || `#${r.id}`}</TableCell>
                              <TableCell>{r.oec?.organizationName || r.oec?.fullName}</TableCell>
                              <TableCell>{r.domain}</TableCell>
                              <TableCell><Badge variant={r.status === "CLOSED" ? "secondary" : (r.status === "NOT_RECEIVABLE" || r.status === "RA_ASSIGNMENT_REFUSED") ? "destructive" : "outline"}>{r.status.replace(/_/g, " ")}</Badge></TableCell>
                              <TableCell>{r.assignedToRa?.fullName || "—"}</TableCell>
                              <TableCell className="text-sm">{r.submissionDate ? new Date(r.submissionDate).toLocaleDateString("fr-FR") : "—"}</TableCell>
                              <TableCell>
                                <Link href={`/cd/demande/${r.id}`}>
                                  <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" />Voir</Button>
                                </Link>
                              </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team-validation">
                <Card>
                  <CardHeader>
                    <CardTitle>Compositions d'équipe à valider</CardTitle>
                    <CardDescription>Le RA a soumis la composition de l'équipe et la date d'évaluation. Validez pour envoyer à l'OEC ou demandez des modifications.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingTeamValidation.length === 0 ? (
                      <div className="text-center py-8"><CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" /><p className="text-muted-foreground">Aucune composition en attente de validation</p></div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Réf.</TableHead>
                            <TableHead>OEC</TableHead>
                            <TableHead>Domaine</TableHead>
                            <TableHead>RA</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingTeamValidation.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono">{r.referenceNumber || `#${r.id}`}</TableCell>
                              <TableCell>{r.oec?.organizationName || r.oec?.fullName}</TableCell>
                              <TableCell>{r.domain}</TableCell>
                              <TableCell>{r.assignedToRa?.fullName || "—"}</TableCell>
                              <TableCell className="space-x-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setSelectedTeamRequest(r); setTeamValidDialogOpen(true); }}>
                                  <CheckCircle className="h-4 w-4 mr-1" />Approuver
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => { setSelectedTeamRequest(r); setTeamChangesComments(""); setTeamChangesDialogOpen(true); }}>
                                  <XCircle className="h-4 w-4 mr-1" />Demander modifications
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recusations">
                <Card>
                  <CardHeader>
                    <CardTitle>Récusations à examiner</CardTitle>
                    <CardDescription>L'OEC a récusé un ou plusieurs membres de l'équipe d'évaluation. Examinez la demande conformément à la PRO 22.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingRecusations.length === 0 ? (
                      <div className="text-center py-8"><CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" /><p className="text-muted-foreground">Aucune récusation en attente</p></div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Réf.</TableHead>
                            <TableHead>OEC</TableHead>
                            <TableHead>Domaine</TableHead>
                            <TableHead>RA</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingRecusations.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono">{r.referenceNumber || `#${r.id}`}</TableCell>
                              <TableCell>{r.oec?.organizationName || r.oec?.fullName}</TableCell>
                              <TableCell>{r.domain}</TableCell>
                              <TableCell>{r.assignedToRa?.fullName || "—"}</TableCell>
                              <TableCell>
                                <Button size="sm" onClick={() => { setSelectedRecusation(r); setRecusDecisionReason(""); setRecusDialogOpen(true); }}>
                                  <Shield className="h-4 w-4 mr-1" />Examiner
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* ASSIGN DIALOG */}
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Assigner à un Responsable d'Accréditation</DialogTitle>
                <DialogDescription>
                  Seuls les RA de votre département sont proposés ci-dessous.
                </DialogDescription>
              </DialogHeader>
              {selectedRequest && (
                <div className="space-y-4 py-4">
                  <Alert><AlertDescription><strong>OEC :</strong> {selectedRequest.oec?.organizationName}<br /><strong>Domaine :</strong> {selectedRequest.domain}<br /><strong>Type :</strong> {selectedRequest.type}</AlertDescription></Alert>
                  <div className="space-y-2">
                    <Label>Responsable d'accréditation (RA du département)</Label>
                    <Select value={selectedRaId} onValueChange={setSelectedRaId}>
                      <SelectTrigger><SelectValue placeholder="Sélectionnez un RA" /></SelectTrigger>
                      <SelectContent>
                        {getBestRAs(selectedRequest.domain).map((ra) => {
                          const isMatch = ra.domaineExpertise?.toLowerCase().includes(selectedRequest.domain?.toLowerCase());
                          return (
                            <SelectItem key={ra.id} value={ra.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{ra.fullName}</span>
                                {isMatch && <Badge variant="default" className="text-xs py-0 px-1">Match</Badge>}
                                <span className="text-muted-foreground text-xs">{ra.email}</span>
                                <span className="text-muted-foreground text-xs">({ra.activeDossiers} actifs)</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {rasWorkload.length === 0 && (
                      <p className="text-xs text-amber-700">
                        Aucun RA n'est rattaché à votre département. Contactez l'administrateur.
                      </p>
                    )}
                  </div>
                  {selectedRaId && (() => {
                    const ra = rasWorkload.find(r => r.id === parseInt(selectedRaId));
                    if (!ra) return null;
                    return (
                      <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
                        <h4 className="font-medium text-sm">Profil du RA</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Expertise :</span><p className="font-medium">{ra.domaineExpertise || "—"}</p></div>
                          <div><span className="text-muted-foreground">Spécialité :</span><p className="font-medium">{ra.specialite || "—"}</p></div>
                          <div><span className="text-muted-foreground">Actifs :</span><p className="font-medium">{ra.activeDossiers}</p></div>
                          <div><span className="text-muted-foreground">Total :</span><p className="font-medium">{ra.assignedDossiers}</p></div>
                        </div>
                        {ra.activeDossiers > 5 && <Alert variant="destructive"><AlertDescription>Charge élevée ({ra.activeDossiers} dossiers actifs)</AlertDescription></Alert>}
                      </div>
                    );
                  })()}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assigning}>Annuler</Button>
                <Button onClick={handleAssign} disabled={assigning || !selectedRaId}>
                  {assigning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assignation...</> : "Assigner"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CLOSE DIALOG */}
          <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Classer le dossier</DialogTitle><DialogDescription>Ce dossier sera classé et archivé. L'OEC sera notifié.</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Raison du classement *</Label>
                  <Textarea value={closeReason} onChange={(e) => setCloseReason(e.target.value)} placeholder="Raison du classement..." rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCloseDialogOpen(false)} disabled={closing}>Annuler</Button>
                <Button variant="destructive" onClick={handleClose} disabled={closing || !closeReason.trim()}>
                  {closing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Classement...</> : "Classer le dossier"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* RECEIVABILITY REVIEW DIALOG */}
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Validation de l'étude de recevabilité</DialogTitle>
                <DialogDescription>
                  Dossier {reviewRequest?.referenceNumber || `#${reviewRequest?.id}`} — {reviewRequest?.oec?.organizationName}
                </DialogDescription>
              </DialogHeader>
              {reviewRequest && (
                <div className="space-y-4 py-4">
                  <Alert>
                    <AlertDescription>
                      <strong>RA :</strong> {reviewRequest.assignedToRa?.fullName || "—"}<br />
                      <strong>Domaine :</strong> {reviewRequest.domain}<br />
                      <strong>Proposition du RA :</strong>{" "}
                      <Badge className={(reviewRequest as any).isReceivable ? "bg-green-500" : "bg-red-500"}>
                        {(reviewRequest as any).isReceivable ? "Recevable" : "Non recevable"}
                      </Badge>
                    </AlertDescription>
                  </Alert>
                  {(reviewRequest as any).receivabilityComments && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Commentaires du RA</Label>
                      <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">{(reviewRequest as any).receivabilityComments}</div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Vos commentaires (obligatoire si modifications demandées)</Label>
                    <Textarea value={reviewComments} onChange={(e) => setReviewComments(e.target.value)} placeholder="Observations, remarques, corrections à apporter..." rows={4} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleReviewReceivability(true)} disabled={reviewing}>
                      {reviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Approuver et envoyer à l'OEC
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleReviewReceivability(false)} disabled={reviewing}>
                      {reviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                      Demander modifications
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* CD VIEW CONVENTION DIALOG */}
          <Dialog open={cdConventionDialogOpen} onOpenChange={setCdConventionDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5" /> Convention
                </DialogTitle>
                <DialogDescription>
                  Dossier {cdSelectedQuotation?.request?.referenceNumber || `#${cdSelectedQuotation?.request?.id || cdSelectedQuotation?.requestId}`}
                  {cdSelectedQuotation?.request?.oec?.organizationName && <> — {cdSelectedQuotation.request.oec.organizationName}</>}
                </DialogDescription>
              </DialogHeader>
              {cdConventionLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
              ) : !cdConvention ? (
                <p className="text-center text-muted-foreground py-8">Aucune convention disponible pour ce dossier</p>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">N° Convention</p>
                      <p className="font-mono font-medium">{cdConvention.conventionNumber}</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Statut</p>
                      <p className="font-medium">{cdConvention.status || "—"}</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Contenu</p>
                    <p className="whitespace-pre-wrap">{cdConvention.content || "—"}</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Termes et conditions</p>
                    <p className="whitespace-pre-wrap">{cdConvention.termsAndConditions || "—"}</p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setCdConventionDialogOpen(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CD VALIDATE QUOTATION/CONVENTION DIALOG */}
          <Dialog open={cdValidationDialogOpen} onOpenChange={setCdValidationDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Valider et envoyer à l&apos;OEC</DialogTitle>
                <DialogDescription>
                  Confirmez la validation du devis et de la convention. Ils seront envoyés à l&apos;OEC qui dispose de 10 jours pour accepter.
                </DialogDescription>
              </DialogHeader>
              {cdSelectedQuotation && (
                <div className="space-y-4 py-4">
                  <Alert>
                    <AlertDescription>
                      <strong>N° :</strong> {cdSelectedQuotation.quotationNumber}<br />
                      <strong>OEC :</strong> {cdSelectedQuotation.request?.oec?.organizationName}<br />
                      <strong>Domaine :</strong> {cdSelectedQuotation.request?.domain}
                    </AlertDescription>
                  </Alert>
                  <div className="flex flex-wrap gap-2">
                    <a href={`/api/quotations/${cdSelectedQuotation.id}/devis.pdf`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" type="button">
                        <Download className="h-3.5 w-3.5 mr-1" /> Devis PDF
                      </Button>
                    </a>
                    <Button size="sm" variant="outline" type="button" onClick={() => openConventionView(cdSelectedQuotation)}>
                      <FileSignature className="h-3.5 w-3.5 mr-1" /> Convention
                    </Button>
                  </div>
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-amber-800">
                      <strong>Important :</strong> L&apos;OEC a 10 jours pour accepter. Un rappel sera envoyé au bout de 5 jours. Si l&apos;OEC ne répond pas dans les 15 jours, le dossier sera classé.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setCdValidationDialogOpen(false)} disabled={cdValidating}>Annuler</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleCDValidate} disabled={cdValidating}>
                  {cdValidating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validation...</> : <><Send className="mr-2 h-4 w-4" />Valider et envoyer à l&apos;OEC</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CD REQUEST MODIFICATIONS DIALOG */}
          <Dialog open={cdModifDialogOpen} onOpenChange={setCdModifDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Demander des modifications</DialogTitle>
                <DialogDescription>
                  Le RA sera notifié et pourra modifier le devis et/ou la convention avant de renvoyer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Modifications demandées *</Label>
                  <Textarea
                    value={cdModifComments}
                    onChange={(e) => setCdModifComments(e.target.value)}
                    placeholder="Décrivez les modifications à apporter au devis ou à la convention..."
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCdModifDialogOpen(false)} disabled={cdRequesting}>Annuler</Button>
                <Button variant="destructive" onClick={handleCDRequestModifications} disabled={cdRequesting || !cdModifComments.trim()}>
                  {cdRequesting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><AlertTriangle className="mr-2 h-4 w-4" />Demander modifications</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* TEAM VALIDATION DIALOG */}
          <Dialog open={teamValidDialogOpen} onOpenChange={setTeamValidDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Approuver la composition d'équipe</DialogTitle>
                <DialogDescription>
                  Confirmez que la composition de l'équipe et la date d'évaluation proposées sont conformes. Elles seront envoyées à l'OEC pour acceptation.
                </DialogDescription>
              </DialogHeader>
              {selectedTeamRequest && (
                <Alert>
                  <AlertDescription>
                    <strong>Dossier :</strong> {selectedTeamRequest.referenceNumber || `#${selectedTeamRequest.id}`}<br />
                    <strong>OEC :</strong> {selectedTeamRequest.oec?.organizationName}<br />
                    <strong>RA :</strong> {selectedTeamRequest.assignedToRa?.fullName || "—"}
                  </AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setTeamValidDialogOpen(false)} disabled={teamValidating}>Annuler</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleTeamApprove} disabled={teamValidating}>
                  {teamValidating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validation...</> : <><Send className="mr-2 h-4 w-4" />Approuver et envoyer à l'OEC</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* TEAM CHANGES DIALOG */}
          <Dialog open={teamChangesDialogOpen} onOpenChange={setTeamChangesDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Demander des modifications à la composition</DialogTitle>
                <DialogDescription>
                  Le RA sera notifié et devra modifier la composition de l'équipe et/ou la date avant de resoumettre.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Modifications demandées *</Label>
                  <Textarea
                    value={teamChangesComments}
                    onChange={(e) => setTeamChangesComments(e.target.value)}
                    placeholder="Décrivez les modifications à apporter à la composition ou à la date..."
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTeamChangesDialogOpen(false)} disabled={teamRequesting}>Annuler</Button>
                <Button variant="destructive" onClick={handleTeamRequestChanges} disabled={teamRequesting || !teamChangesComments.trim()}>
                  {teamRequesting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><AlertTriangle className="mr-2 h-4 w-4" />Demander modifications</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* RECUSATION EXAMINATION DIALOG */}
          <Dialog open={recusDialogOpen} onOpenChange={setRecusDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Examiner la récusation</DialogTitle>
                <DialogDescription>
                  L'OEC a récusé un ou plusieurs membres de l'équipe d'évaluation. Conformément à la PRO 22, examinez la demande et prenez une décision.
                </DialogDescription>
              </DialogHeader>
              {selectedRecusation && (
                <div className="space-y-4 py-4">
                  <Alert>
                    <AlertDescription>
                      <strong>Dossier :</strong> {selectedRecusation.referenceNumber || `#${selectedRecusation.id}`}<br />
                      <strong>OEC :</strong> {selectedRecusation.oec?.organizationName}<br />
                      <strong>RA :</strong> {selectedRecusation.assignedToRa?.fullName || "—"}
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-amber-200 bg-amber-50">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-amber-800">
                      <strong>Si acceptée :</strong> Le RA devra remplacer le(s) membre(s) récusé(s), faire signer l'engagement d'impartialité au nouveau membre, et resoumettre la composition.<br />
                      <strong>Si rejetée :</strong> L'équipe sera maintenue en l'état et l'OEC sera notifié.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label>Raison de votre décision *</Label>
                    <Textarea
                      value={recusDecisionReason}
                      onChange={(e) => setRecusDecisionReason(e.target.value)}
                      placeholder="Motivez votre décision conformément à la PRO 22..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleRecusationDecision(true)} disabled={recusProcessing || !recusDecisionReason.trim()}>
                      {recusProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Accepter la récusation
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleRecusationDecision(false)} disabled={recusProcessing || !recusDecisionReason.trim()}>
                      {recusProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                      Rejeter la récusation
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
