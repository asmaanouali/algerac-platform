import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CorrectRequestPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [corrections, setCorrections] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!corrections.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez décrire les corrections apportées",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", `/api/requests/${id}/receivability-corrections`, {
        corrections,
      });
      
      toast({
        title: "Corrections soumises",
        description: "Votre demande corrigée a été resoumise avec succès",
      });
      
      setLocation("/oec/mes-demandes");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de soumettre les corrections",
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
              <CardTitle>Corriger et Resoumettre la Demande</CardTitle>
              <CardDescription>
                Cette demande a été jugée non recevable. Veuillez apporter les corrections 
                nécessaires et décrire les modifications effectuées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Assurez-vous d'avoir corrigé tous les points soulevés dans la décision 
                  de non-recevabilité avant de resoumettre votre demande.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="corrections">
                    Description des corrections apportées *
                  </Label>
                  <Textarea
                    id="corrections"
                    value={corrections}
                    onChange={(e) => setCorrections(e.target.value)}
                    placeholder="Décrivez en détail les corrections que vous avez apportées à votre dossier..."
                    className="min-h-[200px]"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Soyez précis sur les modifications effectuées pour faciliter la réévaluation.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Soumission..." : "Resoumettre la demande"}
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
