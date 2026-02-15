import { useState, useEffect } from "react";
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
import { Loader2, Building2, Stamp, CheckCircle2, XCircle, Clock, FileCheck, TrendingUp, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DGDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [ordersRes, reqRes] = await Promise.all([
        fetch("/api/workflow/mission-orders/pending-approval", { credentials: "include" }),
        fetch("/api/requests", { credentials: "include" }),
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (reqRes.ok) {
        const allReqs = await reqRes.json();
        setRequests(Array.isArray(allReqs) ? allReqs : []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDGApproval = async (orderId: number) => {
    setProcessing(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/mission-orders/${orderId}/approve-dg`, { notes: reviewNotes });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Ordre de mission approuvé par la DG" });
        setShowReview(false);
        setSelectedOrder(null);
        setReviewNotes("");
        loadData();
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  if (!user) return null;

  const pendingDG = orders.filter((o: any) => o.status === "DT_APPROVED");
  const allApproved = orders.filter((o: any) => ["FULLY_APPROVED", "SENT_TO_MEMBER", "IN_PROGRESS", "COMPLETED"].includes(o.status));
  const totalRequests = requests.length;
  const accredited = requests.filter((r: any) => r.status === "CAS_DECISION_GRANT").length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Direction Générale</h1>
                <p className="text-muted-foreground mt-1">{user.fullName} — Directrice Générale d'ALGERAC</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Ordres à signer</p><p className="text-2xl font-bold text-amber-600">{pendingDG.length}</p></div>
                    <Stamp className="w-8 h-8 text-amber-500/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Missions approuvées</p><p className="text-2xl font-bold">{allApproved.length}</p></div>
                    <CheckCircle2 className="w-8 h-8 text-green-500/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Dossiers actifs</p><p className="text-2xl font-bold">{totalRequests}</p></div>
                    <TrendingUp className="w-8 h-8 text-blue-500/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Accréditations délivrées</p><p className="text-2xl font-bold text-green-600">{accredited}</p></div>
                    <Award className="w-8 h-8 text-primary/60" />
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="pending">
                <TabsList className="mb-4">
                  <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-1" />En attente de signature ({pendingDG.length})</TabsTrigger>
                  <TabsTrigger value="approved"><CheckCircle2 className="w-4 h-4 mr-1" />Approuvés ({allApproved.length})</TabsTrigger>
                  <TabsTrigger value="overview"><TrendingUp className="w-4 h-4 mr-1" />Vue d'ensemble</TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ordres de Mission — Approbation DG</CardTitle>
                      <CardDescription>Les ordres déjà approuvés par la DT nécessitent votre signature finale</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pendingDG.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>N° Ordre</TableHead>
                              <TableHead>Dossier</TableHead>
                              <TableHead>Dates</TableHead>
                              <TableHead>Destination</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingDG.map((o: any) => (
                              <TableRow key={o.id}>
                                <TableCell className="font-medium">{o.orderNumber || `OM-${o.id}`}</TableCell>
                                <TableCell>Dossier #{o.requestId}</TableCell>
                                <TableCell className="text-sm">
                                  {o.startDate ? `${new Date(o.startDate).toLocaleDateString("fr-FR")} — ${new Date(o.endDate).toLocaleDateString("fr-FR")}` : "—"}
                                </TableCell>
                                <TableCell className="text-sm">{o.destination || "—"}</TableCell>
                                <TableCell>
                                  <Button size="sm" onClick={() => { setSelectedOrder(o); setShowReview(true); }}>
                                    <Stamp className="w-4 h-4 mr-1" />Signer
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun ordre en attente de votre signature</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="approved">
                  <Card>
                    <CardContent className="pt-6">
                      {allApproved.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>N° Ordre</TableHead>
                              <TableHead>Dossier</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
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
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun ordre approuvé</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader><CardTitle className="text-lg">Répartition des Dossiers</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { label: "En traitement", count: requests.filter((r: any) => !["CAS_DECISION_GRANT", "CAS_DECISION_REFUSAL", "REJECTED"].includes(r.status)).length, color: "bg-blue-500" },
                            { label: "Accrédités", count: accredited, color: "bg-green-500" },
                            { label: "Refusés", count: requests.filter((r: any) => ["CAS_DECISION_REFUSAL", "REJECTED"].includes(r.status)).length, color: "bg-red-500" },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${item.color}`} />
                              <span className="text-sm flex-1">{item.label}</span>
                              <span className="font-bold">{item.count}</span>
                            </div>
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
                              <div>
                                <p className="text-sm font-medium">{r.referenceNumber || `#${r.id}`}</p>
                                <p className="text-xs text-muted-foreground">{r.domain}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">{r.status}</Badge>
                            </div>
                          ))}
                          {requests.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune activité</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          <Dialog open={showReview} onOpenChange={setShowReview}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Signature DG — Ordre de Mission</DialogTitle>
                <DialogDescription>
                  {selectedOrder?.orderNumber || `OM-${selectedOrder?.id}`} — Dossier #{selectedOrder?.requestId}
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-muted-foreground">Dates</p>
                      <p>{selectedOrder.startDate ? `${new Date(selectedOrder.startDate).toLocaleDateString("fr-FR")} — ${new Date(selectedOrder.endDate).toLocaleDateString("fr-FR")}` : "—"}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p>{selectedOrder.destination || "—"}</p>
                    </div>
                  </div>
                  <div className="p-2 bg-green-50 rounded text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Déjà approuvé par la Direction Technique</span>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes de la DG (optionnel)</label>
                    <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Observations ou conditions..." rows={3} />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReview(false)}>Annuler</Button>
                <Button onClick={() => handleDGApproval(selectedOrder?.id)} disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Stamp className="w-4 h-4 mr-2" />}
                  Signer et Approuver
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
