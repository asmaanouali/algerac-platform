import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, Stamp, CheckCircle2, XCircle, Clock, FileCheck, TrendingUp, Award, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DGDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [pendingValidation, setPendingValidation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [validationDecision, setValidationDecision] = useState("");
  const [validationComments, setValidationComments] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [ordersRes, reqRes, pendingRes] = await Promise.all([
        fetch("/api/workflow/mission-orders/pending-approval", { credentials: "include" }),
        fetch("/api/requests", { credentials: "include" }),
        fetch("/api/requests/pending-dg-validation", { credentials: "include" }),
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (reqRes.ok) { const d = await reqRes.json(); setRequests(Array.isArray(d) ? d : []); }
      if (pendingRes.ok) { const d = await pendingRes.json(); setPendingValidation(Array.isArray(d) ? d : []); }
    } catch (e) { }
    setLoading(false);
  };

  const handleDGApproval = async (orderId: number) => {
    setProcessing(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/mission-orders/${orderId}/approve-dg`, { notes: reviewNotes });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Ordre de mission approuvé" });
        setShowReview(false); setSelectedOrder(null); setReviewNotes(""); loadData();
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setProcessing(false);
  };

  const handleReceivabilityValidation = async () => {
    if (!validationDecision || !selectedRequest) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/requests/${selectedRequest.id}/dg-validate-receivability`, {
        approved: validationDecision === "approved",
        comments: validationComments,
      });
      toast({
        title: "Décision enregistrée",
        description: validationDecision === "approved" ? "Recevabilité validée" : "Recevabilité rejetée — le RA sera notifié",
      });
      setShowValidation(false); setSelectedRequest(null); setValidationDecision(""); setValidationComments(""); loadData();
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setProcessing(false);
  };

  if (!user) return null;
  const pendingDG = orders.filter((o: any) => o.status === "DT_APPROVED");
  const allApproved = orders.filter((o: any) => ["FULLY_APPROVED","SENT_TO_MEMBER","IN_PROGRESS","COMPLETED"].includes(o.status));
  const accredited = requests.filter((r: any) => r.status === "CAS_DECISION_GRANT").length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{t('dg_page.dashboardTitle')}</h1>
                <p className="text-muted-foreground mt-1">{user.fullName} — Directrice Générale d'ALGERAC</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Recevabilité à valider</p><p className="text-2xl font-bold text-purple-600">{pendingValidation.length}</p></div><ShieldCheck className="w-8 h-8 text-purple-500/60" /></CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Ordres à signer</p><p className="text-2xl font-bold text-amber-600">{pendingDG.length}</p></div><Stamp className="w-8 h-8 text-amber-500/60" /></CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Missions approuvées</p><p className="text-2xl font-bold">{allApproved.length}</p></div><CheckCircle2 className="w-8 h-8 text-green-500/60" /></CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Dossiers actifs</p><p className="text-2xl font-bold">{requests.length}</p></div><TrendingUp className="w-8 h-8 text-blue-500/60" /></CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Accréditations</p><p className="text-2xl font-bold text-green-600">{accredited}</p></div><Award className="w-8 h-8 text-primary/60" /></CardContent></Card>
              </div>

              <Tabs defaultValue="receivability">
                <TabsList className="mb-4">
                  <TabsTrigger value="receivability"><ShieldCheck className="w-4 h-4 mr-1" />Validation recevabilité ({pendingValidation.length})</TabsTrigger>
                  <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-1" />Ordres de mission ({pendingDG.length})</TabsTrigger>
                  <TabsTrigger value="approved"><CheckCircle2 className="w-4 h-4 mr-1" />Approuvés ({allApproved.length})</TabsTrigger>
                  <TabsTrigger value="overview"><TrendingUp className="w-4 h-4 mr-1" />Vue d'ensemble</TabsTrigger>
                </TabsList>

                {/* RECEIVABILITY VALIDATION TAB */}
                <TabsContent value="receivability">
                  <Card>
                    <CardHeader>
                      <CardTitle>Validation de Recevabilité</CardTitle>
                      <CardDescription>Validez ou rejetez la recevabilité des dossiers préparés par les RAs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pendingValidation.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Référence</TableHead>
                              <TableHead>OEC</TableHead>
                              <TableHead>Domaine</TableHead>
                              <TableHead>RA</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingValidation.map((r: any) => (
                              <TableRow key={r.id}>
                                <TableCell className="font-mono font-medium">{r.referenceNumber || `#${r.id}`}</TableCell>
                                <TableCell>{r.oec?.organizationName || r.oec?.fullName}</TableCell>
                                <TableCell>{r.domain}</TableCell>
                                <TableCell>{r.assignedRa?.fullName || "—"}</TableCell>
                                <TableCell>
                                  <Button size="sm" onClick={() => { setSelectedRequest(r); setValidationDecision(""); setValidationComments(""); setShowValidation(true); }}>
                                    <ShieldCheck className="w-4 h-4 mr-1" />Évaluer
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun dossier en attente de validation</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* MISSION ORDERS TAB */}
                <TabsContent value="pending">
                  <Card>
                    <CardHeader><CardTitle>Ordres de Mission — Signature DG</CardTitle><CardDescription>Ordres approuvés par la DT nécessitant votre signature</CardDescription></CardHeader>
                    <CardContent>
                      {pendingDG.length > 0 ? (
                        <Table>
                          <TableHeader><TableRow><TableHead>N° Ordre</TableHead><TableHead>Dossier</TableHead><TableHead>Dates</TableHead><TableHead>Destination</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {pendingDG.map((o: any) => (
                              <TableRow key={o.id}>
                                <TableCell className="font-medium">{o.orderNumber || `OM-${o.id}`}</TableCell>
                                <TableCell>Dossier #{o.requestId}</TableCell>
                                <TableCell className="text-sm">{o.startDate ? `${new Date(o.startDate).toLocaleDateString("fr-FR")} — ${new Date(o.endDate).toLocaleDateString("fr-FR")}` : "—"}</TableCell>
                                <TableCell className="text-sm">{o.destination || "—"}</TableCell>
                                <TableCell><Button size="sm" onClick={() => { setSelectedOrder(o); setShowReview(true); }}><Stamp className="w-4 h-4 mr-1" />Signer</Button></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun ordre en attente</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="approved">
                  <Card><CardContent className="pt-6">
                    {allApproved.length > 0 ? (
                      <Table>
                        <TableHeader><TableRow><TableHead>N° Ordre</TableHead><TableHead>Dossier</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {allApproved.map((o: any) => (
                            <TableRow key={o.id}>
                              <TableCell className="font-medium">{o.orderNumber || `OM-${o.id}`}</TableCell>
                              <TableCell>Dossier #{o.requestId}</TableCell>
                              <TableCell><Badge variant="outline">{o.status === "FULLY_APPROVED" ? "Finalisé" : o.status}</Badge></TableCell>
                              <TableCell className="text-sm">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("fr-FR") : "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : <p className="text-center text-muted-foreground py-8">Aucun ordre approuvé</p>}
                  </CardContent></Card>
                </TabsContent>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Répartition des Dossiers</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { label: "En traitement", count: requests.filter((r: any) => !["CAS_DECISION_GRANT","CAS_DECISION_REFUSAL","REJECTED","CLOSED"].includes(r.status)).length, color: "bg-blue-500" },
                            { label: "Accrédités", count: accredited, color: "bg-green-500" },
                            { label: "Refusés/Classés", count: requests.filter((r: any) => ["CAS_DECISION_REFUSAL","REJECTED","CLOSED"].includes(r.status)).length, color: "bg-red-500" },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${item.color}`} /><span className="text-sm flex-1">{item.label}</span><span className="font-bold">{item.count}</span></div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Activité Récente</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {requests.slice(0, 5).map((r: any) => (
                            <div key={r.id} className="flex items-center justify-between p-2 border rounded">
                              <div><p className="text-sm font-medium">{r.referenceNumber || `#${r.id}`}</p><p className="text-xs text-muted-foreground">{r.domain}</p></div>
                              <Badge variant="outline" className="text-xs">{r.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* Mission Order Signing Dialog */}
          <Dialog open={showReview} onOpenChange={setShowReview}>
            <DialogContent>
              <DialogHeader><DialogTitle>Signature DG — Ordre de Mission</DialogTitle><DialogDescription>{selectedOrder?.orderNumber || `OM-${selectedOrder?.id}`} — Dossier #{selectedOrder?.requestId}</DialogDescription></DialogHeader>
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-gray-50 rounded"><p className="text-xs text-muted-foreground">Dates</p><p>{selectedOrder.startDate ? `${new Date(selectedOrder.startDate).toLocaleDateString("fr-FR")} — ${new Date(selectedOrder.endDate).toLocaleDateString("fr-FR")}` : "—"}</p></div>
                    <div className="p-2 bg-gray-50 rounded"><p className="text-xs text-muted-foreground">Destination</p><p>{selectedOrder.destination || "—"}</p></div>
                  </div>
                  <div className="p-2 bg-green-50 rounded text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /><span>Approuvé par la DT</span></div>
                  <div><label className="text-sm font-medium">Notes (optionnel)</label><Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Observations..." rows={3} /></div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReview(false)}>Annuler</Button>
                <Button onClick={() => handleDGApproval(selectedOrder?.id)} disabled={processing}>{processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Stamp className="w-4 h-4 mr-2" />}Signer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Receivability Validation Dialog */}
          <Dialog open={showValidation} onOpenChange={setShowValidation}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Validation de Recevabilité — DG</DialogTitle><DialogDescription>Évaluez et validez la recevabilité de ce dossier</DialogDescription></DialogHeader>
              {selectedRequest && (
                <div className="space-y-4 py-4">
                  <div className="border rounded-lg p-4 bg-muted/50 grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Référence:</span><p className="font-mono font-medium">{selectedRequest.referenceNumber}</p></div>
                    <div><span className="text-muted-foreground">OEC:</span><p className="font-medium">{selectedRequest.oec?.organizationName}</p></div>
                    <div><span className="text-muted-foreground">Domaine:</span><p className="font-medium">{selectedRequest.domain}</p></div>
                    <div><span className="text-muted-foreground">RA:</span><p className="font-medium">{selectedRequest.assignedRa?.fullName || "—"}</p></div>
                  </div>
                  <div className="space-y-3">
                    <Label>Décision *</Label>
                    <RadioGroup value={validationDecision} onValueChange={setValidationDecision}>
                      <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="approved" id="dg-a" /><Label htmlFor="dg-a" className="flex items-center gap-2 cursor-pointer flex-1"><CheckCircle2 className="h-5 w-5 text-green-600" /><div><p className="font-medium">Valider la recevabilité</p><p className="text-sm text-muted-foreground">Le dossier est conforme et peut passer à la contractualisation</p></div></Label></div>
                      <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="rejected" id="dg-r" /><Label htmlFor="dg-r" className="flex items-center gap-2 cursor-pointer flex-1"><XCircle className="h-5 w-5 text-red-600" /><div><p className="font-medium">Rejeter</p><p className="text-sm text-muted-foreground">Le dossier nécessite des corrections supplémentaires</p></div></Label></div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2"><Label>Commentaires</Label><Textarea value={validationComments} onChange={(e) => setValidationComments(e.target.value)} placeholder="Observations de la Direction Générale..." rows={4} /></div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowValidation(false)} disabled={processing}>Annuler</Button>
                <Button onClick={handleReceivabilityValidation} disabled={processing || !validationDecision}>
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  {validationDecision === "approved" ? "Valider" : "Rejeter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
