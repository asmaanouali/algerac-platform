import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  ShieldAlert, Plus, AlertTriangle, TrendingUp, Clock, Lightbulb,
  Send, CheckCircle, Play, Eye, X, FileText, Search, Download,
  XCircle, AlertCircle, RotateCcw
} from "lucide-react";

interface RiskEntry {
  id: number;
  registerCode: string;
  type: string;
  title: string;
  description: string;
  category: string;
  source: string;
  likelihood: string | null;
  impact: string | null;
  level: string | null;
  mitigationActions: string | null;
  actionPlan: string | null;
  actionDeadline: string | null;
  actionProgress: string | null;
  status: string;
  ownerDepartment: string;
  residualDocControl: string | null;
  residualCompetence: string | null;
  residualControlLevel: string | null;
  residualMastery: string | null;
  residualRiskNotes: string | null;
  reviewNotes: string | null;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  submittedAt: string | null;
  validatedAt: string | null;
  createdAt: string;
  owner?: { fullName: string } | null;
  submittedBy?: { fullName: string } | null;
  validatedBy?: { fullName: string } | null;
}

const CATEGORIES: Record<string, string> = {
  MINISTRY: "Ministère et organismes",
  BOARD: "Conseil d'administration",
  CAS: "Comités d'accréditation spécialisés",
  STAFF: "Personnel d'ALGERAC",
  APPEALS: "Commission de recours",
  ASSESSORS: "Évaluateurs et experts",
  ASSESSMENTS: "Évaluations",
  TRAINING: "Formations",
  OEC_OPERATIONS: "Fonctionnement des OEC",
  IMPARTIALITY: "Impartialité",
  OTHER: "Autre",
};

const LIKELIHOODS: Record<string, string> = {
  UNLIKELY: "Peu Probable (1)",
  PROBABLE: "Probable (2)",
  ALMOST_CERTAIN: "Presque Certain (3)",
};

const IMPACTS: Record<string, string> = {
  INSIGNIFICANT: "Insignifiant (1)",
  MODERATE: "Modéré (2)",
  SEVERE: "Grave (3)",
};

const STATUSES: Record<string, { label: string; color: string }> = {
  IDENTIFIED: { label: "Identifié", color: "bg-blue-100 text-blue-800" },
  ANALYZED: { label: "Analysé", color: "bg-purple-100 text-purple-800" },
  PENDING_VALIDATION: { label: "En attente DG", color: "bg-amber-100 text-amber-800" },
  VALIDATED: { label: "Validé DG", color: "bg-indigo-100 text-indigo-800" },
  IN_TREATMENT: { label: "En traitement", color: "bg-orange-100 text-orange-800" },
  MONITORED: { label: "Suivi", color: "bg-teal-100 text-teal-800" },
  CLOSED: { label: "Clôturé", color: "bg-gray-100 text-gray-800" },
};

const LEVELS: Record<string, { label: string; color: string }> = {
  LOW: { label: "L — Faible", color: "bg-green-100 text-green-800" },
  MEDIUM: { label: "M — Modéré", color: "bg-yellow-100 text-yellow-800" },
  HIGH: { label: "H — Élevé", color: "bg-red-100 text-red-800" },
};

const MASTERY_OPTIONS: Record<string, string> = {
  GOOD: "Bonne maîtrise",
  PARTIAL: "Maîtrise partielle",
  INSUFFICIENT: "Maîtrise insuffisante",
};

export default function RiskOpportunityPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = ((user as any)?.role || "").toUpperCase();

  const canIdentify = ["RQ", "CD", "DT", "ADMIN"].includes(role);
  const canAnalyze = ["RQ", "CD", "DT", "ADMIN"].includes(role);
  const canSubmitDG = ["RQ", "ADMIN"].includes(role);
  const canValidate = ["DG", "ADMIN"].includes(role);
  const canTreat = ["RQ", "ADMIN"].includes(role);
  const canMonitor = ["RQ", "CD", "DT", "ADMIN"].includes(role);
  const canClose = ["RQ", "DG", "ADMIN"].includes(role);

  const [entries, setEntries] = useState<RiskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [showTreatment, setShowTreatment] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showValidateConfirm, setShowValidateConfirm] = useState(false);
  const [selected, setSelected] = useState<RiskEntry | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    type: "RISK", title: "", description: "", category: "ASSESSMENTS", source: "", department: ""
  });
  const [analyzeForm, setAnalyzeForm] = useState({
    likelihood: "PROBABLE", impact: "MODERATE",
    residualDocControl: "", residualCompetence: "", residualControlLevel: "", residualMastery: "GOOD"
  });
  const [treatForm, setTreatForm] = useState({ mitigationActions: "", actionPlan: "", deadline: "" });
  const [monitorForm, setMonitorForm] = useState({ reviewNotes: "", actionProgress: "", nextReview: "" });
  const [rejectNotes, setRejectNotes] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    try {
      const res = await fetch("/api/risks", { credentials: "include" });
      const data = await res.json();
      setEntries(data.data || []);
    } catch { setEntries([]); }
    setLoading(false);
  };

  // Filter logic
  const filterData = (data: RiskEntry[]) => {
    return data.filter(e => {
      const matchSearch = !searchQuery || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.registerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLevel = filterLevel === "ALL" || e.level === filterLevel;
      const matchStatus = filterStatus === "ALL" || e.status === filterStatus;
      return matchSearch && matchLevel && matchStatus;
    });
  };

  // §5.1 Identifier
  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      toast({ title: "Erreur", description: "Le titre est obligatoire", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", "/api/risks", createForm);
      toast({ title: "Risque/Opportunité identifié(e)" });
      setShowCreate(false);
      setCreateForm({ type: "RISK", title: "", description: "", category: "ASSESSMENTS", source: "", department: "" });
      loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // §5.2 Analyser
  const handleAnalyze = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/risks/${selected.id}/analyze`, analyzeForm);
      toast({ title: "Analyse FOR 77 enregistrée" });
      setShowAnalyze(false);
      loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // §5.3 Soumettre à DG
  const handleSubmitDG = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/risks/${id}/submit-dg`, {});
      toast({ title: "Soumis à la DG pour vérification" });
      loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // §5.4 Valider par DG
  const handleValidate = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/risks/${selected.id}/validate`, {});
      toast({ title: "Validé par la Direction Générale" });
      setShowValidateConfirm(false);
      setSelected(null);
      loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // §5.4 DG Rejeter
  const handleReject = async () => {
    if (!selected) return;
    if (!rejectNotes.trim()) {
      toast({ title: "Erreur", description: "Les notes de rejet sont obligatoires", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("PUT", `/api/risks/${selected.id}/reject`, { rejectionNotes: rejectNotes });
      toast({ title: "Rejeté — renvoyé pour révision" });
      setShowReject(false);
      setRejectNotes("");
      setSelected(null);
      loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // §5.4 Traitement
  const handleTreatment = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/risks/${selected.id}/start-treatment`, treatForm);
      toast({ title: "Plan d'action mis en œuvre" });
      setShowTreatment(false);
      loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // §5.5 Suivi
  const handleMonitor = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/risks/${selected.id}/monitor`, monitorForm);
      toast({ title: "Suivi enregistré" });
      setShowMonitor(false);
      loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // Clôturer with confirmation
  const handleClose = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/risks/${selected.id}/close`, { residualNotes: closeNotes });
      toast({ title: "Clôturé" });
      setShowClose(false);
      setCloseNotes("");
      setSelected(null);
      loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["Code", "Type", "Titre", "Domaine", "Vraisemblance", "Conséquence", "Niveau", "Statut", "Département", "Maîtrise", "Créé le"];
    const rows = entries.map(e => [
      e.registerCode,
      e.type === "RISK" ? "Risque" : "Opportunité",
      `"${e.title.replace(/"/g, '""')}"`,
      CATEGORIES[e.category] || e.category,
      LIKELIHOODS[e.likelihood || ""] || "",
      IMPACTS[e.impact || ""] || "",
      LEVELS[e.level || ""]?.label || "",
      STATUSES[e.status]?.label || e.status,
      e.ownerDepartment || "",
      MASTERY_OPTIONS[e.residualMastery || ""] || "",
      e.createdAt ? new Date(e.createdAt).toLocaleDateString("fr-FR") : ""
    ]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registre-risques-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const risks = entries.filter(e => e.type === "RISK");
  const opps = entries.filter(e => e.type === "OPPORTUNITY");
  const overdueCount = entries.filter(e => e.nextReviewDate && new Date(e.nextReviewDate) < new Date()).length;
  const overdueActionCount = entries.filter(e => e.actionDeadline && new Date(e.actionDeadline) < new Date() && e.status === "IN_TREATMENT").length;

  // Risk matrix counts
  const matrixCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const likelihoods = ["UNLIKELY", "PROBABLE", "ALMOST_CERTAIN"];
    const impacts = ["INSIGNIFICANT", "MODERATE", "SEVERE"];
    for (const l of likelihoods) {
      for (const i of impacts) {
        counts[`${l}_${i}`] = entries.filter(e => e.likelihood === l && e.impact === i).length;
      }
    }
    return counts;
  }, [entries]);

  const isOverdue = (e: RiskEntry) => e.nextReviewDate && new Date(e.nextReviewDate) < new Date();
  const isActionOverdue = (e: RiskEntry) => e.actionDeadline && new Date(e.actionDeadline) < new Date() && e.status === "IN_TREATMENT";

  const renderActions = (e: RiskEntry) => (
    <div className="flex gap-1 justify-end flex-wrap">
      <Button size="sm" variant="ghost" onClick={() => { setSelected(e); setShowDetail(true); }}>
        <Eye className="w-3 h-3" />
      </Button>
      {(e.status === "IDENTIFIED" || e.status === "ANALYZED") && canAnalyze && (
        <Button size="sm" variant="outline" onClick={() => {
          setSelected(e);
          setAnalyzeForm({
            likelihood: e.likelihood || "PROBABLE",
            impact: e.impact || "MODERATE",
            residualDocControl: e.residualDocControl || "",
            residualCompetence: e.residualCompetence || "",
            residualControlLevel: e.residualControlLevel || "",
            residualMastery: e.residualMastery || "GOOD"
          });
          setShowAnalyze(true);
        }}>
          {e.status === "ANALYZED" ? <><RotateCcw className="w-3 h-3 mr-1" />Ré-analyser</> : "Analyser"}
        </Button>
      )}
      {e.status === "ANALYZED" && canSubmitDG && (
        <Button size="sm" onClick={() => handleSubmitDG(e.id)}>
          <Send className="w-3 h-3 mr-1" />Soumettre DG
        </Button>
      )}
      {e.status === "PENDING_VALIDATION" && canValidate && (
        <>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => {
            setSelected(e);
            setShowValidateConfirm(true);
          }}>
            <CheckCircle className="w-3 h-3 mr-1" />Valider
          </Button>
          <Button size="sm" variant="destructive" onClick={() => {
            setSelected(e);
            setRejectNotes("");
            setShowReject(true);
          }}>
            <XCircle className="w-3 h-3 mr-1" />Rejeter
          </Button>
        </>
      )}
      {e.status === "VALIDATED" && canTreat && (
        <Button size="sm" variant="outline" onClick={() => {
          setSelected(e);
          setTreatForm({ mitigationActions: "", actionPlan: "", deadline: "" });
          setShowTreatment(true);
        }}><Play className="w-3 h-3 mr-1" />Traiter</Button>
      )}
      {(e.status === "IN_TREATMENT" || e.status === "MONITORED") && canMonitor && (
        <Button size="sm" variant="outline" onClick={() => {
          setSelected(e);
          setMonitorForm({ reviewNotes: "", actionProgress: "", nextReview: "" });
          setShowMonitor(true);
        }}>Suivi</Button>
      )}
      {["IN_TREATMENT", "MONITORED"].includes(e.status) && canClose && (
        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => {
          setSelected(e);
          setCloseNotes("");
          setShowClose(true);
        }}>
          <X className="w-3 h-3 mr-1" />Clôturer
        </Button>
      )}
    </div>
  );

  const renderTable = (data: RiskEntry[]) => {
    const filtered = filterData(data);
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Domaine</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun enregistrement</TableCell></TableRow>
              ) : filtered.map(e => (
                <TableRow key={e.id} className={isOverdue(e) || isActionOverdue(e) ? "bg-red-50" : ""}>
                  <TableCell className="font-mono text-sm">{e.registerCode}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    <div className="flex items-center gap-1">
                      {e.title}
                      {isOverdue(e) && <AlertCircle className="w-3 h-3 text-red-500 shrink-0" title="Revue en retard" />}
                      {isActionOverdue(e) && <Clock className="w-3 h-3 text-orange-500 shrink-0" title="Action en retard" />}
                      {e.reviewNotes && e.status === "ANALYZED" && <RotateCcw className="w-3 h-3 text-amber-500 shrink-0" title="Rejeté par DG" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{CATEGORIES[e.category] || e.category}</TableCell>
                  <TableCell>
                    {e.level ? <Badge className={LEVELS[e.level]?.color || "bg-gray-100"}>{LEVELS[e.level]?.label || e.level}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell><Badge className={STATUSES[e.status]?.color || "bg-gray-100"}>{STATUSES[e.status]?.label || e.status}</Badge></TableCell>
                  <TableCell className="text-right">{renderActions(e)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-primary" />
                Risques & Opportunités — PRO 30
              </h1>
              <p className="text-muted-foreground">
                Matrice FOR 77 — Gestion des risques et opportunités
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />Exporter CSV
              </Button>
              {canIdentify && (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 mr-2" />Identifier
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{risks.length}</p>
                  <p className="text-xs text-muted-foreground">Risques</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{opps.length}</p>
                  <p className="text-xs text-muted-foreground">Opportunités</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{entries.filter(e => e.level === "HIGH").length}</p>
                  <p className="text-xs text-muted-foreground">Niveau élevé (H)</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{entries.filter(e => e.status === "PENDING_VALIDATION").length}</p>
                  <p className="text-xs text-muted-foreground">En attente DG</p>
                </div>
              </div>
            </Card>
            <Card className={`p-4 ${overdueCount + overdueActionCount > 0 ? "border-red-300 bg-red-50" : ""}`}>
              <div className="flex items-center gap-3">
                <AlertCircle className={`w-8 h-8 ${overdueCount + overdueActionCount > 0 ? "text-red-500" : "text-gray-400"}`} />
                <div>
                  <p className="text-2xl font-bold">{overdueCount + overdueActionCount}</p>
                  <p className="text-xs text-muted-foreground">En retard</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Risk Matrix Visual with counts */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />Matrice de risque 3×3 (PRO 30 §5.2)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse w-full max-w-lg">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-50">Conséquence \ Vraisemblance</th>
                      <th className="border p-2 bg-gray-50">Peu Probable (1)</th>
                      <th className="border p-2 bg-gray-50">Probable (2)</th>
                      <th className="border p-2 bg-gray-50">Presque Certain (3)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      { label: "Grave (3)", impact: "SEVERE", colors: ["bg-red-100 text-red-800", "bg-red-100 text-red-800", "bg-red-100 text-red-800"], levels: ["H", "H", "H"] },
                      { label: "Modéré (2)", impact: "MODERATE", colors: ["bg-yellow-100 text-yellow-800", "bg-red-100 text-red-800", "bg-red-100 text-red-800"], levels: ["M", "H", "H"] },
                      { label: "Insignifiant (1)", impact: "INSIGNIFICANT", colors: ["bg-green-100 text-green-800", "bg-yellow-100 text-yellow-800", "bg-yellow-100 text-yellow-800"], levels: ["L", "M", "M"] },
                    ] as const).map(row => (
                      <tr key={row.impact}>
                        <td className="border p-2 font-medium">{row.label}</td>
                        {(["UNLIKELY", "PROBABLE", "ALMOST_CERTAIN"] as const).map((likelihood, i) => {
                          const count = matrixCounts[`${likelihood}_${row.impact}`] || 0;
                          return (
                            <td key={likelihood} className={`border p-2 ${row.colors[i]} text-center font-bold`}>
                              {row.levels[i]}
                              {count > 0 && <span className="ml-1 text-[10px] font-normal opacity-80">({count})</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                H (6-9) : Actions correctives · M (3-4) : Actions préventives · L (1-2) : Surveillance
              </p>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, titre, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous niveaux</SelectItem>
                <SelectItem value="HIGH">H — Élevé</SelectItem>
                <SelectItem value="MEDIUM">M — Modéré</SelectItem>
                <SelectItem value="LOW">L — Faible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous statuts</SelectItem>
                {Object.entries(STATUSES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="risks">
            <TabsList>
              <TabsTrigger value="risks"><AlertTriangle className="w-4 h-4 mr-1" />Risques ({risks.length})</TabsTrigger>
              <TabsTrigger value="opps"><Lightbulb className="w-4 h-4 mr-1" />Opportunités ({opps.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="risks">{renderTable(risks)}</TabsContent>
            <TabsContent value="opps">{renderTable(opps)}</TabsContent>
          </Tabs>

          {/* ===== DIALOGS ===== */}

          {/* §5.1 — Identification Dialog */}
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Identifier un risque/opportunité</DialogTitle>
                <DialogDescription>§5.1 — Séance de brainstorming (CD + DT + RQ)</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Select value={createForm.type} onValueChange={(v) => setCreateForm({...createForm, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RISK">Risque</SelectItem>
                      <SelectItem value="OPPORTUNITY">Opportunité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Titre *</Label>
                  <Input value={createForm.title} onChange={(e) => setCreateForm({...createForm, title: e.target.value})} placeholder="Description courte du risque/opportunité" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={createForm.description} onChange={(e) => setCreateForm({...createForm, description: e.target.value})} placeholder="Détails, contexte, causes potentielles..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Domaine (FOR 77)</Label>
                    <Select value={createForm.category} onValueChange={(v) => setCreateForm({...createForm, category: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORIES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Source</Label>
                    <Input value={createForm.source} onChange={(e) => setCreateForm({...createForm, source: e.target.value})} placeholder="Audit, revue de direction..." />
                  </div>
                </div>
                <div>
                  <Label>Département / Service</Label>
                  <Input value={createForm.department} onChange={(e) => setCreateForm({...createForm, department: e.target.value})} placeholder="Ex: Direction Technique, Service Qualité..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={!createForm.title.trim()}>Identifier</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* §5.2 — Analyse Dialog */}
          <Dialog open={showAnalyze} onOpenChange={setShowAnalyze}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Analyse FOR 77 — {selected?.registerCode}</DialogTitle>
                <DialogDescription>
                  §5.2 — Renseigner Conséquence et Vraisemblance + évaluation du risque résiduel
                  {selected?.reviewNotes && selected?.status === "ANALYZED" && (
                    <span className="block mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
                      <strong>Note de rejet DG :</strong> {selected.reviewNotes}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vraisemblance</Label>
                    <Select value={analyzeForm.likelihood} onValueChange={(v) => setAnalyzeForm({...analyzeForm, likelihood: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(LIKELIHOODS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Conséquence (gravité)</Label>
                    <Select value={analyzeForm.impact} onValueChange={(v) => setAnalyzeForm({...analyzeForm, impact: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(IMPACTS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Évaluation du risque résiduel (§5.3)</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Maîtrise documentaire</Label>
                      <Select value={analyzeForm.residualDocControl} onValueChange={(v) => setAnalyzeForm({...analyzeForm, residualDocControl: v})}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dispositions en place, connues, appliquées et testées">En place, appliquées et testées</SelectItem>
                          <SelectItem value="Dispositions en place, partiellement appliquées">En place, partiellement appliquées</SelectItem>
                          <SelectItem value="Absence de disposition">Absence de disposition</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Compétence</Label>
                      <Select value={analyzeForm.residualCompetence} onValueChange={(v) => setAnalyzeForm({...analyzeForm, residualCompetence: v})}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Personnel formé et expérimenté">Formé et expérimenté</SelectItem>
                          <SelectItem value="Personnel formé, non expérimenté">Formé, non expérimenté</SelectItem>
                          <SelectItem value="Personnel non formé">Non formé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Contrôle</Label>
                      <Select value={analyzeForm.residualControlLevel} onValueChange={(v) => setAnalyzeForm({...analyzeForm, residualControlLevel: v})}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Risque facile à contrôler">Facile à contrôler</SelectItem>
                          <SelectItem value="Surveillance difficile à réaliser">Surveillance difficile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Maîtrise globale du risque</Label>
                      <Select value={analyzeForm.residualMastery} onValueChange={(v) => setAnalyzeForm({...analyzeForm, residualMastery: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(MASTERY_OPTIONS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAnalyze(false)}>Annuler</Button>
                <Button onClick={handleAnalyze}>Enregistrer l'analyse</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* §5.4 — Traitement Dialog */}
          <Dialog open={showTreatment} onOpenChange={setShowTreatment}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Plan d'action — {selected?.registerCode}</DialogTitle>
                <DialogDescription>§5.4 — Définir les actions de traitement</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Actions d'atténuation / exploitation</Label>
                  <Textarea value={treatForm.mitigationActions} onChange={(e) => setTreatForm({...treatForm, mitigationActions: e.target.value})} placeholder="Actions pour éliminer, réduire ou surveiller le risque..." />
                </div>
                <div>
                  <Label>Plan d'action détaillé</Label>
                  <Textarea value={treatForm.actionPlan} onChange={(e) => setTreatForm({...treatForm, actionPlan: e.target.value})} placeholder="Étapes concrètes, responsables..." />
                </div>
                <div>
                  <Label>Échéance</Label>
                  <Input type="date" value={treatForm.deadline} onChange={(e) => setTreatForm({...treatForm, deadline: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTreatment(false)}>Annuler</Button>
                <Button onClick={handleTreatment}>Démarrer le traitement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* §5.5 — Suivi Dialog */}
          <Dialog open={showMonitor} onOpenChange={setShowMonitor}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Suivi — {selected?.registerCode}</DialogTitle>
                <DialogDescription>§5.5 — Évaluation de l'efficacité (RQ + CD + DT)</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Progrès des actions</Label>
                  <Textarea value={monitorForm.actionProgress} onChange={(e) => setMonitorForm({...monitorForm, actionProgress: e.target.value})} placeholder="État d'avancement..." />
                </div>
                <div>
                  <Label>Notes de revue</Label>
                  <Textarea value={monitorForm.reviewNotes} onChange={(e) => setMonitorForm({...monitorForm, reviewNotes: e.target.value})} placeholder="Efficacité des mesures, risques résiduels..." />
                </div>
                <div>
                  <Label>Prochaine revue</Label>
                  <Input type="date" value={monitorForm.nextReview} onChange={(e) => setMonitorForm({...monitorForm, nextReview: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMonitor(false)}>Annuler</Button>
                <Button onClick={handleMonitor}>Enregistrer le suivi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* DG Validation Confirmation */}
          <AlertDialog open={showValidateConfirm} onOpenChange={setShowValidateConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la validation</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous êtes sur le point de valider <strong>{selected?.registerCode}</strong> — « {selected?.title} ».
                  <br />Cette action rendra la matrice disponible pour traitement et sera diffusée au Conseil d'Administration.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleValidate} className="bg-green-600 hover:bg-green-700">Valider</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* DG Rejection Dialog */}
          <Dialog open={showReject} onOpenChange={setShowReject}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rejeter — {selected?.registerCode}</DialogTitle>
                <DialogDescription>
                  Le risque sera renvoyé au statut « Analysé » pour révision par l'équipe (CD + DT + RQ).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Motif du rejet *</Label>
                  <Textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Préciser les raisons du rejet et les corrections attendues..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReject(false)}>Annuler</Button>
                <Button variant="destructive" onClick={handleReject} disabled={!rejectNotes.trim()}>Rejeter et renvoyer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Close Confirmation Dialog */}
          <Dialog open={showClose} onOpenChange={setShowClose}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clôturer — {selected?.registerCode}</DialogTitle>
                <DialogDescription>
                  Confirmez la clôture de « {selected?.title} ». Cette action est définitive.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Notes de risque résiduel</Label>
                  <Textarea
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder="Risques résiduels acceptés, commentaires de clôture..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClose(false)}>Annuler</Button>
                <Button variant="destructive" onClick={handleClose}>Confirmer la clôture</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Detail Dialog */}
          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selected?.registerCode} — {selected?.title}</DialogTitle>
              </DialogHeader>
              {selected && (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-muted-foreground">Type :</span> <Badge>{selected.type === "RISK" ? "Risque" : "Opportunité"}</Badge></div>
                    <div><span className="text-muted-foreground">Statut :</span> <Badge className={STATUSES[selected.status]?.color}>{STATUSES[selected.status]?.label}</Badge></div>
                    <div><span className="text-muted-foreground">Domaine :</span> {CATEGORIES[selected.category] || selected.category}</div>
                    <div><span className="text-muted-foreground">Source :</span> {selected.source || "—"}</div>
                    <div><span className="text-muted-foreground">Département :</span> {selected.ownerDepartment || "—"}</div>
                    <div><span className="text-muted-foreground">Créé le :</span> {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("fr-FR") : "—"}</div>
                  </div>
                  <div><span className="text-muted-foreground">Description :</span><p className="mt-1">{selected.description}</p></div>

                  {/* Workflow Timeline */}
                  <div className="border-t pt-4">
                    <p className="font-medium mb-3">Progression du workflow</p>
                    <div className="flex items-center gap-1 text-xs">
                      {Object.entries(STATUSES).map(([key, val], idx) => {
                        const statusOrder = Object.keys(STATUSES);
                        const currentIdx = statusOrder.indexOf(selected.status);
                        const isPast = idx <= currentIdx;
                        const isCurrent = key === selected.status;
                        return (
                          <div key={key} className="flex items-center gap-1">
                            <div className={`px-2 py-1 rounded-full whitespace-nowrap ${isCurrent ? val.color + " font-bold" : isPast ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                              {val.label}
                            </div>
                            {idx < Object.keys(STATUSES).length - 1 && <span className="text-gray-300">→</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selected.likelihood && (
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Analyse (FOR 77)</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div><span className="text-muted-foreground">Vraisemblance :</span><br/>{LIKELIHOODS[selected.likelihood] || selected.likelihood}</div>
                        <div><span className="text-muted-foreground">Conséquence :</span><br/>{IMPACTS[selected.impact!] || selected.impact}</div>
                        <div><span className="text-muted-foreground">Niveau :</span><br/><Badge className={LEVELS[selected.level!]?.color}>{LEVELS[selected.level!]?.label}</Badge></div>
                      </div>
                    </div>
                  )}

                  {selected.residualMastery && (
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Risque résiduel (§5.3)</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">Maîtrise doc. :</span> {selected.residualDocControl}</div>
                        <div><span className="text-muted-foreground">Compétence :</span> {selected.residualCompetence}</div>
                        <div><span className="text-muted-foreground">Contrôle :</span> {selected.residualControlLevel}</div>
                        <div><span className="text-muted-foreground">Maîtrise :</span> <Badge>{MASTERY_OPTIONS[selected.residualMastery] || selected.residualMastery}</Badge></div>
                      </div>
                    </div>
                  )}

                  {(selected.submittedAt || selected.validatedAt) && (
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Validation</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selected.submittedAt && <div><span className="text-muted-foreground">Soumis le :</span> {new Date(selected.submittedAt).toLocaleDateString("fr-FR")}{selected.submittedBy ? ` par ${selected.submittedBy.fullName}` : ""}</div>}
                        {selected.validatedAt && <div><span className="text-muted-foreground">Validé le :</span> {new Date(selected.validatedAt).toLocaleDateString("fr-FR")}{selected.validatedBy ? ` par ${selected.validatedBy.fullName}` : ""}</div>}
                      </div>
                    </div>
                  )}

                  {selected.mitigationActions && (
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Traitement (§5.4)</p>
                      <div><span className="text-muted-foreground">Actions :</span><p>{selected.mitigationActions}</p></div>
                      {selected.actionPlan && <div className="mt-2"><span className="text-muted-foreground">Plan :</span><p>{selected.actionPlan}</p></div>}
                      {selected.actionDeadline && <div className="mt-2"><span className="text-muted-foreground">Échéance :</span> {new Date(selected.actionDeadline).toLocaleDateString("fr-FR")}</div>}
                      {selected.actionProgress && <div className="mt-2"><span className="text-muted-foreground">Progrès :</span><p>{selected.actionProgress}</p></div>}
                    </div>
                  )}

                  {(selected.reviewNotes || selected.lastReviewDate || selected.nextReviewDate) && (
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Suivi (§5.5)</p>
                      {selected.lastReviewDate && <div><span className="text-muted-foreground">Dernière revue :</span> {new Date(selected.lastReviewDate).toLocaleDateString("fr-FR")}</div>}
                      {selected.nextReviewDate && (
                        <div className={isOverdue(selected) ? "text-red-600 font-medium" : ""}>
                          <span className="text-muted-foreground">Prochaine revue :</span> {new Date(selected.nextReviewDate).toLocaleDateString("fr-FR")}
                          {isOverdue(selected) && " ⚠ En retard"}
                        </div>
                      )}
                      {selected.reviewNotes && <div className="mt-2"><span className="text-muted-foreground">Notes :</span><p>{selected.reviewNotes}</p></div>}
                    </div>
                  )}

                  {selected.residualRiskNotes && (
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Notes de clôture</p>
                      <p>{selected.residualRiskNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
