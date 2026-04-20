import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Stamp, CheckCircle2, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DGMissionOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/workflow/mission-orders/pending-approval", { credentials: "include" });
      if (res.ok) setOrders(await res.json());
    } catch (e) { }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    setProcessing(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/mission-orders/${selectedOrder.id}/approve-dg`, { notes });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Ordre de mission approuvé par DG — Finalisé" });
        setShowDialog(false);
        setSelectedOrder(null);
        setNotes("");
        loadOrders();
      } else {
        toast({ title: "Erreur", description: data.error || "Erreur inconnue", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  if (!user) return null;

  const pending = orders.filter((o: any) => o.status === "PENDING_DG_APPROVAL");
  const processed = orders.filter((o: any) => o.status !== "PENDING_DG_APPROVAL");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Approbation DG — Ordres de Mission</h1>
            <p className="text-muted-foreground mt-1">Donnez la validation finale des ordres de mission (Étape 6.3)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">En attente de votre approbation</p>
                      <p className="text-3xl font-bold text-amber-600">{pending.length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-400/60" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Finalisés</p>
                      <p className="text-3xl font-bold text-green-600">{processed.filter(o => o.status === "FULLY_APPROVED").length}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-400/60" />
                  </CardContent>
                </Card>
              </div>

              {/* Pending DG approval */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stamp className="w-5 h-5 text-blue-600" />
                    En attente d'approbation DG ({pending.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pending.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Ordre</TableHead>
                          <TableHead>Dossier</TableHead>
                          <TableHead>Détails</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pending.map((o: any) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-medium">{o.orderNumber || `OM-${o.id}`}</TableCell>
                            <TableCell>Dossier #{o.requestId}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                              {o.missionDetails || "—"}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => { setSelectedOrder(o); setShowDialog(true); }}>
                                <Stamp className="w-4 h-4 mr-1" />Approuver DG
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Aucun ordre en attente de votre approbation</p>
                  )}
                </CardContent>
              </Card>

              {/* History */}
              {processed.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Historique ({processed.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Ordre</TableHead>
                          <TableHead>Dossier</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processed.map((o: any) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-medium">{o.orderNumber || `OM-${o.id}`}</TableCell>
                            <TableCell>Dossier #{o.requestId}</TableCell>
                            <TableCell>
                              <Badge variant={o.status === "FULLY_APPROVED" ? "default" : "secondary"}>
                                {o.status === "FULLY_APPROVED" ? "Finalisé" :
                                 o.status === "SENT_TO_MEMBER" ? "Envoyé au membre" : o.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approbation DG</DialogTitle>
                <DialogDescription>
                  {selectedOrder?.orderNumber || `OM-${selectedOrder?.id}`} — Dossier #{selectedOrder?.requestId}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {selectedOrder?.missionDetails && (
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Détails de la mission</p>
                    <p>{selectedOrder.missionDetails}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Notes (optionnel)</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observations..." rows={3} className="mt-1" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
                <Button onClick={handleApprove} disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Confirmer l'approbation DG
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
