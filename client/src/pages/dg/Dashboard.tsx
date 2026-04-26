import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/stat-card";
import {
  Loader2, Stamp, CheckCircle2, XCircle, ShieldCheck, Award,
  ArrowRightLeft, AlertCircle, ArrowRight,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DGDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [pendingValidation, setPendingValidation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showValidation, setShowValidation] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [validationDecision, setValidationDecision] = useState("");
  const [validationComments, setValidationComments] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [ordersRes, reqRes, pendingRes] = await Promise.all([
          fetch("/api/workflow/mission-orders/pending-approval", { credentials: "include" }),
          fetch("/api/requests", { credentials: "include" }),
          fetch("/api/requests/pending-dg-validation", { credentials: "include" }),
        ]);
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (reqRes.ok) {
          const d = await reqRes.json();
          setRequests(Array.isArray(d) ? d : []);
        }
        if (pendingRes.ok) {
          const d = await pendingRes.json();
          setPendingValidation(Array.isArray(d) ? d : []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      setShowValidation(false);
      setSelectedRequest(null);
      setValidationDecision("");
      setValidationComments("");
      setPendingValidation(prev => prev.filter(r => r.id !== selectedRequest.id));
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  if (!user) return null;

  const pendingDG = orders.filter((o: any) => o.status === "DT_APPROVED");
  const accredited = requests.filter((r: any) => r.status === "CAS_DECISION_GRANT" || r.status === "ACTIVE").length;
  const activeFiles = requests.filter((r: any) =>
    !["CAS_DECISION_GRANT", "CAS_DECISION_REFUSAL", "REJECTED", "CLOSED", "WITHDRAWN", "ACTIVE"].includes(r.status)
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{t('dg_page.dashboardTitle', { defaultValue: "Tableau de bord DG" })}</h1>
            <p className="text-muted-foreground mt-1">{user.fullName} — Direction Générale d'ALGERAC</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatCard
                  title="Recevabilités à valider"
                  value={pendingValidation.length}
                  icon={ShieldCheck}
                  description="Dossiers préparés par les RA"
                  className={pendingValidation.length > 0 ? "border-l-purple-500" : ""}
                />
                <StatCard
                  title="Ordres à signer"
                  value={pendingDG.length}
                  icon={Stamp}
                  description="Approuvés par la DT"
                  className={pendingDG.length > 0 ? "border-l-amber-500" : ""}
                />
                <StatCard
                  title="Dossiers actifs"
                  value={activeFiles}
                  icon={AlertCircle}
                  description="En cours de traitement"
                />
                <StatCard
                  title="Accréditations"
                  value={accredited}
                  icon={Award}
                  description="Décisions favorables"
                  className="border-l-emerald-500"
                />
              </div>

              {pendingValidation.length > 0 && (
                <Card className="mb-6 border-purple-200 bg-purple-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-purple-800 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" /> {pendingValidation.length} validation(s) de recevabilité
                    </CardTitle>
                    <CardDescription className="text-purple-700">
                      Validez ou rejetez la recevabilité des dossiers préparés par les RA.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingValidation.slice(0, 5).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-100">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {r.referenceNumber || `Demande #${r.id}`} — {r.oec?.organizationName || r.oec?.fullName || "—"}
                          </p>
                          <p className="text-xs text-purple-700">
                            {r.domain} · RA: {r.assignedRa?.fullName || "—"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-700 border-purple-300 ml-2"
                          onClick={() => {
                            setSelectedRequest(r);
                            setValidationDecision("");
                            setValidationComments("");
                            setShowValidation(true);
                          }}
                        >
                          Évaluer <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {pendingDG.length > 0 && (
                <Card className="mb-6 border-amber-200 bg-amber-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                      <Stamp className="h-5 w-5" /> {pendingDG.length} ordre(s) de mission à signer
                    </CardTitle>
                    <CardDescription className="text-amber-700">
                      Ordres approuvés par la DT en attente de votre signature.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/dg/ordres-mission">
                      <Button size="sm" variant="outline" className="text-amber-700 border-amber-300">
                        Voir les ordres <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/dg/ordres-mission">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <Stamp className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold">Ordres de mission</h3>
                      <p className="text-xs text-muted-foreground mt-1">Signature DG</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/dg/certificats">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <Award className="w-10 h-10 mx-auto mb-3 text-emerald-600" />
                      <h3 className="font-semibold">Certificats</h3>
                      <p className="text-xs text-muted-foreground mt-1">Signature des certificats</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/dg/transferts">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 text-center">
                      <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                      <h3 className="font-semibold">Transferts</h3>
                      <p className="text-xs text-muted-foreground mt-1">Vue d'ensemble</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </>
          )}

          <Dialog open={showValidation} onOpenChange={setShowValidation}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Validation de recevabilité — DG</DialogTitle>
                <DialogDescription>Évaluez et validez la recevabilité de ce dossier</DialogDescription>
              </DialogHeader>
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
                      <div className="flex items-center space-x-2 border rounded-lg p-3">
                        <RadioGroupItem value="approved" id="dg-a" />
                        <Label htmlFor="dg-a" className="flex items-center gap-2 cursor-pointer flex-1">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">Valider la recevabilité</p>
                            <p className="text-sm text-muted-foreground">Le dossier peut passer à la contractualisation</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-3">
                        <RadioGroupItem value="rejected" id="dg-r" />
                        <Label htmlFor="dg-r" className="flex items-center gap-2 cursor-pointer flex-1">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium">Rejeter</p>
                            <p className="text-sm text-muted-foreground">Le dossier nécessite des corrections supplémentaires</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Commentaires</Label>
                    <Textarea
                      value={validationComments}
                      onChange={(e) => setValidationComments(e.target.value)}
                      placeholder="Observations de la Direction Générale..."
                      rows={4}
                    />
                  </div>
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
