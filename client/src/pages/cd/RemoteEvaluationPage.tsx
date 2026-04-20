import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Video, Plus, CheckCircle, XCircle, Wifi, Monitor, Shield,
  ClipboardCheck, AlertTriangle, Calendar, FileText, Users,
  Eye, Play, Square, Send, Clock, Ban, ArrowRight, Search
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════
interface RemoteEval {
  id: number;
  evaluationCode: string;
  justification: string;
  justificationDetails: string;
  technologyPlatform: string;
  remoteScope: string;
  onsiteScope: string;
  partialRemote: boolean;
  status: string;
  oecConsentObtained: boolean;
  createdAt: string;
  updatedAt: string;
  // Risk analysis
  riskAnalysisResult: string | null;
  riskAnalysisDate: string | null;
  monthsSinceLastOnsiteAssessment: number | null;
  ictEquipmentAvailable: boolean | null;
  requirementsNatureSuitable: boolean | null;
  safetyConstraintsAcceptable: boolean | null;
  cabResourcesStable: boolean | null;
  digitizationLevelAdequate: boolean | null;
  cabPerformanceSatisfactory: boolean | null;
  teamSizeAdequate: boolean | null;
  assessorRemoteExperience: boolean | null;
  findingsNatureFollowable: boolean | null;
  complaintsToInvestigate: boolean | null;
  // Tech
  videoCapabilityVerified: boolean | null;
  audioCapabilityVerified: boolean | null;
  documentSharingVerified: boolean | null;
  connectionStabilityTest: boolean | null;
  // Confidentiality
  confidentialityConfirmed: boolean | null;
  // Meetings
  openingMeetingDate: string | null;
  closingMeetingDate: string | null;
  evaluationFindings: string | null;
  // Deviations
  deviationSheetsSentDate: string | null;
  deviationSheetsDeadline: string | null;
  oecDocumentsReceivedDate: string | null;
  oecDocumentsDeadline: string | null;
  // ICT traceability
  ictUsageDescription: string | null;
  ictEffectivenessAssessment: string | null;
  // Technical difficulties
  technicalDifficultiesEncountered: boolean | null;
  technicalDifficultiesDetails: string | null;
  // Follow up
  onsiteFollowUpNeeded: boolean | null;
  onsiteFollowUpReason: string | null;
  // Not feasible
  remoteNotFeasible: boolean | null;
  notFeasibleReason: string | null;
  // Scheduling
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  estimatedDurationHours: number | null;
  evaluationPhases: number | null;
  // Approval
  approvalComments: string | null;
  approvalDate: string | null;
  oecConsentDate: string | null;
  // Request info
  request: { id: number; referenceNumber: string; type: string; domain: string } | null;
}

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════
const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  RISK_ANALYSIS_PENDING:   { color: "bg-amber-100 text-amber-800 border-amber-300", label: "Analyse des risques", icon: Search },
  RISK_ANALYSIS_COMPLETED: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Risques acceptables", icon: CheckCircle },
  RISK_ANALYSIS_REJECTED:  { color: "bg-red-100 text-red-800 border-red-300", label: "Risques non acceptables", icon: XCircle },
  PENDING_CD_APPROVAL:     { color: "bg-orange-100 text-orange-800 border-orange-300", label: "Attente approbation CD", icon: Clock },
  CD_APPROVED:             { color: "bg-indigo-100 text-indigo-800 border-indigo-300", label: "Approuvé par CD", icon: CheckCircle },
  CD_REJECTED:             { color: "bg-red-100 text-red-800 border-red-300", label: "Rejeté par CD", icon: XCircle },
  PENDING_OEC_CONSENT:     { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Attente consentement OEC", icon: Clock },
  OEC_CONSENTED:           { color: "bg-teal-100 text-teal-800 border-teal-300", label: "OEC a consenti", icon: CheckCircle },
  OEC_REFUSED:             { color: "bg-red-100 text-red-800 border-red-300", label: "OEC a refusé", icon: XCircle },
  TECH_VERIFICATION:       { color: "bg-cyan-100 text-cyan-800 border-cyan-300", label: "Vérification technique OK", icon: Wifi },
  TECH_VERIFICATION_FAILED:{ color: "bg-red-100 text-red-800 border-red-300", label: "Échec technique", icon: AlertTriangle },
  SCHEDULED:               { color: "bg-purple-100 text-purple-800 border-purple-300", label: "Programmée", icon: Calendar },
  OPENING_MEETING:         { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Réunion d'ouverture", icon: Users },
  IN_PROGRESS:             { color: "bg-cyan-100 text-cyan-800 border-cyan-300", label: "En cours", icon: Play },
  CLOSING_MEETING:         { color: "bg-indigo-100 text-indigo-800 border-indigo-300", label: "Réunion de clôture", icon: Square },
  PENDING_DEVIATION_SHEETS:{ color: "bg-orange-100 text-orange-800 border-orange-300", label: "Fiches d'écarts envoyées", icon: FileText },
  PENDING_OEC_VALIDATION:  { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Validation OEC en cours", icon: Clock },
  PENDING_CAS_DECISION:    { color: "bg-violet-100 text-violet-800 border-violet-300", label: "Attente décision CAS", icon: ClipboardCheck },
  COMPLETED:               { color: "bg-green-100 text-green-800 border-green-300", label: "Terminée", icon: CheckCircle },
  ONSITE_FOLLOW_UP:        { color: "bg-amber-100 text-amber-800 border-amber-300", label: "Suivi sur site", icon: AlertTriangle },
  NOT_FEASIBLE_DESK_REVIEW:{ color: "bg-gray-100 text-gray-800 border-gray-300", label: "Non réalisable – Revue doc.", icon: FileText },
  CANCELLED:               { color: "bg-gray-100 text-gray-600 border-gray-300", label: "Annulée", icon: Ban },
};

const JUSTIFICATION_LABELS: Record<string, string> = {
  EXTRAORDINARY_EVENTS:    "Événements extraordinaires (pandémie, grève…)",
  TRAVEL_IMPOSSIBLE:       "Déplacement impossible (sécurité, restrictions…)",
  MULTIPLE_SITES:          "Nombre important de sites à évaluer",
  MINOR_SCOPE_EXTENSION:   "Extension mineure de la portée",
  TEAM_UNAVAILABILITY:     "Indisponibilité de l'équipe (force majeure)",
  SUPPLEMENTARY_ASSESSMENT:"Évaluation complémentaire rapprochée",
};

const WORKFLOW_STEPS = [
  "RISK_ANALYSIS_PENDING", "RISK_ANALYSIS_COMPLETED", "CD_APPROVED",
  "PENDING_OEC_CONSENT", "OEC_CONSENTED", "TECH_VERIFICATION",
  "SCHEDULED", "OPENING_MEETING", "IN_PROGRESS", "CLOSING_MEETING",
  "PENDING_DEVIATION_SHEETS", "PENDING_OEC_VALIDATION",
  "PENDING_CAS_DECISION", "COMPLETED"
];

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════
export default function RemoteEvaluationPage() {
  const { toast } = useToast();
  const [evals, setEvals] = useState<RemoteEval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [selected, setSelected] = useState<RemoteEval | null>(null);

  // Dialog states
  const [showCreate, setShowCreate] = useState(false);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false);
  const [showCdApproval, setShowCdApproval] = useState(false);
  const [showTech, setShowTech] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showClosingMeeting, setShowClosingMeeting] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showNotFeasible, setShowNotFeasible] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showDifficulties, setShowDifficulties] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    requestId: "", justification: "EXTRAORDINARY_EVENTS", justificationDetails: "",
    technologyPlatform: "Zoom", remoteScope: "", onsiteScope: "",
    partialRemote: false, durationHours: "", evaluationPhases: "1",
    startDate: "", endDate: ""
  });

  const [riskForm, setRiskForm] = useState({
    monthsSinceLastOnsite: "", ictEquipmentAvailable: true, ictEquipmentDetails: "",
    requirementsNatureSuitable: true, findingsNatureFollowable: true, findingsDetails: "",
    complaintsToInvestigate: false, complaintsDetails: "",
    safetyConstraintsAcceptable: true, cabResourcesStable: true,
    digitizationLevelAdequate: true, cabPerformanceSatisfactory: true,
    teamSizeAdequate: true, assessorRemoteExperience: true, comments: ""
  });

  const [techForm, setTechForm] = useState({
    videoOk: true, audioOk: true, docSharingOk: true, connectionOk: true, techPrereqs: ""
  });

  const [scheduleForm, setScheduleForm] = useState({ startDate: "", endDate: "" });
  const [cdApprovalForm, setCdApprovalForm] = useState({ comments: "" });
  const [closingForm, setClosingForm] = useState({ findings: "" });
  const [completeForm, setCompleteForm] = useState({
    ictUsageDescription: "", ictEffectivenessAssessment: "",
    onsiteFollowUp: false, followUpReason: ""
  });
  const [notFeasibleForm, setNotFeasibleForm] = useState({
    reason: "", deskReview: true, conferenceCall: true, onsitePlannedDate: ""
  });
  const [cancelForm, setCancelForm] = useState({ reason: "" });
  const [difficultiesForm, setDifficultiesForm] = useState({ details: "" });

  // ─── Data loading ──────────────────────────────────────
  const loadEvals = useCallback(async () => {
    try {
      const res = await fetch("/api/remote-evaluation", { credentials: "include" });
      const data = await res.json();
      setEvals(data.data || []);
    } catch { setEvals([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadEvals(); }, [loadEvals]);

  // ─── API calls ─────────────────────────────────────────
  const apiCall = async (method: string, url: string, body?: any, successMsg?: string) => {
    try {
      await apiRequest(method, url, body);
      toast({ title: successMsg || "Opération réussie" });
      loadEvals();
      return true;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const handleCreate = async () => {
    const ok = await apiCall("POST", "/api/remote-evaluation", {
      ...createForm,
      requestId: parseInt(createForm.requestId),
      durationHours: createForm.durationHours ? parseInt(createForm.durationHours) : null,
      evaluationPhases: parseInt(createForm.evaluationPhases),
      startDate: createForm.startDate || null,
      endDate: createForm.endDate || null,
    }, "Évaluation à distance créée — analyse des risques requise");
    if (ok) setShowCreate(false);
  };

  const handleRiskAnalysis = async () => {
    if (!selected) return;
    const ok = await apiCall("PUT", `/api/remote-evaluation/${selected.id}/risk-analysis`, {
      ...riskForm,
      monthsSinceLastOnsite: riskForm.monthsSinceLastOnsite ? parseInt(riskForm.monthsSinceLastOnsite) : null,
    }, "Analyse des risques soumise (FOR 77-1)");
    if (ok) { setShowRiskAnalysis(false); setSelected(null); }
  };

  const handleCdApproval = async (approved: boolean) => {
    if (!selected) return;
    const ok = await apiCall("PUT", `/api/remote-evaluation/${selected.id}/cd-approval`, {
      approved, comments: cdApprovalForm.comments
    }, approved ? "Approuvé par le CD" : "Rejeté par le CD");
    if (ok) { setShowCdApproval(false); setSelected(null); }
  };

  const handleOecConsent = async (id: number, consented: boolean) => {
    await apiCall("PUT", `/api/remote-evaluation/${id}/oec-consent`, { consented },
      consented ? "Consentement OEC obtenu" : "OEC a refusé");
  };

  const handleTechVerify = async () => {
    if (!selected) return;
    const ok = await apiCall("PUT", `/api/remote-evaluation/${selected.id}/verify-technical`, techForm,
      "Vérification technique effectuée");
    if (ok) { setShowTech(false); setSelected(null); }
  };

  const handleSchedule = async () => {
    if (!selected) return;
    const ok = await apiCall("PUT", `/api/remote-evaluation/${selected.id}/confirm-schedule`, {
      startDate: scheduleForm.startDate || null,
      endDate: scheduleForm.endDate || null,
    }, "Évaluation programmée — confidentialité confirmée (FOR 01-1)");
    if (ok) { setShowSchedule(false); setSelected(null); }
  };

  const handleOpeningMeeting = async (id: number) => {
    await apiCall("PUT", `/api/remote-evaluation/${id}/opening-meeting`, {},
      "Réunion d'ouverture démarrée");
  };

  const handleStart = async (id: number) => {
    await apiCall("PUT", `/api/remote-evaluation/${id}/start`, {}, "Évaluation démarrée");
  };

  const handleReportDifficulties = async () => {
    if (!selected) return;
    const ok = await apiCall("PUT", `/api/remote-evaluation/${selected.id}/report-difficulties`,
      difficultiesForm, "Difficultés techniques signalées au CD/RA");
    if (ok) { setShowDifficulties(false); setSelected(null); }
  };

  const handleClosingMeeting = async () => {
    if (!selected) return;
    const ok = await apiCall("PUT", `/api/remote-evaluation/${selected.id}/closing-meeting`,
      closingForm, "Réunion de clôture terminée — fiches d'écarts à envoyer sous 24h");
    if (ok) { setShowClosingMeeting(false); setSelected(null); }
  };

  const handleSendDeviationSheets = async (id: number) => {
    await apiCall("PUT", `/api/remote-evaluation/${id}/send-deviation-sheets`, {},
      "Fiches d'écarts envoyées à l'OEC");
  };

  const handleReceiveOecDocs = async (id: number) => {
    await apiCall("PUT", `/api/remote-evaluation/${id}/receive-oec-documents`, {},
      "Documents validés par l'OEC reçus");
  };

  const handleComplete = async () => {
    if (!selected) return;
    const ok = await apiCall("PUT", `/api/remote-evaluation/${selected.id}/complete`,
      completeForm, "Évaluation finalisée");
    if (ok) { setShowComplete(false); setSelected(null); }
  };

  const handleCasDecision = async (id: number) => {
    await apiCall("PUT", `/api/remote-evaluation/${id}/cas-decision`, {},
      "Décision CAS enregistrée — évaluation terminée");
  };

  const handleNotFeasible = async () => {
    if (!selected) return;
    const ok = await apiCall("PUT", `/api/remote-evaluation/${selected.id}/not-feasible`,
      notFeasibleForm, "Évaluation marquée non réalisable — revue documentaire en cours");
    if (ok) { setShowNotFeasible(false); setSelected(null); }
  };

  const handleCancel = async () => {
    if (!selected) return;
    const ok = await apiCall("PUT", `/api/remote-evaluation/${selected.id}/cancel`,
      cancelForm, "Évaluation annulée/reportée");
    if (ok) { setShowCancel(false); setSelected(null); }
  };

  // ─── Helpers ───────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const s = STATUS_CONFIG[status] || { color: "bg-gray-100 text-gray-800", label: status, icon: Clock };
    const Icon = s.icon;
    return <Badge className={`${s.color} border gap-1`}><Icon className="w-3 h-3" />{s.label}</Badge>;
  };

  const getWorkflowProgress = (status: string) => {
    const idx = WORKFLOW_STEPS.indexOf(status);
    if (idx === -1) return 0;
    return Math.round(((idx + 1) / WORKFLOW_STEPS.length) * 100);
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  }) : "—";

  const openDialogFor = (e: RemoteEval, dialogSetter: (v: boolean) => void) => {
    setSelected(e);
    dialogSetter(true);
  };

  const activeEvals = evals.filter(e =>
    !["COMPLETED", "CANCELLED", "CD_REJECTED", "OEC_REFUSED", "RISK_ANALYSIS_REJECTED", "NOT_FEASIBLE_DESK_REVIEW"].includes(e.status));
  const completedEvals = evals.filter(e =>
    ["COMPLETED", "CANCELLED", "CD_REJECTED", "OEC_REFUSED", "RISK_ANALYSIS_REJECTED", "NOT_FEASIBLE_DESK_REVIEW"].includes(e.status));

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Video className="w-6 h-6 text-primary" />
                Évaluation à distance — PRO 29
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Procédure d'évaluation à distance ALGERAC Rev02 — Workflow complet avec analyse des risques (FOR 77-1)
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />Proposer une évaluation
            </Button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{evals.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{activeEvals.length}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{evals.filter(e => e.status === "COMPLETED").length}</p>
                <p className="text-xs text-muted-foreground">Terminées</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{evals.filter(e => ["CANCELLED","CD_REJECTED","OEC_REFUSED","RISK_ANALYSIS_REJECTED"].includes(e.status)).length}</p>
                <p className="text-xs text-muted-foreground">Rejetées/Annulées</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="list">Évaluations actives ({activeEvals.length})</TabsTrigger>
              <TabsTrigger value="completed">Historique ({completedEvals.length})</TabsTrigger>
              {selected && <TabsTrigger value="detail">Détails</TabsTrigger>}
            </TabsList>

            {/* ─── Active evaluations tab ──────────────── */}
            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Évaluations actives</CardTitle>
                  <CardDescription>Évaluations à distance en cours selon le workflow PRO 29</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : activeEvals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Aucune évaluation à distance active</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[140px]">Code</TableHead>
                          <TableHead>Demande</TableHead>
                          <TableHead>Justification</TableHead>
                          <TableHead>Plateforme</TableHead>
                          <TableHead>Progression</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeEvals.map(e => (
                          <TableRow key={e.id} className="group">
                            <TableCell className="font-mono text-xs font-medium">{e.evaluationCode}</TableCell>
                            <TableCell className="text-sm">{e.request?.referenceNumber || "—"}</TableCell>
                            <TableCell className="text-sm max-w-[180px] truncate">
                              {JUSTIFICATION_LABELS[e.justification] || e.justification?.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                                {e.technologyPlatform}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="w-24">
                                <Progress value={getWorkflowProgress(e.status)} className="h-1.5" />
                                <span className="text-[10px] text-muted-foreground">{getWorkflowProgress(e.status)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(e.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end flex-wrap">
                                {/* View details */}
                                <Button size="sm" variant="ghost" onClick={() => {
                                  setSelected(e); setActiveTab("detail");
                                }}><Eye className="w-3.5 h-3.5" /></Button>

                                {/* Risk Analysis */}
                                {e.status === "RISK_ANALYSIS_PENDING" && (
                                  <Button size="sm" variant="default" onClick={() => openDialogFor(e, setShowRiskAnalysis)}>
                                    <Search className="w-3 h-3 mr-1" />Analyse risques
                                  </Button>
                                )}

                                {/* CD Approval */}
                                {e.status === "RISK_ANALYSIS_COMPLETED" && (
                                  <Button size="sm" variant="default" onClick={() => openDialogFor(e, setShowCdApproval)}>
                                    <CheckCircle className="w-3 h-3 mr-1" />Décision CD
                                  </Button>
                                )}

                                {/* OEC Consent */}
                                {e.status === "PENDING_OEC_CONSENT" && <>
                                  <Button size="sm" onClick={() => handleOecConsent(e.id, true)}>
                                    <CheckCircle className="w-3 h-3 mr-1" />Consentir
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleOecConsent(e.id, false)}>Refuser</Button>
                                </>}

                                {/* Tech Verification */}
                                {e.status === "OEC_CONSENTED" && (
                                  <Button size="sm" onClick={() => openDialogFor(e, setShowTech)}>
                                    <Wifi className="w-3 h-3 mr-1" />Vérif. technique
                                  </Button>
                                )}

                                {/* Schedule + Confidentiality */}
                                {e.status === "TECH_VERIFICATION" && (
                                  <Button size="sm" onClick={() => openDialogFor(e, setShowSchedule)}>
                                    <Calendar className="w-3 h-3 mr-1" />Programmer
                                  </Button>
                                )}

                                {/* Opening meeting */}
                                {e.status === "SCHEDULED" && (
                                  <Button size="sm" onClick={() => handleOpeningMeeting(e.id)}>
                                    <Users className="w-3 h-3 mr-1" />Réunion d'ouverture
                                  </Button>
                                )}

                                {/* Start evaluation */}
                                {e.status === "OPENING_MEETING" && (
                                  <Button size="sm" onClick={() => handleStart(e.id)}>
                                    <Play className="w-3 h-3 mr-1" />Démarrer évaluation
                                  </Button>
                                )}

                                {/* During evaluation */}
                                {e.status === "IN_PROGRESS" && <>
                                  <Button size="sm" variant="outline" onClick={() => openDialogFor(e, setShowDifficulties)}>
                                    <AlertTriangle className="w-3 h-3 mr-1" />Difficultés
                                  </Button>
                                  <Button size="sm" onClick={() => openDialogFor(e, setShowClosingMeeting)}>
                                    <Square className="w-3 h-3 mr-1" />Clôturer
                                  </Button>
                                </>}

                                {/* Send deviation sheets */}
                                {e.status === "CLOSING_MEETING" && (
                                  <Button size="sm" onClick={() => handleSendDeviationSheets(e.id)}>
                                    <Send className="w-3 h-3 mr-1" />Envoyer fiches d'écarts
                                  </Button>
                                )}

                                {/* Receive OEC documents */}
                                {e.status === "PENDING_DEVIATION_SHEETS" && (
                                  <Button size="sm" onClick={() => handleReceiveOecDocs(e.id)}>
                                    <FileText className="w-3 h-3 mr-1" />Docs OEC reçus
                                  </Button>
                                )}

                                {/* Complete */}
                                {e.status === "PENDING_OEC_VALIDATION" && (
                                  <Button size="sm" onClick={() => openDialogFor(e, setShowComplete)}>
                                    <ClipboardCheck className="w-3 h-3 mr-1" />Finaliser
                                  </Button>
                                )}

                                {/* CAS Decision */}
                                {e.status === "PENDING_CAS_DECISION" && (
                                  <Button size="sm" onClick={() => handleCasDecision(e.id)}>
                                    <CheckCircle className="w-3 h-3 mr-1" />Décision CAS
                                  </Button>
                                )}

                                {/* Not feasible - available at several stages */}
                                {["RISK_ANALYSIS_REJECTED", "TECH_VERIFICATION_FAILED", "OEC_REFUSED"].includes(e.status) && (
                                  <Button size="sm" variant="secondary" onClick={() => openDialogFor(e, setShowNotFeasible)}>
                                    <FileText className="w-3 h-3 mr-1" />Revue documentaire
                                  </Button>
                                )}

                                {/* Cancel */}
                                {!["COMPLETED", "CANCELLED", "NOT_FEASIBLE_DESK_REVIEW"].includes(e.status) && (
                                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => openDialogFor(e, setShowCancel)}>
                                    <Ban className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Completed evaluations tab ──────────── */}
            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historique</CardTitle>
                </CardHeader>
                <CardContent>
                  {completedEvals.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Aucune évaluation terminée</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Demande</TableHead>
                          <TableHead>Justification</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedEvals.map(e => (
                          <TableRow key={e.id}>
                            <TableCell className="font-mono text-xs">{e.evaluationCode}</TableCell>
                            <TableCell>{e.request?.referenceNumber || "—"}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {JUSTIFICATION_LABELS[e.justification] || e.justification}
                            </TableCell>
                            <TableCell>{getStatusBadge(e.status)}</TableCell>
                            <TableCell className="text-sm">{formatDate(e.updatedAt || e.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => { setSelected(e); setActiveTab("detail"); }}>
                                <Eye className="w-3.5 h-3.5" />
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

            {/* ─── Detail view tab ────────────────────── */}
            <TabsContent value="detail">
              {selected && <DetailView eval={selected} formatDate={formatDate} getStatusBadge={getStatusBadge} getWorkflowProgress={getWorkflowProgress} />}
            </TabsContent>
          </Tabs>

          {/* ═══════════════════════════════════════════════ */}
          {/* DIALOGS                                        */}
          {/* ═══════════════════════════════════════════════ */}

          {/* ─── Create Dialog ────────────────────────── */}
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />Proposer une évaluation à distance
                </DialogTitle>
                <DialogDescription>
                  PRO 29 §5.2 — Seules les évaluations de surveillance, renouvellement (sans extension) et transition sont éligibles.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>N° de demande d'accréditation *</Label>
                  <Input type="number" value={createForm.requestId}
                    onChange={e => setCreateForm({...createForm, requestId: e.target.value})}
                    placeholder="ID de la demande" />
                </div>
                <div>
                  <Label>Justification (§5.2) *</Label>
                  <Select value={createForm.justification} onValueChange={v => setCreateForm({...createForm, justification: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(JUSTIFICATION_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Détails de la justification</Label>
                  <Textarea value={createForm.justificationDetails}
                    onChange={e => setCreateForm({...createForm, justificationDetails: e.target.value})}
                    placeholder="Décrivez les circonstances…" />
                </div>
                <div>
                  <Label>Plateforme technologique *</Label>
                  <Select value={createForm.technologyPlatform} onValueChange={v => setCreateForm({...createForm, technologyPlatform: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zoom">Zoom</SelectItem>
                      <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                      <SelectItem value="Webex">Webex</SelectItem>
                      <SelectItem value="Google Meet">Google Meet</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Périmètre évalué à distance</Label>
                  <Textarea value={createForm.remoteScope}
                    onChange={e => setCreateForm({...createForm, remoteScope: e.target.value})}
                    placeholder="Exigences et activités évaluées à distance…" />
                </div>
                <div>
                  <Label>Périmètre nécessitant une évaluation sur site</Label>
                  <Textarea value={createForm.onsiteScope}
                    onChange={e => setCreateForm({...createForm, onsiteScope: e.target.value})}
                    placeholder="Éléments nécessitant une présence physique…" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phases d'évaluation (§5.6)</Label>
                    <Select value={createForm.evaluationPhases} onValueChange={v => setCreateForm({...createForm, evaluationPhases: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 phase (journée complète)</SelectItem>
                        <SelectItem value="2">2 phases (2 × ½ journée)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Durée estimée (heures)</Label>
                    <Input type="number" value={createForm.durationHours}
                      onChange={e => setCreateForm({...createForm, durationHours: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de début proposée</Label>
                    <Input type="datetime-local" value={createForm.startDate}
                      onChange={e => setCreateForm({...createForm, startDate: e.target.value})} />
                  </div>
                  <div>
                    <Label>Date de fin proposée</Label>
                    <Input type="datetime-local" value={createForm.endDate}
                      onChange={e => setCreateForm({...createForm, endDate: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={!createForm.requestId}>Proposer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Risk Analysis Dialog (FOR 77-1) ──────── */}
          <Dialog open={showRiskAnalysis} onOpenChange={setShowRiskAnalysis}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />Analyse des risques — FOR 77-1
                </DialogTitle>
                <DialogDescription>
                  PRO 29 §5.3 — Évaluez les 11 critères pour déterminer si l'évaluation à distance est réalisable.
                  Code : {selected?.evaluationCode}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Mois depuis la dernière évaluation sur site</Label>
                  <Input type="number" value={riskForm.monthsSinceLastOnsite}
                    onChange={e => setRiskForm({...riskForm, monthsSinceLastOnsite: e.target.value})} />
                </div>

                <Separator />
                <p className="text-sm font-semibold text-muted-foreground">Critères d'évaluation (§5.3)</p>

                {[
                  { key: "ictEquipmentAvailable", label: "Disponibilité des équipements TIC (équipe + OEC)" },
                  { key: "requirementsNatureSuitable", label: "Nature des exigences compatible avec l'évaluation à distance" },
                  { key: "findingsNatureFollowable", label: "Nature des constatations évaluable à distance" },
                  { key: "safetyConstraintsAcceptable", label: "Contraintes de sûreté et sécurité au sein de l'OEC acceptables" },
                  { key: "cabResourcesStable", label: "Stabilité des ressources et du système de management de l'OEC" },
                  { key: "digitizationLevelAdequate", label: "Niveau de numérisation suffisant pour les évaluateurs" },
                  { key: "cabPerformanceSatisfactory", label: "Performance, transparence et collaboration de l'OEC satisfaisantes" },
                  { key: "teamSizeAdequate", label: "Taille de l'équipe et durée de l'évaluation adéquates" },
                  { key: "assessorRemoteExperience", label: "Formation/expérience des évaluateurs à l'évaluation à distance" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
                    <Checkbox
                      checked={riskForm[key as keyof typeof riskForm] as boolean}
                      onCheckedChange={c => setRiskForm({...riskForm, [key]: !!c})} />
                    <Label className="text-sm cursor-pointer flex-1">{label}</Label>
                  </div>
                ))}

                <div className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
                  <Checkbox checked={riskForm.complaintsToInvestigate}
                    onCheckedChange={c => setRiskForm({...riskForm, complaintsToInvestigate: !!c})} />
                  <Label className="text-sm">Des réclamations doivent faire l'objet d'une enquête</Label>
                </div>
                {riskForm.complaintsToInvestigate && (
                  <Textarea value={riskForm.complaintsDetails} placeholder="Détails des réclamations…"
                    onChange={e => setRiskForm({...riskForm, complaintsDetails: e.target.value})} />
                )}

                <div>
                  <Label>Détails équipements TIC</Label>
                  <Textarea value={riskForm.ictEquipmentDetails} placeholder="Équipements disponibles côté OEC et évaluateurs…"
                    onChange={e => setRiskForm({...riskForm, ictEquipmentDetails: e.target.value})} />
                </div>

                <Separator />
                <div>
                  <Label>Commentaires / Conclusion de l'analyse</Label>
                  <Textarea value={riskForm.comments} placeholder="Synthèse de l'analyse des risques…"
                    onChange={e => setRiskForm({...riskForm, comments: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRiskAnalysis(false)}>Annuler</Button>
                <Button onClick={handleRiskAnalysis}>Soumettre l'analyse</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── CD Approval Dialog ───────────────────── */}
          <Dialog open={showCdApproval} onOpenChange={setShowCdApproval}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Décision du Chef de Département</DialogTitle>
                <DialogDescription>
                  L'analyse des risques est favorable. Approuvez-vous l'évaluation à distance {selected?.evaluationCode} ?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Commentaires</Label>
                  <Textarea value={cdApprovalForm.comments}
                    onChange={e => setCdApprovalForm({ comments: e.target.value })}
                    placeholder="Observations du CD…" />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => handleCdApproval(false)} className="text-red-600">
                  <XCircle className="w-4 h-4 mr-1" />Rejeter
                </Button>
                <Button onClick={() => handleCdApproval(true)}>
                  <CheckCircle className="w-4 h-4 mr-1" />Approuver
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Tech Verification Dialog ─────────────── */}
          <Dialog open={showTech} onOpenChange={setShowTech}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />Vérification technique — §5.5
                </DialogTitle>
                <DialogDescription>
                  Testez la plateforme/logiciel pour s'assurer de la bonne utilisation par l'équipe et l'OEC.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {[
                  { key: "videoOk", label: "Capacité vidéo vérifiée", icon: "🎥" },
                  { key: "audioOk", label: "Capacité audio vérifiée", icon: "🎤" },
                  { key: "docSharingOk", label: "Partage de documents fonctionnel", icon: "📄" },
                  { key: "connectionOk", label: "Stabilité de la connexion testée", icon: "📶" },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center space-x-3 p-2 rounded border">
                    <Checkbox checked={techForm[key as keyof typeof techForm] as boolean}
                      onCheckedChange={c => setTechForm({...techForm, [key]: !!c})} />
                    <Label className="text-sm flex-1"><span className="mr-2">{icon}</span>{label}</Label>
                  </div>
                ))}
                <div>
                  <Label>Prérequis techniques supplémentaires</Label>
                  <Textarea value={techForm.techPrereqs}
                    onChange={e => setTechForm({...techForm, techPrereqs: e.target.value})}
                    placeholder="Prérequis techniques identifiés…" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTech(false)}>Annuler</Button>
                <Button onClick={handleTechVerify}>Valider la vérification</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Schedule + Confidentiality Dialog ────── */}
          <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />Programmer et confirmer la confidentialité
                </DialogTitle>
                <DialogDescription>
                  §5.3 — Confirmation de la confidentialité (FOR 01-1) et planification de la date d'évaluation en accord avec l'OEC.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                    <Shield className="w-4 h-4" />
                    Engagement de confidentialité et d'impartialité (FOR 01-1)
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    En confirmant, l'équipe d'évaluation s'engage à respecter la confidentialité des informations selon les dispositions de la procédure.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de début</Label>
                    <Input type="datetime-local" value={scheduleForm.startDate}
                      onChange={e => setScheduleForm({...scheduleForm, startDate: e.target.value})} />
                  </div>
                  <div>
                    <Label>Date de fin</Label>
                    <Input type="datetime-local" value={scheduleForm.endDate}
                      onChange={e => setScheduleForm({...scheduleForm, endDate: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSchedule(false)}>Annuler</Button>
                <Button onClick={handleSchedule}>
                  <Shield className="w-4 h-4 mr-1" />Confirmer confidentialité et programmer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Report Difficulties Dialog ────────────── */}
          <Dialog open={showDifficulties} onOpenChange={setShowDifficulties}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />Signaler des difficultés techniques
                </DialogTitle>
                <DialogDescription>
                  §5.6 — Toute difficulté rencontrée doit être signalée au CD/RA chargé du dossier.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label>Description des difficultés</Label>
                <Textarea value={difficultiesForm.details}
                  onChange={e => setDifficultiesForm({ details: e.target.value })}
                  placeholder="Problème de connexion, accès limité, etc." rows={4} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDifficulties(false)}>Annuler</Button>
                <Button variant="destructive" onClick={handleReportDifficulties}>Signaler</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Closing Meeting Dialog ───────────────── */}
          <Dialog open={showClosingMeeting} onOpenChange={setShowClosingMeeting}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Square className="w-5 h-5" />Réunion de clôture — §5.6-C
                </DialogTitle>
                <DialogDescription>
                  Les fiches d'écarts devront être envoyées dans un délai de 24 heures après cette réunion.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label>Constatations de l'évaluation *</Label>
                <Textarea value={closingForm.findings}
                  onChange={e => setClosingForm({ findings: e.target.value })}
                  placeholder="Synthèse des constatations, non-conformités identifiées…" rows={6} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClosingMeeting(false)}>Annuler</Button>
                <Button onClick={handleClosingMeeting} disabled={!closingForm.findings.trim()}>
                  Clôturer l'évaluation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Complete Dialog (ICT Traceability) ────── */}
          <Dialog open={showComplete} onOpenChange={setShowComplete}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />Finaliser — Traçabilité documentaire §5.6-D
                </DialogTitle>
                <DialogDescription>
                  Le rapport doit indiquer dans quelle mesure les TIC ont été utilisées et leur efficacité.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Description de l'utilisation des TIC *</Label>
                  <Textarea value={completeForm.ictUsageDescription}
                    onChange={e => setCompleteForm({...completeForm, ictUsageDescription: e.target.value})}
                    placeholder="Outils utilisés, méthodes de communication, partage d'écran…" rows={3} />
                </div>
                <div>
                  <Label>Évaluation de l'efficacité des TIC</Label>
                  <Textarea value={completeForm.ictEffectivenessAssessment}
                    onChange={e => setCompleteForm({...completeForm, ictEffectivenessAssessment: e.target.value})}
                    placeholder="Les objectifs ont-ils été atteints malgré la distance ?" rows={3} />
                </div>
                <Separator />
                <div className="flex items-center space-x-3">
                  <Checkbox checked={completeForm.onsiteFollowUp}
                    onCheckedChange={c => setCompleteForm({...completeForm, onsiteFollowUp: !!c})} />
                  <Label>Suivi sur site nécessaire</Label>
                </div>
                {completeForm.onsiteFollowUp && (
                  <Textarea value={completeForm.followUpReason}
                    onChange={e => setCompleteForm({...completeForm, followUpReason: e.target.value})}
                    placeholder="Raison du suivi sur site…" />
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowComplete(false)}>Annuler</Button>
                <Button onClick={handleComplete}>Finaliser</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Not Feasible Dialog §5.7 ─────────────── */}
          <Dialog open={showNotFeasible} onOpenChange={setShowNotFeasible}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />Évaluation à distance non réalisable — §5.7
                </DialogTitle>
                <DialogDescription>
                  ALGERAC offre la possibilité du maintien de l'accréditation au moyen d'une revue documentaire approfondie et d'une conférence téléphonique.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Motif de non-réalisabilité *</Label>
                  <Textarea value={notFeasibleForm.reason}
                    onChange={e => setNotFeasibleForm({...notFeasibleForm, reason: e.target.value})}
                    placeholder="Connectivité insuffisante, limitations d'équipement, problèmes de confidentialité…" />
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox checked={notFeasibleForm.deskReview}
                    onCheckedChange={c => setNotFeasibleForm({...notFeasibleForm, deskReview: !!c})} />
                  <Label>Revue documentaire approfondie effectuée</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox checked={notFeasibleForm.conferenceCall}
                    onCheckedChange={c => setNotFeasibleForm({...notFeasibleForm, conferenceCall: !!c})} />
                  <Label>Conférence téléphonique effectuée</Label>
                </div>
                <div>
                  <Label>Date prévue pour l'évaluation sur site</Label>
                  <Input type="datetime-local" value={notFeasibleForm.onsitePlannedDate}
                    onChange={e => setNotFeasibleForm({...notFeasibleForm, onsitePlannedDate: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNotFeasible(false)}>Annuler</Button>
                <Button onClick={handleNotFeasible} disabled={!notFeasibleForm.reason.trim()}>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Cancel Dialog ────────────────────────── */}
          <Dialog open={showCancel} onOpenChange={setShowCancel}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <Ban className="w-5 h-5" />Annuler / Reporter l'évaluation
                </DialogTitle>
                <DialogDescription>
                  §5.6 — Si l'évaluation est annulée, elle sera organisée à une date ultérieure en accord avec l'OEC.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Label>Motif d'annulation *</Label>
                <Textarea value={cancelForm.reason}
                  onChange={e => setCancelForm({ reason: e.target.value })}
                  placeholder="Problème technique, décision OEC, circonstances…" rows={3} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCancel(false)}>Retour</Button>
                <Button variant="destructive" onClick={handleCancel} disabled={!cancelForm.reason.trim()}>
                  Confirmer l'annulation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Detail View Component
// ═══════════════════════════════════════════════════════════
function DetailView({ eval: e, formatDate, getStatusBadge, getWorkflowProgress }: {
  eval: RemoteEval;
  formatDate: (d: string | null) => string;
  getStatusBadge: (s: string) => JSX.Element;
  getWorkflowProgress: (s: string) => number;
}) {
  const progress = getWorkflowProgress(e.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold font-mono">{e.evaluationCode}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Demande : {e.request?.referenceNumber || "—"} • {e.request?.domain || ""}
              </p>
            </div>
            {getStatusBadge(e.status)}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Progression du workflow</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          {/* Workflow steps visualization */}
          <div className="flex flex-wrap gap-1 mt-3">
            {WORKFLOW_STEPS.map((step, idx) => {
              const stepIdx = WORKFLOW_STEPS.indexOf(e.status);
              const isCompleted = idx < stepIdx;
              const isCurrent = idx === stepIdx;
              const label = STATUS_CONFIG[step]?.label || step;
              return (
                <Badge key={step} variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
                  className={`text-[9px] ${isCurrent ? "ring-2 ring-primary ring-offset-1" : ""} ${isCompleted ? "opacity-60" : ""}`}>
                  {isCompleted && <CheckCircle className="w-2 h-2 mr-0.5" />}
                  {label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* General info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Informations générales</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <DetailRow label="Justification" value={JUSTIFICATION_LABELS[e.justification] || e.justification} />
              {e.justificationDetails && <DetailRow label="Détails" value={e.justificationDetails} />}
              <DetailRow label="Plateforme" value={e.technologyPlatform} />
              <DetailRow label="Phases" value={`${e.evaluationPhases || 1} phase(s)`} />
              <DetailRow label="Durée estimée" value={e.estimatedDurationHours ? `${e.estimatedDurationHours}h` : "—"} />
              {e.scheduledStartDate && <DetailRow label="Début prévu" value={formatDate(e.scheduledStartDate)} />}
              {e.scheduledEndDate && <DetailRow label="Fin prévue" value={formatDate(e.scheduledEndDate)} />}
              <DetailRow label="Créé le" value={formatDate(e.createdAt)} />
            </CardContent>
          </Card>

          {/* Scope */}
          <Card>
            <CardHeader><CardTitle className="text-base">Périmètre</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <DetailRow label="Évalué à distance" value={e.remoteScope || "—"} />
              <DetailRow label="Sur site requis" value={e.onsiteScope || "—"} />
            </CardContent>
          </Card>

          {/* Findings */}
          {e.evaluationFindings && (
            <Card>
              <CardHeader><CardTitle className="text-base">Constatations</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{e.evaluationFindings}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Risk Analysis */}
          {e.riskAnalysisDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />Analyse des risques (FOR 77-1)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <DetailRow label="Date" value={formatDate(e.riskAnalysisDate)} />
                <DetailRow label="Résultat" value={
                  <Badge className={e.riskAnalysisResult === "ACCEPTABLE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {e.riskAnalysisResult === "ACCEPTABLE" ? "Acceptable" : "Non acceptable"}
                  </Badge>
                } />
                <DetailRow label="Mois depuis dernier sur site" value={e.monthsSinceLastOnsiteAssessment?.toString() || "—"} />
                <RiskCheck label="Équipements TIC" value={e.ictEquipmentAvailable} />
                <RiskCheck label="Exigences compatibles" value={e.requirementsNatureSuitable} />
                <RiskCheck label="Constatations évaluables" value={e.findingsNatureFollowable} />
                <RiskCheck label="Sûreté/sécurité OEC" value={e.safetyConstraintsAcceptable} />
                <RiskCheck label="Ressources OEC stables" value={e.cabResourcesStable} />
                <RiskCheck label="Numérisation adéquate" value={e.digitizationLevelAdequate} />
                <RiskCheck label="Performance OEC" value={e.cabPerformanceSatisfactory} />
                <RiskCheck label="Taille équipe adéquate" value={e.teamSizeAdequate} />
                <RiskCheck label="Expérience évaluateurs" value={e.assessorRemoteExperience} />
              </CardContent>
            </Card>
          )}

          {/* Tech verification */}
          {e.videoCapabilityVerified !== null && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2">
                <Wifi className="w-4 h-4" />Vérification technique (§5.5)
              </CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <RiskCheck label="Vidéo" value={e.videoCapabilityVerified} />
                <RiskCheck label="Audio" value={e.audioCapabilityVerified} />
                <RiskCheck label="Partage documents" value={e.documentSharingVerified} />
                <RiskCheck label="Connexion stable" value={e.connectionStabilityTest} />
              </CardContent>
            </Card>
          )}

          {/* Approvals & Consent */}
          <Card>
            <CardHeader><CardTitle className="text-base">Approbations & Consentement</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {e.approvalDate && <DetailRow label="Approuvé CD le" value={formatDate(e.approvalDate)} />}
              {e.approvalComments && <DetailRow label="Commentaires CD" value={e.approvalComments} />}
              <DetailRow label="Consentement OEC" value={
                e.oecConsentObtained === true ? "✅ Obtenu" :
                e.oecConsentObtained === false ? "❌ Refusé" : "⏳ En attente"
              } />
              {e.oecConsentDate && <DetailRow label="Date consentement" value={formatDate(e.oecConsentDate)} />}
              {e.confidentialityConfirmed && (
                <DetailRow label="Confidentialité (FOR 01-1)" value="✅ Confirmée" />
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base">Chronologie</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {e.openingMeetingDate && <DetailRow label="Réunion d'ouverture" value={formatDate(e.openingMeetingDate)} />}
              {e.closingMeetingDate && <DetailRow label="Réunion de clôture" value={formatDate(e.closingMeetingDate)} />}
              {e.deviationSheetsSentDate && <DetailRow label="Fiches d'écarts envoyées" value={formatDate(e.deviationSheetsSentDate)} />}
              {e.deviationSheetsDeadline && <DetailRow label="Deadline fiches d'écarts" value={formatDate(e.deviationSheetsDeadline)} />}
              {e.oecDocumentsReceivedDate && <DetailRow label="Docs OEC reçus" value={formatDate(e.oecDocumentsReceivedDate)} />}
            </CardContent>
          </Card>

          {/* ICT Traceability */}
          {e.ictUsageDescription && (
            <Card>
              <CardHeader><CardTitle className="text-base">Traçabilité documentaire (§5.6-D)</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <DetailRow label="Utilisation des TIC" value={e.ictUsageDescription} />
                {e.ictEffectivenessAssessment && <DetailRow label="Efficacité" value={e.ictEffectivenessAssessment} />}
              </CardContent>
            </Card>
          )}

          {/* Technical difficulties */}
          {e.technicalDifficultiesEncountered && (
            <Card className="border-amber-200">
              <CardHeader><CardTitle className="text-base text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />Difficultés techniques
              </CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{e.technicalDifficultiesDetails || "Signalées"}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Small helper components ──────────────────────────
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function RiskCheck({ label, value }: { label: string; value: boolean | null }) {
  return (
    <div className="flex items-center gap-2">
      {value === true ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> :
       value === false ? <XCircle className="w-3.5 h-3.5 text-red-600" /> :
       <Clock className="w-3.5 h-3.5 text-gray-400" />}
      <span className={value === false ? "text-red-700" : ""}>{label}</span>
    </div>
  );
}
