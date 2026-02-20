import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

const DOMAINS = [
  "Laboratoires d'essais",
  "Laboratoires d'étalonnage",
  "Organismes d'inspection",
  "Organismes de certification de produits",
  "Organismes de certification de systèmes de management",
  "Organismes de certification de personnes",
  "Organismes de vérification/validation",
  "Producteurs de matériaux de référence",
];

export default function CorrectRequestPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [corrections, setCorrections] = useState("");
  const [domain, setDomain] = useState("");
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
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
        setDomain(data.domain || "");
        setDescription(data.description || "");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!corrections.trim()) { toast({ variant: "destructive", title: "Erreur", description: "Décrivez les corrections" }); return; }
    setSubmitting(true);
    try {
      // Resubmit the request with corrections
      await apiRequest("POST", `/api/requests/${requestId}/submit`, {
        corrections,
        domain,
        description,
      });
      toast({ title: "Corrections soumises", description: "Votre demande corrigée a été resoumise pour étude. Vous devez procéder au paiement." });
      setTimeout(() => setLocation(`/oec/paiement/${requestId}`), 2000);
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
        <main className="p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Corriger et Resoumettre</h1>
              <p className="text-muted-foreground mt-2">Votre demande a été déclarée non recevable. Corrigez-la et resoumettez.</p>
            </div>

            {request?.receivabilityComments && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Motifs de non-recevabilité :</strong>
                  <p className="mt-2 whitespace-pre-wrap">{request.receivabilityComments}</p>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader><CardTitle>Corrections</CardTitle><CardDescription>Modifiez les informations nécessaires et décrivez les corrections apportées</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Domaine d'accréditation</Label>
                  <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez le domaine" /></SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description mise à jour</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description détaillée de votre activité..." rows={6} />
                </div>

                <div className="space-y-2">
                  <Label>Description des corrections apportées *</Label>
                  <Textarea value={corrections} onChange={(e) => setCorrections(e.target.value)} placeholder="Décrivez les corrections effectuées en réponse aux motifs de non-recevabilité..." rows={6} />
                </div>

                <Button onClick={handleSubmit} disabled={submitting || !corrections.trim()} className="w-full">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Soumission...</> : <><Send className="mr-2 h-4 w-4" />Resoumettre la demande</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
