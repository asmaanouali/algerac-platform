import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, Eye, Users, UserMinus, UserPlus, Shield, FileText, Download, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { consumeDeepLinkedRequest } from "@/lib/ra-resume";

interface RecusationRequest {
  id: number;
  requestId: number;
  requestRef: string;
  oecName: string;
  teamId: number;
  recusationCount?: number;
  recusedMembers: Array<{ id: number; name: string; role: string; email: string }>;
  reason: string;
  proofDocuments?: Array<{ name: string; base64?: string; mimeType?: string }> | string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  raDecision?: string;
  createdAt: string;
  decidedAt?: string;
}

interface AvailableExpert {
  id: number;
  fullName: string;
  email: string;
  specialite: string;
  activeDossiers?: number;
}

function parseProofDocuments(raw: any): Array<{ name: string; base64?: string; mimeType?: string }> {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

export default function RecusationAnalysisPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [recusations, setRecusations] = useState<RecusationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecusation, setSelectedRecusation] = useState<RecusationRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [decisionDialog, setDecisionDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [raDecisionNote, setRaDecisionNote] = useState("");
  const [availableExperts, setAvailableExperts] = useState<AvailableExpert[]>([]);
  const [replacementMap, setReplacementMap] = useState<Record<number, number>>({});

  useEffect(() => {
    if (user && !authLoading) loadRecusations();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadRecusations = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/workflow/recusations");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setRecusations(list);
      consumeDeepLinkedRequest(list, (item) => {
        setSelectedRecusation(item);
        setDetailsOpen(true);
      }, "requestId");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur de chargement", description: err.message || "Impossible de charger les récusations." });
    } finally { setLoading(false); }
  };

  const loadAvailableExperts = async (teamId: number) => {
    try {
      const res = await apiRequest("GET", `/api/workflow/teams/${teamId}/available-replacements`);
      if (!res.ok) throw new Error(await res.text());
      setAvailableExperts(await res.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger la liste des experts disponibles." });
      setAvailableExperts([]);
    }
  };

  const handleAcceptRecusation = async () => {
    if (!selectedRecusation) return;
    const allReplaced = selectedRecusation.recusedMembers.every(m => replacementMap[m.id]);
    if (!allReplaced) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner un remplaçant pour chaque membre récusé." });
      return;
    }
    if (!raDecisionNote.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez justifier votre décision." });
      return;
    }
    setProcessing(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/recusations/${selectedRecusation.id}/accept`, {
        raDecision: raDecisionNote,
        replacements: Object.entries(replacementMap).map(([recusedId, replacementId]) => ({
          recusedMemberId: Number(recusedId),
          replacementExpertId: replacementId,
        })),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur lors du traitement");
      }
      toast({ title: "Récusation acceptée (PRO 22)", description: "Les membres ont été remplacés. Les nouveaux membres doivent signer leurs engagements (FOR 01-1). L'OEC sera notifié." });
      setDecisionDialog(false);
      setDetailsOpen(false);
      loadRecusations();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de traiter la récusation." });
    } finally { setProcessing(false); }
  };

  const handleRejectRecusation = async () => {
    if (!selectedRecusation || !raDecisionNote.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez justifier le rejet de la récusation." });
      return;
    }
    setProcessing(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/recusations/${selectedRecusation.id}/reject`, {
        raDecision: raDecisionNote,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur lors du traitement");
      }
      toast({ title: "Récusation rejetée (PRO 22)", description: "La récusation ne repose pas sur un conflit d'intérêt valide. L'équipe est maintenue. L'OEC sera notifié." });
      setDecisionDialog(false);
      setDetailsOpen(false);
      loadRecusations();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de traiter la récusation." });
    } finally { setProcessing(false); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge className="bg-yellow-500 text-white">En attente</Badge>;
      case "ACCEPTED": return <Badge className="bg-green-500 text-white">Acceptée</Badge>;
      case "REJECTED": return <Badge className="bg-red-500 text-white">Rejetée</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const pendingCount = recusations.filter(r => r.status === "PENDING").length;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">Analyse des Récusations (PRO 22)</h1>
                <p className="text-muted-foreground mt-2">
                  Examinez les demandes de récusation des OEC. Seul un conflit d'intérêt valide justifie l'acceptation. Chaque OEC peut récuser au maximum <strong>2 fois</strong>.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadRecusations} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {t("common.refresh")}
              </Button>
            </div>

            {pendingCount > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>{pendingCount} récusation{pendingCount > 1 ? "s" : ""}</strong> en attente de votre analyse.
                </AlertDescription>
              </Alert>
            )}

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">En attente</p><p className="text-2xl font-bold">{pendingCount}</p></div><UserMinus className="h-8 w-8 text-yellow-500" /></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Acceptées</p><p className="text-2xl font-bold">{recusations.filter(r => r.status === "ACCEPTED").length}</p></div><CheckCircle className="h-8 w-8 text-green-500" /></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Rejetées</p><p className="text-2xl font-bold">{recusations.filter(r => r.status === "REJECTED").length}</p></div><XCircle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
            </div>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Demandes de récusation ({recusations.length})</CardTitle>
                <CardDescription>Référence PRO 22 — Procédure de traitement des récusations ALGERAC</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : recusations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Aucune demande de récusation</p>
                    <p className="text-sm mt-1">Les récusations soumises par les OEC apparaîtront ici.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ref. Demande</TableHead>
                          <TableHead>OEC</TableHead>
                          <TableHead>Membres récusés</TableHead>
                          <TableHead>Nb. récus.</TableHead>
                          <TableHead>Documents</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recusations.map(r => {
                          const docs = parseProofDocuments(r.proofDocuments);
                          return (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-sm">{r.requestRef}</TableCell>
                            <TableCell className="font-medium">{r.oecName}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {r.recusedMembers.map(m => (
                                  <Badge key={m.id} variant="outline" className="mr-1">{m.name} ({m.role})</Badge>
                                ))}
                                {r.recusedMembers.length === 0 && <span className="text-xs text-muted-foreground">Membres remplacés</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.recusationCount && r.recusationCount >= 2 ? "destructive" : "secondary"}>
                                {r.recusationCount ?? 1}/2
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {docs.length > 0 ? (
                                <Badge className="bg-blue-100 text-blue-700">{docs.length} fichier(s)</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Aucun</span>
                              )}
                            </TableCell>
                            <TableCell>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : "—"}</TableCell>
                            <TableCell>{getStatusBadge(r.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedRecusation(r); setDetailsOpen(true); }}>
                                  <Eye className="w-4 h-4 mr-1" />Voir
                                </Button>
                                {r.status === "PENDING" && (
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setSelectedRecusation(r);
                                    setRaDecisionNote("");
                                    setReplacementMap({});
                                    loadAvailableExperts(r.teamId);
                                    setDecisionDialog(true);
                                  }}>
                                    Analyser
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Récusation — {selectedRecusation?.requestRef}</DialogTitle>
            <DialogDescription>Demande de <strong>{selectedRecusation?.oecName}</strong> — Récusation n°{selectedRecusation?.recusationCount ?? 1} sur 2 autorisées (PRO 22)</DialogDescription>
          </DialogHeader>
          {selectedRecusation && (
            <div className="space-y-4">
              {/* PRO 22 conflict of interest reminder */}
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-xs">
                  <strong>PRO 22 :</strong> La récusation n'est recevable que si elle repose sur un <strong>conflit d'intérêt</strong> (travail antérieur au sein de l'organisme, concurrent principal, différend passé, ou prestation de conseil fournie à l'OEC).
                </AlertDescription>
              </Alert>

              <div>
                <Label className="text-muted-foreground">Membres récusés</Label>
                <div className="mt-2 space-y-2">
                  {selectedRecusation.recusedMembers.length > 0 ? selectedRecusation.recusedMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 border rounded">
                      <UserMinus className="w-5 h-5 text-red-500" />
                      <div><p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.role} — {m.email}</p></div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground italic">Les membres récusés ont déjà été remplacés.</p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Motif de récusation invoqué par l'OEC</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded border">{selectedRecusation.reason || "Aucun motif fourni"}</p>
              </div>
              {(() => {
                const docs = parseProofDocuments(selectedRecusation.proofDocuments);
                return docs.length > 0 ? (
                  <div>
                    <Label className="text-muted-foreground">Documents de preuve fournis par l'OEC</Label>
                    <div className="mt-2 space-y-2">
                      {docs.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">{doc.name}</span>
                          </div>
                          {doc.base64 && (
                            <Button variant="ghost" size="sm" onClick={() => {
                              const byteChars = atob(doc.base64!);
                              const byteArr = new Uint8Array(byteChars.length);
                              for (let j = 0; j < byteChars.length; j++) byteArr[j] = byteChars.charCodeAt(j);
                              const blob = new Blob([byteArr], { type: doc.mimeType || "application/octet-stream" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url; a.download = doc.name; a.click();
                              URL.revokeObjectURL(url);
                            }}>
                              <Download className="w-4 h-4 mr-1" />Télécharger
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
              {selectedRecusation.raDecision && (
                <Alert className={selectedRecusation.status === "ACCEPTED" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    <strong>Décision RA ({selectedRecusation.decidedAt ? new Date(selectedRecusation.decidedAt).toLocaleDateString("fr-FR") : "—"}) :</strong> {selectedRecusation.raDecision}
                  </AlertDescription>
                </Alert>
              )}
              {selectedRecusation.status === "PENDING" && (
                <div className="pt-4 border-t">
                  <Button className="w-full" onClick={() => {
                    setRaDecisionNote("");
                    setReplacementMap({});
                    loadAvailableExperts(selectedRecusation.teamId);
                    setDecisionDialog(true);
                  }}>Analyser et décider</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog open={decisionDialog} onOpenChange={setDecisionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Analyse de la récusation (PRO 22)</DialogTitle>
            <DialogDescription>{selectedRecusation?.requestRef} — {selectedRecusation?.oecName}</DialogDescription>
          </DialogHeader>
          {selectedRecusation && (
            <div className="space-y-6 py-4">
              {/* Conflict of interest criteria reminder */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <strong>Critères de recevabilité (PRO 22) :</strong> L'évaluateur a travaillé au sein de l'organisme · Est un concurrent principal · A eu un différend avec lui · A fourni des prestations de conseil à l'OEC.
                </AlertDescription>
              </Alert>

              {/* Motif OEC */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Motif invoqué par l'OEC</Label>
                <p className="mt-1 text-sm bg-slate-50 p-3 rounded border whitespace-pre-wrap">{selectedRecusation.reason}</p>
              </div>

              <div>
                <Label className="font-semibold">Membres récusés — désignez un remplaçant pour chacun</Label>
                <p className="text-xs text-muted-foreground mt-1">Référez-vous à la liste des évaluateurs/experts (FOR 29). Seuls les experts disponibles non-membres de cette équipe sont listés.</p>
                <div className="space-y-3 mt-3">
                  {selectedRecusation.recusedMembers.map(m => (
                    <div key={m.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <UserMinus className="w-4 h-4 text-red-500" />
                        <span className="font-medium">{m.name}</span>
                        <Badge variant="outline">{m.role}</Badge>
                        <span className="text-xs text-muted-foreground">{m.email}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Remplaçant désigné (FOR 26 mis à jour) :</Label>
                        <Select value={replacementMap[m.id]?.toString() || ""} onValueChange={(v) => setReplacementMap(prev => ({ ...prev, [m.id]: Number(v) }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un expert depuis FOR 29..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableExperts.length === 0 ? (
                              <SelectItem value="_none" disabled>Aucun expert disponible</SelectItem>
                            ) : availableExperts.map(e => (
                              <SelectItem key={e.id} value={e.id.toString()}>
                                {e.fullName} — {e.specialite || "Spécialité non précisée"}
                                {e.activeDossiers ? ` (${e.activeDossiers} dossier(s) actif(s))` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Analyse et justification de la décision <span className="text-red-500">*</span></Label>
                <Textarea
                  value={raDecisionNote}
                  onChange={(e) => setRaDecisionNote(e.target.value)}
                  placeholder="Si vous acceptez : précisez pourquoi la récusation est fondée sur un conflit d'intérêt valide.&#10;Si vous rejetez : expliquez pourquoi la récusation n'est pas recevable et que l'équipe est maintenue."
                  rows={4}
                />
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800 text-xs">
                  Le devis estimatif (FOR 44) sera révisé si nécessaire suite aux modifications apportées (cf. Annexe 3 PRO 12).
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDecisionDialog(false)} disabled={processing}>Annuler</Button>
            <Button variant="destructive" onClick={handleRejectRecusation} disabled={processing || !raDecisionNote.trim()}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Rejeter — Maintenir l'équipe
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleAcceptRecusation} disabled={processing || !raDecisionNote.trim()}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Accepter — Remplacer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
