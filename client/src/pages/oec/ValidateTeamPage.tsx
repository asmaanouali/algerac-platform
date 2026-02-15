import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, XCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ValidateTeamPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [recusationReason, setRecusationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidation = async (accepted: boolean) => {
    if (!accepted && !recusationReason.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez indiquer le motif de récusation",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", `/api/requests/${id}/team-validation`, {
        accepted,
        recusationReason: accepted ? null : recusationReason,
      });
      
      toast({
        title: accepted ? "Équipe validée" : "Récusation enregistrée",
        description: accepted 
          ? "L'équipe d'évaluation a été validée avec succès"
          : "Votre récusation a été transmise au CD",
      });
      
      setLocation("/oec/mes-demandes");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer votre réponse",
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
                <Users className="h-5 w-5" />
                Validation de l'Équipe d'Évaluation
              </CardTitle>
              <CardDescription>
                Examinez la composition de l'équipe d'évaluation proposée (FOR 26) et validez-la 
                ou exercez votre droit de récusation (PRO 22).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  Vous disposez d'un délai de <strong>3 jours ouvrables</strong> pour examiner 
                  la composition de l'équipe et exercer votre droit de récusation si nécessaire.
                </AlertDescription>
              </Alert>

              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">Motifs de récusation valables (PRO 22) :</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Conflit d'intérêts avéré</li>
                  <li>Relation professionnelle ou personnelle récente</li>
                  <li>Compétence insuffisante dans le domaine technique</li>
                  <li>Litige antérieur avec l'OEC</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recusation">
                  Motif de récusation (obligatoire si vous récusez l'équipe)
                </Label>
                <Textarea
                  id="recusation"
                  value={recusationReason}
                  onChange={(e) => setRecusationReason(e.target.value)}
                  placeholder="Indiquez le motif précis de votre récusation..."
                  className="min-h-[150px]"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => handleValidation(true)} 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider l'équipe
                </Button>
                <Button 
                  onClick={() => handleValidation(false)} 
                  disabled={isSubmitting}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Exercer mon droit de récusation
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
