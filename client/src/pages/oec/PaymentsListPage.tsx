import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, CreditCard, Eye } from "lucide-react";

interface Payment {
  id: number;
  requestId: number;
  amount: number;
  status: string;
  paymentDate?: string;
  createdAt: string;
  request?: {
    id: number;
    referenceNumber?: string;
    type: string;
  };
}

export default function PaymentsListPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (user && !authLoading) {
      loadPayments();
    }
  }, [user, authLoading]);

  // Rediriger vers login si non authentifié
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      // Récupérer les demandes de l'utilisateur
      const requestsRes = await fetch("/api/requests/my-requests", {
        credentials: "include"
      });

      if (requestsRes.status === 401 || requestsRes.status === 403) {
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        setLocation("/");
        return;
      }

      if (requestsRes.ok) {
        const requests = await requestsRes.json();
        
        // Pour chaque demande, récupérer son paiement
        const paymentsPromises = requests.map(async (request: any) => {
          try {
            const paymentRes = await fetch(`/api/payments/request/${request.id}`, {
              credentials: "include"
            });
            if (paymentRes.ok) {
              const payments = await paymentRes.json();
              return payments.map((p: any) => ({
                ...p,
                request: {
                  id: request.id,
                  referenceNumber: request.referenceNumber,
                  type: request.type
                }
              }));
            }
          } catch (error) {
            console.error("Erreur chargement paiement:", error);
          }
          return [];
        });

        const allPayments = await Promise.all(paymentsPromises);
        const flatPayments = allPayments.flat().filter(p => p);
        setPayments(flatPayments);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paiements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
      COMPLETED: { label: "Payé", className: "bg-green-100 text-green-800" },
      FAILED: { label: "Échoué", className: "bg-red-100 text-red-800" },
      CANCELLED: { label: "Annulé", className: "bg-gray-100 text-gray-800" }
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto max-w-6xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Mes Paiements
                </CardTitle>
                <CardDescription>
                  Historique et statut de vos paiements de frais d'enregistrement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun paiement trouvé</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence Demande</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.request?.referenceNumber || `#${payment.request?.id}`}
                          </TableCell>
                          <TableCell>{payment.request?.type}</TableCell>
                          <TableCell className="font-bold">{payment.amount.toLocaleString()} DA</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {payment.paymentDate 
                              ? new Date(payment.paymentDate).toLocaleDateString('fr-FR')
                              : new Date(payment.createdAt).toLocaleDateString('fr-FR')
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.status === 'PENDING' && (
                              <Button
                                size="sm"
                                onClick={() => setLocation(`/oec/payment/${payment.requestId}`)}
                              >
                                Payer
                              </Button>
                            )}
                            {payment.status === 'COMPLETED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setLocation(`/oec/payment/${payment.requestId}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
