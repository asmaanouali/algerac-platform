import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";

export default function PaymentPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [request, setRequest] = useState<any>(null);

  useEffect(() => {
    if (user && !authLoading) {
      loadPaymentInfo();
    }
  }, [requestId, user, authLoading]);

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

  const loadPaymentInfo = async () => {
    try {
      // Charger les infos de la demande
      const requestRes = await fetch(`/api/requests/${requestId}`, {
        credentials: "include"
      });
      if (requestRes.ok) {
        setRequest(await requestRes.json());
      }

      // Charger les infos de paiement
      const paymentRes = await fetch(`/api/payments/request/${requestId}`, {
        credentials: "include"
      });
      if (paymentRes.ok) {
        const payments = await paymentRes.json();
        if (payments.length > 0) {
          setPayment(payments[0]);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Si pas de payment, créer un d'abord
      let paymentId = payment?.id;
      
      if (!paymentId) {
        toast({
          title: "Création du paiement...",
          description: "Préparation de la transaction",
        });
        
        const createRes = await fetch(`/api/requests/${requestId}/payment`, {
          method: "POST",
          credentials: "include"
        });
        
        if (!createRes.ok) {
          throw new Error("Erreur lors de la création du paiement");
        }
        
        const newPayment = await createRes.json();
        paymentId = newPayment.id;
        setPayment(newPayment);
      }
      
      // Simuler un paiement (dans un vrai système, on utiliserait une API de paiement)
      const transactionId = `TXN-${Date.now()}`;
      
      const res = await fetch(`/api/payments/${paymentId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          paymentMethod: "CARD",
          transactionId: transactionId
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors du paiement");
      }

      toast({
        title: "✅ Paiement simulé avec succès !",
        description: "Votre demande est maintenant prête pour l'attribution à un expert. Redirection...",
      });

      setTimeout(() => {
        setLocation("/oec/dashboard");
      }, 2000);

    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const isPaid = payment?.status === "COMPLETED";

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="container mx-auto max-w-2xl">
              <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPaid ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                Paiement effectué
              </>
            ) : (
              <>
                <CreditCard className="h-6 w-6" />
                Paiement des frais d'enregistrement
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isPaid 
              ? "Le paiement a été effectué avec succès. Votre demande est en cours de traitement."
              : "Veuillez effectuer le paiement pour que votre demande soit traitée."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {request && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type de demande:</span>
                <span className="font-medium">{request.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Domaine:</span>
                <span className="font-medium">{request.domain}</span>
              </div>
            </div>
          )}

          {payment && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-medium">Montant à payer:</span>
                <span className="font-bold">{payment.amount} DA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type de frais:</span>
                <span className="text-sm">Frais d'enregistrement</span>
              </div>
              {isPaid && payment.transactionId && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transaction ID:</span>
                  <span className="text-sm font-mono">{payment.transactionId}</span>
                </div>
              )}
            </div>
          )}

          {!isPaid && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-900">
                <strong>Mode Simulation :</strong> Cliquez sur le bouton ci-dessous pour simuler le paiement et continuer le workflow.
              </AlertDescription>
            </Alert>
          )}

          {isPaid && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-900">
                ✅ Le paiement a déjà été effectué. Vous pouvez retourner au tableau de bord.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/oec/dashboard")}
          >
            Retour au tableau de bord
          </Button>
          {!isPaid && (
            <Button 
              onClick={handlePayment} 
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {processing ? "Traitement..." : "💳 Simuler le paiement"}
            </Button>
          )}
        </CardFooter>
      </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
