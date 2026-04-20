import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, CreditCard, Eye, AlertTriangle } from "lucide-react";

interface Payment {
  id: number;
  requestId: number;
  amount: number;
  status: string;
  paymentType?: string;
  paymentDate?: string;
  createdAt: string;
  dueDate?: string;
  currency?: string;
  invoiceNumber?: string;
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
          }
          return [];
        });

        const allPayments = await Promise.all(paymentsPromises);
        const flatPayments = allPayments.flat().filter(p => p);
        setPayments(flatPayments);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les paiements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (p: Payment) => p.dueDate && new Date(p.dueDate) < new Date() && p.status === "PENDING";

  const fmtPaymentType = (t: string) => ({
    REGISTRATION_FEE: "Inscription dossier",
    EVALUATION_FEE: "Frais d'évaluation",
    ANNUAL_FEE: "Redevance annuelle",
    SURVEILLANCE_FEE: "Surveillance",
    RENEWAL_FEE: "Renouvellement",
    EXTENSION_FEE: "Extension de portée",
    SUSPENSION_LIFT_FEE: "Levée de suspension",
    TRANSFER_FEE: "Transfert forfaitaire",
    CERTIFICATE_DELIVERY_FEE: "Délivrance certificat",
    COMPLEMENTARY_EVAL_FEE: "Éval. complémentaire",
    ADDITIONAL_EVAL_FEE: "Éval. supplémentaire",
    MULTISITE_FEE: "Multi-sites",
  }[t] || t?.replace(/_/g, " ") || "—");

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      AWAITING_FEE_SETTING: { label: "En attente des frais", className: "bg-amber-100 text-amber-800" },
      PENDING: { label: "À payer", className: "bg-yellow-100 text-yellow-800" },
      PROOF_SUBMITTED: { label: "Preuve envoyée", className: "bg-blue-100 text-blue-800" },
      DAG_VALIDATED: { label: "Validé", className: "bg-green-100 text-green-800" },
      DAG_REJECTED: { label: "Rejeté - À resoumettre", className: "bg-red-100 text-red-800" },
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
                  Toutes vos factures : inscription, évaluation, redevance annuelle, etc. (PRO_18 / PRO_18-1)
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
                  <>
                    {payments.some(isOverdue) && (
                      <Alert className="mb-4 border-red-300 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-900">
                          <strong>Attention :</strong> Vous avez {payments.filter(isOverdue).length} facture(s) en retard de paiement.
                          Veuillez régulariser pour éviter l'interruption de votre dossier (PRO_18 §6).
                        </AlertDescription>
                      </Alert>
                    )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Type de frais</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Devise</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => {
                        const overdue = isOverdue(payment);
                        const dueDate = payment.dueDate ? new Date(payment.dueDate) : null;
                        const daysRemaining = dueDate ? Math.ceil((dueDate.getTime() - new Date().getTime()) / 86400000) : null;
                        return (
                        <TableRow key={payment.id} className={overdue ? "bg-red-50/60" : ""}>
                          <TableCell className="font-medium font-mono text-sm">
                            {payment.request?.referenceNumber || `#${payment.request?.id}`}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{payment.invoiceNumber || "—"}</TableCell>
                          <TableCell className="text-sm">{fmtPaymentType(payment.paymentType || "")}</TableCell>
                          <TableCell className="font-bold tabular-nums">{payment.amount.toLocaleString()} {payment.currency || "DZD"}</TableCell>
                          <TableCell className="font-mono text-xs">{payment.currency || "DZD"}</TableCell>
                          <TableCell className={`text-sm ${overdue ? "text-red-700 font-semibold" : daysRemaining !== null && daysRemaining <= 5 && daysRemaining >= 0 ? "text-amber-700 font-semibold" : ""}` }>
                            {dueDate ? dueDate.toLocaleDateString("fr-FR") : "—"}
                            {overdue && <div className="text-xs text-red-600">⚠ En retard</div>}
                            {!overdue && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 5 && (
                              <div className="text-xs text-amber-600">J−{daysRemaining}</div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-right">
                            {(payment.status === 'PENDING' || payment.status === 'DAG_REJECTED') && (
                              <Button
                                size="sm"
                                onClick={() => setLocation(`/oec/payment/${payment.requestId}`)}
                              >
                                Payer
                              </Button>
                            )}
                            {(payment.status === 'COMPLETED' || payment.status === 'DAG_VALIDATED' || payment.status === 'PROOF_SUBMITTED') && (
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
                        );
                      })}
                    </TableBody>
                  </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
