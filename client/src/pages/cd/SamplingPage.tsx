import { useState, useEffect, useCallback } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Beaker, Plus, CheckCircle, Clock, Send, XCircle, FileSearch, Target,
  Users, Building2, FlaskConical, AlertTriangle, Archive, Eye, Info,
  Calculator, ChevronDown, ChevronUp, Search, Filter
} from "lucide-react";

interface SamplingPlan {
  id: number;
  planCode: string;
  planType: string;
  assessmentType: string;
  methodology: string;
  // Scope
  totalMethodsInScope: number | null;
  selectedMethodsCount: number | null;
  selectedMethods: string | null;
  numberOfAssessmentsInCycle: number | null;
  accreditationCycleYears: number | null;
  // Sites
  totalSitesInScope: number | null;
  selectedSitesCount: number | null;
  selectedSites: string | null;
  headquartersIncluded: boolean | null;
  // Personnel
  totalPersonnelCount: number | null;
  selectedPersonnelCount: number | null;
  selectedPersonnel: string | null;
  totalSignatories: number | null;
  selectedSignatories: number | null;
  totalInspectors: number | null;
  selectedInspectors: number | null;
  totalTechnicians: number | null;
  selectedTechnicians: number | null;
  allCompetenceFilesReviewed: boolean | null;
  newRecruitsIncluded: boolean | null;
  newClearancesIncluded: boolean | null;
  // Criteria
  selectionCriteria: string | null;
  riskFactors: string | null;
  riskAnalysisNotes: string | null;
  justification: string | null;
  coversAllDomains: boolean | null;
  coversKeyPersonnel: boolean | null;
  coverageNotes: string | null;
  // Historical
  internalAuditResults: string | null;
  managementReviewResults: string | null;
  findingsHistory: string | null;
  lastScopeObservationDate: string | null;
  // Status
  status: string;
  approvalComments: string | null;
  createdAt: string;
  updatedAt: string | null;
  request?: { id: number; referenceNumber: string; type: string; domain: string };
  createdBy?: { id: number; fullName: string };
  approvedBy?: { id: number; fullName: string };
  approvalDate: string | null;
}

const defaultForm = {
  requestId: "", planType: "LABORATORY", methodology: "",
  totalMethods: "", selectedMethods: "", selectedMethodsDetail: "",
  totalSites: "", selectedSites: "", selectedSitesDetail: "",
  headquartersIncluded: false,
  numberOfAssessmentsInCycle: "", accreditationCycleYears: "",
  // Personnel
  totalPersonnelCount: "", selectedPersonnelCount: "", selectedPersonnel: "",
  totalSignatories: "", selectedSignatories: "",
  totalInspectors: "", selectedInspectors: "",
  totalTechnicians: "", selectedTechnicians: "",
  allCompetenceFilesReviewed: false, newRecruitsIncluded: false, newClearancesIncluded: false,
  // Criteria
  selectionCriteria: "", riskFactors: "", riskAnalysisNotes: "",
  justification: "", coversAllDomains: false, coversKeyPersonnel: false, coverageNotes: "",
  // Historical
  internalAuditResults: "", managementReviewResults: "", findingsHistory: "",
};

type FormState = typeof defaultForm;

export default function SamplingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SamplingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SamplingPlan | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formStep, setFormStep] = useState(0);

  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [reviewForm, setReviewForm] = useState({ approved: true, comments: "" });

  // Stats
  const pendingCount = plans.filter(p => p.status === "SUBMITTED_TO_CD").length;
  const draftCount = plans.filter(p => p.status === "DRAFT" || p.status === "CD_CHANGES_REQUESTED").length;
  const approvedCount = plans.filter(p => p.status === "CD_APPROVED").length;
  const appliedCount = plans.filter(p => p.status === "APPLIED").length;

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/sampling", { credentials: "include" });
      const data = await res.json();
      setPlans(data.data || []);
    } catch { setPlans([]); }
    setLoading(false);
  }, []);

  const filteredPlans = plans.filter(p => {
    if (activeTab === "pending") return p.status === "SUBMITTED_TO_CD";
    if (activeTab === "draft") return p.status === "DRAFT" || p.status === "CD_CHANGES_REQUESTED";
    if (activeTab === "approved") return p.status === "CD_APPROVED";
    if (activeTab === "applied") return p.status === "APPLIED" || p.status === "SUPERSEDED" || p.status === "ARCHIVED";
    return true;
  }).filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.planCode?.toLowerCase().includes(q) ||
      p.request?.referenceNumber?.toLowerCase().includes(q) ||
      p.planType?.toLowerCase().includes(q) ||
      p.assessmentType?.toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    try {
      await apiRequest("POST", "/api/sampling", {
        requestId: parseInt(form.requestId),
        planType: form.planType,
        methodology: form.methodology,
        totalMethods: form.totalMethods ? parseInt(form.totalMethods) : null,
        selectedMethods: form.selectedMethods ? parseInt(form.selectedMethods) : null,
        selectedMethodsDetail: form.selectedMethodsDetail || null,
        totalSites: form.totalSites ? parseInt(form.totalSites) : null,
        selectedSites: form.selectedSites ? parseInt(form.selectedSites) : null,
        selectedSitesDetail: form.selectedSitesDetail || null,
        headquartersIncluded: form.headquartersIncluded,
        numberOfAssessmentsInCycle: form.numberOfAssessmentsInCycle ? parseInt(form.numberOfAssessmentsInCycle) : null,
        accreditationCycleYears: form.accreditationCycleYears ? parseInt(form.accreditationCycleYears) : null,
        // Personnel
        totalPersonnelCount: form.totalPersonnelCount ? parseInt(form.totalPersonnelCount) : null,
        selectedPersonnelCount: form.selectedPersonnelCount ? parseInt(form.selectedPersonnelCount) : null,
        selectedPersonnel: form.selectedPersonnel || null,
        totalSignatories: form.totalSignatories ? parseInt(form.totalSignatories) : null,
        selectedSignatories: form.selectedSignatories ? parseInt(form.selectedSignatories) : null,
        totalInspectors: form.totalInspectors ? parseInt(form.totalInspectors) : null,
        selectedInspectors: form.selectedInspectors ? parseInt(form.selectedInspectors) : null,
        totalTechnicians: form.totalTechnicians ? parseInt(form.totalTechnicians) : null,
        selectedTechnicians: form.selectedTechnicians ? parseInt(form.selectedTechnicians) : null,
        allCompetenceFilesReviewed: form.allCompetenceFilesReviewed,
        newRecruitsIncluded: form.newRecruitsIncluded,
        newClearancesIncluded: form.newClearancesIncluded,
        // Criteria
        selectionCriteria: form.selectionCriteria || null,
        riskFactors: form.riskFactors || null,
        riskAnalysisNotes: form.riskAnalysisNotes || null,
        justification: form.justification || null,
        coversAllDomains: form.coversAllDomains,
        coversKeyPersonnel: form.coversKeyPersonnel,
        coverageNotes: form.coverageNotes || null,
        // Historical
        internalAuditResults: form.internalAuditResults || null,
        managementReviewResults: form.managementReviewResults || null,
        findingsHistory: form.findingsHistory || null,
      });
      toast({ title: "Plan d'échantillonnage créé avec succès" });
      setShowCreate(false);
      setForm({ ...defaultForm });
      setFormStep(0);
      loadPlans();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (planId: number) => {
    try {
      await apiRequest("PUT", `/api/sampling/${planId}/submit`, {});
      toast({ title: "Plan soumis au CD pour validation" });
      loadPlans();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleReview = async () => {
    if (!selectedPlan) return;
    try {
      await apiRequest("PUT", `/api/sampling/${selectedPlan.id}/review`, reviewForm);
      toast({ title: reviewForm.approved ? "Plan approuvé par le CD" : "Modifications demandées" });
      setShowReview(false);
      setReviewForm({ approved: true, comments: "" });
      loadPlans();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleApply = async (planId: number) => {
    try {
      await apiRequest("PUT", `/api/sampling/${planId}/apply`, {});
      toast({ title: "Plan d'échantillonnage appliqué à l'évaluation" });
      loadPlans();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleArchive = async (planId: number) => {
    try {
      await apiRequest("PUT", `/api/sampling/${planId}/archive`, {});
      toast({ title: "Plan archivé" });
      loadPlans();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // Recommended scope sample (§5.2.b)
  const recommendedScopeSize = form.totalMethods && form.numberOfAssessmentsInCycle
    ? Math.ceil(parseInt(form.totalMethods) / parseInt(form.numberOfAssessmentsInCycle))
    : null;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800 border-gray-300", label: "Brouillon" },
      SUBMITTED_TO_CD: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "En attente CD" },
      CD_APPROVED: { color: "bg-green-100 text-green-800 border-green-300", label: "Approuvé" },
      CD_CHANGES_REQUESTED: { color: "bg-amber-100 text-amber-800 border-amber-300", label: "Modifications demandées" },
      APPLIED: { color: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "Appliqué" },
      SUPERSEDED: { color: "bg-purple-100 text-purple-800 border-purple-300", label: "Remplacé" },
      ARCHIVED: { color: "bg-slate-100 text-slate-600 border-slate-300", label: "Archivé" },
    };
    const s = map[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return <Badge variant="outline" className={`${s.color} text-xs`}>{s.label}</Badge>;
  };

  const getAssessmentTypeLabel = (type: string | undefined) => {
    const labels: Record<string, string> = {
      INITIAL: "Initiale", SURVEILLANCE: "Surveillance",
      RENOUVELLEMENT: "Renouvellement", EXTENSION: "Extension"
    };
    return labels[type || ""] || type || "—";
  };

  const getPlanTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      LABORATORY: "Laboratoire", INSPECTION: "Inspection",
      MEDICAL_LAB: "Labo. médical", CALIBRATION: "Étalonnage"
    };
    return labels[type] || type;
  };

  const openDetail = (plan: SamplingPlan) => {
    setSelectedPlan(plan);
    setShowDetail(true);
  };

  const openReview = (plan: SamplingPlan) => {
    setSelectedPlan(plan);
    setReviewForm({ approved: true, comments: "" });
    setShowReview(true);
  };

  // Step labels for create wizard
  const steps = [
    { label: "Portée", icon: FlaskConical },
    { label: "Sites", icon: Building2 },
    { label: "Personnel", icon: Users },
    { label: "Risques & Justification", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Beaker className="w-6 h-6 text-primary" />
                Échantillonnage — PRO 13-1
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Plans d'échantillonnage pour les évaluations de laboratoires et d'inspection
              </p>
            </div>
            <Button onClick={() => { setForm({ ...defaultForm }); setFormStep(0); setShowCreate(true); }}>
              <Plus className="w-4 h-4 mr-2" />Nouveau plan
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("draft")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Clock className="w-5 h-5 text-gray-600" /></div>
                <div><p className="text-2xl font-bold">{draftCount}</p><p className="text-xs text-muted-foreground">Brouillons</p></div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("pending")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100"><Send className="w-5 h-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">En attente CD</p></div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("approved")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                <div><p className="text-2xl font-bold">{approvedCount}</p><p className="text-xs text-muted-foreground">Approuvés</p></div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("applied")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100"><Target className="w-5 h-5 text-emerald-600" /></div>
                <div><p className="text-2xl font-bold">{appliedCount}</p><p className="text-xs text-muted-foreground">Appliqués</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs + Search */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Plans d'échantillonnage ({filteredPlans.length})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Tous ({plans.length})</TabsTrigger>
                  <TabsTrigger value="draft">Brouillons ({draftCount})</TabsTrigger>
                  <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
                  <TabsTrigger value="approved">Approuvés ({approvedCount})</TabsTrigger>
                  <TabsTrigger value="applied">Appliqués/Archivés</TabsTrigger>
                </TabsList>

                {loading ? (
                  <p className="text-muted-foreground text-center py-12">Chargement...</p>
                ) : filteredPlans.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Beaker className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Aucun plan d'échantillonnage</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Demande</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Évaluation</TableHead>
                        <TableHead>Portée</TableHead>
                        <TableHead>Sites</TableHead>
                        <TableHead>Personnel</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlans.map((p) => (
                        <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openDetail(p)}>
                          <TableCell className="font-mono text-xs font-medium">{p.planCode}</TableCell>
                          <TableCell className="text-xs">{p.request?.referenceNumber || "—"}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{getPlanTypeLabel(p.planType)}</Badge></TableCell>
                          <TableCell className="text-xs">{getAssessmentTypeLabel(p.assessmentType)}</TableCell>
                          <TableCell className="text-xs font-medium">
                            {p.selectedMethodsCount != null && p.totalMethodsInScope != null
                              ? `${p.selectedMethodsCount}/${p.totalMethodsInScope}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {p.selectedSitesCount != null && p.totalSitesInScope != null
                              ? `${p.selectedSitesCount}/${p.totalSitesInScope}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {p.selectedPersonnelCount != null && p.totalPersonnelCount != null
                              ? `${p.selectedPersonnelCount}/${p.totalPersonnelCount}`
                              : "—"}
                          </TableCell>
                          <TableCell>{getStatusBadge(p.status)}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1 justify-end">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8"
                                      onClick={() => openDetail(p)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Voir les détails</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {(p.status === "DRAFT" || p.status === "CD_CHANGES_REQUESTED") && (
                                <Button size="sm" variant="outline" onClick={() => handleSubmit(p.id)}>
                                  <Send className="w-3 h-3 mr-1" />Soumettre
                                </Button>
                              )}
                              {p.status === "SUBMITTED_TO_CD" && (
                                <Button size="sm" onClick={() => openReview(p)}>
                                  <FileSearch className="w-3 h-3 mr-1" />Examiner
                                </Button>
                              )}
                              {p.status === "CD_APPROVED" && (
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleApply(p.id)}>
                                  <Target className="w-3 h-3 mr-1" />Appliquer
                                </Button>
                              )}
                              {(p.status === "APPLIED" || p.status === "SUPERSEDED") && (
                                <Button size="sm" variant="outline" onClick={() => handleArchive(p.id)}>
                                  <Archive className="w-3 h-3 mr-1" />Archiver
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {/* ===== CREATE DIALOG - Multi-step wizard ===== */}
          <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); setFormStep(0); } }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Beaker className="w-5 h-5" />Nouveau plan d'échantillonnage
                </DialogTitle>
                <DialogDescription>Définir l'échantillonnage des méthodes, sites et personnel — PRO 13-1</DialogDescription>
              </DialogHeader>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-4">
                {steps.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button key={i} onClick={() => setFormStep(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        formStep === i
                          ? "bg-primary text-primary-foreground"
                          : formStep > i
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                      }`}>
                      <Icon className="w-3.5 h-3.5" />
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Common fields */}
              {formStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>N° de demande <span className="text-red-500">*</span></Label>
                      <Input type="number" value={form.requestId}
                        onChange={(e) => setForm({...form, requestId: e.target.value})}
                        placeholder="ID de la demande" />
                    </div>
                    <div>
                      <Label>Type de plan</Label>
                      <Select value={form.planType} onValueChange={(v) => setForm({...form, planType: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LABORATORY">Laboratoire d'essais</SelectItem>
                          <SelectItem value="INSPECTION">Organisme d'inspection</SelectItem>
                          <SelectItem value="MEDICAL_LAB">Laboratoire médical</SelectItem>
                          <SelectItem value="CALIBRATION">Laboratoire d'étalonnage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />Échantillonnage de la portée (§5.1.b / §5.2.b)
                  </h3>

                  <div>
                    <Label>Méthodologie d'échantillonnage</Label>
                    <Textarea value={form.methodology}
                      onChange={(e) => setForm({...form, methodology: e.target.value})}
                      placeholder="Décrire l'approche d'échantillonnage (aléatoire, stratifiée, basée sur le risque...)" rows={3} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre total de méthodes dans la portée</Label>
                      <Input type="number" value={form.totalMethods}
                        onChange={(e) => setForm({...form, totalMethods: e.target.value})} />
                    </div>
                    <div>
                      <Label>Méthodes sélectionnées pour évaluation</Label>
                      <Input type="number" value={form.selectedMethods}
                        onChange={(e) => setForm({...form, selectedMethods: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nb d'évaluations dans le cycle</Label>
                      <Input type="number" value={form.numberOfAssessmentsInCycle}
                        onChange={(e) => setForm({...form, numberOfAssessmentsInCycle: e.target.value})}
                        placeholder="Ex: 4 (pour un cycle de 4 ans)" />
                    </div>
                    <div>
                      <Label>Durée du cycle (années)</Label>
                      <Input type="number" value={form.accreditationCycleYears}
                        onChange={(e) => setForm({...form, accreditationCycleYears: e.target.value})}
                        placeholder="Ex: 4 ou 5" />
                    </div>
                  </div>

                  {/* Auto-calculated recommendation */}
                  {recommendedScopeSize !== null && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <Calculator className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        <strong>Taille recommandée</strong> (§5.2.b) : {recommendedScopeSize} méthodes/an
                        <span className="text-blue-600 ml-1">({form.totalMethods} ÷ {form.numberOfAssessmentsInCycle})</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>Détail des méthodes sélectionnées</Label>
                    <Textarea value={form.selectedMethodsDetail}
                      onChange={(e) => setForm({...form, selectedMethodsDetail: e.target.value})}
                      placeholder="Liste des méthodes: NF EN ISO ..., NF EN ... (une par ligne)" rows={3} />
                  </div>
                </div>
              )}

              {/* Step 2: Sites */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" />Échantillonnage des sites (§5.1.a / §5.2.a)
                  </h3>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <strong>§5.1.a :</strong> En évaluation initiale, tous les sites sont évalués.
                    <br /><strong>§5.2.a :</strong> En surveillance, l'échantillonnage est basé sur l'analyse des risques. Le siège est systématiquement évalué.
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre total de sites</Label>
                      <Input type="number" value={form.totalSites}
                        onChange={(e) => setForm({...form, totalSites: e.target.value})} />
                    </div>
                    <div>
                      <Label>Sites sélectionnés pour évaluation</Label>
                      <Input type="number" value={form.selectedSites}
                        onChange={(e) => setForm({...form, selectedSites: e.target.value})} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch checked={form.headquartersIncluded}
                      onCheckedChange={(v) => setForm({...form, headquartersIncluded: v})} />
                    <Label className="cursor-pointer">Siège (siège social) inclus dans l'évaluation</Label>
                    {!form.headquartersIncluded && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />Requis en surveillance
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label>Détail des sites sélectionnés</Label>
                    <Textarea value={form.selectedSitesDetail}
                      onChange={(e) => setForm({...form, selectedSitesDetail: e.target.value})}
                      placeholder="Siège: Alger..., Site 1: Oran..., Site client: ..." rows={4} />
                  </div>
                </div>
              )}

              {/* Step 3: Personnel */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />Échantillonnage du personnel (§5.1.c / §5.2.c)
                  </h3>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <strong>§5.1.c :</strong> Tous les dossiers de compétence sont examinés. Sélection représentative des signataires et du personnel.
                    <br /><strong>§5.2.c :</strong> Prendre en compte le domaine technique, les audits internes, les nouvelles recrues et habilitations.
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Personnel total de l'OEC</Label>
                      <Input type="number" value={form.totalPersonnelCount}
                        onChange={(e) => setForm({...form, totalPersonnelCount: e.target.value})} />
                    </div>
                    <div>
                      <Label>Personnel sélectionné pour évaluation</Label>
                      <Input type="number" value={form.selectedPersonnelCount}
                        onChange={(e) => setForm({...form, selectedPersonnelCount: e.target.value})} />
                    </div>
                  </div>

                  <Separator />
                  <p className="text-xs text-muted-foreground font-medium">Détail par catégorie</p>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Signataires (total)</Label>
                      <Input type="number" value={form.totalSignatories}
                        onChange={(e) => setForm({...form, totalSignatories: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Signataires (sélectionnés)</Label>
                      <Input type="number" value={form.selectedSignatories}
                        onChange={(e) => setForm({...form, selectedSignatories: e.target.value})} />
                    </div>
                    <div></div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Inspecteurs (total)</Label>
                      <Input type="number" value={form.totalInspectors}
                        onChange={(e) => setForm({...form, totalInspectors: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Inspecteurs (sélectionnés)</Label>
                      <Input type="number" value={form.selectedInspectors}
                        onChange={(e) => setForm({...form, selectedInspectors: e.target.value})} />
                    </div>
                    <div></div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Techniciens (total)</Label>
                      <Input type="number" value={form.totalTechnicians}
                        onChange={(e) => setForm({...form, totalTechnicians: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Techniciens (sélectionnés)</Label>
                      <Input type="number" value={form.selectedTechnicians}
                        onChange={(e) => setForm({...form, selectedTechnicians: e.target.value})} />
                    </div>
                    <div></div>
                  </div>

                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch checked={form.allCompetenceFilesReviewed}
                        onCheckedChange={(v) => setForm({...form, allCompetenceFilesReviewed: v})} />
                      <Label className="text-sm cursor-pointer">Tous les dossiers de compétence examinés (§5.1.c)</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={form.newRecruitsIncluded}
                        onCheckedChange={(v) => setForm({...form, newRecruitsIncluded: v})} />
                      <Label className="text-sm cursor-pointer">Nouvelles recrues incluses (§5.2.c)</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={form.newClearancesIncluded}
                        onCheckedChange={(v) => setForm({...form, newClearancesIncluded: v})} />
                      <Label className="text-sm cursor-pointer">Nouvelles habilitations incluses (§5.2.c)</Label>
                    </div>
                  </div>

                  <div>
                    <Label>Détail du personnel sélectionné</Label>
                    <Textarea value={form.selectedPersonnel}
                      onChange={(e) => setForm({...form, selectedPersonnel: e.target.value})}
                      placeholder="Nom, rôle, site d'affectation... (un par ligne)" rows={3} />
                  </div>
                </div>
              )}

              {/* Step 4: Risk & Justification */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />Analyse de risque et justification (§5.3)
                  </h3>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <strong>§5.3 :</strong> ALGERAC peut modifier ou augmenter la taille de l'échantillon en fonction des risques identifiés.
                    Le plan ne peut être élaboré sans une analyse de risque.
                  </div>

                  <div>
                    <Label>Critères de sélection</Label>
                    <Textarea value={form.selectionCriteria}
                      onChange={(e) => setForm({...form, selectionCriteria: e.target.value})}
                      placeholder="Critères ayant guidé la sélection de l'échantillon..." rows={3} />
                  </div>
                  <div>
                    <Label>Facteurs de risque identifiés</Label>
                    <Textarea value={form.riskFactors}
                      onChange={(e) => setForm({...form, riskFactors: e.target.value})}
                      placeholder="Risques identifiés (plaintes, écarts précédents, changements, ...)" rows={3} />
                  </div>
                  <div>
                    <Label>Notes d'analyse de risque</Label>
                    <Textarea value={form.riskAnalysisNotes}
                      onChange={(e) => setForm({...form, riskAnalysisNotes: e.target.value})}
                      placeholder="Détail de l'analyse de risque ayant conduit à l'échantillonnage retenu..." rows={3} />
                  </div>
                  <div>
                    <Label>Justification de l'échantillon</Label>
                    <Textarea value={form.justification}
                      onChange={(e) => setForm({...form, justification: e.target.value})}
                      placeholder="Justifier la taille et la composition de l'échantillon..." rows={3} />
                  </div>

                  <Separator />
                  <p className="text-xs text-muted-foreground font-medium">Références historiques (§5.2.b/c)</p>

                  <div>
                    <Label>Résultats des audits internes</Label>
                    <Textarea value={form.internalAuditResults}
                      onChange={(e) => setForm({...form, internalAuditResults: e.target.value})}
                      placeholder="Résumé des constats d'audit interne pertinents..." rows={2} />
                  </div>
                  <div>
                    <Label>Résultats de la revue de direction</Label>
                    <Textarea value={form.managementReviewResults}
                      onChange={(e) => setForm({...form, managementReviewResults: e.target.value})}
                      placeholder="Points issus de la revue de direction..." rows={2} />
                  </div>
                  <div>
                    <Label>Historique des écarts</Label>
                    <Textarea value={form.findingsHistory}
                      onChange={(e) => setForm({...form, findingsHistory: e.target.value})}
                      placeholder="Écarts relevés lors des évaluations précédentes..." rows={2} />
                  </div>

                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch checked={form.coversAllDomains}
                        onCheckedChange={(v) => setForm({...form, coversAllDomains: v})} />
                      <Label className="text-sm cursor-pointer">L'échantillon couvre tous les domaines techniques</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={form.coversKeyPersonnel}
                        onCheckedChange={(v) => setForm({...form, coversKeyPersonnel: v})} />
                      <Label className="text-sm cursor-pointer">Le personnel clé est couvert</Label>
                    </div>
                    <div>
                      <Label>Notes de couverture</Label>
                      <Textarea value={form.coverageNotes}
                        onChange={(e) => setForm({...form, coverageNotes: e.target.value})}
                        placeholder="Notes additionnelles sur la couverture de l'échantillon..." rows={2} />
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex justify-between sm:justify-between">
                <div>
                  {formStep > 0 && (
                    <Button variant="outline" onClick={() => setFormStep(formStep - 1)}>
                      <ChevronUp className="w-4 h-4 mr-1" />Précédent
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setShowCreate(false); setFormStep(0); }}>Annuler</Button>
                  {formStep < steps.length - 1 ? (
                    <Button onClick={() => setFormStep(formStep + 1)}>
                      Suivant<ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={handleCreate} disabled={!form.requestId}>
                      <CheckCircle className="w-4 h-4 mr-1" />Créer le plan
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ===== DETAIL DIALOG ===== */}
          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              {selectedPlan && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      Plan {selectedPlan.planCode}
                      <span className="ml-2">{getStatusBadge(selectedPlan.status)}</span>
                    </DialogTitle>
                    <DialogDescription>
                      {selectedPlan.request?.referenceNumber && `Demande: ${selectedPlan.request.referenceNumber}`}
                      {selectedPlan.request?.domain && ` — ${selectedPlan.request.domain}`}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Type de plan</p>
                      <p className="font-medium">{getPlanTypeLabel(selectedPlan.planType)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Type d'évaluation</p>
                      <p className="font-medium">{getAssessmentTypeLabel(selectedPlan.assessmentType)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Créé par</p>
                      <p className="font-medium">{selectedPlan.createdBy?.fullName || "—"}</p>
                    </div>
                  </div>

                  {/* Scope section */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <FlaskConical className="w-4 h-4" />Portée
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Méthodes sélectionnées:</span>
                        <span className="ml-2 font-medium">
                          {selectedPlan.selectedMethodsCount ?? "—"} / {selectedPlan.totalMethodsInScope ?? "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Cycle:</span>
                        <span className="ml-2 font-medium">
                          {selectedPlan.accreditationCycleYears ?? "—"} ans, {selectedPlan.numberOfAssessmentsInCycle ?? "—"} éval.
                        </span>
                      </div>
                    </div>
                    {selectedPlan.methodology && (
                      <div className="text-sm p-3 rounded bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Méthodologie</p>
                        <p className="whitespace-pre-wrap">{selectedPlan.methodology}</p>
                      </div>
                    )}
                    {selectedPlan.selectedMethods && (
                      <div className="text-sm p-3 rounded bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Méthodes sélectionnées</p>
                        <p className="whitespace-pre-wrap">{selectedPlan.selectedMethods}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Sites section */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4" />Sites
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Sites sélectionnés:</span>
                        <span className="ml-2 font-medium">
                          {selectedPlan.selectedSitesCount ?? "—"} / {selectedPlan.totalSitesInScope ?? "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Siège inclus:</span>
                        <span className="ml-2">
                          {selectedPlan.headquartersIncluded
                            ? <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">Oui</Badge>
                            : <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">Non</Badge>}
                        </span>
                      </div>
                    </div>
                    {selectedPlan.selectedSites && (
                      <div className="text-sm p-3 rounded bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Détail des sites</p>
                        <p className="whitespace-pre-wrap">{selectedPlan.selectedSites}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Personnel section */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />Personnel
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="p-2 rounded bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold">{selectedPlan.selectedPersonnelCount ?? "—"}/{selectedPlan.totalPersonnelCount ?? "—"}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground">Signataires</p>
                        <p className="font-bold">{selectedPlan.selectedSignatories ?? "—"}/{selectedPlan.totalSignatories ?? "—"}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground">Inspecteurs</p>
                        <p className="font-bold">{selectedPlan.selectedInspectors ?? "—"}/{selectedPlan.totalInspectors ?? "—"}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground">Techniciens</p>
                        <p className="font-bold">{selectedPlan.selectedTechnicians ?? "—"}/{selectedPlan.totalTechnicians ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-wrap text-xs">
                      {selectedPlan.allCompetenceFilesReviewed && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">Dossiers de compétence examinés</Badge>
                      )}
                      {selectedPlan.newRecruitsIncluded && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Nouvelles recrues incluses</Badge>
                      )}
                      {selectedPlan.newClearancesIncluded && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Nouvelles habilitations incluses</Badge>
                      )}
                    </div>
                    {selectedPlan.selectedPersonnel && (
                      <div className="text-sm p-3 rounded bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Détail du personnel</p>
                        <p className="whitespace-pre-wrap">{selectedPlan.selectedPersonnel}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Risk & Justification */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />Risques & Justification
                    </h4>
                    {selectedPlan.riskFactors && (
                      <div className="text-sm p-3 rounded bg-red-50/50">
                        <p className="text-xs text-muted-foreground mb-1">Facteurs de risque</p>
                        <p className="whitespace-pre-wrap">{selectedPlan.riskFactors}</p>
                      </div>
                    )}
                    {selectedPlan.riskAnalysisNotes && (
                      <div className="text-sm p-3 rounded bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Analyse de risque</p>
                        <p className="whitespace-pre-wrap">{selectedPlan.riskAnalysisNotes}</p>
                      </div>
                    )}
                    {selectedPlan.justification && (
                      <div className="text-sm p-3 rounded bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Justification</p>
                        <p className="whitespace-pre-wrap">{selectedPlan.justification}</p>
                      </div>
                    )}
                    {selectedPlan.selectionCriteria && (
                      <div className="text-sm p-3 rounded bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Critères de sélection</p>
                        <p className="whitespace-pre-wrap">{selectedPlan.selectionCriteria}</p>
                      </div>
                    )}
                  </div>

                  {/* Historical */}
                  {(selectedPlan.internalAuditResults || selectedPlan.managementReviewResults || selectedPlan.findingsHistory) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Références historiques</h4>
                        {selectedPlan.internalAuditResults && (
                          <div className="text-sm p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">Audits internes</p>
                            <p className="whitespace-pre-wrap">{selectedPlan.internalAuditResults}</p>
                          </div>
                        )}
                        {selectedPlan.managementReviewResults && (
                          <div className="text-sm p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">Revue de direction</p>
                            <p className="whitespace-pre-wrap">{selectedPlan.managementReviewResults}</p>
                          </div>
                        )}
                        {selectedPlan.findingsHistory && (
                          <div className="text-sm p-3 rounded bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">Historique des écarts</p>
                            <p className="whitespace-pre-wrap">{selectedPlan.findingsHistory}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Approval info */}
                  {selectedPlan.approvalComments && (
                    <>
                      <Separator />
                      <div className="p-3 rounded bg-muted/30 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">
                          Commentaires {selectedPlan.approvedBy ? `de ${selectedPlan.approvedBy.fullName}` : "du CD"}
                          {selectedPlan.approvalDate && ` — ${new Date(selectedPlan.approvalDate).toLocaleDateString("fr-FR")}`}
                        </p>
                        <p className="whitespace-pre-wrap">{selectedPlan.approvalComments}</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* ===== REVIEW DIALOG ===== */}
          <Dialog open={showReview} onOpenChange={setShowReview}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              {selectedPlan && (
                <>
                  <DialogHeader>
                    <DialogTitle>Examiner le plan {selectedPlan.planCode}</DialogTitle>
                    <DialogDescription>
                      {selectedPlan.request?.referenceNumber && `Demande: ${selectedPlan.request.referenceNumber}`}
                      {" — "}{getPlanTypeLabel(selectedPlan.planType)}
                      {" — "}{getAssessmentTypeLabel(selectedPlan.assessmentType)}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Summary for reviewer */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-3 rounded-lg border text-center">
                      <FlaskConical className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Portée</p>
                      <p className="font-bold">{selectedPlan.selectedMethodsCount ?? "—"}/{selectedPlan.totalMethodsInScope ?? "—"}</p>
                    </div>
                    <div className="p-3 rounded-lg border text-center">
                      <Building2 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Sites</p>
                      <p className="font-bold">{selectedPlan.selectedSitesCount ?? "—"}/{selectedPlan.totalSitesInScope ?? "—"}</p>
                      {selectedPlan.headquartersIncluded && (
                        <p className="text-xs text-green-600">Siège inclus</p>
                      )}
                    </div>
                    <div className="p-3 rounded-lg border text-center">
                      <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Personnel</p>
                      <p className="font-bold">{selectedPlan.selectedPersonnelCount ?? "—"}/{selectedPlan.totalPersonnelCount ?? "—"}</p>
                    </div>
                  </div>

                  {selectedPlan.methodology && (
                    <div className="text-sm p-3 rounded bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Méthodologie</p>
                      <p className="whitespace-pre-wrap line-clamp-4">{selectedPlan.methodology}</p>
                    </div>
                  )}
                  {selectedPlan.justification && (
                    <div className="text-sm p-3 rounded bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Justification</p>
                      <p className="whitespace-pre-wrap line-clamp-4">{selectedPlan.justification}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label>Décision</Label>
                      <Select value={reviewForm.approved ? "true" : "false"}
                        onValueChange={(v) => setReviewForm({...reviewForm, approved: v === "true"})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">
                            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />Approuver</span>
                          </SelectItem>
                          <SelectItem value="false">
                            <span className="flex items-center gap-2"><XCircle className="w-4 h-4 text-amber-600" />Demander des modifications</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Commentaires {!reviewForm.approved && <span className="text-red-500">*</span>}</Label>
                      <Textarea value={reviewForm.comments}
                        onChange={(e) => setReviewForm({...reviewForm, comments: e.target.value})}
                        placeholder={reviewForm.approved
                          ? "Commentaires optionnels..."
                          : "Préciser les modifications demandées..."
                        } rows={4} />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowReview(false)}>Annuler</Button>
                    <Button onClick={handleReview}
                      disabled={!reviewForm.approved && !reviewForm.comments}
                      className={reviewForm.approved ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}>
                      {reviewForm.approved
                        ? <><CheckCircle className="w-4 h-4 mr-1" />Approuver</>
                        : <><XCircle className="w-4 h-4 mr-1" />Demander modifications</>}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
