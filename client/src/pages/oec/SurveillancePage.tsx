import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Eye, Calendar, AlertTriangle, FileText, CheckCircle, Clock,
  Activity, Upload, ArrowRight, RefreshCw, Expand, Zap, Info, TrendingUp
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Programmée", color: "bg-blue-100 text-blue-800" },
  RISK_ANALYSIS_SENT: { label: "FOR 77-1 envoyé", color: "bg-purple-100 text-purple-800" },
  RISK_ANALYSIS_COMPLETED: { label: "FOR 77-1 complété", color: "bg-purple-100 text-purple-800" },
  RISK_ANALYZED: { label: "Risque analysé", color: "bg-indigo-100 text-indigo-800" },
  DOCUMENTS_REQUESTED: { label: "Documents demandés", color: "bg-yellow-100 text-yellow-800" },
  DOCUMENTS_RECEIVED: { label: "Documents envoyés", color: "bg-lime-100 text-lime-800" },
  QUOTATION_SENT: { label: "Devis reçu", color: "bg-orange-100 text-orange-800" },
  QUOTATION_ACCEPTED: { label: "Devis accepté", color: "bg-teal-100 text-teal-800" },
  QUOTATION_REJECTED: { label: "Devis refusé", color: "bg-red-100 text-red-800" },
  TEAM_DESIGNATED: { label: "Équipe constituée", color: "bg-indigo-100 text-indigo-800" },
  TEAM_VALIDATED: { label: "Équipe validée", color: "bg-cyan-100 text-cyan-800" },
  PLAN_PREPARED: { label: "Plan préparé", color: "bg-slate-100 text-slate-800" },
  PLAN_VALIDATED: { label: "Plan validé", color: "bg-emerald-100 text-emerald-800" },
  PLAN_SENT_TO_OEC: { label: "Plan reçu", color: "bg-sky-100 text-sky-800" },
  MISSION_ORDERS_APPROVED: { label: "OM approuvés", color: "bg-violet-100 text-violet-800" },
  MISSION_ORDERS_SENT: { label: "OM envoyés", color: "bg-fuchsia-100 text-fuchsia-800" },
  IN_PROGRESS: { label: "En cours", color: "bg-cyan-100 text-cyan-800" },
  EVALUATION_COMPLETED: { label: "Évaluation terminée", color: "bg-amber-100 text-amber-800" },
  REPORT_DRAFTING: { label: "Rédaction rapport", color: "bg-amber-100 text-amber-800" },
  REPORT_VALIDATION: { label: "Validation rapport", color: "bg-orange-100 text-orange-800" },
  REPORT_VALIDATED: { label: "Rapport validé", color: "bg-emerald-100 text-emerald-800" },
  CAS_PREPARATION: { label: "Préparation CAS", color: "bg-rose-100 text-rose-800" },
  CAS_SUBMITTED: { label: "Soumis au CAS", color: "bg-red-100 text-red-800" },
  COMPLETED: { label: "Terminée", color: "bg-emerald-100 text-emerald-800" },
  SANCTIONS_APPLIED: { label: "Sanctions", color: "bg-red-200 text-red-900" },
};

const EVAL_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  SURVEILLANCE: { label: "Surveillance", color: "bg-blue-50 text-blue-700 border-blue-200" },
  EXTENSION: { label: "Extension", color: "bg-green-50 text-green-700 border-green-200" },
  RENOUVELLEMENT: { label: "Renouvellement", color: "bg-amber-50 text-amber-700 border-amber-200" },
  EXTRAORDINAIRE: { label: "Extraordinaire", color: "bg-red-50 text-red-700 border-red-200" },
};

const WORKFLOW_STEPS = [
  "PLANNED", "DOCUMENTS_REQUESTED", "QUOTATION_SENT", "QUOTATION_ACCEPTED",
  "TEAM_DESIGNATED", "IN_PROGRESS", "REPORT_VALIDATED", "CAS_SUBMITTED", "COMPLETED"
];

export default function OECSurveillancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  // Dialogs
  const [showSubmitDocs, setShowSubmitDocs] = useState(false);
  const [showAcceptQuotation, setShowAcceptQuotation] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Forms
  const [docsForm, setDocsForm] = useState({ documents: "" });

  useEffect(() => { loadEvaluations(); }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflow/surveillance/all", { credentials: "include" });
      const data = await res.json();
      if (data.success) setEvaluations(data.data || []);
    } catch (err) { }
    setLoading(false);
  };

  const handleSubmitDocuments = async () => {
    if (!selectedEval) return;
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/submit-documents`, docsForm);
      toast({ title: "Documents soumis avec succès" });
      setShowSubmitDocs(false);
      setDocsForm({ documents: "" });
      loadEvaluations();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleQuotationResponse = async (accepted: boolean) => {
    if (!selectedEval) return;
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/accept-quotation`, { accepted });
      toast({ title: accepted ? "Devis accepté" : "Devis refusé" });
      setShowAcceptQuotation(false);
      loadEvaluations();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return <Badge className={cfg.color}>{cfg.label}</Badge>;
  };

  const getEvalTypeBadge = (type: string) => {
    const cfg = EVAL_TYPE_CONFIG[type || "SURVEILLANCE"] || EVAL_TYPE_CONFIG.SURVEILLANCE;
    return <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>;
  };

  // OEC-specific actions: submit documents, accept/reject quotation
  const needsAction = (ev: any) => {
    return ev.status === "DOCUMENTS_REQUESTED" || ev.status === "QUOTATION_SENT";
  };

  const pending = evaluations.filter(e => needsAction(e));
  const active = evaluations.filter(e => !needsAction(e) && e.status !== "COMPLETED" && e.status !== "SANCTIONS_APPLIED");
  const done = evaluations.filter(e => e.status === "COMPLETED" || e.status === "SANCTIONS_APPLIED");

  const getTabEvals = (tab: string) => {
    switch (tab) {
      case "pending": return pending;
      case "active": return active;
      case "completed": return done;
      default: return evaluations;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Eye className="w-7 h-7 text-primary" />
                Mes Surveillances
              </h1>
              <p className="text-muted-foreground mt-1">
                Suivi des évaluations de surveillance, extensions et renouvellements de votre accréditation
              </p>
            </div>
            <Button variant="outline" onClick={loadEvaluations} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
          </div>

          {/* Pending actions alert */}
          {pending.length > 0 && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {pending.length} action{pending.length > 1 ? "s" : ""} en attente de votre part
                  </p>
                  <p className="text-xs text-amber-600">
                    {pending.filter(e => e.status === "DOCUMENTS_REQUESTED").length > 0 && "Documents à soumettre (FOR 68). "}
                    {pending.filter(e => e.status === "QUOTATION_SENT").length > 0 && "Devis à accepter/refuser."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("pending")}>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
                  <p className="text-xs text-muted-foreground">Actions requises</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("active")}>
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{active.length}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("completed")}>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">{done.length}</p>
                  <p className="text-xs text-muted-foreground">Terminées</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{evaluations.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT: List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 h-8">
                      <TabsTrigger value="pending" className="text-xs">
                        Actions {pending.length > 0 && <Badge className="ml-1 h-4 w-4 p-0 text-[10px] bg-amber-500">{pending.length}</Badge>}
                      </TabsTrigger>
                      <TabsTrigger value="active" className="text-xs">En cours</TabsTrigger>
                      <TabsTrigger value="completed" className="text-xs">Terminées</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {loading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Chargement...</p>
                  ) : getTabEvals(activeTab).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Aucune évaluation</p>
                  ) : getTabEvals(activeTab).map((ev: any) => (
                    <div key={ev.id} onClick={() => { setSelectedEval(ev); setShowDetails(true); }}
                      className={`p-3 rounded-lg cursor-pointer border transition-all ${
                        selectedEval?.id === ev.id ? "bg-primary/10 border-primary shadow-sm" : "hover:bg-gray-50 border-transparent"
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{ev.evaluationCode || `#${ev.id}`}</p>
                        {getEvalTypeBadge(ev.evaluationType)}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(ev.status)}
                        {needsAction(ev) && <Badge className="bg-amber-500 text-white text-[10px]">Action</Badge>}
                      </div>
                      {ev.evaluationDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(ev.evaluationDate).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Detail panel */}
            <div className="lg:col-span-3">
              {!selectedEval ? (
                <Card className="flex flex-col items-center justify-center h-64 gap-3">
                  <Eye className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Sélectionnez une évaluation pour voir les détails</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <CardTitle>{selectedEval.evaluationCode || `Évaluation #${selectedEval.id}`}</CardTitle>
                          {getEvalTypeBadge(selectedEval.evaluationType)}
                          {getStatusBadge(selectedEval.status)}
                        </div>
                      </div>
                      <CardDescription className="mt-2">
                        <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <span>Date: {selectedEval.evaluationDate ? new Date(selectedEval.evaluationDate).toLocaleDateString("fr-FR") : "Non planifiée"}</span>
                          {selectedEval.focusScope && <span>Portée: {selectedEval.focusScope.substring(0, 100)}{selectedEval.focusScope.length > 100 ? "..." : ""}</span>}
                          {selectedEval.quotationAmount && <span>Devis: {selectedEval.quotationAmount} DA</span>}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        {selectedEval.status === "DOCUMENTS_REQUESTED" && (
                          <Button size="sm" onClick={() => setShowSubmitDocs(true)} className="gap-1">
                            <Upload className="w-3 h-3" />Soumettre les documents (FOR 68)
                          </Button>
                        )}
                        {selectedEval.status === "QUOTATION_SENT" && (
                          <>
                            <Button size="sm" onClick={() => handleQuotationResponse(true)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle className="w-3 h-3" />Accepter le devis
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleQuotationResponse(false)} className="gap-1">
                              Refuser le devis
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Workflow progress */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Progression</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-1 flex-wrap">
                        {WORKFLOW_STEPS.map((step, i) => {
                          const statusOrder = Object.keys(STATUS_CONFIG);
                          const currentIdx = statusOrder.indexOf(selectedEval.status);
                          const stepIdx = statusOrder.indexOf(step);
                          const isCompleted = currentIdx >= stepIdx;
                          const isCurrent = selectedEval.status === step;

                          return (
                            <div key={step} className="flex items-center gap-1">
                              <div className={`w-2.5 h-2.5 rounded-full ${
                                isCurrent ? "bg-primary ring-2 ring-primary/30" :
                                isCompleted ? "bg-emerald-500" : "bg-gray-200"
                              }`} />
                              <span className={`text-[10px] ${isCurrent ? "font-medium text-primary" : isCompleted ? "text-emerald-600" : "text-muted-foreground"}`}>
                                {STATUS_CONFIG[step]?.label || step}
                              </span>
                              {i < WORKFLOW_STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/50" />}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* What to expect section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="w-4 h-4" />Informations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedEval.status === "DOCUMENTS_REQUESTED" && (
                        <div className="text-sm space-y-2">
                          <p className="font-medium text-amber-700">Action requise: Soumettre les documents FOR 68</p>
                          <p className="text-muted-foreground text-xs">
                            ALGERAC vous demande de fournir les documents nécessaires à la préparation de l'évaluation.
                            Cette demande est envoyée au moins 2 mois avant la date prévue de l'évaluation.
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Documents typiques: manuel qualité, procédures, rapport d'audit interne,
                            revue de direction, résultats d'essais d'aptitude, registre des réclamations.
                          </p>
                        </div>
                      )}
                      {selectedEval.status === "QUOTATION_SENT" && (
                        <div className="text-sm space-y-2">
                          <p className="font-medium text-amber-700">Action requise: Répondre au devis</p>
                          <p className="text-muted-foreground text-xs">
                            Un devis de {selectedEval.quotationAmount ? `${selectedEval.quotationAmount} DA` : "surveillance"} vous a été envoyé.
                            Veuillez l'accepter ou le refuser. En cas de refus, vous pouvez contacter ALGERAC pour discussion.
                          </p>
                        </div>
                      )}
                      {selectedEval.status === "PLANNED" && (
                        <p className="text-sm text-muted-foreground">
                          Votre surveillance est programmée. ALGERAC va effectuer l'analyse de risque (FOR 77-1)
                          puis vous envoyer la demande de documents (FOR 68) au moins 2 mois avant l'évaluation.
                        </p>
                      )}
                      {["IN_PROGRESS"].includes(selectedEval.status) && (
                        <p className="text-sm text-muted-foreground">
                          L'évaluation est en cours. L'équipe d'évaluation examine votre conformité
                          aux exigences d'accréditation (ISO/IEC 17025, etc.).
                        </p>
                      )}
                      {["REPORT_DRAFTING", "REPORT_VALIDATION", "REPORT_VALIDATED"].includes(selectedEval.status) && (
                        <p className="text-sm text-muted-foreground">
                          Le rapport d'évaluation est en cours de rédaction/validation.
                          Il sera soumis au Comité d'Accréditation Sectoriel (CAS) pour décision.
                        </p>
                      )}
                      {["CAS_PREPARATION", "CAS_SUBMITTED"].includes(selectedEval.status) && (
                        <p className="text-sm text-muted-foreground">
                          Le dossier est soumis au CAS. La décision peut être: maintien, maintien avec réserves,
                          réduction de portée, suspension ou retrait (PRO 23).
                        </p>
                      )}
                      {selectedEval.status === "COMPLETED" && (
                        <p className="text-sm text-emerald-700 font-medium">
                          Évaluation terminée. La décision CAS est définitive.
                        </p>
                      )}
                      {selectedEval.status === "SANCTIONS_APPLIED" && (
                        <p className="text-sm text-red-700 font-medium">
                          Des sanctions ont été appliquées (PRO 23). Consultez le détail ci-dessous.
                          Vous disposez d'un droit de recours.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Findings & results */}
                  {(selectedEval.evaluationFindings || selectedEval.casDecision) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Résultats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedEval.evaluationFindings && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Constats de l'évaluation</p>
                            <p className="text-sm whitespace-pre-wrap">{selectedEval.evaluationFindings}</p>
                          </div>
                        )}
                        {selectedEval.casRecommendation && (
                          <div className="pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Recommandation</p>
                            <p className="text-sm">{selectedEval.casRecommendation}</p>
                          </div>
                        )}
                        {selectedEval.casDecision && (
                          <div className="pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Décision CAS</p>
                            <p className="text-sm font-medium">{selectedEval.casDecision}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit Documents Dialog */}
          <Dialog open={showSubmitDocs} onOpenChange={setShowSubmitDocs}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Soumettre les documents (FOR 68)</DialogTitle>
                <DialogDescription>
                  Fournissez les documents demandés par ALGERAC pour préparer l'évaluation de surveillance.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label>Documents / Références</Label>
                <Textarea value={docsForm.documents}
                  onChange={e => setDocsForm({ ...docsForm, documents: e.target.value })}
                  placeholder="Liste des documents fournis, références, dates de version..."
                  className="min-h-[150px]" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSubmitDocs(false)}>Annuler</Button>
                <Button onClick={handleSubmitDocuments}>
                  <Upload className="w-4 h-4 mr-1" />Soumettre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </div>
  );
}
