import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, AlertTriangle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

export default function DocumentaryResponsePage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) loadData();
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, revRes] = await Promise.all([
        fetch(`/api/requests/${requestId}`, { credentials: "include" }),
        fetch(`/api/workflow/documentary-review/by-request/${requestId}`, { credentials: "include" }),
      ]);
      if (reqRes.ok) setRequest(await reqRes.json());
      if (revRes.ok) setReviews(await revRes.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!response.trim()) { toast({ variant: "destructive", title: "Erreur", description: "Rédigez votre réponse" }); return; }
    setSubmitting(true);
    try {
      await apiRequest("POST", `/api/requests/${requestId}/documentary-response`, { response, documentsProvided: true });
      toast({ title: "Réponse envoyée", description: "Votre réponse aux insuffisances documentaires a été transmise" });
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const deficiencies = reviews.filter((r: any) => r.deficienciesIdentified);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Réponse aux Insuffisances Documentaires</h1>
              <p className="text-muted-foreground mt-2">Répondez aux observations de l'équipe d'évaluation</p>
            </div>

            {request && (
              <Alert><AlertDescription><strong>Référence :</strong> {request.referenceNumber}<br /><strong>Domaine :</strong> {request.domain}</AlertDescription></Alert>
            )}

            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Délai :</strong> Vous disposez de <strong>3 mois</strong> pour répondre aux insuffisances documentaires. Passé ce délai, le dossier sera classé par le CD.
              </AlertDescription>
            </Alert>

            {deficiencies.map((review: any) => (
              <Card key={review.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Insuffisances identifiées</CardTitle>
                  <CardDescription>Revue du {new Date(review.reviewStartDate).toLocaleDateString("fr-FR")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-amber-50 p-4 rounded-lg"><p className="whitespace-pre-wrap">{review.deficienciesDetails}</p></div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader><CardTitle><FileText className="inline h-5 w-5 mr-2" />Votre Réponse</CardTitle><CardDescription>Décrivez les corrections apportées et les documents complémentaires fournis</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Réponse détaillée *</Label>
                  <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Détaillez les corrections apportées, les documents mis à jour ou ajoutés..." rows={10} />
                </div>
                <Button onClick={handleSubmit} disabled={submitting || !response.trim()} className="w-full">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi...</> : <><Send className="mr-2 h-4 w-4" />Envoyer la réponse</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
