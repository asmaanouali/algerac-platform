import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

export default function LiftObstaclesPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) loadData();
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${requestId}`, { credentials: "include" });
      if (res.ok) setRequest(await res.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!description.trim()) { toast({ variant: "destructive", title: "Erreur", description: "Décrivez les mesures prises" }); return; }
    setSubmitting(true);
    try {
      await apiRequest("POST", `/api/requests/${requestId}/lift-obstacles`, { description, resolved: true });
      toast({ title: "Obstacles levés", description: "Votre réponse a été transmise. Le processus continue." });
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Levée des Obstacles</h1>
              <p className="text-muted-foreground mt-2">Suite à la visite préliminaire, des obstacles bloquants ont été identifiés</p>
            </div>

            {request && (
              <Alert><AlertDescription><strong>Référence :</strong> {request.referenceNumber}<br /><strong>Domaine :</strong> {request.domain}</AlertDescription></Alert>
            )}

            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le rapport de visite préliminaire (FOR 12) a identifié des obstacles bloquants.
                Vous devez décrire les mesures correctives prises pour lever ces obstacles avant que le processus puisse continuer.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader><CardTitle>Mesures Correctives</CardTitle><CardDescription>Décrivez les actions entreprises pour résoudre chaque obstacle identifié</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Description des mesures prises *</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pour chaque obstacle identifié, décrivez les mesures correctives mises en place..." rows={10} />
                </div>
                <Button onClick={handleSubmit} disabled={submitting || !description.trim()} className="w-full">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><CheckCircle className="mr-2 h-4 w-4" />Confirmer la levée des obstacles</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
