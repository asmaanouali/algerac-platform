import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function LiftObstaclesPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!details.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez décrire les actions entreprises pour lever les obstacles",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", `/api/requests/${id}/lift-obstacles`, {
        details,
      });
      
      toast({
        title: "Notification envoyée",
        description: "Le CD a été notifié de la levée des obstacles",
      });
      
      setLocation("/oec/mes-demandes");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la notification",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/oec/mes-demandes")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à mes demandes
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Notification de Levée des Obstacles
              </CardTitle>
              <CardDescription>
                Le processus d'accréditation a été suspendu suite à l'identification d'obstacles 
                bloquants lors de la visite préliminaire. Notifiez le CD une fois ces obstacles levés.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>
                  Votre processus d'accréditation est actuellement <strong>suspendu</strong> en raison 
                  d'obstacles identifiés dans le rapport de visite préliminaire (FOR 12).
                </AlertDescription>
              </Alert>

              <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-2">
                <h3 className="font-semibold">Rappel :</h3>
                <p className="text-sm text-muted-foreground">
                  Les obstacles bloquants peuvent inclure : infrastructure inadéquate, personnel 
                  insuffisant, équipements non conformes, système qualité inexistant, etc.
                </p>
                <p className="text-sm text-muted-foreground">
                  Assurez-vous que tous les obstacles identifiés dans le rapport FOR 12 ont été 
                  effectivement levés avant de notifier le CD.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="details">
                    Détails des actions entreprises pour lever les obstacles *
                  </Label>
                  <Textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Décrivez précisément les actions entreprises pour lever chaque obstacle identifié..."
                    className="min-h-[200px]"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Référencez chaque obstacle du rapport FOR 12 et décrivez les mesures correctives mises en place.
                  </p>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Le CD procédera à une vérification avant de reprendre le processus d'accréditation.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Envoi..." : "Notifier la levée des obstacles"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/oec/mes-demandes")}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
