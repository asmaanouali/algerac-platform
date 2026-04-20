import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, CreditCard, CheckCircle, Upload, AlertTriangle, Clock, XCircle, Building2, Globe2, FileText, Calendar } from "lucide-react";

export default function PaymentPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [request, setRequest] = useState<any>(null);
  const [transactionId, setTransactionId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !authLoading) {
      loadPaymentInfo();
    }
  }, [requestId, user, authLoading]);

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
      const requestRes = await fetch(`/api/requests/${requestId}`, {
        credentials: "include"
      });
      if (requestRes.ok) {
        setRequest(await requestRes.json());
      }

      const paymentRes = await fetch(`/api/payments/request/${requestId}`, {
        credentials: "include"
      });
      if (paymentRes.ok) {
        const payments = await paymentRes.json();
        if (payments.length > 0) {
          // Priorité : paiement en attente (PENDING/DAG_REJECTED) > preuve soumise > reste
          const actionable = payments.find((p: any) => p.status === "PENDING" || p.status === "DAG_REJECTED");
          setPayment(actionable || payments[payments.length - 1]);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res((r.result as string).split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const handleSubmitProof = async () => {
    if (!transactionId.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir l'identifiant de la transaction",
        variant: "destructive",
      });
      return;
    }

    if (!proofFile) {
      toast({
        title: "Erreur",
        description: "Veuillez joindre une preuve de paiement",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const proofBase64 = await fileToBase64(proofFile);

      const res = await fetch(`/api/payments/${payment.id}/submit-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          transactionId: transactionId.trim(),
          proofBase64,
          proofName: proofFile.name,
          proofMimeType: proofFile.type,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de la soumission");
      }

      toast({
        title: "Preuve de paiement soumise",
        description: "Le DAG va vérifier votre paiement. Vous serez notifié du résultat.",
      });

      await loadPaymentInfo();
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

  const status = payment?.status;
  const isAwaitingFees = status === "AWAITING_FEE_SETTING";
  const isPending = status === "PENDING" || status === "DAG_REJECTED";
  const isProofSubmitted = status === "PROOF_SUBMITTED";
  const isValidated = status === "DAG_VALIDATED" || status === "COMPLETED";
  const isRejected = status === "DAG_REJECTED";

  const currency = payment?.currency || "DZD";
  const isNational = currency === "DZD";

  const dueDate = payment?.dueDate ? new Date(payment.dueDate) : null;
  const now = new Date();
  const isOverdue = dueDate && dueDate < now && isPending;
  const daysRemaining = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / 86400000) : null;

  const fmtPaymentType = (t: string) => ({
    REGISTRATION_FEE: "Frais d'inscription dossier (§5.1)",
    EVALUATION_FEE: "Frais d'évaluation (§5.2)",
    ANNUAL_FEE: "Redevance annuelle (§5.5)",
    SURVEILLANCE_FEE: "Frais de surveillance (§5.6)",
    RENEWAL_FEE: "Frais de renouvellement (§5.7)",
    EXTENSION_FEE: "Frais d'extension de portée (§5.8)",
    SUSPENSION_LIFT_FEE: "Frais de levée de suspension (§5.11)",
    TRANSFER_FEE: "Transfert forfaitaire (§5.12)",
    CERTIFICATE_DELIVERY_FEE: "Délivrance / modification certificat (§5.4)",
    COMPLEMENTARY_EVAL_FEE: "Frais d'évaluation complémentaire (§5.9)",
    ADDITIONAL_EVAL_FEE: "Frais d'évaluation supplémentaire (§5.10)",
    MULTISITE_FEE: "Frais multi-sites (§5.13)",
  }[t] || t.replace(/_/g, " "));

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
            <div className="container mx-auto max-w-2xl space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isValidated ? (
                      <>
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        Paiement validé
                      </>
                    ) : isProofSubmitted ? (
                      <>
                        <Clock className="h-6 w-6 text-blue-600" />
                        En attente de vérification
                      </>
                    ) : isAwaitingFees ? (
                      <>
                        <Clock className="h-6 w-6 text-amber-600" />
                        En attente de fixation des frais
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-6 w-6" />
                        {payment?.paymentType === "EVALUATION_FEE" ? "Frais d'évaluation" : "Frais d'enregistrement du dossier"}
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isValidated 
                      ? "Le paiement a été validé par le DAG. Votre dossier est en cours de traitement."
                      : isProofSubmitted
                      ? "Votre preuve de paiement a été reçue et est en cours de vérification par le DAG."
                      : isAwaitingFees
                      ? "Le DAG est en train de fixer les frais d'enregistrement de votre dossier. Vous serez notifié dès qu'ils seront prêts."
                      : "Veuillez effectuer le paiement et soumettre votre preuve pour que votre dossier soit traité."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Info demande */}
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
                      {request.referenceNumber && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Référence:</span>
                          <span className="font-medium font-mono">{request.referenceNumber}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Numéro de facture & échéance */}
                  {payment && !isAwaitingFees && (
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-medium">Montant à payer :</span>
                        <span className="font-bold text-xl">{Number(payment.amount).toLocaleString()} {currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Type de frais :</span>
                        <span className="text-sm font-medium">{fmtPaymentType(payment.paymentType)}</span>
                      </div>
                      {payment.invoiceNumber && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" />N° Facture :</span>
                          <span className="text-sm font-mono font-semibold">{payment.invoiceNumber}</span>
                        </div>
                      )}
                      {dueDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />Échéance :</span>
                          <span className={`text-sm font-semibold ${isOverdue ? "text-red-600" : daysRemaining !== null && daysRemaining <= 5 ? "text-amber-600" : "text-foreground"}`}>
                            {dueDate.toLocaleDateString("fr-FR")}
                            {isOverdue
                              ? ` — ⚠ Dépassée de ${Math.abs(daysRemaining ?? 0)}j`
                              : daysRemaining !== null && daysRemaining >= 0
                              ? ` — J−${daysRemaining}`
                              : ""}
                          </span>
                        </div>
                      )}
                      {payment.transactionId && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Transaction ID :</span>
                          <span className="text-sm font-mono">{payment.transactionId}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Overdue alert */}
                  {isOverdue && (
                    <Alert className="bg-red-50 border-red-400">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-900">
                        <strong>Paiement en retard !</strong> La date d'échéance du {dueDate?.toLocaleDateString("fr-FR")} est dépassée.
                        Veuillez régulariser immédiatement pour éviter l'interruption de votre dossier (PRO_18 §6).
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Bank details block */}
                  {isPending && (
                    <div className="border rounded-lg overflow-hidden">
                      {isNational ? (
                        <div className="p-4 bg-blue-50/60">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-blue-900">Virement bancaire — OEC National — DZD</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Banque :</span><span className="font-medium">Crédit Populaire d'Algérie (CPA)</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">N° Compte :</span><span className="font-mono font-semibold">007 00400 2500001 02 67</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Bénéficiaire :</span><span className="font-medium">ALGERAC — Organisme Algérien d'Accréditation</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Motif :</span><span className="font-medium">{payment?.invoiceNumber ? `Réf. ${payment.invoiceNumber}` : `Demande ${requestId}`}</span></div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-emerald-50/60">
                          <div className="flex items-center gap-2 mb-3">
                            <Globe2 className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold text-emerald-900">Wire Transfer — Foreign OEC — {currency}</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Bank :</span><span className="font-medium">Banque Extérieure d'Algérie (BEA) — Agence 038HBB</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Account No. :</span><span className="font-mono font-semibold">002000380383000019/97</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">SWIFT/BIC :</span><span className="font-mono font-semibold">BEXADZAL038</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Address :</span><span>88 Rue Hassiba Ben Bouali, Alger</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Beneficiary :</span><span className="font-medium">ALGERAC — Organisme Algérien d'Accréditation</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Reference :</span><span className="font-medium">{payment?.invoiceNumber ? `Ref. ${payment.invoiceNumber}` : `Request ${requestId}`}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Avertissement non-remboursable */}
                  {isPending && (
                    <Alert className="bg-amber-50 border-amber-300">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-900">
                        <strong>Important :</strong> Les frais d'inscription de dossier ne sont pas remboursables 
                        quel que soit le résultat de l'étude de recevabilité.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Rejet du DAG */}
                  {isRejected && payment?.dagComments && (
                    <Alert className="bg-red-50 border-red-300">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-900">
                        <strong>Paiement rejeté par le DAG :</strong> {payment.dagComments}
                        <br />
                        <span className="text-sm mt-1 block">Veuillez soumettre une nouvelle preuve de paiement valide.</span>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Formulaire de soumission de preuve */}
                  {isPending && (
                    <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                      <h3 className="font-semibold text-base">Soumettre votre preuve de paiement</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="transactionId">Identifiant de la transaction *</Label>
                        <Input
                          id="transactionId"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Ex: VIR-2026-XXXXX ou numéro de reçu"
                        />
                        <p className="text-xs text-muted-foreground">
                          L'identifiant figurant sur votre reçu ou confirmation de virement bancaire
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Preuve de paiement *</Label>
                        <div
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setProofFile(file);
                            }}
                          />
                          {proofFile ? (
                            <div className="flex items-center justify-center gap-2 text-green-700">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">{proofFile.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(proofFile.size / 1024).toFixed(0)} Ko)
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Cliquez pour joindre la preuve de paiement
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PDF, JPG ou PNG (reçu bancaire, confirmation de virement)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* En attente de frais */}
                  {isAwaitingFees && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        Le montant des frais d'enregistrement est en cours de détermination par le service financier. 
                        Vous recevrez une notification dès qu'il sera fixé.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Preuve soumise - en attente */}
                  {isProofSubmitted && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        Votre preuve de paiement est en cours de vérification par le DAG. 
                        Vous serez notifié dès que la vérification sera terminée.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Validé */}
                  {isValidated && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900">
                        Le paiement a été validé. Votre dossier est transmis pour assignation à un responsable d'accréditation.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/oec/payments")}
                  >
                    Retour à la facturation
                  </Button>
                  {isPending && (
                    <Button 
                      onClick={handleSubmitProof} 
                      disabled={processing || !transactionId.trim() || !proofFile}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {processing ? "Envoi en cours..." : "Soumettre le paiement"}
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
