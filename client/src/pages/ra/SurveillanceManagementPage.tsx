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
import {
  Shield, Eye, Calendar, AlertTriangle, FileText, CheckCircle,
  Clock, Users, Activity, BarChart3, Send, XCircle
} from "lucide-react";

export default function SurveillanceManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");

  // Dialogs
  const [showProgramme, setShowProgramme] = useState(false);
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false);
  const [showRequestDocs, setShowRequestDocs] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [showTeamPlan, setShowTeamPlan] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showCASDecision, setShowCASDecision] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Forms
  const [programmeForm, setProgrammeForm] = useState({ certificateId: "", plannedDate: "", type: "SURVEILLANCE" });
  const [riskForm, setRiskForm] = useState({
    previousNonConformities: false, complaintsReceived: false, significantChanges: false,
    marketSurveillanceIssues: false, overallRiskLevel: "LOW", recommendations: ""
  });
  const [docForm, setDocForm] = useState({ documentTypes: "", deadline: "" });
  const [quotationForm, setQuotationForm] = useState({ amount: "", duration: "", teamSize: "" });
  const [teamPlanForm, setTeamPlanForm] = useState({ teamComposition: "", evaluationPlanDetails: "", plannedDate: "" });
  const [completeForm, setCompleteForm] = useState({ findings: "", recommendations: "" });
  const [casForm, setCasForm] = useState({ decision: "", conditions: "" });
  const [suspendForm, setSuspendForm] = useState({ reason: "", duration: "" });
  const [withdrawForm, setWithdrawForm] = useState({ reason: "" });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [upRes, ovRes] = await Promise.all([
        fetch("/api/workflow/surveillance/upcoming", { credentials: "include" }),
        fetch("/api/workflow/surveillance/overdue", { credentials: "include" })
      ]);
      const upData = await upRes.json();
      const ovData = await ovRes.json();
      if (upData.success) setUpcoming(upData.data || []);
      if (ovData.success) setOverdue(ovData.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const selectEval = async (ev: any) => {
    setSelectedEval(ev);
    try {
      const res = await fetch(`/api/workflow/surveillance/${ev.id}/risk-analysis`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setRiskAnalysis(data.data);
      else setRiskAnalysis(null);
    } catch (err) { setRiskAnalysis(null); }
  };

  const handleProgramme = async () => {
    try {
      await apiRequest("POST", "/api/workflow/surveillance/programme", {
        ...programmeForm, certificateId: parseInt(programmeForm.certificateId)
      });
      toast({ title: "Surveillance programmée" });
      setShowProgramme(false);
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
      toast({ title: "Documents demandés à l'OEC (FOR 68)" });
      setShowRequestDocs(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleQuotation = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/quotation`, {
        ...quotationForm,
        amount: parseFloat(quotationForm.amount),
        duration: parseInt(quotationForm.duration),
        teamSize: parseInt(quotationForm.teamSize)
      });
      toast({ title: "Devis de surveillance préparé" });
      setShowQuotation(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleAcceptQuotation = async () => {
    try {
      await apiRequest("PUT", `/api/workflow/surveillance/${selectedEval.id}/accept-quotation`, {});
      toast({ title: "Devis accepté par l'OEC" });
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleTeamPlan = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/team-plan`, teamPlanForm);
      toast({ title: "Équipe et plan préparés" });
      setShowTeamPlan(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleStart = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/start`, {});
      toast({ title: "Évaluation de surveillance démarrée" });
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleComplete = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/complete`, completeForm);
      toast({ title: "Évaluation terminée" });
      setShowComplete(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleValidateReport = async () => {
    try {
      await apiRequest("PUT", `/api/workflow/surveillance/${selectedEval.id}/validate-report`, {});
      toast({ title: "Rapport de surveillance validé" });
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCASDecision = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/cas-decision`, casForm);
      toast({ title: "Décision CAS de surveillance enregistrée" });
      setShowCASDecision(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSuspend = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/suspend`, {
        ...suspendForm, duration: parseInt(suspendForm.duration)
      });
      toast({ title: "Accréditation suspendue (PRO 23)" });
      setShowSuspend(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleWithdraw = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/withdraw`, withdrawForm);
      toast({ title: "Accréditation retirée (PRO 23)" });
      setShowWithdraw(false);
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleLiftSuspension = async () => {
    try {
      await apiRequest("POST", `/api/workflow/surveillance/${selectedEval.id}/lift-suspension`, {});
      toast({ title: "Suspension levée" });
      selectEval(selectedEval);
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusColor = (status: string) => {
    const m: Record<string, string> = {
      PLANNED: "bg-blue-100 text-blue-800",
      RISK_ANALYSIS: "bg-purple-100 text-purple-800",
      DOCUMENTS_REQUESTED: "bg-yellow-100 text-yellow-800",
      QUOTATION_PREPARED: "bg-orange-100 text-orange-800",
      QUOTATION_ACCEPTED: "bg-teal-100 text-teal-800",
      TEAM_PREPARED: "bg-indigo-100 text-indigo-800",
      IN_PROGRESS: "bg-cyan-100 text-cyan-800",
      REPORT_PENDING: "bg-amber-100 text-amber-800",
      CAS_REVIEW: "bg-red-100 text-red-800",
      COMPLETED: "bg-emerald-100 text-emerald-800"
    };
    return m[status] || "bg-gray-100 text-gray-800";
  };

  const allEvals = [...upcoming, ...overdue];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Surveillance périodique</h1>
              <p className="text-muted-foreground">Gestion du cycle complet de surveillance</p>
            </div>
            <Button onClick={() => setShowProgramme(true)}>
              <Calendar className="w-4 h-4 mr-2" />Programmer une surveillance
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{upcoming.length}</p>
                  <p className="text-xs text-muted-foreground">Prochaines</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
                  <p className="text-xs text-muted-foreground">En retard</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {allEvals.filter((e: any) => e.status === "IN_PROGRESS").length}
                  </p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {allEvals.filter((e: any) => e.status === "COMPLETED").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Terminées</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT: Surveillance list */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Surveillances</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {loading ? <p className="text-sm text-muted-foreground">Chargement...</p> :
                   allEvals.length === 0 ? <p className="text-sm text-muted-foreground">Aucune surveillance</p> :
                   allEvals.map((ev: any) => (
                    <div key={ev.id} onClick={() => selectEval(ev)}
                      className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                        selectedEval?.id === ev.id ? "bg-primary/10 border-primary" : "hover:bg-gray-50 border-transparent"
                      }`}>
                      <p className="font-medium text-sm">Surveillance #{ev.id}</p>
                      <Badge className={getStatusColor(ev.status)}>
                        {ev.status?.replace(/_/g, " ")}
                      </Badge>
                      {ev.plannedDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(ev.plannedDate).toLocaleDateString("fr-FR")}
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
                <Card className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Sélectionnez une surveillance</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Status & info */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Surveillance #{selectedEval.id}</CardTitle>
                        <Badge className={getStatusColor(selectedEval.status)}>
                          {selectedEval.status?.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <CardDescription>
                        Type: {selectedEval.type || "SURVEILLANCE"} |
                        Planifiée: {selectedEval.plannedDate ? new Date(selectedEval.plannedDate).toLocaleDateString("fr-FR") : "N/A"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Contextual actions based on status */}
                      <div className="flex gap-2 flex-wrap">
                        {selectedEval.status === "PLANNED" && (
                          <Button size="sm" onClick={() => setShowRiskAnalysis(true)}>
                            <BarChart3 className="w-3 h-3 mr-1" />Analyse de risque FOR 77-1
                          </Button>
                        )}
                        {selectedEval.status === "RISK_ANALYSIS" && (
                          <Button size="sm" onClick={() => setShowRequestDocs(true)}>
                            <FileText className="w-3 h-3 mr-1" />Demander documents FOR 68
                          </Button>
                        )}
                        {selectedEval.status === "DOCUMENTS_REQUESTED" && (
                          <Button size="sm" onClick={() => setShowQuotation(true)}>
                            <FileText className="w-3 h-3 mr-1" />Préparer le devis
                          </Button>
                        )}
                        {selectedEval.status === "QUOTATION_PREPARED" && (
                          <Button size="sm" onClick={handleAcceptQuotation}>
                            <CheckCircle className="w-3 h-3 mr-1" />Accepter devis
                          </Button>
                        )}
                        {selectedEval.status === "QUOTATION_ACCEPTED" && (
                          <Button size="sm" onClick={() => setShowTeamPlan(true)}>
                            <Users className="w-3 h-3 mr-1" />Préparer équipe & plan
                          </Button>
                        )}
                        {selectedEval.status === "TEAM_PREPARED" && (
                          <Button size="sm" onClick={handleStart}>
                            <Activity className="w-3 h-3 mr-1" />Démarrer l'évaluation
                          </Button>
                        )}
                        {selectedEval.status === "IN_PROGRESS" && (
                          <Button size="sm" onClick={() => setShowComplete(true)}>
                            <CheckCircle className="w-3 h-3 mr-1" />Terminer l'évaluation
                          </Button>
                        )}
                        {selectedEval.status === "REPORT_PENDING" && (
                          <Button size="sm" onClick={handleValidateReport}>
                            <CheckCircle className="w-3 h-3 mr-1" />Valider le rapport
                          </Button>
                        )}
                        {selectedEval.status === "CAS_REVIEW" && (
                          <>
                            <Button size="sm" onClick={() => setShowCASDecision(true)}>
                              <Shield className="w-3 h-3 mr-1" />Décision CAS
                            </Button>
                            <Button size="sm" variant="outline" className="text-orange-600" onClick={() => setShowSuspend(true)}>
                              Suspendre
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setShowWithdraw(true)}>
                              Retirer
                            </Button>
                          </>
                        )}
                        {selectedEval.status === "COMPLETED" && selectedEval.accreditationSuspended && (
                          <Button size="sm" onClick={handleLiftSuspension}>
                            <CheckCircle className="w-3 h-3 mr-1" />Lever la suspension
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Analysis display */}
                  {riskAnalysis && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />Analyse de risque FOR 77-1
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            {riskAnalysis.previousNonConformities ?
                              <XCircle className="w-4 h-4 text-red-500" /> :
                              <CheckCircle className="w-4 h-4 text-green-500" />}
                            <span>Non-conformités antérieures</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {riskAnalysis.complaintsReceived ?
                              <XCircle className="w-4 h-4 text-red-500" /> :
                              <CheckCircle className="w-4 h-4 text-green-500" />}
                            <span>Réclamations reçues</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {riskAnalysis.significantChanges ?
                              <XCircle className="w-4 h-4 text-red-500" /> :
                              <CheckCircle className="w-4 h-4 text-green-500" />}
                            <span>Changements significatifs</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {riskAnalysis.marketSurveillanceIssues ?
                              <XCircle className="w-4 h-4 text-red-500" /> :
                              <CheckCircle className="w-4 h-4 text-green-500" />}
                            <span>Problèmes de surveillance du marché</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <Badge className={riskAnalysis.overallRiskLevel === "HIGH" ? "bg-red-100 text-red-800" :
                            riskAnalysis.overallRiskLevel === "MEDIUM" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                            Risque: {riskAnalysis.overallRiskLevel}
                          </Badge>
                          {riskAnalysis.recommendations && (
                            <p className="text-sm text-muted-foreground mt-2">{riskAnalysis.recommendations}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Programme Dialog */}
          <Dialog open={showProgramme} onOpenChange={setShowProgramme}>
            <DialogContent>
              <DialogHeader><DialogTitle>Programmer une surveillance</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>ID du certificat</Label>
                  <Input type="number" value={programmeForm.certificateId}
                    onChange={(e) => setProgrammeForm({ ...programmeForm, certificateId: e.target.value })}
                    placeholder="ID certificat" />
                </div>
                <div>
                  <Label>Date prévue</Label>
                  <Input type="datetime-local" value={programmeForm.plannedDate}
                    onChange={(e) => setProgrammeForm({ ...programmeForm, plannedDate: e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={programmeForm.type}
                    onValueChange={(v) => setProgrammeForm({ ...programmeForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SURVEILLANCE">Surveillance</SelectItem>
                      <SelectItem value="EXTRAORDINARY">Extraordinaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowProgramme(false)}>Annuler</Button>
                <Button onClick={handleProgramme}>Programmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Risk Analysis Dialog */}
          <Dialog open={showRiskAnalysis} onOpenChange={setShowRiskAnalysis}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Analyse de risque FOR 77-1</DialogTitle>
                <DialogDescription>Évaluation des risques pour déterminer le périmètre de surveillance</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={riskForm.previousNonConformities}
                      onCheckedChange={(c) => setRiskForm({ ...riskForm, previousNonConformities: !!c })} />
                    <Label>Non-conformités antérieures constatées</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={riskForm.complaintsReceived}
                      onCheckedChange={(c) => setRiskForm({ ...riskForm, complaintsReceived: !!c })} />
                    <Label>Réclamations reçues</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={riskForm.significantChanges}
                      onCheckedChange={(c) => setRiskForm({ ...riskForm, significantChanges: !!c })} />
                    <Label>Changements significatifs dans l'organisme</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={riskForm.marketSurveillanceIssues}
                      onCheckedChange={(c) => setRiskForm({ ...riskForm, marketSurveillanceIssues: !!c })} />
                    <Label>Problèmes liés à la surveillance du marché</Label>
                  </div>
                </div>
                <div>
                  <Label>Niveau de risque global</Label>
                  <Select value={riskForm.overallRiskLevel}
                    onValueChange={(v) => setRiskForm({ ...riskForm, overallRiskLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Faible</SelectItem>
                      <SelectItem value="MEDIUM">Moyen</SelectItem>
                      <SelectItem value="HIGH">Élevé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recommandations</Label>
                  <Textarea value={riskForm.recommendations}
                    onChange={(e) => setRiskForm({ ...riskForm, recommendations: e.target.value })}
                    placeholder="Recommandations basées sur l'analyse..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRiskAnalysis(false)}>Annuler</Button>
                <Button onClick={handleRiskAnalysis}>Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Request Documents Dialog */}
          <Dialog open={showRequestDocs} onOpenChange={setShowRequestDocs}>
            <DialogContent>
              <DialogHeader><DialogTitle>Demander des documents (FOR 68)</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Types de documents demandés</Label>
                  <Textarea value={docForm.documentTypes}
                    onChange={(e) => setDocForm({ ...docForm, documentTypes: e.target.value })}
                    placeholder="Manuel qualité, procédures, enregistrements..." />
                </div>
                <div>
                  <Label>Date limite</Label>
                  <Input type="datetime-local" value={docForm.deadline}
                    onChange={(e) => setDocForm({ ...docForm, deadline: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRequestDocs(false)}>Annuler</Button>
                <Button onClick={handleRequestDocs}>Envoyer la demande</Button>
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
                    onChange={(e) => setQuotationForm({ ...quotationForm, amount: e.target.value })} />
                </div>
                <div>
                  <Label>Durée (jours)</Label>
                  <Input type="number" value={quotationForm.duration}
                    onChange={(e) => setQuotationForm({ ...quotationForm, duration: e.target.value })} />
                </div>
                <div>
                  <Label>Taille de l'équipe</Label>
                  <Input type="number" value={quotationForm.teamSize}
                    onChange={(e) => setQuotationForm({ ...quotationForm, teamSize: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowQuotation(false)}>Annuler</Button>
                <Button onClick={handleQuotation}>Préparer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Team & Plan Dialog */}
          <Dialog open={showTeamPlan} onOpenChange={setShowTeamPlan}>
            <DialogContent>
              <DialogHeader><DialogTitle>Équipe et plan de surveillance</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Composition de l'équipe</Label>
                  <Textarea value={teamPlanForm.teamComposition}
                    onChange={(e) => setTeamPlanForm({ ...teamPlanForm, teamComposition: e.target.value })}
                    placeholder="Évaluateurs et experts techniques..." />
                </div>
                <div>
                  <Label>Détails du plan d'évaluation</Label>
                  <Textarea value={teamPlanForm.evaluationPlanDetails}
                    onChange={(e) => setTeamPlanForm({ ...teamPlanForm, evaluationPlanDetails: e.target.value })}
                    placeholder="Programme détaillé..." />
                </div>
                <div>
                  <Label>Date d'évaluation</Label>
                  <Input type="datetime-local" value={teamPlanForm.plannedDate}
                    onChange={(e) => setTeamPlanForm({ ...teamPlanForm, plannedDate: e.target.value })} />
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
            <DialogContent>
              <DialogHeader><DialogTitle>Terminer l'évaluation</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Constats</Label>
                  <Textarea value={completeForm.findings}
                    onChange={(e) => setCompleteForm({ ...completeForm, findings: e.target.value })}
                    placeholder="Constats de l'évaluation de surveillance..." className="min-h-[100px]" />
                </div>
                <div>
                  <Label>Recommandations</Label>
                  <Textarea value={completeForm.recommendations}
                    onChange={(e) => setCompleteForm({ ...completeForm, recommendations: e.target.value })}
                    placeholder="Recommandations..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowComplete(false)}>Annuler</Button>
                <Button onClick={handleComplete}>Terminer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CAS Decision Dialog */}
          <Dialog open={showCASDecision} onOpenChange={setShowCASDecision}>
            <DialogContent>
              <DialogHeader><DialogTitle>Décision CAS — Surveillance</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Décision</Label>
                  <Select value={casForm.decision}
                    onValueChange={(v) => setCasForm({ ...casForm, decision: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTAIN">Maintenir l'accréditation</SelectItem>
                      <SelectItem value="SUSPEND">Suspendre</SelectItem>
                      <SelectItem value="WITHDRAW">Retirer</SelectItem>
                      <SelectItem value="REDUCE">Réduire la portée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Conditions</Label>
                  <Textarea value={casForm.conditions}
                    onChange={(e) => setCasForm({ ...casForm, conditions: e.target.value })}
                    placeholder="Conditions et observations..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCASDecision(false)}>Annuler</Button>
                <Button onClick={handleCASDecision}>Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Suspend Dialog */}
          <Dialog open={showSuspend} onOpenChange={setShowSuspend}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Suspendre l'accréditation (PRO 23)</DialogTitle>
                <DialogDescription>Suspension temporaire — maximum 6 mois</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Motif</Label>
                  <Textarea value={suspendForm.reason}
                    onChange={(e) => setSuspendForm({ ...suspendForm, reason: e.target.value })}
                    placeholder="Motif de la suspension..." />
                </div>
                <div>
                  <Label>Durée (mois)</Label>
                  <Input type="number" max="6" value={suspendForm.duration}
                    onChange={(e) => setSuspendForm({ ...suspendForm, duration: e.target.value })} />
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
                <DialogDescription>Action irréversible - retrait définitif</DialogDescription>
              </DialogHeader>
              <div>
                <Label>Motif du retrait</Label>
                <Textarea value={withdrawForm.reason}
                  onChange={(e) => setWithdrawForm({ reason: e.target.value })}
                  placeholder="Motif détaillé du retrait..." className="min-h-[120px]" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWithdraw(false)}>Annuler</Button>
                <Button variant="destructive" onClick={handleWithdraw}>Confirmer le retrait</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
