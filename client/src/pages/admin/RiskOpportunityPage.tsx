import { useState, useEffect } from "react";
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
import {
  ShieldAlert, Plus, AlertTriangle, TrendingUp, Clock, Lightbulb,
  Send, CheckCircle, Play, Eye, X, FileText
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
  actionProgress: string | null;
  status: string;
  ownerDepartment: string;
  residualDocControl: string | null;
  residualCompetence: string | null;
  residualControlLevel: string | null;
  residualMastery: string | null;
  reviewNotes: string | null;
  nextReviewDate: string | null;
  createdAt: string;
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

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [showTreatment, setShowTreatment] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
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

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    try {
      const res = await fetch("/api/risks", { credentials: "include" });
      const data = await res.json();
      setEntries(data.data || []);
    } catch { setEntries([]); }
    setLoading(false);
  };

  // §5.1 Identifier
  const handleCreate = async () => {
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
  const handleValidate = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/risks/${id}/validate`, {});
      toast({ title: "Validé par la Direction Générale" });
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

  // Clôturer
  const handleClose = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/risks/${id}/close`, { residualNotes: "" });
      toast({ title: "Clôturé" });
      loadEntries();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const risks = entries.filter(e => e.type === "RISK");
  const opps = entries.filter(e => e.type === "OPPORTUNITY");

  const renderActions = (e: RiskEntry) => (
    <div className="flex gap-1 justify-end flex-wrap">
      <Button size="sm" variant="ghost" onClick={() => { setSelected(e); setShowDetail(true); }}>
        <Eye className="w-3 h-3" />
      </Button>
      {e.status === "IDENTIFIED" && canAnalyze && (
        <Button size="sm" variant="outline" onClick={() => {
          setSelected(e);
          setAnalyzeForm({ likelihood: "PROBABLE", impact: "MODERATE", residualDocControl: "", residualCompetence: "", residualControlLevel: "", residualMastery: "GOOD" });
          setShowAnalyze(true);
        }}>Analyser</Button>
      )}
      {e.status === "ANALYZED" && canSubmitDG && (
        <Button size="sm" onClick={() => handleSubmitDG(e.id)}>
          <Send className="w-3 h-3 mr-1" />Soumettre DG
        </Button>
      )}
      {e.status === "PENDING_VALIDATION" && canValidate && (
        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleValidate(e.id)}>
          <CheckCircle className="w-3 h-3 mr-1" />Valider
        </Button>
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
        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleClose(e.id)}>
          <X className="w-3 h-3 mr-1" />Clôturer
        </Button>
      )}
    </div>
  );

  const renderTable = (data: RiskEntry[]) => (
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
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun enregistrement</TableCell></TableRow>
            ) : data.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-sm">{e.registerCode}</TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">{e.title}</TableCell>
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
            {canIdentify && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />Identifier
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
          </div>

          {/* Risk Matrix Visual */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />Matrice de risque 3×3 (PRO 30 §5.2)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse w-full max-w-md">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-50">Conséquence \ Vraisemblance</th>
                      <th className="border p-2 bg-gray-50">Peu Probable (1)</th>
                      <th className="border p-2 bg-gray-50">Probable (2)</th>
                      <th className="border p-2 bg-gray-50">Presque Certain (3)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium">Grave (3)</td>
                      <td className="border p-2 bg-red-100 text-red-800 text-center font-bold">H</td>
                      <td className="border p-2 bg-red-100 text-red-800 text-center font-bold">H</td>
                      <td className="border p-2 bg-red-100 text-red-800 text-center font-bold">H</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">Modéré (2)</td>
                      <td className="border p-2 bg-yellow-100 text-yellow-800 text-center font-bold">M</td>
                      <td className="border p-2 bg-red-100 text-red-800 text-center font-bold">H</td>
                      <td className="border p-2 bg-red-100 text-red-800 text-center font-bold">H</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">Insignifiant (1)</td>
                      <td className="border p-2 bg-green-100 text-green-800 text-center font-bold">L</td>
                      <td className="border p-2 bg-yellow-100 text-yellow-800 text-center font-bold">M</td>
                      <td className="border p-2 bg-yellow-100 text-yellow-800 text-center font-bold">M</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                H (6-9) : Actions correctives · M (3-4) : Actions préventives · L (1-2) : Surveillance
              </p>
            </CardContent>
          </Card>

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
                  <Label>Titre</Label>
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate}>Identifier</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* §5.2 — Analyse Dialog */}
          <Dialog open={showAnalyze} onOpenChange={setShowAnalyze}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Analyse FOR 77 — {selected?.registerCode}</DialogTitle>
                <DialogDescription>§5.2 — Renseigner Conséquence et Vraisemblance + évaluation du risque résiduel</DialogDescription>
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
                  </div>
                  <div><span className="text-muted-foreground">Description :</span><p className="mt-1">{selected.description}</p></div>

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
                      <p className="font-medium mb-2">Risque résiduel</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">Maîtrise doc. :</span> {selected.residualDocControl}</div>
                        <div><span className="text-muted-foreground">Compétence :</span> {selected.residualCompetence}</div>
                        <div><span className="text-muted-foreground">Contrôle :</span> {selected.residualControlLevel}</div>
                        <div><span className="text-muted-foreground">Maîtrise :</span> <Badge>{MASTERY_OPTIONS[selected.residualMastery] || selected.residualMastery}</Badge></div>
                      </div>
                    </div>
                  )}

                  {selected.mitigationActions && (
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Traitement</p>
                      <div><span className="text-muted-foreground">Actions :</span><p>{selected.mitigationActions}</p></div>
                      {selected.actionPlan && <div className="mt-2"><span className="text-muted-foreground">Plan :</span><p>{selected.actionPlan}</p></div>}
                      {selected.actionProgress && <div className="mt-2"><span className="text-muted-foreground">Progrès :</span><p>{selected.actionProgress}</p></div>}
                    </div>
                  )}

                  {selected.reviewNotes && (
                    <div className="border-t pt-4">
                      <p className="font-medium mb-2">Dernière revue</p>
                      <p>{selected.reviewNotes}</p>
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
