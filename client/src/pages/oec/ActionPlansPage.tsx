import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StringDatePicker } from "@/components/ui/date-time-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ActionPlan {
  gapId: string;
  correctiveAction: string;
  preventiveAction: string;
  responsible: string;
  deadline: string;
}

export default function ActionPlansPage() {
  const { requestId: id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([
    { gapId: "", correctiveAction: "", preventiveAction: "", responsible: "", deadline: "" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addActionPlan = () => {
    setActionPlans([...actionPlans, 
      { gapId: "", correctiveAction: "", preventiveAction: "", responsible: "", deadline: "" }
    ]);
  };

  const removeActionPlan = (index: number) => {
    setActionPlans(actionPlans.filter((_, i) => i !== index));
  };

  const updateActionPlan = (index: number, field: keyof ActionPlan, value: string) => {
    const updated = [...actionPlans];
    updated[index][field] = value;
    setActionPlans(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const incomplete = actionPlans.some(plan => 
      !plan.gapId || !plan.correctiveAction || !plan.responsible || !plan.deadline
    );
    
    if (incomplete) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires pour chaque plan",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", `/api/requests/${id}/action-plans`, {
        actionPlans,
      });
      
      toast({
        title: "Plans d'actions soumis",
        description: "Vos plans d'actions ont été transmis à l'équipe d'évaluation",
      });
      
      setLocation("/oec/mes-demandes");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de soumettre les plans d'actions",
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
        <main className="p-4 md:p-8">
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
                Plans d'Actions pour Traitement des Écarts
              </CardTitle>
              <CardDescription>
                Soumettez vos plans d'actions pour traiter les écarts identifiés lors de l'évaluation.
                Les écarts CRITIQUES doivent être résolus dans un délai de 6 mois maximum.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertDescription>
                  Vous disposez d'un délai de <strong>10 jours</strong> après la clôture de l'évaluation 
                  pour soumettre vos plans d'actions. L'équipe disposera de 5 jours pour les évaluer.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-6">
                {actionPlans.map((plan, index) => (
                  <Card key={index} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Plan d'Action #{index + 1}
                        </CardTitle>
                        {actionPlans.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeActionPlan(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`gap-${index}`}>Référence écart (FOR 02) *</Label>
                        <Input
                          id={`gap-${index}`}
                          value={plan.gapId}
                          onChange={(e) => updateActionPlan(index, "gapId", e.target.value)}
                          placeholder="Ex: GC-001, NC-003"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`corrective-${index}`}>Action corrective *</Label>
                        <Textarea
                          id={`corrective-${index}`}
                          value={plan.correctiveAction}
                          onChange={(e) => updateActionPlan(index, "correctiveAction", e.target.value)}
                          placeholder="Décrivez l'action corrective pour traiter l'écart..."
                          className="min-h-[100px]"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`preventive-${index}`}>Action préventive</Label>
                        <Textarea
                          id={`preventive-${index}`}
                          value={plan.preventiveAction}
                          onChange={(e) => updateActionPlan(index, "preventiveAction", e.target.value)}
                          placeholder="Décrivez l'action préventive pour éviter la récurrence..."
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`responsible-${index}`}>Responsable *</Label>
                          <Input
                            id={`responsible-${index}`}
                            value={plan.responsible}
                            onChange={(e) => updateActionPlan(index, "responsible", e.target.value)}
                            placeholder="Nom du responsable"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`deadline-${index}`}>Date limite *</Label>
                          <StringDatePicker
                            value={plan.deadline}
                            onChange={(v) => updateActionPlan(index, "deadline", v)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addActionPlan}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un plan d'action
                </Button>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Soumission..." : "Soumettre les plans d'actions"}
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
