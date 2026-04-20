import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Shield, Eye, Calendar, AlertTriangle, FileText, CheckCircle,
  Clock, Users, Activity, BarChart3, ArrowRight, RefreshCw,
  Expand, Zap, Info, TrendingUp, XCircle
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Programmée", color: "bg-blue-100 text-blue-800" },
  RISK_ANALYSIS_SENT: { label: "FOR 77-1 envoyé", color: "bg-purple-100 text-purple-800" },
  RISK_ANALYSIS_COMPLETED: { label: "FOR 77-1 complété", color: "bg-purple-100 text-purple-800" },
  RISK_ANALYZED: { label: "Risque analysé", color: "bg-indigo-100 text-indigo-800" },
  DOCUMENTS_REQUESTED: { label: "FOR 68 envoyé", color: "bg-yellow-100 text-yellow-800" },
  DOCUMENTS_RECEIVED: { label: "Documents reçus", color: "bg-lime-100 text-lime-800" },
  QUOTATION_SENT: { label: "Devis envoyé", color: "bg-orange-100 text-orange-800" },
  QUOTATION_ACCEPTED: { label: "Devis accepté", color: "bg-teal-100 text-teal-800" },
  QUOTATION_REJECTED: { label: "Devis refusé", color: "bg-red-100 text-red-800" },
  TEAM_DESIGNATED: { label: "Équipe désignée", color: "bg-indigo-100 text-indigo-800" },
  TEAM_VALIDATED: { label: "Équipe validée", color: "bg-cyan-100 text-cyan-800" },
  PLAN_PREPARED: { label: "Plan préparé", color: "bg-slate-100 text-slate-800" },
  PLAN_VALIDATED: { label: "Plan validé", color: "bg-emerald-100 text-emerald-800" },
  PLAN_SENT_TO_OEC: { label: "Plan envoyé OEC", color: "bg-sky-100 text-sky-800" },
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
  SANCTIONS_APPLIED: { label: "Sanctions (PRO 23)", color: "bg-red-200 text-red-900" },
};

const EVAL_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  SURVEILLANCE: { label: "Surveillance", color: "bg-blue-50 text-blue-700 border-blue-200" },
  EXTENSION: { label: "Extension", color: "bg-green-50 text-green-700 border-green-200" },
  RENOUVELLEMENT: { label: "Renouvellement", color: "bg-amber-50 text-amber-700 border-amber-200" },
  EXTRAORDINAIRE: { label: "Extraordinaire", color: "bg-red-50 text-red-700 border-red-200" },
};

const WORKFLOW_STEPS = [
  "PLANNED", "RISK_ANALYSIS_COMPLETED", "DOCUMENTS_RECEIVED", "QUOTATION_ACCEPTED",
  "TEAM_DESIGNATED", "IN_PROGRESS", "REPORT_VALIDATED", "CAS_SUBMITTED", "COMPLETED"
];

export default function CDSurveillancePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
  const [deadlineViolations, setDeadlineViolations] = useState<any[]>([]);
  const [findingDeadlines, setFindingDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Dialogs
  const [showExtraordinary, setShowExtraordinary] = useState(false);
  const [showValidateReport, setShowValidateReport] = useState(false);
  const [showCycleInfo, setShowCycleInfo] = useState(false);
  const [cycleInfo, setCycleInfo] = useState<any>(null);

  // Forms
  const [extraordinaryForm, setExtraordinaryForm] = useState({ certificateId: "", requestId: "", reason: "", triggerType: "COMPLAINT" });
  const [validateReportForm, setValidateReportForm] = useState({ validated: true, corrections: "" });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [allRes, dlRes, fdRes] = await Promise.all([
        fetch("/api/workflow/surveillance/all", { credentials: "include" }).then(r => r.json()).catch(() => ({ success: false })),
        fetch("/api/workflow/surveillance/check-deadlines", { credentials: "include" }).then(r => r.json()).catch(() => ({ success: false })),
        fetch("/api/workflow/surveillance/check-finding-deadlines", { credentials: "include" }).then(r => r.json()).catch(() => ({ success: false })),
      ]);
      if (allRes?.success) setEvaluations(allRes.data || []);
      if (dlRes?.success) setDeadlineViolations(dlRes.data || []);
      if (fdRes?.success) setFindingDeadlines(fdRes.data || []);
    } catch (err) { }
    setLoading(false);
  };

  const selectEval = async (ev: any) => {
    setSelectedEval(ev);
    try {
      const res = await fetch(`/api/workflow/surveillance/${ev.id}/risk-analysis`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setRiskAnalysis(data.data);
      else setRiskAnalysis(null);
    } catch { setRiskAnalysis(null); }
  };

  const loadCycleInfo = async (certificateId: number) => {
    try {
      const res = await fetch(`/api/workflow/surveillance/cycle/${certificateId}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) { setCycleInfo(data.data); setShowCycleInfo(true); }
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleExtraordinary = async () => {
    try {
      await apiRequest("POST", "/api/workflow/surveillance/extraordinary", {
        certificateId: parseInt(extraordinaryForm.certificateId),
        requestId: parseInt(extraordinaryForm.requestId),
        reason: extraordinaryForm.reason,
        triggerType: extraordinaryForm.triggerType
      });
      toast({ title: "Surveillance extraordinaire programmée" });
      setShowExtraordinary(false);
      setExtraordinaryForm({ certificateId: "", requestId: "", reason: "", triggerType: "COMPLAINT" });
      loadAll();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleValidateReport = async () => {
    if (!selectedEval) return;
    try {
      await apiRequest("PUT", `/api/workflow/surveillance/${selectedEval.id}/validate-report`, validateReportForm);
      toast({ title: validateReportForm.validated ? "Rapport validé" : "Corrections demandées" });
      setShowValidateReport(false);
      selectEval(selectedEval);
      loadAll();
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

  const inProgress = evaluations.filter(e => e.status !== "COMPLETED" && e.status !== "SANCTIONS_APPLIED");
  const completedEvals = evaluations.filter(e => e.status === "COMPLETED" || e.status === "SANCTIONS_APPLIED");
  const needsReview = evaluations.filter(e => ["REPORT_DRAFTING", "REPORT_VALIDATION"].includes(e.status));

  const getTabEvals = (tab: string) => {
    switch (tab) {
      case "review": return needsReview;
      case "in-progress": return inProgress;
      case "completed": return completedEvals;
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
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-7 h-7 text-primary" />
                Surveillance — Direction Qualité
              </h1>
              <p className="text-muted-foreground mt-1">
                PRO 25 — Supervision des cycles de surveillance, validation des rapports, suivi des délais
              </p>
            </div>
            <Button onClick={() => setShowExtraordinary(true)} variant="outline" className="gap-1 border-red-300 text-red-700 hover:bg-red-50">
              <Zap className="w-4 h-4" /> Surveillance extraordinaire
            </Button>
          </div>

          {/* Deadline alerts */}
          {(deadlineViolations.length > 0 || findingDeadlines.length > 0) && (
            <div className="mb-6 space-y-3">
              {deadlineViolations.map((v: any, i: number) => (
                <Card key={`dl-${i}`} className="border-red-200 bg-red-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        Dépassement délai — {v.evaluationCode || `#${v.evaluationId}`}
                      </p>
                      <p className="text-xs text-red-600">
                        {v.monthsSinceGrant} mois écoulés (max {v.maxMonths}). Retard: {v.overdueDays} jours.
                        Suspension immédiate requise (PRO 23 §5.1).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {findingDeadlines.map((f: any, i: number) => (
                <Card key={`fd-${i}`} className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">
                        Écarts non soldés — {f.evaluationCode || `#${f.evaluationId}`}
                      </p>
                      <p className="text-xs text-orange-600">
                        {f.daysSinceEvaluation} jours (max {f.deadlineDays}). Retard: {f.overdueDays} jours.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("all")}>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{evaluations.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("review")}>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-600">{needsReview.length}</p>
                  <p className="text-xs text-muted-foreground">À valider</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("in-progress")}>
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{inProgress.length}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("completed")}>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">{completedEvals.length}</p>
                  <p className="text-xs text-muted-foreground">Terminées</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{deadlineViolations.length + findingDeadlines.length}</p>
                  <p className="text-xs text-muted-foreground">Alertes</p>
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
                    <TabsList className="grid grid-cols-4 h-8">
                      <TabsTrigger value="all" className="text-xs">Tout</TabsTrigger>
                      <TabsTrigger value="review" className="text-xs">
                        Valider {needsReview.length > 0 && <Badge className="ml-1 h-4 w-4 p-0 text-[10px] bg-amber-500">{needsReview.length}</Badge>}
                      </TabsTrigger>
                      <TabsTrigger value="in-progress" className="text-xs">En cours</TabsTrigger>
                      <TabsTrigger value="completed" className="text-xs">Fini</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {loading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Chargement...</p>
                  ) : getTabEvals(activeTab).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Aucune évaluation</p>
                  ) : getTabEvals(activeTab).map((ev: any) => (
                    <div key={ev.id} onClick={() => selectEval(ev)}
                      className={`p-3 rounded-lg cursor-pointer border transition-all ${
                        selectedEval?.id === ev.id ? "bg-primary/10 border-primary shadow-sm" : "hover:bg-gray-50 border-transparent"
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{ev.evaluationCode || `#${ev.id}`}</p>
                        {getEvalTypeBadge(ev.evaluationType)}
                      </div>
                      <div className="mt-1">{getStatusBadge(ev.status)}</div>
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

            {/* RIGHT: Detail */}
            <div className="lg:col-span-3">
              {!selectedEval ? (
                <Card className="flex flex-col items-center justify-center h-64 gap-3">
                  <Shield className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Sélectionnez une évaluation pour la supervision</p>
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
                        {selectedEval.certificate?.id && (
                          <Button size="sm" variant="ghost" className="text-xs"
                            onClick={() => loadCycleInfo(selectedEval.certificate.id)}>
                            <Info className="w-3 h-3 mr-1" />Cycle
                          </Button>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <span>Date: {selectedEval.evaluationDate ? new Date(selectedEval.evaluationDate).toLocaleDateString("fr-FR") : "Non planifiée"}</span>
                          {selectedEval.focusScope && <span>Portée: {selectedEval.focusScope.substring(0, 80)}...</span>}
                          {selectedEval.quotationAmount && <span>Devis: {selectedEval.quotationAmount} DA</span>}
                          {selectedEval.extraordinaryReason && <span>Motif: {selectedEval.extraordinaryReason}</span>}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        {["REPORT_DRAFTING", "REPORT_VALIDATION"].includes(selectedEval.status) && (
                          <Button size="sm" onClick={() => setShowValidateReport(true)} className="gap-1">
                            <CheckCircle className="w-3 h-3" />Valider le rapport
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Workflow progress */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Progression du workflow</CardTitle>
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

                  {/* Risk analysis */}
                  {riskAnalysis && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />Analyse de risque FOR 77-1
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {[
                            { key: "organizationChanges", label: "Changements organisationnels" },
                            { key: "scopeModifications", label: "Modifications de portée" },
                            { key: "complaintsReceived", label: "Réclamations reçues" },
                            { key: "qualityIncidents", label: "Incidents qualité" },
                            { key: "keyPersonnelChanges", label: "Changements personnel clé" },
                            { key: "newSites", label: "Nouveaux sites" },
                            { key: "managementSystemChanges", label: "Changements système management" },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              {riskAnalysis[key] ?
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> :
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                              <span className="text-xs">{label}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Findings */}
                  {(selectedEval.evaluationFindings || selectedEval.casDecision) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Constats & décisions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedEval.evaluationFindings && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Constats</p>
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

          {/* ===== DIALOGS ===== */}

          {/* Extraordinary Surveillance */}
          <Dialog open={showExtraordinary} onOpenChange={setShowExtraordinary}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Surveillance extraordinaire</DialogTitle>
                <DialogDescription>PRO 25 §5.2.1 — Initiée par le CD suite à un événement significatif</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID Certificat</Label>
                    <Input type="number" value={extraordinaryForm.certificateId}
                      onChange={e => setExtraordinaryForm({ ...extraordinaryForm, certificateId: e.target.value })} />
                  </div>
                  <div>
                    <Label>ID Demande</Label>
                    <Input type="number" value={extraordinaryForm.requestId}
                      onChange={e => setExtraordinaryForm({ ...extraordinaryForm, requestId: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Motif déclencheur</Label>
                  <Select value={extraordinaryForm.triggerType}
                    onValueChange={v => setExtraordinaryForm({ ...extraordinaryForm, triggerType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLAINT">Réclamation de tiers</SelectItem>
                      <SelectItem value="REORGANIZATION">Réorganisation importante</SelectItem>
                      <SelectItem value="TRANSFER">Transfert d'accréditation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Justification</Label>
                  <Textarea value={extraordinaryForm.reason}
                    onChange={e => setExtraordinaryForm({ ...extraordinaryForm, reason: e.target.value })}
                    placeholder="Détail de l'événement..." className="min-h-[100px]" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExtraordinary(false)}>Annuler</Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={handleExtraordinary}>Initier</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Validate Report */}
          <Dialog open={showValidateReport} onOpenChange={setShowValidateReport}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Validation du rapport — CD</DialogTitle>
                <DialogDescription>PRO 25 §5.3 — Validation technique avant soumission CAS</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked={validateReportForm.validated}
                    onChange={e => setValidateReportForm({ ...validateReportForm, validated: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300" />
                  <Label>Rapport validé et conforme</Label>
                </div>
                {!validateReportForm.validated && (
                  <div>
                    <Label>Corrections demandées</Label>
                    <Textarea value={validateReportForm.corrections}
                      onChange={e => setValidateReportForm({ ...validateReportForm, corrections: e.target.value })}
                      placeholder="Corrections à apporter..." />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowValidateReport(false)}>Annuler</Button>
                <Button onClick={handleValidateReport}>{validateReportForm.validated ? "Valider" : "Demander corrections"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cycle Info */}
          <Dialog open={showCycleInfo} onOpenChange={setShowCycleInfo}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Cycle d'accréditation — PRO 25 §5.1</DialogTitle>
              </DialogHeader>
              {cycleInfo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Certificat</p>
                      <p className="font-medium">{cycleInfo.certificateNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Cycle</p>
                      <p className="font-medium">{cycleInfo.cycleNumber === 1 ? "1er cycle (3 ans, 2 surv.)" : `${cycleInfo.cycleNumber}ème cycle (4 ans, 3 surv.)`}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Date d'effet</p>
                      <p className="font-medium">{cycleInfo.effectiveDate ? new Date(cycleInfo.effectiveDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Expiration</p>
                      <p className="font-medium">{cycleInfo.expiryDate ? new Date(cycleInfo.expiryDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Surveillances réalisées</p>
                      <p className="font-medium">{cycleInfo.completedSurveillances} / {cycleInfo.totalSurveillancesRequired}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Prochaine surveillance</p>
                      <p className="font-medium">{cycleInfo.nextSurveillanceDate ? new Date(cycleInfo.nextSurveillanceDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                  </div>
                  <Card className="bg-blue-50 border-blue-200 p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Délais max (§5.1):</strong> S1: 14 mois | S2: 24/26 mois | S3: 36 mois (cycle 4 ans)
                    </p>
                  </Card>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCycleInfo(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </div>
  );
}
