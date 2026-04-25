import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, ArrowLeft, CheckCircle, XCircle, Download, FileText,
  Mail, Phone, User, Building2, Calendar, MapPin,
} from "lucide-react";

interface Application {
  id: number;
  nomOrganisme: string;
  typeOrganisme?: string;
  adresseSiege?: string;
  telephone?: string;
  email: string;
  nomRepresentant?: string;
  fonction?: string;
  porteeAccreditation?: string;
  status: string;
  rejectionReason?: string;
  manquements?: string;
  createdAt?: string;
  documentsJson?: string;
}

export default function DTOECApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [manquements, setManquements] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [params.id]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/oec-applications/all", { credentials: "include" });
      if (!res.ok) throw new Error("Chargement impossible");
      const data = await res.json();
      const found = (data as any[]).find((a) => String(a.id) === String(params.id));
      setApp(found || null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message });
    } finally { setLoading(false); }
  };

  const approve = async () => {
    if (!app) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/oec-applications/${app.id}/approve`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || "Erreur");
      toast({ title: "Candidature approuvée", description: "Le DAG a été notifié pour fixer les frais de dépôt." });
      setLocation("/dt/demandes-accreditation");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message });
    } finally { setBusy(false); }
  };

  const reject = async () => {
    if (!app) return;
    if (!rejectionReason.trim()) { toast({ variant: "destructive", title: "Motif requis" }); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/oec-applications/${app.id}/reject`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason, manquements }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || "Erreur");
      toast({ title: "Candidature rejetée", description: "Le candidat a été notifié." });
      setLocation("/dt/demandes-accreditation");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message });
    } finally { setBusy(false); setRejectOpen(false); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50/50"><Sidebar /><div className="md:ml-64"><Navbar />
    <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>
  </div></div>;

  if (!app) return <div className="min-h-screen bg-gray-50/50"><Sidebar /><div className="md:ml-64"><Navbar />
    <main className="p-8">
      <Button variant="outline" onClick={() => setLocation("/dt/demandes-accreditation")}><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
      <p className="text-center text-muted-foreground py-10">Candidature introuvable</p>
    </main>
  </div></div>;

  let docs: Array<{ key?: string; name: string; base64?: string; mimeType?: string }> = [];
  try { docs = app.documentsJson ? JSON.parse(app.documentsJson) : []; } catch { docs = []; }

  const canReview = app.status === "PENDING_DT" || app.status === "PENDING";

  const Info = ({ icon: Icon, label, value }: any) => (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground flex items-center gap-1">{Icon && <Icon className="w-3 h-3" />}{label}</p>
      <p className="text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => setLocation("/dt/demandes-accreditation")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">Nouvel OEC (pas de compte)</Badge>
              <Badge variant="outline">APP-{app.id}</Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2"><Building2 className="w-5 h-5" />{app.nomOrganisme}</CardTitle>
              <CardDescription>Demande d'inscription — nécessite la création d'un compte par l'administrateur après approbation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Info label="Type d'organisme" value={app.typeOrganisme} />
                <Info icon={Calendar} label="Date de candidature" value={app.createdAt} />
                <Info label="Statut" value={app.status?.replace(/_/g, " ")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Coordonnées</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Info icon={MapPin} label="Adresse du siège" value={app.adresseSiege} />
                <Info icon={Phone} label="Téléphone" value={app.telephone} />
                <Info icon={Mail} label="Email" value={app.email} />
                <Info icon={User} label="Représentant" value={app.nomRepresentant} />
                <Info label="Fonction" value={app.fonction} />
                <Info label="Portée d'accréditation" value={app.porteeAccreditation} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Documents joints ({docs.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="text-sm font-medium text-blue-800">DOC1 — Formulaire de demande d'accréditation</span>
                  <Button variant="outline" size="sm" onClick={async () => {
                    try {
                      const r = await fetch(`/api/candidatures/oec/${app.id}/doc1`, { credentials: "include" });
                      if (!r.ok) throw new Error();
                      const blob = await r.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = `DOC1_${app.nomOrganisme.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      toast({ variant: "destructive", title: "Téléchargement impossible" });
                    }
                  }}><Download className="w-3 h-3 mr-1" /> Télécharger</Button>
                </div>
                {docs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun document supplémentaire</p>
                ) : docs.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm truncate">{d.name}</span>
                    </div>
                    {d.base64 ? (
                      <Button variant="ghost" size="sm" onClick={() => {
                        const mime = d.mimeType || "application/octet-stream";
                        const bc = atob(d.base64!);
                        const ba = new Uint8Array(bc.length);
                        for (let j = 0; j < bc.length; j++) ba[j] = bc.charCodeAt(j);
                        const blob = new Blob([ba], { type: mime });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = d.name; a.click();
                        URL.revokeObjectURL(url);
                      }}><Download className="w-3.5 h-3.5 mr-1" /> Télécharger</Button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">sans fichier</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {app.rejectionReason && (
            <Card className="border-red-200">
              <CardHeader><CardTitle className="text-red-700">Motif de refus</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-red-800 bg-red-50 p-3 rounded border border-red-100">{app.rejectionReason}</p>
                {app.manquements && <p className="text-xs text-muted-foreground mt-2">Manquements : {app.manquements}</p>}
              </CardContent>
            </Card>
          )}

          <Card className={canReview ? "border-2 border-amber-300" : ""}>
            <CardHeader>
              <CardTitle>Décision de la Direction Technique</CardTitle>
              <CardDescription>
                {canReview
                  ? "Approuvez pour transmettre au DAG (fixation des frais de dépôt) ou rejetez avec motif."
                  : "Cette candidature n'est plus en attente de vérification DT."}
              </CardDescription>
            </CardHeader>
            {canReview && (
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-[#00A63E] hover:bg-[#009235]" onClick={approve} disabled={busy}>
                    {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                    Approuver & Transmettre au DAG
                  </Button>
                  <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={busy}>
                    <XCircle className="w-4 h-4 mr-1" /> Rejeter
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </main>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la candidature</DialogTitle>
            <DialogDescription>Le candidat sera notifié par email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motif de refus *</Label>
              <Textarea rows={4} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Raisons du refus..." />
            </div>
            <div className="space-y-2">
              <Label>Manquements identifiés</Label>
              <Textarea rows={4} value={manquements} onChange={(e) => setManquements(e.target.value)} placeholder="Manquements à corriger..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={busy}>Annuler</Button>
            <Button variant="destructive" onClick={reject} disabled={busy || !rejectionReason.trim()}>
              {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
