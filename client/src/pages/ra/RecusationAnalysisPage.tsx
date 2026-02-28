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
import { Loader2, CheckCircle, XCircle, Eye, Users, UserMinus, UserPlus, Shield, FileText, Download, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface RecusationRequest {
  id: number;
  requestId: number;
  requestRef: string;
  oecName: string;
  teamId: number;
  recusedMembers: Array<{ id: number; name: string; role: string; email: string }>;
  reason: string;
  proofDocuments?: Array<{ name: string; base64?: string; mimeType?: string }>;
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
      const data = await res.json();
      setRecusations(data);
    } catch {
      // Mock data
      setRecusations([
        {
          id: 1, requestId: 10, requestRef: "ACC-2026-010", oecName: "ENACT", teamId: 5,
          recusedMembers: [
            { id: 101, name: "Dr. Amani Saidi", role: "ET", email: "amani@eval.dz" }
          ],
          reason: "Conflit d'intérêts - l'évaluateur a travaillé avec notre laboratoire il y a moins de 2 ans.",
          proofDocuments: [
            { name: "Contrat_collaboration_2024.pdf", mimeType: "application/pdf" },
            { name: "Email_echange_commercial.pdf", mimeType: "application/pdf" }
          ],
          status: "PENDING", createdAt: "2026-02-20"
        },
        {
          id: 2, requestId: 12, requestRef: "ACC-2026-012", oecName: "CETIC", teamId: 7,
          recusedMembers: [
            { id: 102, name: "M. Karim Benali", role: "REE", email: "karim@eval.dz" },
            { id: 103, name: "Mme. Nadia Cherif", role: "EQ", email: "nadia@eval.dz" }
          ],
          reason: "Manque d'impartialité - les évaluateurs ont exprimé des avis négatifs publiquement sur notre organisme.",
          status: "ACCEPTED", raDecision: "Recusation acceptée - remplacement des membres par des évaluateurs sans lien avec l'organisme.",
          createdAt: "2026-02-10", decidedAt: "2026-02-12"
        },
        {
          id: 3, requestId: 14, requestRef: "ACC-2026-014", oecName: "LGCE", teamId: 9,
          recusedMembers: [
            { id: 104, name: "Dr. Salim Ouafik", role: "ET", email: "salim@eval.dz" }
          ],
          reason: "L'évaluateur est un concurrent direct dans notre domaine d'activité.",
          status: "REJECTED", raDecision: "Recusation rejetée - l'évaluateur n'exerce pas dans le même domaine de portée. L'équipe est maintenue.",
          createdAt: "2026-02-05", decidedAt: "2026-02-07"
        }
      ]);
    } finally { setLoading(false); }
  };

  const loadAvailableExperts = async (teamId: number) => {
    try {
      const res = await apiRequest("GET", `/api/workflow/teams/${teamId}/available-replacements`);
      setAvailableExperts(await res.json());
    } catch {
      setAvailableExperts([
        { id: 201, fullName: "Dr. Yacine Hamadi", email: "yacine@eval.dz", specialite: "ISO 17025" },
        { id: 202, fullName: "Mme. Leila Kaddour", email: "leila@eval.dz", specialite: "ISO 17020" },
        { id: 203, fullName: "M. Omar Djelloul", email: "omar@eval.dz", specialite: "ISO 17065" },
      ]);
    }
  };

  const handleAcceptRecusation = async () => {
    if (!selectedRecusation) return;
    // Check that all recused members have replacements
    const allReplaced = selectedRecusation.recusedMembers.every(m => replacementMap[m.id]);
    if (!allReplaced) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner un remplaçant pour chaque membre récusé." });
      return;
    }
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/workflow/recusations/${selectedRecusation.id}/accept`, {
        raDecision: raDecisionNote,
        replacements: Object.entries(replacementMap).map(([recusedId, replacementId]) => ({
          recusedMemberId: Number(recusedId),
          replacementExpertId: replacementId,
        })),
      });
      toast({ title: "Récusation acceptée", description: "Les membres ont été remplacés. L'OEC sera notifié de la nouvelle composition." });
      setDecisionDialog(false);
      setDetailsOpen(false);
      loadRecusations();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de traiter la récusation." });
    } finally { setProcessing(false); }
  };

  const handleRejectRecusation = async () => {
    if (!selectedRecusation || !raDecisionNote.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez justifier le rejet de la récusation." });
      return;
    }
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/workflow/recusations/${selectedRecusation.id}/reject`, {
        raDecision: raDecisionNote,
      });
      toast({ title: "Récusation rejetée", description: "L'OEC sera notifié que l'équipe est maintenue." });
      setDecisionDialog(false);
      setDetailsOpen(false);
      loadRecusations();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de traiter la récusation." });
    } finally { setProcessing(false); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge className="bg-yellow-500">En attente</Badge>;
      case "ACCEPTED": return <Badge className="bg-green-500">Acceptée</Badge>;
      case "REJECTED": return <Badge className="bg-red-500">Rejetée</Badge>;
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
            <div>
              <h1 className="text-3xl font-bold">Analyse des Récusations (PRO 22)</h1>
              <p className="text-muted-foreground mt-2">
                Examinez les demandes de récusation des OEC et décidez du remplacement ou du maintien des membres
              </p>
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
              <CardHeader><CardTitle>Demandes de récusation ({recusations.length})</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : recusations.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Aucune demande de récusation</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ref. Demande</TableHead>
                          <TableHead>OEC</TableHead>
                          <TableHead>Membres récusés</TableHead>
                          <TableHead>Documents</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recusations.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-sm">{r.requestRef}</TableCell>
                            <TableCell className="font-medium">{r.oecName}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {r.recusedMembers.map(m => (
                                  <Badge key={m.id} variant="outline" className="mr-1">{m.name} ({m.role})</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {r.proofDocuments && r.proofDocuments.length > 0 ? (
                                <Badge className="bg-blue-100 text-blue-700">{r.proofDocuments.length} fichier(s)</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Aucun</span>
                              )}
                            </TableCell>
                            <TableCell>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</TableCell>
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
                        ))}
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
            <DialogDescription>Demande de {selectedRecusation?.oecName}</DialogDescription>
          </DialogHeader>
          {selectedRecusation && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Membres récusés</Label>
                <div className="mt-2 space-y-2">
                  {selectedRecusation.recusedMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 border rounded">
                      <UserMinus className="w-5 h-5 text-red-500" />
                      <div><p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.role} — {m.email}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Motif de récusation</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded border">{selectedRecusation.reason}</p>
              </div>
              {selectedRecusation.proofDocuments && selectedRecusation.proofDocuments.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Documents de preuve</Label>
                  <div className="mt-2 space-y-2">
                    {selectedRecusation.proofDocuments.map((doc, i) => (
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
              )}
              {selectedRecusation.raDecision && (
                <Alert className={selectedRecusation.status === "ACCEPTED" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>
                    <strong>Décision RA ({selectedRecusation.decidedAt}) :</strong> {selectedRecusation.raDecision}
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
            <DialogTitle>Analyse de la récusation</DialogTitle>
            <DialogDescription>{selectedRecusation?.requestRef} — {selectedRecusation?.oecName}</DialogDescription>
          </DialogHeader>
          {selectedRecusation && (
            <div className="space-y-6 py-4">
              <div>
                <Label className="font-semibold">Membres récusés et remplacements proposés</Label>
                <div className="MT-3 space-y-3 mt-3">
                  {selectedRecusation.recusedMembers.map(m => (
                    <div key={m.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <UserMinus className="w-4 h-4 text-red-500" />
                        <span className="font-medium">{m.name}</span>
                        <Badge variant="outline">{m.role}</Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Remplaçant proposé :</Label>
                        <Select value={replacementMap[m.id]?.toString() || ""} onValueChange={(v) => setReplacementMap(prev => ({ ...prev, [m.id]: Number(v) }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un expert..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableExperts.map(e => (
                              <SelectItem key={e.id} value={e.id.toString()}>
                                {e.fullName} — {e.specialite}
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
                <Label>Analyse et justification <span className="text-red-500">*</span></Label>
                <Textarea value={raDecisionNote} onChange={(e) => setRaDecisionNote(e.target.value)} placeholder="Justifiez votre décision d'accepter ou de rejeter la récusation..." rows={4} />
              </div>
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
