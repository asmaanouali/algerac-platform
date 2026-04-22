import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRightLeft, Plus, Eye,
  AlertTriangle, CheckCircle, XCircle, ShieldAlert
} from "lucide-react";

interface Transfer {
  id: number; transferCode: string; reason: string; reasonDetails: string;
  sourceOrganizationName: string; targetOrganizationName: string; transferredScope: string;
  status: string; createdAt: string; continuityAssessment: string;
  managementSystemContinuity: boolean; personnelContinuity: boolean; equipmentContinuity: boolean;
  impartialityCompliance: boolean; assessmentMethodsContinuity: boolean;
  riskAnalysis: string; lastEvaluationStatus: string; financialRegularized: boolean;
  targetIsNewEntity: boolean; fullScopeTransfer: boolean; scopeModifications: string;
  decisionJustification: string; effectiveDate: string; accreditationNumber: string;
  feasibilityStudy: string; evaluationFindings: string; evaluationRequired: boolean;
  decisionByUser: { id: number; fullName: string } | null;
}

export default function TransferRequestPage() {
  const [, setLocation] = useLocation();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);

  useEffect(() => { loadTransfers(); }, []);

  const loadTransfers = async () => {
    try {
      const res = await fetch("/api/transfers/mine", { credentials: "include" });
      const data = await res.json();
      setTransfers(data.data || []);
    } catch { setTransfers([]); }
    setLoading(false);
  };

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
    PARENT_REORGANIZATION: "Réorganisation société mère",
    SUBSIDIARY_CREATION: "Création de filiale",
    SCOPE_CESSION: "Cession de portée",
    MERGER: "Fusion de deux OEC",
    LEGAL_RESTRUCTURING: "Restructuration juridique",
    ACQUISITION: "Acquisition",
    NAME_CHANGE: "Changement de nom",
    LOCATION_CHANGE: "Changement de localisation",
    SPIN_OFF: "Scission",
    OTHER: "Autre",
  };

  const Indicator = ({ value, label }: { value: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {value ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
      <span className={value ? "text-green-700" : "text-red-600"}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar /><div className="md:ml-64"><Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-primary" />Transfert d'accréditation
              </h1>
              <p className="text-muted-foreground">Demander le transfert de votre accréditation</p>
            </div>
            <Button onClick={() => setLocation("/oec/transfert/nouveau")}>
              <Plus className="w-4 h-4 mr-2" />Demander un transfert
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Mes demandes de transfert</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> :
              transfers.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucune demande de transfert</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Code</TableHead><TableHead>OEC cible</TableHead>
                    <TableHead>Motif</TableHead><TableHead>Périmètre</TableHead>
                    <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{transfers.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.transferCode}</TableCell>
                      <TableCell>{t.targetOrganizationName}</TableCell>
                      <TableCell>{reasonLabel[t.reason] || t.reason?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{t.transferredScope}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => { setSelected(t); setShowDetail(true); }}>
                          <Eye className="w-3 h-3 mr-1" />Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog: Détails du transfert */}
          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Transfert {selected?.transferCode}</DialogTitle>
              </DialogHeader>
              {selected && (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Statut</span>{getStatusBadge(selected.status)}</div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Motif</span><span>{reasonLabel[selected.reason] || selected.reason}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">OEC cible</span><span>{selected.targetOrganizationName}</span></div>
                  {selected.targetIsNewEntity && (
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Organisme en cours de création</Badge>
                  )}
                  <div><span className="text-muted-foreground">Périmètre</span><p className="mt-1">{selected.transferredScope}</p></div>
                  {selected.reasonDetails && <div><span className="text-muted-foreground">Justification</span><p className="mt-1">{selected.reasonDetails}</p></div>}

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
                      <h4 className="font-medium">Évaluation de continuité</h4>
                      <p className="text-muted-foreground">{selected.continuityAssessment}</p>
                      <Indicator value={selected.managementSystemContinuity} label="Système de management" />
                      <Indicator value={selected.personnelContinuity} label="Personnel clé" />
                      <Indicator value={selected.equipmentContinuity} label="Équipements et locaux" />
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <Indicator value={selected.financialRegularized} label="Situation financière régularisée" />
                  </div>

                  {selected.feasibilityStudy && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium">Étude de faisabilité (FOR 86)</h4>
                      <p className="text-muted-foreground mt-1">{selected.feasibilityStudy}</p>
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
                      {selected.decisionByUser && (
                        <p className="text-xs text-muted-foreground mt-1">Par: {selected.decisionByUser.fullName}</p>
                      )}
                    </div>
                  )}

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
                        Conformément à la PRO 31, votre demande sera traitée comme un nouveau client.
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
