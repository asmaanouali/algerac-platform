import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, FileSearch, CheckCircle, XCircle, PlayCircle, FileSignature, AlertTriangle, Globe, Eye, ArrowRight, Send, FileText } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED_TO_RA: "Assigné",
  RECEIVABILITY_STUDY: "Étude en cours",
  RESOURCE_CHECK: "Vérification ressources",
  FOREIGN_EXPERT_PROPOSED: "Expert étranger proposé",
  PRELIMINARY_VISIT_PROPOSED: "Visite préliminaire proposée",
  PRELIMINARY_VISIT_ACCEPTED: "Visite acceptée",
  PRELIMINARY_VISIT_COMPLETED: "Visite terminée",
  OBSTACLES_IDENTIFIED: "Obstacles identifiés",
  PENDING_DG_VALIDATION: "Attente validation DG",
  DG_VALIDATED: "Validé par DG",
  RECEIVABLE: "Recevable",
  NOT_RECEIVABLE: "Non recevable",
  QUOTATION_PREPARATION: "Préparation devis",
  QUOTATION_SENT_TO_DAG: "Devis envoyé au DAG",
  QUOTATION_APPROVED_BY_DAG: "Devis approuvé par DAG",
  CONVENTION_PREPARATION: "Préparation convention",
  QUOTATION_CONVENTION_PENDING_CD: "En attente validation CD",
  QUOTATION_CONVENTION_CD_MODIF: "Modifications CD demandées",
  QUOTATION_SENT_TO_OEC: "Envoyé à l'OEC",
  QUOTATION_OEC_REMINDER: "Rappel OEC (5j)",
  QUOTATION_EXPIRED: "Délai OEC dépassé (classé)",
  QUOTATION_VALIDATED: "Devis validé par OEC",
  TEAM_DESIGNATION: "Constitution équipe",
  TEAM_SENT_TO_OEC: "Équipe envoyée à l'OEC",
  TEAM_VALIDATED: "Équipe validée",
  TEAM_RECUSED: "Équipe récusée",
  DOCUMENTARY_REVIEW: "Revue documentaire",
  DOCUMENTARY_REVIEW_DEFICIENCIES: "Insuffisances documentaires",
  AWAITING_OEC_DOC_RESPONSE: "Attente réponse OEC",
  DOCUMENTARY_REVIEW_COMPLETED: "Revue documentaire terminée",
  EVALUATION_PLAN_PREPARATION: "Préparation évaluation",
  EVALUATION_PLAN_VALIDATION: "Validation plan FOR 32",
  EVALUATION_PLANNED: "Évaluation planifiée",
  EVALUATION_IN_PROGRESS: "Évaluation en cours",
  EVALUATION_COMPLETED: "Évaluation terminée",
  AWAITING_ACTION_PLANS: "Attente plans d'action",
  ACTION_PLANS_EVALUATION: "Évaluation plans d'action",
  ACTION_PLANS_IMPLEMENTATION: "Mise en œuvre plans",
  GAPS_RESOLVED: "Écarts résolus",
  REPORT_DRAFTING: "Rédaction rapport",
  REPORT_VALIDATION: "Validation rapport",
  REPORT_VALIDATED: "Rapport validé",
  CAS_PREPARATION: "Préparation CAS",
  CAS_SCHEDULED: "CAS programmé",
  CAS_DECISION_GRANT: "Décision favorable",
  CAS_DECISION_REFUSAL: "Décision défavorable",
  CAS_DECISION_POSTPONEMENT: "Décision reportée",
  CERTIFICATE_PREPARATION: "Préparation certificat",
  CERTIFICATE_ISSUED: "Certificat délivré",
  ACTIVE: "Accréditation active",
  SUSPENDED: "Suspendu",
  WITHDRAWN: "Retiré",
  CLOSED: "Clôturé",
};

export default function RADashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Dialogs
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [dgPrepDialogOpen, setDgPrepDialogOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);

  // Form state
  const [referenceNumber, setReferenceNumber] = useState("");
  const [decision, setDecision] = useState("");
  const [comments, setComments] = useState("");
  const [resourcesAvailable, setResourcesAvailable] = useState("");
  const [foreignExpertNeeded, setForeignExpertNeeded] = useState(false);
  const [visitNeeded, setVisitNeeded] = useState("");
  const [visitJustification, setVisitJustification] = useState("");
  const [dgSynthesis, setDgSynthesis] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
    else if (user && !authLoading) loadData();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return null;

  const loadData = async () => {
    try {
      const res = await apiRequest("GET", "/api/requests/assigned-to-me");
      const data = await res.json();
      setAllRequests(Array.isArray(data) ? data : []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const newAssignments = allRequests.filter(r => r.status === "ASSIGNED_TO_RA");
  const inStudy = allRequests.filter(r => ["RECEIVABILITY_STUDY", "RESOURCE_CHECK", "FOREIGN_EXPERT_PROPOSED", "PRELIMINARY_VISIT_PROPOSED", "PRELIMINARY_VISIT_ACCEPTED", "PRELIMINARY_VISIT_COMPLETED", "OBSTACLES_IDENTIFIED", "PENDING_DG_VALIDATION"].includes(r.status));
  const validated = allRequests.filter(r => ["DG_VALIDATED", "RECEIVABLE"].includes(r.status));
  const inProgress = allRequests.filter(r => ["QUOTATION_PREPARATION", "QUOTATION_SENT_TO_DAG", "QUOTATION_APPROVED_BY_DAG", "CONVENTION_PREPARATION", "QUOTATION_CONVENTION_PENDING_CD", "QUOTATION_CONVENTION_CD_MODIF", "QUOTATION_SENT_TO_OEC", "QUOTATION_OEC_REMINDER", "QUOTATION_VALIDATED", "TEAM_DESIGNATION", "TEAM_SENT_TO_OEC", "TEAM_VALIDATED", "TEAM_RECUSED", "DOCUMENTARY_REVIEW", "DOCUMENTARY_REVIEW_DEFICIENCIES", "AWAITING_OEC_DOC_RESPONSE", "DOCUMENTARY_REVIEW_COMPLETED"].includes(r.status));
  const inEvaluation = allRequests.filter(r => ["EVALUATION_PLAN_PREPARATION", "EVALUATION_PLAN_VALIDATION", "EVALUATION_PLANNED", "EVALUATION_IN_PROGRESS", "EVALUATION_COMPLETED", "AWAITING_ACTION_PLANS", "ACTION_PLANS_EVALUATION", "ACTION_PLANS_IMPLEMENTATION", "GAPS_RESOLVED", "REPORT_DRAFTING", "REPORT_VALIDATION", "REPORT_VALIDATED", "CAS_PREPARATION", "CAS_SCHEDULED", "CAS_DECISION_GRANT", "CAS_DECISION_REFUSAL", "CAS_DECISION_POSTPONEMENT", "CERTIFICATE_PREPARATION", "CERTIFICATE_ISSUED", "ACTIVE"].includes(r.status));

  // Actions
  const startStudy = async (requestId: number) => {
    try {
      await apiRequest("POST", `/api/requests/${requestId}/start-study`);
      toast({ title: "Étude commencée", description: "L'étude de recevabilité a été lancée" });
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const openReferenceDialog = (request: any) => {
    setSelectedRequest(request);
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    setReferenceNumber(`D-${year}-${num}`);
    setReferenceDialogOpen(true);
  };

  const handleSetReference = async () => {
    if (!referenceNumber.trim()) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/set-reference`, { referenceNumber: referenceNumber.trim() });
      toast({ title: "Numéro attribué", description: `Référence ${referenceNumber} attribuée` });
      setReferenceDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const openDecisionDialog = (request: any) => {
    setSelectedRequest(request);
    setDecision("");
    setComments("");
    setDecisionDialogOpen(true);
  };

  const handleDecision = async () => {
    if (!decision || !comments.trim()) { toast({ title: "Erreur", description: "Remplissez tous les champs", variant: "destructive" }); return; }
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/receivability-decision`, {
        isReceivable: decision === "receivable",
        comments,
      });
      toast({ title: "Décision enregistrée", description: `Demande déclarée ${decision === "receivable" ? "recevable" : "non recevable"}` });
      setDecisionDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const openResourceDialog = (request: any) => {
    setSelectedRequest(request);
    setResourcesAvailable("");
    setForeignExpertNeeded(false);
    setResourceDialogOpen(true);
  };

  const handleResourceCheck = async () => {
    if (!resourcesAvailable) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/resource-check`, {
        resourcesAvailable: resourcesAvailable === "yes",
        foreignExpertNeeded,
        comments,
      });
      toast({ title: "Vérification enregistrée" });
      setResourceDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const openVisitDialog = (request: any) => {
    setSelectedRequest(request);
    setVisitNeeded("");
    setVisitJustification("");
    setVisitDialogOpen(true);
  };

  const handleVisitDecision = async () => {
    if (!visitNeeded) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/preliminary-visit-decision`, {
        visitNeeded: visitNeeded === "yes",
        justification: visitJustification,
      });
      toast({ title: "Décision enregistrée", description: visitNeeded === "yes" ? "Visite préliminaire proposée à l'OEC" : "Pas de visite nécessaire" });
      setVisitDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const openDGPrepDialog = (request: any) => {
    setSelectedRequest(request);
    setDgSynthesis("");
    setDgPrepDialogOpen(true);
  };

  const handleDGPrep = async () => {
    if (!dgSynthesis.trim()) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/prepare-dg-validation`, {
        synthesis: dgSynthesis,
      });
      toast({ title: "Dossier transmis", description: "Le dossier a été transmis au DG pour validation" });
      setDgPrepDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const openNotifyDialog = (request: any) => {
    setSelectedRequest(request);
    setNotifyDialogOpen(true);
  };

  const handleNotifyReceivable = async () => {
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/notify-receivable`, {});
      toast({ title: "OEC notifié", description: "L'OEC a été notifié de la recevabilité. Note de synthèse envoyée au CD." });
      setNotifyDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const getStepActions = (request: any) => {
    switch (request.status) {
      case "ASSIGNED_TO_RA":
        return !request.referenceNumber ? (
          <Button size="sm" onClick={() => openReferenceDialog(request)}><FileSignature className="mr-2 h-4 w-4" />Attribuer numéro</Button>
        ) : (
          <Button size="sm" onClick={() => startStudy(request.id)}><PlayCircle className="mr-2 h-4 w-4" />Commencer l'étude</Button>
        );
      case "RECEIVABILITY_STUDY":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openResourceDialog(request)}><Globe className="mr-1 h-4 w-4" />Ressources</Button>
            <Button size="sm" onClick={() => openDecisionDialog(request)}>Décision</Button>
          </div>
        );
      case "RESOURCE_CHECK":
        return <Button size="sm" onClick={() => openVisitDialog(request)}><Eye className="mr-1 h-4 w-4" />Visite préliminaire</Button>;
      case "PRELIMINARY_VISIT_COMPLETED":
        return <Button size="sm" onClick={() => openDGPrepDialog(request)}><Send className="mr-1 h-4 w-4" />Préparer dossier DG</Button>;
      case "DG_VALIDATED":
        return <Button size="sm" onClick={() => openNotifyDialog(request)}><CheckCircle className="mr-1 h-4 w-4" />Notifier OEC</Button>;
      case "RECEIVABLE":
        return <Button size="sm" onClick={() => setLocation(`/ra/demandes/${request.id}/devis`)}><ArrowRight className="mr-1 h-4 w-4" />Étape 3 : Devis</Button>;
      case "QUOTATION_PREPARATION":
        return <Button size="sm" variant="outline" onClick={() => setLocation(`/ra/demandes/${request.id}/devis`)}><FileText className="mr-1 h-4 w-4" />Continuer devis</Button>;
      case "QUOTATION_SENT_TO_DAG":
        return <Button size="sm" variant="outline" onClick={() => setLocation(`/ra/demandes/${request.id}/devis`)}><FileText className="mr-1 h-4 w-4" />Convention / Devis</Button>;
      case "QUOTATION_APPROVED_BY_DAG":
        return <Button size="sm" onClick={() => setLocation(`/ra/demandes/${request.id}/devis`)}><Send className="mr-1 h-4 w-4" />Convention & validation CD</Button>;
      case "CONVENTION_PREPARATION":
        return <Button size="sm" variant="outline" onClick={() => setLocation(`/ra/demandes/${request.id}/devis`)}><FileText className="mr-1 h-4 w-4" />Continuer convention</Button>;
      case "QUOTATION_CONVENTION_PENDING_CD":
        return <Button size="sm" variant="ghost" disabled><Loader2 className="mr-1 h-4 w-4 animate-spin" />En attente CD…</Button>;
      case "QUOTATION_CONVENTION_CD_MODIF":
        return <Button size="sm" variant="destructive" onClick={() => setLocation(`/ra/demandes/${request.id}/devis`)}><FileText className="mr-1 h-4 w-4" />Corriger (modif CD)</Button>;
      case "QUOTATION_SENT_TO_OEC":
      case "QUOTATION_OEC_REMINDER":
        return <Button size="sm" variant="ghost" disabled><Loader2 className="mr-1 h-4 w-4 animate-spin" />En attente OEC…</Button>;
      case "QUOTATION_EXPIRED":
        return <Badge variant="destructive">Délai OEC expiré</Badge>;
      case "QUOTATION_VALIDATED":
        return <Button size="sm" onClick={() => setLocation(`/ra/equipes`)}><ArrowRight className="mr-1 h-4 w-4" />Étape 4 : Équipe</Button>;
      case "TEAM_VALIDATED":
        return <Button size="sm" onClick={() => setLocation(`/ra/revue-documentaire`)}><ArrowRight className="mr-1 h-4 w-4" />Étape 5 : Revue</Button>;
      case "DOCUMENTARY_REVIEW":
      case "DOCUMENTARY_REVIEW_DEFICIENCIES":
      case "AWAITING_OEC_DOC_RESPONSE":
        return <Button size="sm" variant="outline" onClick={() => setLocation(`/ra/revue-documentaire`)}><FileSearch className="mr-1 h-4 w-4" />Revue documentaire</Button>;
      case "DOCUMENTARY_REVIEW_COMPLETED":
        return <Button size="sm" onClick={() => setLocation(`/ra/preparation-evaluation`)}><ArrowRight className="mr-1 h-4 w-4" />Étape 6 : Prép. évaluation</Button>;
      case "EVALUATION_PLAN_PREPARATION":
      case "EVALUATION_PLAN_VALIDATION":
        return <Button size="sm" variant="outline" onClick={() => setLocation(`/ra/preparation-evaluation`)}><FileText className="mr-1 h-4 w-4" />Préparation évaluation</Button>;
      case "EVALUATION_PLANNED":
        return <Badge className="bg-blue-100 text-blue-800">Évaluation planifiée</Badge>;
      case "EVALUATION_IN_PROGRESS":
        return <Badge className="bg-amber-100 text-amber-800">Évaluation sur site</Badge>;
      case "EVALUATION_COMPLETED":
        return <Button size="sm" onClick={() => setLocation(`/ra/ecarts`)}><ArrowRight className="mr-1 h-4 w-4" />Étape 8 : Écarts</Button>;
      case "AWAITING_ACTION_PLANS":
      case "ACTION_PLANS_EVALUATION":
      case "ACTION_PLANS_IMPLEMENTATION":
      case "GAPS_RESOLVED":
        return <Button size="sm" variant="outline" onClick={() => setLocation(`/ra/ecarts`)}><FileText className="mr-1 h-4 w-4" />Gestion écarts</Button>;
      case "REPORT_DRAFTING":
      case "REPORT_VALIDATION":
        return <Button size="sm" variant="outline" onClick={() => setLocation(`/ra/rapport`)}><FileText className="mr-1 h-4 w-4" />Validation rapport</Button>;
      case "REPORT_VALIDATED":
        return <Button size="sm" onClick={() => setLocation(`/ra/preparation-cas`)}><ArrowRight className="mr-1 h-4 w-4" />Étape 9 : CAS</Button>;
      case "CAS_PREPARATION":
      case "CAS_SCHEDULED":
        return <Button size="sm" variant="outline" onClick={() => setLocation(`/ra/preparation-cas`)}><FileText className="mr-1 h-4 w-4" />Préparation CAS</Button>;
      case "CAS_DECISION_GRANT":
        return <Button size="sm" onClick={() => setLocation(`/ra/decision`)}><CheckCircle className="mr-1 h-4 w-4" />Décision favorable</Button>;
      case "CAS_DECISION_REFUSAL":
        return <Badge variant="destructive">Refusé</Badge>;
      case "CAS_DECISION_POSTPONEMENT":
        return <Badge className="bg-amber-100 text-amber-800">Reporté</Badge>;
      case "CERTIFICATE_PREPARATION":
      case "CERTIFICATE_ISSUED":
      case "ACTIVE":
        return <Button size="sm" variant="outline" onClick={() => setLocation(`/ra/decision`)}><CheckCircle className="mr-1 h-4 w-4" />Accréditation</Button>;
      default:
        return <Badge variant="secondary">{STATUS_LABELS[request.status] || request.status}</Badge>;
    }
  };

  const getProgress = (status: string) => {
    const steps = [
      "ASSIGNED_TO_RA","RECEIVABILITY_STUDY","RESOURCE_CHECK","PENDING_DG_VALIDATION",
      "DG_VALIDATED","RECEIVABLE",
      "QUOTATION_PREPARATION","QUOTATION_APPROVED_BY_DAG","QUOTATION_CONVENTION_PENDING_CD","QUOTATION_VALIDATED",
      "TEAM_DESIGNATION","TEAM_VALIDATED",
      "DOCUMENTARY_REVIEW","DOCUMENTARY_REVIEW_COMPLETED",
      "EVALUATION_PLAN_PREPARATION","EVALUATION_PLANNED","EVALUATION_IN_PROGRESS","EVALUATION_COMPLETED",
      "AWAITING_ACTION_PLANS","GAPS_RESOLVED",
      "REPORT_DRAFTING","REPORT_VALIDATED",
      "CAS_PREPARATION","CAS_SCHEDULED","CAS_DECISION_GRANT",
      "CERTIFICATE_ISSUED","ACTIVE"
    ];
    const idx = steps.indexOf(status);
    return idx >= 0 ? Math.round(((idx + 1) / steps.length) * 100) : 5;
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Responsable d'Accréditation</h1>
                <p className="text-muted-foreground">Gérez l'ensemble du processus d'accréditation pour vos dossiers</p>
              </div>

              <div className="grid gap-4 md:grid-cols-5 mb-6">
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-600">{newAssignments.length}</div><p className="text-xs text-muted-foreground">Nouvelles assignations</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{inStudy.length}</div><p className="text-xs text-muted-foreground">Étude recevabilité</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{validated.length}</div><p className="text-xs text-muted-foreground">Validés / Recevables</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{inProgress.length}</div><p className="text-xs text-muted-foreground">En progression</p></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-purple-600">{inEvaluation.length}</div><p className="text-xs text-muted-foreground">Évaluation / Décision</p></CardContent></Card>
              </div>

              <Tabs defaultValue="new" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="new">Assignations ({newAssignments.length})</TabsTrigger>
                  <TabsTrigger value="study">Recevabilité ({inStudy.length})</TabsTrigger>
                  <TabsTrigger value="validated">Validés ({validated.length})</TabsTrigger>
                  <TabsTrigger value="progress">En cours ({inProgress.length})</TabsTrigger>
                  <TabsTrigger value="evaluation">Évaluation ({inEvaluation.length})</TabsTrigger>
                  <TabsTrigger value="all">Tous ({allRequests.length})</TabsTrigger>
                </TabsList>

                {/* Each tab renders the request table with appropriate actions */}
                {[
                  { value: "new", data: newAssignments, title: "Nouvelles assignations", desc: "Attribuez un numéro de référence puis démarrez l'étude" },
                  { value: "study", data: inStudy, title: "Étude de recevabilité", desc: "Vérifiez les ressources, décidez de la visite préliminaire, préparez le dossier DG" },
                  { value: "validated", data: validated, title: "Dossiers validés par DG", desc: "Notifiez l'OEC et passez à la contractualisation" },
                  { value: "progress", data: inProgress, title: "Dossiers en progression", desc: "Contractualisation, équipe d'évaluation, revue documentaire" },
                  { value: "evaluation", data: inEvaluation, title: "Évaluation & Décision", desc: "Préparation évaluation, écarts, rapport, CAS, accréditation (Étapes 6-9)" },
                  { value: "all", data: allRequests, title: "Tous les dossiers", desc: "Vue complète de tous vos dossiers" },
                ].map(({ value, data, title, desc }) => (
                  <TabsContent key={value} value={value}>
                    <Card>
                      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{desc}</CardDescription></CardHeader>
                      <CardContent>
                        {data.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Aucun dossier</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Référence</TableHead>
                                <TableHead>OEC</TableHead>
                                <TableHead>Domaine</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Progression</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.map((request: any) => (
                                <TableRow key={request.id}>
                                  <TableCell className="font-mono font-medium">{request.referenceNumber || <Badge variant="secondary">En attente</Badge>}</TableCell>
                                  <TableCell>{request.oec?.organizationName || request.oec?.fullName}</TableCell>
                                  <TableCell>{request.domain}</TableCell>
                                  <TableCell><Badge variant="outline">{STATUS_LABELS[request.status] || request.status.replace(/_/g, " ")}</Badge></TableCell>
                                  <TableCell><Progress value={getProgress(request.status)} className="w-20" /></TableCell>
                                  <TableCell>{getStepActions(request)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Reference Dialog */}
              <Dialog open={referenceDialogOpen} onOpenChange={setReferenceDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader><DialogTitle>Attribuer un numéro de référence</DialogTitle><DialogDescription>Numéro unique pour identifier ce dossier</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Numéro de référence *</Label>
                      <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="D-2026-001" />
                      <p className="text-xs text-muted-foreground">Format : D-ANNÉE-NUMÉRO</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReferenceDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleSetReference} disabled={processing}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Attribuer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Receivability Decision Dialog */}
              <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Décision de recevabilité</DialogTitle><DialogDescription>Évaluez la conformité du dossier</DialogDescription></DialogHeader>
                  {selectedRequest && (
                    <div className="space-y-4 py-4">
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Référence:</span><p className="font-mono font-medium">{selectedRequest.referenceNumber}</p></div>
                        <div><span className="text-muted-foreground">OEC:</span><p className="font-medium">{selectedRequest.oec?.organizationName}</p></div>
                        <div><span className="text-muted-foreground">Type:</span><p className="font-medium">{selectedRequest.type}</p></div>
                        <div><span className="text-muted-foreground">Domaine:</span><p className="font-medium">{selectedRequest.domain}</p></div>
                      </div>
                      <div className="space-y-3">
                        <Label>Décision *</Label>
                        <RadioGroup value={decision} onValueChange={setDecision}>
                          <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors cursor-pointer"><RadioGroupItem value="receivable" id="r1" /><Label htmlFor="r1" className="flex items-center gap-2 cursor-pointer flex-1"><CheckCircle className="h-5 w-5 text-green-600" /><div><p className="font-medium">Recevable</p><p className="text-sm text-muted-foreground">Conforme, passe à l'étape suivante</p></div></Label></div>
                          <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-3 hover:border-red-300 transition-colors cursor-pointer"><RadioGroupItem value="not-receivable" id="r2" /><Label htmlFor="r2" className="flex items-center gap-2 cursor-pointer flex-1"><XCircle className="h-5 w-5 text-red-600" /><div><p className="font-medium">Non recevable</p><p className="text-sm text-muted-foreground">L'OEC devra corriger et resoumettre</p></div></Label></div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2"><Label>Commentaires *</Label><Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Justification détaillée..." rows={4} /></div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDecisionDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleDecision} disabled={processing}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Resource Check Dialog */}
              <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Vérification des ressources</DialogTitle><DialogDescription>Vérifiez la disponibilité des évaluateurs et experts</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-3">
                      <Label>Ressources disponibles ? *</Label>
                      <RadioGroup value={resourcesAvailable} onValueChange={setResourcesAvailable}>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="res-y" /><Label htmlFor="res-y">Oui — évaluateurs compétents disponibles</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="res-n" /><Label htmlFor="res-n">Non — besoin d'experts étrangers</Label></div>
                      </RadioGroup>
                    </div>
                    {resourcesAvailable === "no" && (
                      <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>L'OEC sera consulté pour accepter les frais supplémentaires liés à l'intervention d'experts étrangers.</AlertDescription></Alert>
                    )}
                    <div className="space-y-2"><Label>Commentaires</Label><Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Détails..." rows={3} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setResourceDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleResourceCheck} disabled={processing || !resourcesAvailable}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Valider</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Preliminary Visit Dialog */}
              <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Visite préliminaire</DialogTitle><DialogDescription>Décidez si une visite préliminaire est nécessaire</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-3">
                      <Label>Visite préliminaire nécessaire ? *</Label>
                      <RadioGroup value={visitNeeded} onValueChange={setVisitNeeded}>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="v-y" /><Label htmlFor="v-y">Oui — une visite du site est nécessaire</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="v-n" /><Label htmlFor="v-n">Non — le dossier peut être traité sans visite</Label></div>
                      </RadioGroup>
                    </div>
                    {visitNeeded === "yes" && (
                      <div className="space-y-2"><Label>Justification *</Label><Textarea value={visitJustification} onChange={(e) => setVisitJustification(e.target.value)} placeholder="Pourquoi la visite est nécessaire..." rows={3} /></div>
                    )}
                    <Alert><AlertDescription>Si oui, l'OEC sera informé et devra accepter la visite préliminaire.</AlertDescription></Alert>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setVisitDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleVisitDecision} disabled={processing || !visitNeeded}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* DG Preparation Dialog */}
              <Dialog open={dgPrepDialogOpen} onOpenChange={setDgPrepDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Préparer le dossier pour le DG</DialogTitle><DialogDescription>Rédigez la note de synthèse pour validation par le Directeur Général</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <Alert><AlertDescription>Le DG validera la recevabilité du dossier sur la base de votre synthèse. Cette étape est obligatoire avant de notifier l'OEC.</AlertDescription></Alert>
                    <div className="space-y-2"><Label>Note de synthèse pour le DG *</Label><Textarea value={dgSynthesis} onChange={(e) => setDgSynthesis(e.target.value)} placeholder="Résumez les conclusions de votre étude de recevabilité..." rows={8} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDgPrepDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleDGPrep} disabled={processing || !dgSynthesis.trim()}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Transmettre au DG</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Notify OEC Dialog */}
              <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Notifier l'OEC de la recevabilité</DialogTitle><DialogDescription>L'OEC sera informé que sa demande est recevable. Une note de synthèse sera envoyée au CD.</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Le dossier a été validé par le DG. L'OEC recevra une notification et vous pourrez passer à l'étape de contractualisation.</AlertDescription></Alert>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNotifyDialogOpen(false)} disabled={processing}>Annuler</Button>
                    <Button onClick={handleNotifyReceivable} disabled={processing}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Notifier et continuer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
