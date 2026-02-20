import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, CheckCircle, CreditCard, FileText, ArrowRight } from "lucide-react";

const requestTypes = [
  { value: "INITIAL", label: "Accréditation initiale" },
  { value: "SURVEILLANCE", label: "Surveillance" },
  { value: "RENOUVELLEMENT", label: "Renouvellement" },
  { value: "EXTENSION", label: "Extension de portée" }
];

const domainOptions = [
  "Laboratoire d'essais",
  "Laboratoire d'étalonnage",
  "Organisme d'inspection",
  "Organisme de certification de produits",
  "Organisme de certification de systèmes de management",
  "Organisme de certification de personnes",
  "Producteur de matériaux de référence",
  "Organisateur d'essais d'aptitude",
];

export default function NewRequestPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    type: "",
    domain: "",
    description: ""
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.domain) {
      toast({
        title: "Champs obligatoires",
        description: "Veuillez remplir le type et le domaine d'activité.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Étape 1 : Créer la demande (DRAFT)
      const createRes = await fetch("/api/requests/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      if (!createRes.ok) {
        const error = await createRes.json();
        throw new Error(error.message || "Erreur lors de la création");
      }

      const createData = await createRes.json();
      const requestId = createData.data.id;

      // Étape 2 : Soumettre la demande (passe en PENDING_PAYMENT)
      const submitRes = await fetch(`/api/requests/${requestId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (!submitRes.ok) {
        const error = await submitRes.json();
        throw new Error(error.message || "Erreur lors de la soumission");
      }

      setCreatedRequestId(requestId);
      setShowPaymentDialog(true);

    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToPayment = () => {
    setShowPaymentDialog(false);
    setLocation(`/oec/paiement/${createdRequestId}`);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto max-w-3xl space-y-6">
            {/* En-tête */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Nouvelle Demande d'Accréditation</h1>
              <p className="text-muted-foreground mt-1">Étape 1 — Dépôt de la demande</p>
            </div>

            {/* Indicateur de progression */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-primary font-medium">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</div>
                Remplir le formulaire
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">2</div>
                Payer les frais de dépôt
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">3</div>
                Dossier transmis au CD
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Formulaire simplifié
                </CardTitle>
                <CardDescription>
                  Remplissez les informations ci-dessous pour déposer votre demande.
                  Après soumission, vous serez invité à régler les frais de dépôt.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de demande <span className="text-destructive">*</span></Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Sélectionnez le type de demande" />
                      </SelectTrigger>
                      <SelectContent>
                        {requestTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain">Domaine d'activité <span className="text-destructive">*</span></Label>
                    <Select
                      value={formData.domain}
                      onValueChange={(value) => setFormData({ ...formData, domain: value })}
                    >
                      <SelectTrigger id="domain">
                        <SelectValue placeholder="Sélectionnez votre domaine" />
                      </SelectTrigger>
                      <SelectContent>
                        {domainOptions.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez brièvement votre activité, les normes applicables, la portée demandée..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <CreditCard className="h-4 w-4 text-blue-700" />
                    <AlertDescription className="text-blue-900">
                      Après soumission de ce formulaire, vous devrez <strong>régler les frais de dépôt (5 000 DA)</strong> pour que votre demande soit prise en charge par le Chef de Département.
                    </AlertDescription>
                  </Alert>
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/oec/dashboard")}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading} size="lg">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Soumettre la demande
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </main>
      </div>

      {/* Dialog de succès avec redirection vers paiement */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Demande soumise avec succès
            </DialogTitle>
            <DialogDescription>
              Votre demande d'accréditation a été enregistrée. Pour qu'elle soit traitée, 
              vous devez maintenant procéder au paiement des frais de dépôt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Frais de dépôt à régler</p>
                  <p className="text-2xl font-bold text-amber-800 mt-1">5 000 DA</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Le paiement doit être effectué avant la prise en charge de votre dossier.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={goToPayment} className="w-full" size="lg">
              <CreditCard className="mr-2 h-4 w-4" />
              Procéder au paiement
            </Button>
            <Button variant="ghost" onClick={() => { setShowPaymentDialog(false); setLocation("/oec/mes-demandes"); }} className="w-full text-muted-foreground">
              Je paierai plus tard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
