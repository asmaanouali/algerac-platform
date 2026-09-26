import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRightLeft, CheckCircle, XCircle, Search, ClipboardCheck,
  Eye, FileCheck, ShieldAlert, DollarSign, AlertTriangle
} from "lucide-react";

interface Transfer {
  id: number; transferCode: string; reason: string; reasonDetails: string;
  sourceOrganizationName: string; targetOrganizationName: string; transferredScope: string;
  status: string; createdAt: string; continuityAssessment: string;
  managementSystemContinuity: boolean; personnelContinuity: boolean; equipmentContinuity: boolean;
  impartialityCompliance: boolean; assessmentMethodsContinuity: boolean;
  riskAnalysis: string; lastEvaluationStatus: string; financialRegularized: boolean;
  targetIsNewEntity: boolean; fullScopeTransfer: boolean; scopeModifications: string;
  feasibilityStudy: string; feasibilityStudyRef: string;
  evaluationRequired: boolean; evaluationFindings: string;
  decisionJustification: string; effectiveDate: string; accreditationNumber: string;
  decisionByUser: { id: number; fullName: string } | null;
}

export default function AccreditationTransferPage() {
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeasibility, setShowFeasibility] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);
  const [feasForm, setFeasForm] = useState({
    feasibilityStudy: "", feasibilityStudyRef: "FOR-86",
    evaluationRequired: false, findings: ""
  });

  useEffect(() => { loadTransfers(); }, []);

  const loadTransfers = async () => {
    try {
      const res = await fetch("/api/transfers", { credentials: "include" });
      const data = await res.json();
      setTransfers(data.data || []);
    } catch { setTransfers([]); }
    setLoading(false);
  };

  const handleFeasibilityStudy = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/transfers/${selected.id}/feasibility`, feasForm);
      toast({ title: feasForm.evaluationRequired ? "Évaluation supplémentaire requise" : "Dossier envoyé au CAS pour décision" });
      setShowFeasibility(false);
      setFeasForm({ feasibilityStudy: "", feasibilityStudyRef: "FOR-86", evaluationRequired: false, findings: "" });
      loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleEvaluation = async (id: number) => {
    const findings = prompt("Résultat de l'évaluation supplémentaire :");
    if (!findings) return;
    try {
      await apiRequest("PUT", `/api/transfers/${id}/evaluation`, { findings });
      toast({ title: "Évaluation enregistrée, dossier envoyé au CAS" });
      loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleComplete = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/transfers/${id}/complete`, {});
      toast({ title: "Transfert complété" });
      loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const pending = transfers.filter(t => ["DOCUMENTS_SUBMITTED"].includes(t.status));
  const evaluation = transfers.filter(t => ["EVALUATION_REQUIRED", "EVALUATION_IN_PROGRESS"].includes(t.status));
  const inProgress = transfers.filter(t => ["UNDER_REVIEW", "PENDING_CAS_DECISION", "APPROVED", "CERTIFICATE_ISSUED"].includes(t.status));
  const completed = transfers.filter(t => ["COMPLETED", "REJECTED", "CANCELLED"].includes(t.status));

  const getStatusBadge = (s: string) => {
    const m: Record<string, { c: string; l: string }> = {
      INITIATED: { c: "bg-blue-100 text-blue-800", l: "Initié" },
      DOCUMENTS_SUBMITTED: { c: "bg-indigo-100 text-indigo-800", l: "Documents soumis" },
      UNDER_REVIEW: { c: "bg-yellow-100 text-yellow-800", l: "En examen" },
      EVALUATION_REQUIRED: { c: "bg-purple-100 text-purple-800", l: "Évaluation requise" },
      EVALUATION_IN_PROGRESS: { c: "bg-purple-100 text-purple-800", l: "Évaluation en cours" },
      EVALUATION_COMPLETED: { c: "bg-indigo-100 text-indigo-800", l: "Évaluation terminée" },
      PENDING_CAS_DECISION: { c: "bg-orange-100 text-orange-800", l: "En attente décision CAS" },
      APPROVED: { c: "bg-green-100 text-green-800", l: "Approuvé" },
      CERTIFICATE_ISSUED: { c: "bg-teal-100 text-teal-800", l: "Certificat émis" },
      COMPLETED: { c: "bg-emerald-100 text-emerald-800", l: "Complété" },
      REJECTED: { c: "bg-red-100 text-red-800", l: "Rejeté" },
      CANCELLED: { c: "bg-gray-100 text-gray-800", l: "Annulé" },
    };
    const v = m[s] || { c: "bg-gray-100 text-gray-800", l: s };
    return <Badge className={v.c}>{v.l}</Badge>;
  };

  const reasonLabel: Record<string, string> = {
    PARENT_REORGANIZATION: "Réorganisation société mère", SUBSIDIARY_CREATION: "Création de filiale",
    SCOPE_CESSION: "Cession de portée", MERGER: "Fusion de deux OEC",
    LEGAL_RESTRUCTURING: "Restructuration juridique", ACQUISITION: "Acquisition",
    NAME_CHANGE: "Changement de nom", LOCATION_CHANGE: "Changement de localisation",
    SPIN_OFF: "Scission", OTHER: "Autre"
  };

  const Indicator = ({ value, label }: { value: boolean | undefined; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {value ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
      <span className={value ? "text-green-700" : "text-red-600"}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar /><div className="md:ml-64"><Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-primary" />Transfert d'accréditation — PRO 31
              </h1>
              <p className="text-muted-foreground">Étude de faisabilité et suivi des transferts d'accréditation</p>
            </div>
            <Button variant="outline" onClick={loadTransfers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg"><FileCheck className="w-5 h-5 text-indigo-600" /></div>
                <div><p className="text-2xl font-bold">{pending.length}</p><p className="text-sm text-muted-foreground">À examiner</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg"><Search className="w-5 h-5 text-purple-600" /></div>
                <div><p className="text-2xl font-bold">{evaluation.length}</p><p className="text-sm text-muted-foreground">Évaluations</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg"><ArrowRightLeft className="w-5 h-5 text-orange-600" /></div>
                <div><p className="text-2xl font-bold">{inProgress.length}</p><p className="text-sm text-muted-foreground">En cours</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                <div><p className="text-2xl font-bold">{completed.length}</p><p className="text-sm text-muted-foreground">Terminés</p></div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">À examiner ({pending.length})</TabsTrigger>
              <TabsTrigger value="evaluation">Évaluations ({evaluation.length})</TabsTrigger>
              <TabsTrigger value="inprogress">En cours ({inProgress.length})</TabsTrigger>
              <TabsTrigger value="all">Tous ({transfers.length})</TabsTrigger>
            </TabsList>

            {[
              { key: "pending", data: pending, title: "Demandes en attente d'étude de faisabilité" },
              { key: "evaluation", data: evaluation, title: "Évaluations supplémentaires en cours" },
              { key: "inprogress", data: inProgress, title: "Transferts en cours" },
              { key: "all", data: transfers, title: "Tous les transferts" },
            ].map(tab => (
              <TabsContent key={tab.key} value={tab.key}>
                <Card>
                  <CardHeader><CardTitle>{tab.title}</CardTitle></CardHeader>
                  <CardContent>
                    {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> :
                    tab.data.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucune demande</p> : (
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>Code</TableHead><TableHead>OEC source</TableHead><TableHead>OEC cible</TableHead>
                          <TableHead>Motif</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>{tab.data.map(t => (
                          <TableRow key={t.id}>
                            <TableCell className="font-mono text-sm">{t.transferCode}</TableCell>
                            <TableCell>{t.sourceOrganizationName}</TableCell>
                            <TableCell>{t.targetOrganizationName}</TableCell>
                            <TableCell>{reasonLabel[t.reason] || t.reason?.replace(/_/g, " ")}</TableCell>
                            <TableCell>{getStatusBadge(t.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end flex-wrap">
                                <Button size="sm" variant="ghost" onClick={() => { setSelected(t); setShowDetail(true); }}>
                                  <Eye className="w-3 h-3 mr-1" />Détails
                                </Button>
                                {t.status === "DOCUMENTS_SUBMITTED" && (
                                  <Button size="sm" onClick={() => {
                                    setSelected(t);
                                    setFeasForm({ feasibilityStudy: "", feasibilityStudyRef: "FOR-86", evaluationRequired: false, findings: "" });
                                    setShowFeasibility(true);
                                  }}>
                                    <FileCheck className="w-3 h-3 mr-1" />Étude de faisabilité
                                  </Button>
                                )}
                                {["EVALUATION_REQUIRED", "EVALUATION_IN_PROGRESS"].includes(t.status) && (
                                  <Button size="sm" onClick={() => handleEvaluation(t.id)}>
                                    <Search className="w-3 h-3 mr-1" />Enregistrer évaluation
                                  </Button>
                                )}
                                {["APPROVED", "CERTIFICATE_ISSUED"].includes(t.status) && (
                                  <Button size="sm" variant="outline" onClick={() => handleComplete(t.id)}>
                                    <CheckCircle className="w-3 h-3 mr-1" />Compléter
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}</TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Dialog: Étude de faisabilité (FOR 86) */}
          <Dialog open={showFeasibility} onOpenChange={setShowFeasibility}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Étude de faisabilité — {selected?.transferCode}</DialogTitle>
                <DialogDescription>FOR 86 — Évaluation documentaire du transfert d'accréditation (PRO 31 §5.2)</DialogDescription>
              </DialogHeader>

              {selected && (
                <div className="space-y-5">
                  {/* Résumé du dossier */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">OEC source :</span> <span className="font-medium">{selected.sourceOrganizationName}</span></div>
                      <div><span className="text-muted-foreground">OEC cible :</span> <span className="font-medium">{selected.targetOrganizationName}</span></div>
                      <div><span className="text-muted-foreground">Motif :</span> <span>{reasonLabel[selected.reason] || selected.reason}</span></div>
                      <div><span className="text-muted-foreground">Périmètre :</span> <span>{selected.fullScopeTransfer ? "Intégral" : "Partiel"}</span></div>
                    </div>
                    {selected.targetIsNewEntity && (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Organisme en cours de création</Badge>
                    )}
                  </div>

                  {/* Analyse des risques soumise */}
                  {selected.riskAnalysis && (
                    <div className="border rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />Analyse des risques (soumise par l'OEC)
                      </h4>
                      <p className="text-sm text-muted-foreground">{selected.riskAnalysis}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Indicator value={selected.impartialityCompliance} label="Impartialité" />
                        <Indicator value={selected.assessmentMethodsContinuity} label="Méthodes d'évaluation" />
                        <Indicator value={selected.managementSystemContinuity} label="Système de management" />
                        <Indicator value={selected.personnelContinuity} label="Personnel" />
                        <Indicator value={selected.equipmentContinuity} label="Équipements" />
                        <Indicator value={selected.financialRegularized} label="Finances régularisées" />
                      </div>
                      {selected.lastEvaluationStatus && (
                        <div className="text-sm"><span className="text-muted-foreground">Écarts dernière évaluation :</span> {selected.lastEvaluationStatus}</div>
                      )}
                    </div>
                  )}

                  {/* Continuité */}
                  {selected.continuityAssessment && (
                    <div className="border rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm">Évaluation de continuité</h4>
                      <p className="text-sm text-muted-foreground">{selected.continuityAssessment}</p>
                    </div>
                  )}

                  {/* Formulaire de faisabilité */}
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <Label className="font-semibold">Référence FOR 86</Label>
                      <Input value={feasForm.feasibilityStudyRef}
                        onChange={(e) => setFeasForm({...feasForm, feasibilityStudyRef: e.target.value})}
                        placeholder="FOR-86" className="mt-1" />
                    </div>
                    <div>
                      <Label className="font-semibold">Résultat de l'étude de faisabilité *</Label>
                      <Textarea value={feasForm.feasibilityStudy}
                        onChange={(e) => setFeasForm({...feasForm, feasibilityStudy: e.target.value})}
                        placeholder="Résultat de l'analyse documentaire selon l'appendice 09 du DOC 01..."
                        className="mt-1" rows={4} />
                    </div>
                    <div>
                      <Label>Constatations / observations</Label>
                      <Textarea value={feasForm.findings}
                        onChange={(e) => setFeasForm({...feasForm, findings: e.target.value})}
                        placeholder="Observations supplémentaires..."
                        className="mt-1" rows={2} />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant={!feasForm.evaluationRequired ? "default" : "outline"}
                        onClick={() => setFeasForm({...feasForm, evaluationRequired: false})}
                        className="flex-1"
                      >
                        <ClipboardCheck className="w-4 h-4 mr-2" />Pas d'évaluation nécessaire
                      </Button>
                      <Button
                        variant={feasForm.evaluationRequired ? "default" : "outline"}
                        onClick={() => setFeasForm({...feasForm, evaluationRequired: true})}
                        className="flex-1"
                      >
                        <Search className="w-4 h-4 mr-2" />Évaluation supplémentaire requise
                      </Button>
                    </div>
                    {feasForm.evaluationRequired && (
                      <p className="text-sm text-muted-foreground">
                        L'évaluation sera réalisée par la même équipe d'évaluation (sauf récusation PRO 22) et facturée selon PRO 18/18-1.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFeasibility(false)}>Annuler</Button>
                <Button onClick={handleFeasibilityStudy} disabled={!feasForm.feasibilityStudy}>
                  {feasForm.evaluationRequired ? "Demander une évaluation" : "Envoyer au CAS"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Détails du transfert */}
          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Transfert {selected?.transferCode}</DialogTitle></DialogHeader>
              {selected && (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Statut</span>{getStatusBadge(selected.status)}</div>
                  <div className="flex justify-between"><span className="text-muted-foreground">OEC source</span><span>{selected.sourceOrganizationName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">OEC cible</span><span>{selected.targetOrganizationName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Motif</span><span>{reasonLabel[selected.reason] || selected.reason}</span></div>
                  <div><span className="text-muted-foreground">Périmètre</span><p className="mt-1">{selected.transferredScope}</p></div>
                  {selected.reasonDetails && <div><span className="text-muted-foreground">Justification</span><p className="mt-1">{selected.reasonDetails}</p></div>}

                  {/* Risk analysis */}
                  {selected.riskAnalysis && (
                    <div className="border-t pt-3 space-y-2">
                      <h4 className="font-medium flex items-center gap-2"><ShieldAlert className="w-4 h-4" />Analyse des risques</h4>
                      <p className="text-muted-foreground">{selected.riskAnalysis}</p>
                      <Indicator value={selected.impartialityCompliance} label="Impartialité" />
                      <Indicator value={selected.assessmentMethodsContinuity} label="Méthodes d'évaluation" />
                    </div>
                  )}

                  {selected.continuityAssessment && (
                    <div className="border-t pt-3 space-y-2">
                      <h4 className="font-medium">Continuité</h4>
                      <Indicator value={selected.managementSystemContinuity} label="Système de management" />
                      <Indicator value={selected.personnelContinuity} label="Personnel" />
                      <Indicator value={selected.equipmentContinuity} label="Équipements" />
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <Indicator value={selected.financialRegularized} label="Finances régularisées" />
                  </div>

                  {selected.feasibilityStudy && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium">Étude de faisabilité (FOR 86)</h4>
                      <p className="text-muted-foreground mt-1">{selected.feasibilityStudy}</p>
                      {selected.feasibilityStudyRef && <p className="text-xs text-muted-foreground">Réf: {selected.feasibilityStudyRef}</p>}
                    </div>
                  )}

                  {selected.evaluationFindings && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium">Résultat de l'évaluation</h4>
                      <p className="text-muted-foreground mt-1">{selected.evaluationFindings}</p>
                    </div>
                  )}

                  {selected.decisionJustification && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium">Décision CAS</h4>
                      <p className="text-muted-foreground mt-1">{selected.decisionJustification}</p>
                      {selected.decisionByUser && <p className="text-xs text-muted-foreground">Par: {selected.decisionByUser.fullName}</p>}
                    </div>
                  )}

                  {selected.effectiveDate && (
                    <div className="border-t pt-3 space-y-1">
                      <h4 className="font-medium">Certificat</h4>
                      <div className="flex justify-between"><span className="text-muted-foreground">Date d'effet</span><span>{new Date(selected.effectiveDate).toLocaleDateString("fr-FR")}</span></div>
                      {selected.accreditationNumber && (
                        <div className="flex justify-between"><span className="text-muted-foreground">N° accréditation</span><span className="font-mono">{selected.accreditationNumber}</span></div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <DialogFooter><Button variant="outline" onClick={() => setShowDetail(false)}>Fermer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
