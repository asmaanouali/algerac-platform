import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRightLeft, CheckCircle, XCircle, Eye, Gavel,
  ShieldCheck, ShieldAlert, DollarSign, AlertTriangle, Users, Clock, BarChart3
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
  evaluationFindings: string; evaluationRequired: boolean;
  decisionJustification: string; effectiveDate: string; accreditationNumber: string;
  decisionByUser: { id: number; fullName: string } | null;
}

export default function TransferOverviewPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);

  useEffect(() => { loadTransfers(); }, []);

  const loadTransfers = async () => {
    try {
      const res = await fetch("/api/transfers", { credentials: "include" });
      const data = await res.json();
      setTransfers(data.data || []);
    } catch { setTransfers([]); }
    setLoading(false);
  };

  const inProgress = transfers.filter(t => !["APPROVED", "REJECTED", "CERTIFICATE_ISSUED", "COMPLETED", "CANCELLED"].includes(t.status));
  const approved = transfers.filter(t => ["APPROVED", "CERTIFICATE_ISSUED", "COMPLETED"].includes(t.status));
  const rejected = transfers.filter(t => t.status === "REJECTED");

  const getStatusBadge = (s: string) => {
    const m: Record<string, { c: string; l: string }> = {
      INITIATED: { c: "bg-blue-100 text-blue-800", l: "Initié" },
      DOCUMENTS_SUBMITTED: { c: "bg-indigo-100 text-indigo-800", l: "Documents soumis" },
      UNDER_REVIEW: { c: "bg-yellow-100 text-yellow-800", l: "En examen CD" },
      EVALUATION_REQUIRED: { c: "bg-purple-100 text-purple-800", l: "Évaluation requise" },
      EVALUATION_IN_PROGRESS: { c: "bg-purple-100 text-purple-800", l: "Évaluation en cours" },
      EVALUATION_COMPLETED: { c: "bg-indigo-100 text-indigo-800", l: "Évaluation terminée" },
      PENDING_CAS_DECISION: { c: "bg-orange-100 text-orange-800", l: "En attente CAS" },
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
    NAME_CHANGE: "Changement de nom", SPIN_OFF: "Scission",
    LOCATION_CHANGE: "Changement de localisation", OTHER: "Autre"
  };

  const Indicator = ({ value, label }: { value: boolean | undefined; label: string }) => (
    <div className="flex items-center gap-2">
      {value ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
      <span className={value ? "text-green-700" : "text-red-600"}>{label}</span>
    </div>
  );

  const TransferTable = ({ data }: { data: Transfer[] }) => (
    <Table>
      <TableHeader><TableRow>
        <TableHead>Code</TableHead><TableHead>OEC source</TableHead><TableHead>OEC cible</TableHead>
        <TableHead>Motif</TableHead><TableHead>Périmètre</TableHead><TableHead>Statut</TableHead>
        <TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun transfert</TableCell></TableRow>
        ) : data.map(t => (
          <TableRow key={t.id}>
            <TableCell className="font-mono text-sm">{t.transferCode}</TableCell>
            <TableCell>{t.sourceOrganizationName}</TableCell>
            <TableCell>{t.targetOrganizationName}</TableCell>
            <TableCell>{reasonLabel[t.reason] || t.reason?.replace(/_/g, " ")}</TableCell>
            <TableCell className="max-w-[150px] truncate">{t.transferredScope}</TableCell>
            <TableCell>{getStatusBadge(t.status)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{t.createdAt ? new Date(t.createdAt).toLocaleDateString("fr-FR") : "—"}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="ghost" onClick={() => { setSelected(t); setShowDetail(true); }}>
                <Eye className="w-3 h-3 mr-1" />Détails
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar /><div className="md:ml-64"><Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6 text-primary" />Vue d'ensemble des transferts — DG
            </h1>
            <p className="text-muted-foreground">Suivi global des transferts d'accréditation (PRO 31)</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold">{transfers.length}</p><p className="text-sm text-muted-foreground">Total transferts</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg"><Clock className="w-5 h-5 text-orange-600" /></div>
                <div><p className="text-2xl font-bold">{inProgress.length}</p><p className="text-sm text-muted-foreground">En cours</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                <div><p className="text-2xl font-bold">{approved.length}</p><p className="text-sm text-muted-foreground">Approuvés</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg"><XCircle className="w-5 h-5 text-red-600" /></div>
                <div><p className="text-2xl font-bold">{rejected.length}</p><p className="text-sm text-muted-foreground">Rejetés</p></div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="in-progress">
            <TabsList>
              <TabsTrigger value="in-progress">En cours ({inProgress.length})</TabsTrigger>
              <TabsTrigger value="approved">Approuvés ({approved.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejetés ({rejected.length})</TabsTrigger>
              <TabsTrigger value="all">Tous ({transfers.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="in-progress">
              <Card><CardHeader><CardTitle>Transferts en cours de traitement</CardTitle></CardHeader>
                <CardContent>{loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> : <TransferTable data={inProgress} />}</CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="approved">
              <Card><CardHeader><CardTitle>Transferts approuvés</CardTitle></CardHeader>
                <CardContent><TransferTable data={approved} /></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rejected">
              <Card><CardHeader><CardTitle>Transferts rejetés</CardTitle></CardHeader>
                <CardContent><TransferTable data={rejected} /></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="all">
              <Card><CardHeader><CardTitle>Tous les transferts</CardTitle></CardHeader>
                <CardContent><TransferTable data={transfers} /></CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Detail Dialog */}
          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Transfert {selected?.transferCode}</DialogTitle></DialogHeader>
              {selected && (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Statut</span>{getStatusBadge(selected.status)}</div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Motif</span><span>{reasonLabel[selected.reason] || selected.reason}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">OEC source</span><span>{selected.sourceOrganizationName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">OEC cible</span><span>{selected.targetOrganizationName}</span></div>
                  {selected.targetIsNewEntity && (
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Organisme en cours de création</Badge>
                  )}
                  <div><span className="text-muted-foreground">Périmètre transféré</span><p className="mt-1">{selected.transferredScope}</p></div>
                  {selected.reasonDetails && <div><span className="text-muted-foreground">Détails du motif</span><p className="mt-1">{selected.reasonDetails}</p></div>}

                  {/* Risk analysis */}
                  {selected.riskAnalysis && (
                    <div className="border-t pt-3 space-y-2">
                      <h4 className="font-medium flex items-center gap-2"><ShieldAlert className="w-4 h-4" />Analyse des risques</h4>
                      <p className="text-muted-foreground">{selected.riskAnalysis}</p>
                      <div className="grid grid-cols-2 gap-1">
                        <Indicator value={selected.impartialityCompliance} label="Impartialité" />
                        <Indicator value={selected.assessmentMethodsContinuity} label="Méthodes d'évaluation" />
                      </div>
                      {selected.lastEvaluationStatus && (
                        <div><span className="text-muted-foreground">Écarts :</span> {selected.lastEvaluationStatus}</div>
                      )}
                    </div>
                  )}

                  {/* Continuity */}
                  {selected.continuityAssessment && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium flex items-center gap-2 mb-2"><Users className="w-4 h-4" />Évaluation de continuité</h4>
                      <p className="text-muted-foreground">{selected.continuityAssessment}</p>
                      <div className="space-y-1 mt-2">
                        <Indicator value={selected.managementSystemContinuity} label="Système de management" />
                        <Indicator value={selected.personnelContinuity} label="Personnel" />
                        <Indicator value={selected.equipmentContinuity} label="Équipements" />
                      </div>
                    </div>
                  )}

                  {/* Financial */}
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <Indicator value={selected.financialRegularized} label="Situation financière régularisée" />
                    </div>
                  </div>

                  {/* Feasibility study */}
                  {selected.feasibilityStudy && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4" />Étude de faisabilité (FOR 86)</h4>
                      <p className="text-muted-foreground">{selected.feasibilityStudy}</p>
                      {selected.feasibilityStudyRef && <p className="text-xs text-muted-foreground mt-1">Réf: {selected.feasibilityStudyRef}</p>}
                    </div>
                  )}

                  {/* Evaluation */}
                  {selected.evaluationFindings && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4" />Résultat de l'évaluation</h4>
                      <p className="text-muted-foreground">{selected.evaluationFindings}</p>
                    </div>
                  )}

                  {/* Decision */}
                  {selected.decisionJustification && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium flex items-center gap-2 mb-2"><Gavel className="w-4 h-4" />Décision CAS</h4>
                      <p className="text-muted-foreground">{selected.decisionJustification}</p>
                      {selected.decisionByUser && <p className="text-xs text-muted-foreground mt-1">Par: {selected.decisionByUser.fullName}</p>}
                    </div>
                  )}

                  {/* Certificate */}
                  {selected.effectiveDate && (
                    <div className="border-t pt-3 space-y-1">
                      <h4 className="font-medium">Certificat de transfert</h4>
                      <div className="flex justify-between"><span className="text-muted-foreground">Date d'effet</span><span>{new Date(selected.effectiveDate).toLocaleDateString("fr-FR")}</span></div>
                      {selected.accreditationNumber && (
                        <div className="flex justify-between"><span className="text-muted-foreground">N° accréditation</span><span className="font-mono">{selected.accreditationNumber}</span></div>
                      )}
                    </div>
                  )}

                  {selected.status === "REJECTED" && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        Le demandeur sera traité comme un nouveau client conformément à la PRO 31.
                      </AlertDescription>
                    </Alert>
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
