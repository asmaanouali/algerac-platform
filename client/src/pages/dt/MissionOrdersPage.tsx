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
import { Loader2, FileCheck, CheckCircle2, XCircle, Clock, Stamp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function MissionOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/workflow/mission-orders/pending-approval", { credentials: "include" });
      if (res.ok) setOrders(await res.json());
    } catch (e) { }
    setLoading(false);
  };

  const handleApproval = async (approved: boolean) => {
    if (!selectedOrder) return;
    setProcessing(true);
    try {
      const endpoint = approved
        ? `/api/workflow/mission-orders/${selectedOrder.id}/approve-dt`
        : `/api/workflow/mission-orders/${selectedOrder.id}/reject`;
      const res = await apiRequest("POST", endpoint, { notes: reviewNotes });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: approved ? "Ordre de mission approuvé (DT)" : "Ordre de mission rejeté"
        });
        setShowReview(false);
        setSelectedOrder(null);
        setReviewNotes("");
        loadOrders();
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const handleDGApproval = async (orderId: number) => {
    try {
      const res = await apiRequest("POST", `/api/workflow/mission-orders/${orderId}/approve-dg`);
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Approbation DG enregistrée — Ordre de mission finalisé" });
        loadOrders();
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  const pendingDT = orders.filter((o: any) => o.status === "PENDING_DT_APPROVAL");
  const pendingDG = orders.filter((o: any) => o.status === "PENDING_DG_APPROVAL");
  const processed = orders.filter((o: any) => !["PENDING_DT_APPROVAL", "PENDING_DG_APPROVAL"].includes(o.status));

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    DRAFT: { label: "Brouillon", variant: "secondary" },
    PENDING_DT_APPROVAL: { label: "En attente DT", variant: "default" },
    DT_APPROVED: { label: "Approuvé DT", variant: "outline" },
    PENDING_DG_APPROVAL: { label: "En attente DG", variant: "default" },
    FULLY_APPROVED: { label: "Finalisé", variant: "outline" },
    SENT_TO_MEMBER: { label: "Envoyé", variant: "secondary" },
    IN_PROGRESS: { label: "En cours", variant: "default" },
    COMPLETED: { label: "Terminé", variant: "outline" },
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Ordres de Mission</h1>
            <p className="text-muted-foreground mt-1">Approuvez les ordres de mission pour les évaluateurs (Étape 6)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">En attente DT</p><p className="text-2xl font-bold">{pendingDT.length}</p></div>
                    <Clock className="w-8 h-8 text-amber-500/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">En attente DG</p><p className="text-2xl font-bold">{pendingDG.length}</p></div>
                    <Stamp className="w-8 h-8 text-blue-500/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Traités</p><p className="text-2xl font-bold">{processed.length}</p></div>
                    <CheckCircle2 className="w-8 h-8 text-green-500/60" />
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="pending-dt">
                <TabsList className="mb-4">
                  <TabsTrigger value="pending-dt">Approbation DT ({pendingDT.length})</TabsTrigger>
                  <TabsTrigger value="pending-dg">Approbation DG ({pendingDG.length})</TabsTrigger>
                  <TabsTrigger value="processed">Historique ({processed.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending-dt">
                  <Card>
                    <CardContent className="pt-6">
                      {pendingDT.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>N° Ordre</TableHead>
                              <TableHead>Dossier</TableHead>
                              <TableHead>Dates</TableHead>
                              <TableHead>Lieu</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingDT.map((o: any) => (
                              <TableRow key={o.id}>
                                <TableCell className="font-medium">{o.orderNumber || `OM-${o.id}`}</TableCell>
                                <TableCell>Dossier #{o.requestId}</TableCell>
                                <TableCell className="text-sm">
                                  {o.startDate ? `${new Date(o.startDate).toLocaleDateString("fr-FR")} — ${new Date(o.endDate).toLocaleDateString("fr-FR")}` : "—"}
                                </TableCell>
                                <TableCell className="text-sm">{o.destination || "—"}</TableCell>
                                <TableCell>
                                  <Button size="sm" onClick={() => { setSelectedOrder(o); setShowReview(true); }}>
                                    <FileCheck className="w-4 h-4 mr-1" />Examiner
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun ordre en attente d'approbation DT</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pending-dg">
                  <Card>
                    <CardContent className="pt-6">
                      {pendingDG.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>N° Ordre</TableHead>
                              <TableHead>Dossier</TableHead>
                              <TableHead>Dates</TableHead>
                              <TableHead>Statut</TableHead>
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
                                <TableCell>
                                  <Badge variant="outline" className="text-blue-600 border-blue-300">En attente DG</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun ordre en attente d'approbation DG</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="processed">
                  <Card>
                    <CardContent className="pt-6">
                      {processed.length > 0 ? (
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
                            {processed.map((o: any) => (
                              <TableRow key={o.id}>
                                <TableCell className="font-medium">{o.orderNumber || `OM-${o.id}`}</TableCell>
                                <TableCell>Dossier #{o.requestId}</TableCell>
                                <TableCell>
                                  <Badge variant={statusLabels[o.status]?.variant || "outline"}>
                                    {statusLabels[o.status]?.label || o.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {o.createdAt ? new Date(o.createdAt).toLocaleDateString("fr-FR") : "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun ordre traité</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}

          <Dialog open={showReview} onOpenChange={setShowReview}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Examen de l'Ordre de Mission</DialogTitle>
                <DialogDescription>
                  {selectedOrder?.orderNumber || `OM-${selectedOrder?.id}`} — Dossier #{selectedOrder?.requestId}
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-muted-foreground">Dates</p>
                      <p>{selectedOrder.startDate ? `${new Date(selectedOrder.startDate).toLocaleDateString("fr-FR")} — ${new Date(selectedOrder.endDate).toLocaleDateString("fr-FR")}` : "Non définies"}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p>{selectedOrder.destination || "—"}</p>
                    </div>
                  </div>
                  {selectedOrder.transportMode && (
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      <p className="text-xs text-muted-foreground">Mode de transport</p>
                      <p>{selectedOrder.transportMode}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Notes d'approbation</label>
                    <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Observations ou conditions..." rows={3} />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => handleApproval(false)} disabled={processing}>
                  <XCircle className="w-4 h-4 mr-1" />Rejeter
                </Button>
                <Button onClick={() => handleApproval(true)} disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Approuver
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
