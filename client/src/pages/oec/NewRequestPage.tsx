import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2 } from "lucide-react";

const requestTypes = [
  { value: "INITIAL", label: "Initiale" },
  { value: "SURVEILLANCE", label: "Surveillance" },
  { value: "RENOUVELLEMENT", label: "Renouvellement" },
  { value: "EXTENSION", label: "Extension" }
];

export default function NewRequestPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    domain: "",
    description: ""
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Créer la demande
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

      // Soumettre la demande avec paiement automatique
      const submitRes = await fetch(`/api/requests/${requestId}/submit-with-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (!submitRes.ok) {
        const error = await submitRes.json();
        throw new Error(error.message || "Erreur lors de la soumission");
      }

      toast({
        title: "✅ Demande soumise avec succès !",
        description: "Votre demande a été enregistrée et sera bientôt assignée à un responsable.",
      });

      // Rediriger vers le dashboard
      setTimeout(() => {
        setLocation("/oec/dashboard");
      }, 1500);

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

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto max-w-3xl">
            <Card>
        <CardHeader>
          <CardTitle>Nouvelle Demande d'Accréditation</CardTitle>
          <CardDescription>
            Remplissez le formulaire ci-dessous pour soumettre votre demande d'accréditation.
            Votre demande sera automatiquement enregistrée et envoyée au service concerné.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Type de demande *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionnez le type" />
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
              <Label htmlFor="domain">Domaine d'activité *</Label>
              <Input
                id="domain"
                placeholder="Ex: Laboratoire d'essais, Organisme d'inspection..."
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description détaillée</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre demande en détail (activités, portée, normes applicables...)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/oec/dashboard")}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Soumettre la demande
            </Button>
          </CardFooter>
        </form>
      </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
