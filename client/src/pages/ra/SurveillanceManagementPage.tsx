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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Shield, Eye, Calendar, AlertTriangle, FileText, CheckCircle,
  Clock, Users, Activity, BarChart3, Send, XCircle, RefreshCw,
  Expand, Zap, Info, ArrowRight, TrendingUp
} from "lucide-react";

// ========== STATUS MAPPING (matches backend SurveillanceEvaluationStatus enum) ==========
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

const EVAL_TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Eye }> = {
  SURVEILLANCE: { label: "Surveillance", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye },
  EXTENSION: { label: "Extension", color: "bg-green-50 text-green-700 border-green-200", icon: Expand },
  RENOUVELLEMENT: { label: "Renouvellement", color: "bg-amber-50 text-amber-700 border-amber-200", icon: RefreshCw },
  EXTRAORDINAIRE: { label: "Extraordinaire", color: "bg-red-50 text-red-700 border-red-200", icon: Zap },
};

// Major workflow steps for progress visualization
const WORKFLOW_STEPS = [
  "PLANNED", "RISK_ANALYSIS_COMPLETED", "DOCUMENTS_RECEIVED", "QUOTATION_ACCEPTED",
  "TEAM_DESIGNATED", "IN_PROGRESS", "REPORT_VALIDATED", "CAS_SUBMITTED", "COMPLETED"
];

export default function SurveillanceManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [inProgress, setInProgress] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [deadlineViolations, setDeadlineViolations] = useState<any[]>([]);
  const [findingDeadlines, setFindingDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Dialogs
  const [showProgramme, setShowProgramme] = useState(false);
  const [showExtension, setShowExtension] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);
  const [showExtraordinary, setShowExtraordinary] = useState(false);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false);
  const [showRequestDocs, setShowRequestDocs] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [showTeamPlan, setShowTeamPlan] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showValidateReport, setShowValidateReport] = useState(false);
  const [showCASMeeting, setShowCASMeeting] = useState(false);
  const [showCASDecision, setShowCASDecision] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showCycleInfo, setShowCycleInfo] = useState(false);
  const [cycleInfo, setCycleInfo] = useState<any>(null);

  // Forms
  const [programmeForm, setProgrammeForm] = useState({ certificateId: "", requestId: "", plannedDate: "", scope: "" });
  const [extensionForm, setExtensionForm] = useState({ certificateId: "", requestId: "", plannedDate: "", extensionScope: "", extensionType: "SAME_TYPE" });
  const [renewalForm, setRenewalForm] = useState({ certificateId: "", requestId: "", plannedDate: "" });
  const [extraordinaryForm, setExtraordinaryForm] = useState({ certificateId: "", requestId: "", reason: "", triggerType: "COMPLAINT" });
  const [riskForm, setRiskForm] = useState({
    previousNonConformities: false, previousNCDetails: "",
    complaintsTreated: false, complaintsDetails: "",
    scopeChanges: false, scopeChangeDetails: "",
    organizationalChanges: false, orgChangeDetails: "",
    regulatoryChanges: false, regChangeDetails: "",
    satisfactionIssues: false, satisfactionDetails: "",
    overallRiskLevel: "LOW", recommendedActions: ""
  });
  const [docForm, setDocForm] = useState({ documentsRequested: "" });
  const [quotationForm, setQuotationForm] = useState({ quotationDetails: "", amount: "" });
  const [teamPlanForm, setTeamPlanForm] = useState({ teamId: "", evaluationPlanDetails: "" });
  const [completeForm, setCompleteForm] = useState({ findings: "", recommendation: "" });
  const [validateReportForm, setValidateReportForm] = useState({ validated: true, corrections: "" });
  const [casMeetingForm, setCasMeetingForm] = useState({ meetingDate: "", agenda: "" });
  const [casForm, setCasForm] = useState({ decisionType: "", justification: "", scope: "", conditions: "" });
  const [suspendForm, setSuspendForm] = useState({ reason: "", suspensionEndDate: "", correctiveRequirements: "" });
  const [withdrawForm, setWithdrawForm] = useState({ reason: "" });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const endpoints = [
        "/api/workflow/surveillance/upcoming",
        "/api/workflow/surveillance/overdue",
        "/api/workflow/surveillance/in-progress",
        "/api/workflow/surveillance/completed",
        "/api/workflow/surveillance/check-deadlines",
        "/api/workflow/surveillance/check-finding-deadlines",
      ];
      const responses = await Promise.all(
        endpoints.map(url => fetch(url, { credentials: "include" }).then(r => r.json()).catch(() => ({ success: false })))
      );
      if (responses[0]?.success) setUpcoming(responses[0].data || []);
      if (responses[1]?.success) setOverdue(responses[1].data || []);
      if (responses[2]?.success) setInProgress(responses[2].data || []);
      if (responses[3]?.success) setCompleted(responses[3].data || []);
      if (responses[4]?.success) setDeadlineViolations(responses[4].data || []);
      if (responses[5]?.success) setFindingDeadlines(responses[5].data || []);
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

  // ========== ACTION HANDLERS ==========

  const handleProgramme = async () => {
    try {
      await apiRequest("POST", "/api/workflow/surveillance/programme", {
        certificateId: parseInt(programmeForm.certificateId),
        requestId: parseInt(programmeForm.requestId),
        plannedDate: programmeForm.plannedDate || null,
        scope: programmeForm.scope
      });
      toast({ title: "Surveillance programmée avec succès" });
      setShowProgramme(false);
      setProgrammeForm({ certificateId: "", requestId: "", plannedDate: "", scope: "" });
      loadAll();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleExtension = async () => {
    try {
      await apiRequest("POST", "/api/workflow/surveillance/extension", {
        certificateId: parseInt(extensionForm.certificateId),
        requestId: parseInt(extensionForm.requestId),
        plannedDate: extensionForm.plannedDate || null,
        extensionScope: extensionForm.extensionScope,
        extensionType: extensionForm.extensionType
      });
      toast({ title: "Extension d'accréditation programmée" });
      setShowExtension(false);
      setExtensionForm({ certificateId: "", requestId: "", plannedDate: "", extensionScope: "", extensionType: "SAME_TYPE" });
      loadAll();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleRenewal = async () => {
    try {
      await apiRequest("POST", "/api/workflow/surveillance/renewal", {
        certificateId: parseInt(renewalForm.certificateId),
        requestId: parseInt(renewalForm.requestId),
        plannedDate: renewalForm.plannedDate || null
      });
      toast({ title: "Renouvellement programmé" });
      setShowRenewal(false);
      setRenewalForm({ certificateId: "", requestId: "", plannedDate: "" });
      loadAll();
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

  const handleRiskAnalysis = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/risk-analysis`, riskForm);
      toast({ title: "Analyse de risque FOR 77-1 enregistrée" });
      setShowRiskAnalysis(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleRequestDocs = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/request-documents`, docForm);
      toast({ title: "Documents FOR 68 demandés à l'OEC" });
      setShowRequestDocs(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleQuotation = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/quotation`, {
        quotationDetails: quotationForm.quotationDetails,
        amount: parseFloat(quotationForm.amount)
      });
      toast({ title: "Devis de surveillance préparé" });
      setShowQuotation(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleTeamPlan = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/team-plan`, {
        teamId: teamPlanForm.teamId ? parseInt(teamPlanForm.teamId) : null,
        evaluationPlanDetails: teamPlanForm.evaluationPlanDetails
      });
      toast({ title: "Équipe et plan préparés" });
      setShowTeamPlan(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleAcceptQuotation = async (evalId: number, accepted: boolean) => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${evalId}/accept-quotation`, { accepted });
      toast({ title: accepted ? "Devis accepté" : "Devis refusé" });
      loadAll();
      if (selectedEval?.id === evalId) selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleStart = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/start`, {});
      toast({ title: "Évaluation de surveillance démarrée" });
      selectEval(selectedEval);
      loadAll();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleComplete = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/complete`, completeForm);
      toast({ title: "Évaluation terminée — rapport en rédaction" });
      setShowComplete(false);
      selectEval(selectedEval);
      loadAll();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleValidateReport = async () => {
    try {
      await apiRequest("PUT", `/api/workflow/surveillance/${selectedEval.id}/validate-report`, validateReportForm);
      toast({ title: validateReportForm.validated ? "Rapport validé" : "Corrections demandées" });
      setShowValidateReport(false);
      selectEval(selectedEval);
      loadAll();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCASMeeting = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/cas-meeting`, casMeetingForm);
      toast({ title: "Réunion CAS programmée" });
      setShowCASMeeting(false);
      selectEval(selectedEval);
      loadAll();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCASDecision = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/cas-decision`, casForm);
      toast({ title: "Décision CAS enregistrée" });
      setShowCASDecision(false);
      selectEval(selectedEval);
      loadAll();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSuspend = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval?.id}/suspend`, suspendForm);
      toast({ title: "Suspension appliquée (PRO 23)" });
      setShowSuspend(false);
      loadAll();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleWithdraw = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval?.id}/withdraw`, withdrawForm);
      toast({ title: "Retrait d'accréditation appliqué (PRO 23)" });
      setShowWithdraw(false);
      loadAll();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleLiftSuspension = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval?.id}/lift-suspension`, {
        verificationDetails: "Corrections vérifiées et validées"
      });
      toast({ title: "Suspension levée" });
      if (selectedEval) selectEval(selectedEval);
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

  // Determine available actions based on current status
  const getAvailableActions = (eval_: any) => {
    const s = eval_?.status;
    const actions: { label: string; onClick: () => void; icon: typeof Eye }[] = [];

    if (s === "PLANNED") {
      actions.push({ label: "Analyse de risque FOR 77-1", onClick: () => setShowRiskAnalysis(true), icon: BarChart3 });
    }
    if (s === "RISK_ANALYSIS_COMPLETED" || s === "RISK_ANALYZED") {
      actions.push({ label: "Demander documents FOR 68", onClick: () => setShowRequestDocs(true), icon: FileText });
    }
    if (s === "DOCUMENTS_RECEIVED") {
      actions.push({ label: "Préparer le devis", onClick: () => setShowQuotation(true), icon: FileText });
    }
    if (s === "QUOTATION_SENT") {
      actions.push({ label: "Accepter le devis", onClick: () => handleAcceptQuotation(eval_.id, true), icon: CheckCircle });
      actions.push({ label: "Refuser le devis", onClick: () => handleAcceptQuotation(eval_.id, false), icon: XCircle });
    }
    if (s === "QUOTATION_ACCEPTED") {
      actions.push({ label: "Constituer équipe & plan", onClick: () => setShowTeamPlan(true), icon: Users });
    }
    if (["TEAM_DESIGNATED", "TEAM_VALIDATED", "PLAN_VALIDATED", "PLAN_SENT_TO_OEC", "MISSION_ORDERS_SENT"].includes(s)) {
      actions.push({ label: "Démarrer l'évaluation", onClick: handleStart, icon: Activity });
    }
    if (s === "IN_PROGRESS") {
      actions.push({ label: "Compléter l'évaluation", onClick: () => setShowComplete(true), icon: CheckCircle });
    }
    if (s === "REPORT_DRAFTING" || s === "REPORT_VALIDATION") {
      actions.push({ label: "Valider le rapport", onClick: () => setShowValidateReport(true), icon: CheckCircle });
    }
    if (s === "REPORT_VALIDATED" || s === "CAS_PREPARATION") {
      actions.push({ label: "Programmer réunion CAS", onClick: () => setShowCASMeeting(true), icon: Calendar });
    }
    if (s === "CAS_SUBMITTED") {
      actions.push({ label: "Décision CAS", onClick: () => setShowCASDecision(true), icon: Shield });
    }
    if (s === "SANCTIONS_APPLIED") {
      actions.push({ label: "Lever la suspension", onClick: handleLiftSuspension, icon: CheckCircle });
    }

    return actions;
  };

  const getTabEvals = (tab: string) => {
    switch (tab) {
      case "upcoming": return upcoming;
      case "overdue": return overdue;
      case "in-progress": return inProgress;
      case "completed": return completed;
      default: return [...overdue, ...upcoming, ...inProgress, ...completed];
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
                <Eye className="w-7 h-7 text-primary" />
                Surveillance, Renouvellement & Extension
              </h1>
              <p className="text-muted-foreground mt-1">
                PRO 25 — Gestion complète du cycle d'accréditation (Phase IV)
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowProgramme(true)} className="gap-1">
                <Eye className="w-4 h-4" /> Surveillance
              </Button>
              <Button onClick={() => setShowRenewal(true)} variant="outline" className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50">
                <RefreshCw className="w-4 h-4" /> Renouvellement
              </Button>
              <Button onClick={() => setShowExtension(true)} variant="outline" className="gap-1 border-green-300 text-green-700 hover:bg-green-50">
                <Expand className="w-4 h-4" /> Extension
              </Button>
              <Button onClick={() => setShowExtraordinary(true)} variant="outline" className="gap-1 border-red-300 text-red-700 hover:bg-red-50">
                <Zap className="w-4 h-4" /> Extraordinaire
              </Button>
            </div>
          </div>

          {/* Deadline violation alerts */}
          {(deadlineViolations.length > 0 || findingDeadlines.length > 0) && (
            <div className="mb-6 space-y-3">
              {deadlineViolations.map((v: any, i: number) => (
                <Card key={`dl-${i}`} className="border-red-200 bg-red-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        Dépassement délai surveillance — {v.evaluationCode || `#${v.evaluationId}`}
                      </p>
                      <p className="text-xs text-red-600">
                        {v.monthsSinceGrant} mois écoulés (max {v.maxMonths} mois pour S{v.surveillanceNumber}, cycle {v.cycleNumber}).
                        Retard: {v.overdueDays} jours. Risque de suspension immédiate (PRO 23 §5.1).
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
                        {f.daysSinceEvaluation} jours depuis l'évaluation (max {f.deadlineDays} jours).
                        Retard: {f.overdueDays} jours. Dossier à soumettre au CAS.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { tab: "upcoming", icon: Calendar, color: "text-blue-500", label: "À venir", count: upcoming.length },
              { tab: "overdue", icon: AlertTriangle, color: "text-red-500", label: "En retard", count: overdue.length, textColor: "text-red-600" },
              { tab: "in-progress", icon: Activity, color: "text-orange-500", label: "En cours", count: inProgress.length },
              { tab: "completed", icon: CheckCircle, color: "text-emerald-500", label: "Terminées", count: completed.length },
            ].map(({ tab, icon: Icon, color, label, count, textColor }) => (
              <Card key={tab} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(tab)}>
                <div className="flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${color}`} />
                  <div>
                    <p className={`text-2xl font-bold ${textColor || ""}`}>{count}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </Card>
            ))}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{upcoming.length + inProgress.length + overdue.length + completed.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT: Evaluation list with tabs */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4 h-8">
                      <TabsTrigger value="upcoming" className="text-xs">À venir</TabsTrigger>
                      <TabsTrigger value="overdue" className="text-xs">Retard</TabsTrigger>
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

            {/* RIGHT: Detail panel */}
            <div className="lg:col-span-3">
              {!selectedEval ? (
                <Card className="flex flex-col items-center justify-center h-64 gap-3">
                  <Eye className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Sélectionnez une évaluation pour voir les détails</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Eval header with type, status & actions */}
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
                            <Info className="w-3 h-3 mr-1" />Cycle d'accréditation
                          </Button>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <span>Date: {selectedEval.evaluationDate ? new Date(selectedEval.evaluationDate).toLocaleDateString("fr-FR") : "Non planifiée"}</span>
                          {selectedEval.focusScope && <span>Portée: {selectedEval.focusScope.substring(0, 80)}{selectedEval.focusScope.length > 80 ? "..." : ""}</span>}
                          {selectedEval.quotationAmount && <span>Devis: {selectedEval.quotationAmount} DA</span>}
                          {selectedEval.findingDeadlineMonths != null && <span>Délai écarts: {selectedEval.findingDeadlineMonths} mois</span>}
                          {selectedEval.extraordinaryReason && <span>Motif: {selectedEval.extraordinaryReason}</span>}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        {getAvailableActions(selectedEval).map((action, i) => (
                          <Button key={i} size="sm" onClick={action.onClick} className="gap-1">
                            <action.icon className="w-3 h-3" />{action.label}
                          </Button>
                        ))}
                        {selectedEval.status === "CAS_SUBMITTED" && (
                          <>
                            <Button size="sm" variant="outline" className="text-orange-600 border-orange-300 gap-1" onClick={() => setShowSuspend(true)}>
                              <AlertTriangle className="w-3 h-3" />Suspendre (PRO 23)
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={() => setShowWithdraw(true)}>
                              <XCircle className="w-3 h-3" />Retirer (PRO 23)
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Workflow progress bar */}
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

                  {/* Risk Analysis display */}
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
                        {riskAnalysis.raAnalysis && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">{riskAnalysis.raAnalysis}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Findings & Report */}
                  {selectedEval.evaluationFindings && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Constats & rapport</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{selectedEval.evaluationFindings}</p>
                        {selectedEval.casRecommendation && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Recommandation CAS:</p>
                            <p className="text-sm">{selectedEval.casRecommendation}</p>
                          </div>
                        )}
                        {selectedEval.casDecision && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Décision CAS:</p>
                            <p className="text-sm">{selectedEval.casDecision}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ============================= DIALOGS ============================= */}

          {/* Programme Surveillance */}
          <Dialog open={showProgramme} onOpenChange={setShowProgramme}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programmer une surveillance</DialogTitle>
                <DialogDescription>PRO 25 §5.2.1 — Surveillance annuelle espacée de 12 mois max</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID Certificat</Label>
                    <Input type="number" value={programmeForm.certificateId}
                      onChange={e => setProgrammeForm({ ...programmeForm, certificateId: e.target.value })} placeholder="ID certificat" />
                  </div>
                  <div>
                    <Label>ID Demande</Label>
                    <Input type="number" value={programmeForm.requestId}
                      onChange={e => setProgrammeForm({ ...programmeForm, requestId: e.target.value })} placeholder="ID demande" />
                  </div>
                </div>
                <div>
                  <Label>Date prévue</Label>
                  <Input type="datetime-local" value={programmeForm.plannedDate}
                    onChange={e => setProgrammeForm({ ...programmeForm, plannedDate: e.target.value })} />
                </div>
                <div>
                  <Label>Portée (périmètre d'évaluation)</Label>
                  <Textarea value={programmeForm.scope}
                    onChange={e => setProgrammeForm({ ...programmeForm, scope: e.target.value })}
                    placeholder="Portée échantillonnée selon PRO 13..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowProgramme(false)}>Annuler</Button>
                <Button onClick={handleProgramme}>Programmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Extension Dialog */}
          <Dialog open={showExtension} onOpenChange={setShowExtension}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programmer une extension d'accréditation</DialogTitle>
                <DialogDescription>PRO 25 §5.2.2 — Traitée comme évaluation initiale. Durée min: 1 jour. Écarts: 6 mois.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID Certificat</Label>
                    <Input type="number" value={extensionForm.certificateId}
                      onChange={e => setExtensionForm({ ...extensionForm, certificateId: e.target.value })} />
                  </div>
                  <div>
                    <Label>ID Demande</Label>
                    <Input type="number" value={extensionForm.requestId}
                      onChange={e => setExtensionForm({ ...extensionForm, requestId: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Type d'extension</Label>
                  <Select value={extensionForm.extensionType}
                    onValueChange={v => setExtensionForm({ ...extensionForm, extensionType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAME_TYPE">Même type (essais/étalonnages similaires)</SelectItem>
                      <SelectItem value="OTHER_TYPE">Autre type (nouvelles catégories)</SelectItem>
                      <SelectItem value="OTHER_SITE">Autre site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date prévue</Label>
                  <Input type="datetime-local" value={extensionForm.plannedDate}
                    onChange={e => setExtensionForm({ ...extensionForm, plannedDate: e.target.value })} />
                </div>
                <div>
                  <Label>Portée de l'extension</Label>
                  <Textarea value={extensionForm.extensionScope}
                    onChange={e => setExtensionForm({ ...extensionForm, extensionScope: e.target.value })}
                    placeholder="Documents techniques, portée objet de la demande d'extension..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExtension(false)}>Annuler</Button>
                <Button onClick={handleExtension}>Programmer l'extension</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Renewal Dialog */}
          <Dialog open={showRenewal} onOpenChange={setShowRenewal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programmer un renouvellement</DialogTitle>
                <DialogDescription>
                  PRO 25 §5.2.3 — Identique à évaluation initiale.
                  Dossier à déposer 6 mois avant expiration (DOC 02, art. 5).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID Certificat</Label>
                    <Input type="number" value={renewalForm.certificateId}
                      onChange={e => setRenewalForm({ ...renewalForm, certificateId: e.target.value })} />
                  </div>
                  <div>
                    <Label>ID Demande</Label>
                    <Input type="number" value={renewalForm.requestId}
                      onChange={e => setRenewalForm({ ...renewalForm, requestId: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Date prévue de l'évaluation</Label>
                  <Input type="datetime-local" value={renewalForm.plannedDate}
                    onChange={e => setRenewalForm({ ...renewalForm, plannedDate: e.target.value })} />
                </div>
                <Card className="bg-amber-50 border-amber-200 p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Annexe 2 — Gestion des délais de renouvellement:</strong><br />
                    • Cas 1: Terminé avant expiration → date d'effet T ou B, expire B+4 ans<br />
                    • Cas 2: Prolongation max 3 mois → si terminé, date d'effet C, expire B+4 ans<br />
                    • Cas 3: Au-delà des 3 mois → bascule en initiale, nouveau numéro d'accréditation
                  </p>
                </Card>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRenewal(false)}>Annuler</Button>
                <Button onClick={handleRenewal}>Programmer le renouvellement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Extraordinary Surveillance Dialog */}
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
                      <SelectItem value="REORGANIZATION">Réorganisation importante de l'OEC</SelectItem>
                      <SelectItem value="TRANSFER">Transfert d'accréditation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Justification détaillée</Label>
                  <Textarea value={extraordinaryForm.reason}
                    onChange={e => setExtraordinaryForm({ ...extraordinaryForm, reason: e.target.value })}
                    placeholder="Détail de l'événement justifiant la surveillance extraordinaire..." className="min-h-[100px]" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExtraordinary(false)}>Annuler</Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={handleExtraordinary}>Initier</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Risk Analysis Dialog (FOR 77-1) — 6 risk factors */}
          <Dialog open={showRiskAnalysis} onOpenChange={setShowRiskAnalysis}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Analyse de risque FOR 77-1</DialogTitle>
                <DialogDescription>PRO 25 §5.2.1 — Envoyée 2 mois avant l'évaluation pour déterminer le périmètre</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {[
                  { key: "previousNonConformities", detailKey: "previousNCDetails", label: "Non-conformités antérieures constatées" },
                  { key: "complaintsTreated", detailKey: "complaintsDetails", label: "Réclamations / plaintes reçues" },
                  { key: "scopeChanges", detailKey: "scopeChangeDetails", label: "Modifications de la portée d'accréditation" },
                  { key: "organizationalChanges", detailKey: "orgChangeDetails", label: "Changements organisationnels / restructuration" },
                  { key: "regulatoryChanges", detailKey: "regChangeDetails", label: "Changements réglementaires / normatifs" },
                  { key: "satisfactionIssues", detailKey: "satisfactionDetails", label: "Problèmes de satisfaction / retour client" },
                ].map(({ key, detailKey, label }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={(riskForm as any)[key]}
                        onCheckedChange={c => setRiskForm({ ...riskForm, [key]: !!c })} />
                      <Label>{label}</Label>
                    </div>
                    {(riskForm as any)[key] && (
                      <Textarea value={(riskForm as any)[detailKey]}
                        onChange={e => setRiskForm({ ...riskForm, [detailKey]: e.target.value })}
                        placeholder="Préciser les détails..." className="ml-6 text-sm" rows={2} />
                    )}
                  </div>
                ))}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Niveau de risque global</Label>
                    <Select value={riskForm.overallRiskLevel}
                      onValueChange={v => setRiskForm({ ...riskForm, overallRiskLevel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Faible</SelectItem>
                        <SelectItem value="MEDIUM">Moyen</SelectItem>
                        <SelectItem value="HIGH">Élevé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Actions recommandées</Label>
                  <Textarea value={riskForm.recommendedActions}
                    onChange={e => setRiskForm({ ...riskForm, recommendedActions: e.target.value })}
                    placeholder="Ajustement de portée, évaluation supplémentaire, surveillance renforcée..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRiskAnalysis(false)}>Annuler</Button>
                <Button onClick={handleRiskAnalysis}>Enregistrer FOR 77-1</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Request Documents Dialog (FOR 68) */}
          <Dialog open={showRequestDocs} onOpenChange={setShowRequestDocs}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Demander des documents (FOR 68)</DialogTitle>
                <DialogDescription>Envoyé au moins 2 mois avant l'évaluation</DialogDescription>
              </DialogHeader>
              <div>
                <Label>Documents demandés</Label>
                <Textarea value={docForm.documentsRequested}
                  onChange={e => setDocForm({ ...docForm, documentsRequested: e.target.value })}
                  placeholder="Manuel qualité, procédures, rapport audit interne, revue de direction, résultats essais d'aptitude, registre réclamations..."
                  className="min-h-[120px]" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRequestDocs(false)}>Annuler</Button>
                <Button onClick={handleRequestDocs}><Send className="w-4 h-4 mr-1" />Envoyer FOR 68</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Quotation Dialog */}
          <Dialog open={showQuotation} onOpenChange={setShowQuotation}>
            <DialogContent>
              <DialogHeader><DialogTitle>Préparer le devis de surveillance</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Montant (DA)</Label>
                  <Input type="number" value={quotationForm.amount}
                    onChange={e => setQuotationForm({ ...quotationForm, amount: e.target.value })} />
                </div>
                <div>
                  <Label>Détails du devis</Label>
                  <Textarea value={quotationForm.quotationDetails}
                    onChange={e => setQuotationForm({ ...quotationForm, quotationDetails: e.target.value })}
                    placeholder="Durée, taille de l'équipe, frais de déplacement..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowQuotation(false)}>Annuler</Button>
                <Button onClick={handleQuotation}>Envoyer le devis</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Team & Plan Dialog */}
          <Dialog open={showTeamPlan} onOpenChange={setShowTeamPlan}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Constituer l'équipe et le plan</DialogTitle>
                <DialogDescription>L'équipe de surveillance reste inchangée sauf exception. Chaque membre doit signer FOR 01-1 (confidentialité).</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>ID Équipe d'évaluation</Label>
                  <Input type="number" value={teamPlanForm.teamId}
                    onChange={e => setTeamPlanForm({ ...teamPlanForm, teamId: e.target.value })}
                    placeholder="ID de l'équipe existante (optionnel)" />
                </div>
                <div>
                  <Label>Plan d'évaluation détaillé</Label>
                  <Textarea value={teamPlanForm.evaluationPlanDetails}
                    onChange={e => setTeamPlanForm({ ...teamPlanForm, evaluationPlanDetails: e.target.value })}
                    placeholder="Programme de l'évaluation, points à couvrir (§5.2.1 a-k), durée, sites..."
                    className="min-h-[120px]" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTeamPlan(false)}>Annuler</Button>
                <Button onClick={handleTeamPlan}>Valider</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Complete Evaluation Dialog */}
          <Dialog open={showComplete} onOpenChange={setShowComplete}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Compléter l'évaluation</DialogTitle>
                <DialogDescription>
                  PRO 25 §5.3 — Le rapport reprend les conclusions générales, techniques, et la confiance de l'équipe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Constats de l'évaluation</Label>
                  <Textarea value={completeForm.findings}
                    onChange={e => setCompleteForm({ ...completeForm, findings: e.target.value })}
                    placeholder="Conclusions générales, conclusions techniques, écarts critiques/non-critiques constatés..."
                    className="min-h-[120px]" />
                </div>
                <div>
                  <Label>Recommandation pour le CAS</Label>
                  <Textarea value={completeForm.recommendation}
                    onChange={e => setCompleteForm({ ...completeForm, recommendation: e.target.value })}
                    placeholder="Maintien / Suspension / Retrait / Réduction de portée..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowComplete(false)}>Annuler</Button>
                <Button onClick={handleComplete}>Soumettre le rapport</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Validate Report Dialog */}
          <Dialog open={showValidateReport} onOpenChange={setShowValidateReport}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Validation du rapport de surveillance</DialogTitle>
                <DialogDescription>PRO 25 §5.3 — Validation par RA/CD avant transmission au CAS</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={validateReportForm.validated}
                    onCheckedChange={c => setValidateReportForm({ ...validateReportForm, validated: !!c })} />
                  <Label>Rapport validé et conforme</Label>
                </div>
                {!validateReportForm.validated && (
                  <div>
                    <Label>Corrections demandées</Label>
                    <Textarea value={validateReportForm.corrections}
                      onChange={e => setValidateReportForm({ ...validateReportForm, corrections: e.target.value })}
                      placeholder="Corrections à apporter au rapport..." />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowValidateReport(false)}>Annuler</Button>
                <Button onClick={handleValidateReport}>{validateReportForm.validated ? "Valider" : "Demander corrections"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CAS Meeting Dialog */}
          <Dialog open={showCASMeeting} onOpenChange={setShowCASMeeting}>
            <DialogContent>
              <DialogHeader><DialogTitle>Programmer réunion CAS surveillance</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Date de la réunion</Label>
                  <Input type="datetime-local" value={casMeetingForm.meetingDate}
                    onChange={e => setCasMeetingForm({ ...casMeetingForm, meetingDate: e.target.value })} />
                </div>
                <div>
                  <Label>Ordre du jour</Label>
                  <Textarea value={casMeetingForm.agenda}
                    onChange={e => setCasMeetingForm({ ...casMeetingForm, agenda: e.target.value })}
                    placeholder="Points à aborder lors de la réunion CAS..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCASMeeting(false)}>Annuler</Button>
                <Button onClick={handleCASMeeting}>Programmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CAS Decision Dialog — Full set per PRO 25 §5.4 */}
          <Dialog open={showCASDecision} onOpenChange={setShowCASDecision}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Décision CAS — PRO 25 §5.4</DialogTitle>
                <DialogDescription>Enregistrer la décision du comité d'accréditation sectoriel</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Décision</Label>
                  <Select value={casForm.decisionType}
                    onValueChange={v => setCasForm({ ...casForm, decisionType: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner la décision..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTAIN">Maintenir l'accréditation (§5.4.1)</SelectItem>
                      <SelectItem value="GRANT_WITH_RESERVES">Maintenir avec réserves</SelectItem>
                      <SelectItem value="SCOPE_REDUCTION">Réduire la portée</SelectItem>
                      <SelectItem value="SUSPENSION">Suspendre l'accréditation (PRO 23)</SelectItem>
                      <SelectItem value="WITHDRAWAL">Retirer l'accréditation (PRO 23)</SelectItem>
                      <SelectItem value="POSTPONEMENT">Reporter la décision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Justification</Label>
                  <Textarea value={casForm.justification}
                    onChange={e => setCasForm({ ...casForm, justification: e.target.value })}
                    placeholder="Justification de la décision..." className="min-h-[80px]" />
                </div>
                {(casForm.decisionType === "SCOPE_REDUCTION" || casForm.decisionType === "GRANT_WITH_RESERVES") && (
                  <div>
                    <Label>{casForm.decisionType === "SCOPE_REDUCTION" ? "Portée réduite" : "Réserves"}</Label>
                    <Textarea value={casForm.scope}
                      onChange={e => setCasForm({ ...casForm, scope: e.target.value })}
                      placeholder="Portée réduite ou réserves à lever..." />
                  </div>
                )}
                {casForm.decisionType === "GRANT_WITH_RESERVES" && (
                  <div>
                    <Label>Conditions et date limite</Label>
                    <Textarea value={casForm.conditions}
                      onChange={e => setCasForm({ ...casForm, conditions: e.target.value })}
                      placeholder="Conditions à remplir et date limite..." />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCASDecision(false)}>Annuler</Button>
                <Button onClick={handleCASDecision}>Enregistrer la décision</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Suspend Dialog */}
          <Dialog open={showSuspend} onOpenChange={setShowSuspend}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Suspendre l'accréditation (PRO 23)</DialogTitle>
                <DialogDescription>Suspension temporaire — max 6 mois. L'OEC conserve le droit de recours.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Motif de suspension</Label>
                  <Textarea value={suspendForm.reason}
                    onChange={e => setSuspendForm({ ...suspendForm, reason: e.target.value })}
                    placeholder="Motif détaillé de la suspension..." className="min-h-[80px]" />
                </div>
                <div>
                  <Label>Date de fin de suspension</Label>
                  <Input type="datetime-local" value={suspendForm.suspensionEndDate}
                    onChange={e => setSuspendForm({ ...suspendForm, suspensionEndDate: e.target.value })} />
                </div>
                <div>
                  <Label>Exigences correctives</Label>
                  <Textarea value={suspendForm.correctiveRequirements}
                    onChange={e => setSuspendForm({ ...suspendForm, correctiveRequirements: e.target.value })}
                    placeholder="Actions correctives requises de l'OEC..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSuspend(false)}>Annuler</Button>
                <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSuspend}>Suspendre</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Withdraw Dialog */}
          <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Retrait d'accréditation (PRO 23)</DialogTitle>
                <DialogDescription>Action irréversible — Le certificat sera invalidé et l'OEC notifié.</DialogDescription>
              </DialogHeader>
              <div>
                <Label>Motif du retrait</Label>
                <Textarea value={withdrawForm.reason}
                  onChange={e => setWithdrawForm({ reason: e.target.value })}
                  placeholder="Motif détaillé du retrait d'accréditation..." className="min-h-[120px]" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWithdraw(false)}>Annuler</Button>
                <Button variant="destructive" onClick={handleWithdraw}>Confirmer le retrait</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cycle Info Dialog */}
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
                      <p className="font-medium">{cycleInfo.cycleNumber === 1 ? "1er cycle (3 ans, 2 surveillances)" : `${cycleInfo.cycleNumber}ème cycle (4 ans, 3 surveillances)`}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Date d'effet</p>
                      <p className="font-medium">{cycleInfo.effectiveDate ? new Date(cycleInfo.effectiveDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Date d'expiration</p>
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
                      <strong>Délais max (§5.1):</strong><br />
                      • S1: 14 mois après octroi | S2: 24 mois (3 ans) ou 26 mois (4 ans)<br />
                      • S3: 36 mois (cycle 4 ans uniquement)<br />
                      • Aucun report sans motif valable → suspension immédiate
                    </p>
                  </Card>
                  {cycleInfo.renewalSubmissionDeadline && (
                    <Card className="bg-amber-50 border-amber-200 p-3">
                      <p className="text-xs text-amber-800">
                        <strong>Dépôt dossier de renouvellement:</strong>{" "}
                        au plus tard le {new Date(cycleInfo.renewalSubmissionDeadline).toLocaleDateString("fr-FR")} (6 mois avant expiration)
                      </p>
                    </Card>
                  )}
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
