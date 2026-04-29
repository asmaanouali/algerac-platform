import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ClipboardList } from "lucide-react";

export default function MissionOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/workflow/mission-orders/pending-approval", { credentials: "include" });
      if (res.ok) setOrders(await res.json());
    } catch (e) { }
    setLoading(false);
  };

  if (!user) return null;

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    DRAFT: { label: "Brouillon", variant: "secondary" },
    PENDING_DG_APPROVAL: { label: "En attente DG", variant: "default" },
    FULLY_APPROVED: { label: "Finalisé", variant: "outline" },
    SENT_TO_MEMBER: { label: "Envoyé", variant: "secondary" },
    REJECTED: { label: "Rejeté", variant: "destructive" },
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
            <h1 className="text-2xl font-bold">Ordres de Mission</h1>
            <p className="text-muted-foreground mt-1">Suivi des ordres de mission — signés par le DG (Étape 6)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" />Tous les ordres de mission</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
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
                      {orders.map((o: any) => (
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
                  <p className="text-center text-muted-foreground py-8">Aucun ordre de mission</p>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
