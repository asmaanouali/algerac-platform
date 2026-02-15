import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function DocumentaryResponsePage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez décrire votre réponse aux manquements",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", `/api/requests/${id}/documentary-response`, {
        response,
      });
      
      toast({
        title: "Réponse soumise",
        description: "Votre réponse aux manquements documentaires a été transmise",
      });
      
      setLocation("/oec/mes-demandes");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de soumettre votre réponse",
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
                <FileText className="h-5 w-5" />
                Réponse aux Manquements Documentaires
              </CardTitle>
              <CardDescription>
                L'équipe d'évaluation a identifié des manquements lors de la revue documentaire (FOR 56).
                Veuillez fournir les documents manquants et/ou vos explications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertDescription>
                  Vous disposez d'un délai de <strong>3 mois</strong> pour répondre aux manquements 
                  identifiés. Passé ce délai, votre dossier sera classé sans suite.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="response">
                    Votre réponse aux manquements identifiés *
                  </Label>
                  <Textarea
                    id="response"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Décrivez les documents fournis et/ou vos explications concernant les manquements identifiés..."
                    className="min-h-[200px]"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Référencez chaque manquement identifié dans le FOR 56 et fournissez une réponse précise.
                  </p>
                </div>

                <div className="p-4 border-2 border-dashed rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">
                      Téléchargez les documents manquants via l'onglet "Mes Documents"
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    <FileText className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Soumission..." : "Soumettre la réponse"}
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
