import { useState, useEffect } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRightLeft, CheckCircle, Search, ClipboardCheck } from "lucide-react";

interface Transfer {
  id: number; transferCode: string; reason: string;
  sourceOecName: string; targetOecName: string; accreditationScope: string;
  status: string; createdAt: string;
}

export default function AccreditationTransferPage() {
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [selected, setSelected] = useState<Transfer | null>(null);
  const [reviewForm, setReviewForm] = useState({ evaluationRequired: false, findings: "" });
  const [decForm, setDecForm] = useState({ approved: true, conditions: "" });

  useEffect(() => { loadTransfers(); }, []);

  const loadTransfers = async () => {
    try { const res = await fetch("/api/transfers", { credentials: "include" }); const data = await res.json(); setTransfers(data.data || []);
    } catch { setTransfers([]); }
    setLoading(false);
  };

  const handleReview = async () => {
    if (!selected) return;
    try {
      await apiRequest("PUT", `/api/transfers/${selected.id}/review`, reviewForm);
      toast({ title: reviewForm.evaluationRequired ? "Évaluation requise" : "Envoyé au CAS" });
      setShowReview(false); loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleEvaluation = async (id: number) => {
    try { await apiRequest("PUT", `/api/transfers/${id}/evaluation`, { findings: "Évaluation de transfert satisfaisante" }); toast({ title: "Évaluation enregistrée" }); loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleDecision = async () => {
    if (!selected) return;
    try { await apiRequest("PUT", `/api/transfers/${selected.id}/decide`, { approved: decForm.approved, justification: decForm.conditions }); toast({ title: decForm.approved ? "Transfert approuvé" : "Transfert refusé" }); setShowDecision(false); loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleComplete = async (id: number) => {
    try { await apiRequest("PUT", `/api/transfers/${id}/complete`, {}); toast({ title: "Transfert complété" }); loadTransfers();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
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
    };
    const v = m[s] || { c: "bg-gray-100 text-gray-800", l: s };
    return <Badge className={v.c}>{v.l}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar /><div className="md:ml-64"><Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><ArrowRightLeft className="w-6 h-6 text-primary" />Transfert d'accréditation — PRO 31</h1>
              <p className="text-muted-foreground">Examiner et décider sur les demandes de transfert des OEC</p></div>
          </div>

          <Card>
            <CardHeader><CardTitle>Demandes de transfert</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Code</TableHead><TableHead>OEC source</TableHead><TableHead>OEC cible</TableHead>
                    <TableHead>Motif</TableHead><TableHead>Périmètre</TableHead><TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{transfers.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.transferCode}</TableCell>
                      <TableCell>{t.sourceOecName || (t as any).sourceOrganizationName}</TableCell>
                      <TableCell>{t.targetOecName || (t as any).targetOrganizationName}</TableCell>
                      <TableCell>{t.reason?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{t.accreditationScope || (t as any).transferredScope}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end flex-wrap">
                          {t.status === "DOCUMENTS_SUBMITTED" && 
                            <Button size="sm" variant="outline" onClick={() => { setSelected(t); setReviewForm({ evaluationRequired: false, findings: "" }); setShowReview(true); }}><Search className="w-3 h-3 mr-1" />Examiner</Button>
                          }
                          {t.status === "EVALUATION_REQUIRED" && <Button size="sm" onClick={() => handleEvaluation(t.id)}>Évaluer</Button>}
                          {t.status === "APPROVED" && <Button size="sm" onClick={() => handleComplete(t.id)}><CheckCircle className="w-3 h-3 mr-1" />Compléter</Button>}
                          {t.status === "CERTIFICATE_ISSUED" && <Button size="sm" onClick={() => handleComplete(t.id)}><CheckCircle className="w-3 h-3 mr-1" />Compléter</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog: Examiner le transfert */}
          <Dialog open={showReview} onOpenChange={setShowReview}>
            <DialogContent>
              <DialogHeader><DialogTitle>Examiner le transfert {selected?.transferCode}</DialogTitle>
                <DialogDescription>Analyser les documents de continuité et décider si une évaluation est nécessaire</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <div><Label>Constatations</Label>
                  <Textarea value={reviewForm.findings} onChange={(e) => setReviewForm({...reviewForm, findings: e.target.value})} placeholder="Résultat de l'examen des documents..." />
                </div>
                <div className="flex gap-3">
                  <Button variant={!reviewForm.evaluationRequired ? "default" : "outline"} onClick={() => setReviewForm({...reviewForm, evaluationRequired: false})} className="flex-1">
                    <ClipboardCheck className="w-4 h-4 mr-2" />Pas d'évaluation nécessaire
                  </Button>
                  <Button variant={reviewForm.evaluationRequired ? "default" : "outline"} onClick={() => setReviewForm({...reviewForm, evaluationRequired: true})} className="flex-1">
                    <Search className="w-4 h-4 mr-2" />Évaluation requise
                  </Button>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setShowReview(false)}>Annuler</Button>
                <Button onClick={handleReview} disabled={!reviewForm.findings}>Confirmer</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showDecision} onOpenChange={setShowDecision}>
            <DialogContent>
              <DialogHeader><DialogTitle>Décision sur le transfert {selected?.transferCode}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button variant={decForm.approved ? "default" : "outline"} onClick={() => setDecForm({...decForm, approved: true})} className="flex-1"><CheckCircle className="w-4 h-4 mr-2" />Approuver</Button>
                  <Button variant={!decForm.approved ? "destructive" : "outline"} onClick={() => setDecForm({...decForm, approved: false})} className="flex-1">Rejeter</Button>
                </div>
                <div><Label>Conditions</Label><Textarea value={decForm.conditions} onChange={(e) => setDecForm({...decForm, conditions: e.target.value})} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setShowDecision(false)}>Annuler</Button><Button onClick={handleDecision}>Confirmer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
