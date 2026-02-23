import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, Users, AlertTriangle, Shield, Calendar, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface TeamMember {
  id: number;
  expert: { id: number; fullName: string; email: string; specialite: string };
  role: string;
  specialization: string;
  confidentialityAgreementSigned: boolean;
}

const roleLabels: Record<string, string> = {
  REE: "Responsable Equipe Evaluation",
  ET: "Evaluateur Technique",
  EXP: "Expert",
  EQ: "Evaluateur Qualite",
  SUP: "Superviseur",
  OBS: "Observateur",
  EF: "Evaluateur en Formation",
};

export default function ValidateTeamPage() {
  const { requestId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [request, setRequest] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [recuseDialogOpen, setRecuseDialogOpen] = useState(false);
  const [recusedMemberIds, setRecusedMemberIds] = useState<number[]>([]);
  const [recuseReason, setRecuseReason] = useState("");

  // Date negotiation
  const [dateAccepted, setDateAccepted] = useState<boolean>(true);
  const [oecProposedDate, setOecProposedDate] = useState("");
  const [dateRefusalReason, setDateRefusalReason] = useState("");

  useEffect(() => {
    if (user && !authLoading) loadData();
  }, [requestId, user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadData = async () => {
    try {
      setLoading(true);
      const reqRes = await fetch(`/api/requests/${requestId}`, { credentials: "include" });
      if (reqRes.ok) setRequest(await reqRes.json());

      const teamRes = await fetch(`/api/workflow/teams/by-request/${requestId}`, { credentials: "include" });
      if (teamRes.ok) {
        const teams = await teamRes.json();
        if (teams.length > 0) {
          setTeam(teams[0]);
          const memRes = await fetch(`/api/workflow/teams/${teams[0].id}/members`, { credentials: "include" });
          if (memRes.ok) setMembers(await memRes.json());
        }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setLoading(false); }
  };

  const handleAccept = async () => {
    if (!dateAccepted && !oecProposedDate) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez proposer une date alternative" });
      return;
    }
    setProcessing(true);
    try {
      if (team) {
        await apiRequest("POST", `/api/workflow/teams/${team.id}/oec-response`, {
          validated: true,
          dateAccepted,
          oecProposedDate: !dateAccepted ? oecProposedDate : null,
          dateRefusalReason: !dateAccepted ? dateRefusalReason : null,
        });
      } else {
        await apiRequest("POST", `/api/requests/${requestId}/team-validation`, {
          accepted: true,
        });
      }
      toast({ 
        title: "Equipe validee", 
        description: dateAccepted 
          ? "L'equipe et la date d'evaluation ont ete validees." 
          : "L'equipe a ete validee. Vous avez propose une date alternative que le RA examinera."
      });
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setProcessing(false); }
  };

  const toggleRecuseMember = (memberId: number) => {
    setRecusedMemberIds(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const handleRecuse = async () => {
    if (recusedMemberIds.length === 0 || !recuseReason.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Selectionnez au moins un membre et indiquez la raison" });
      return;
    }
    setProcessing(true);
    try {
      if (team) {
        await apiRequest("POST", `/api/workflow/teams/${team.id}/oec-response`, {
          validated: false,
          recusedMemberIds,
          recusationReason: recuseReason,
          dateAccepted: dateAccepted,
          oecProposedDate: !dateAccepted ? oecProposedDate : null,
          dateRefusalReason: !dateAccepted ? dateRefusalReason : null,
        });
      } else {
        await apiRequest("POST", `/api/requests/${requestId}/team-validation`, {
          accepted: false,
          recusedMemberIds,
          recuseReason,
        });
      }
      toast({ title: "Recusation enregistree", description: "Le RA sera notifie et devra proposer une nouvelle equipe (PRO 22)" });
      setRecuseDialogOpen(false);
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setProcessing(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const proposedDate = team?.proposedEvaluationDate;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Validation de l'Equipe d'Evaluation</h1>
              <p className="text-muted-foreground mt-2">Examinez la composition de l'equipe et la date d'evaluation proposees par ALGERAC</p>
            </div>

            {request && (
              <Alert><AlertDescription><strong>Reference :</strong> {request.referenceNumber}<br /><strong>Domaine :</strong> {request.domain}</AlertDescription></Alert>
            )}

            <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Delai :</strong> Vous disposez de <strong>3 jours</strong> pour accepter ou recuser des membres de l'equipe. Sans reponse dans ce delai, la composition sera consideree comme acceptee.
              </AlertDescription>
            </Alert>

            {/* Proposed evaluation date */}
            {proposedDate && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800"><CalendarDays className="h-5 w-5" />Date d'Evaluation Proposee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-blue-900">
                      {new Date(proposedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Label className="font-medium">Acceptez-vous cette date ?</Label>
                    <div className="flex gap-3">
                      <Button variant={dateAccepted ? "default" : "outline"} size="sm" onClick={() => setDateAccepted(true)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Oui, j'accepte cette date
                      </Button>
                      <Button variant={!dateAccepted ? "destructive" : "outline"} size="sm" onClick={() => setDateAccepted(false)}>
                        <XCircle className="w-4 h-4 mr-1" /> Non, proposer une autre date
                      </Button>
                    </div>
                    {!dateAccepted && (
                      <div className="mt-3 p-4 bg-white rounded-lg border space-y-3">
                        <div className="space-y-2">
                          <Label>Date alternative proposee *</Label>
                          <Input type="date" value={oecProposedDate} onChange={(e) => setOecProposedDate(e.target.value)} min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} />
                        </div>
                        <div className="space-y-2">
                          <Label>Motif du refus de date</Label>
                          <Textarea value={dateRefusalReason} onChange={(e) => setDateRefusalReason(e.target.value)} placeholder="Indiquez la raison pour laquelle cette date ne convient pas..." rows={2} />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Composition de l'Equipe (FOR 26)</CardTitle>
                <CardDescription>Fiche de composition de l'equipe d'evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun membre dans l'equipe</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evaluateur</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Specialisation</TableHead>
                        <TableHead>Engagement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell><div><p className="font-medium">{m.expert?.fullName}</p><p className="text-xs text-muted-foreground">{m.expert?.email}</p></div></TableCell>
                          <TableCell><Badge variant="outline">{roleLabels[m.role] || m.role}</Badge></TableCell>
                          <TableCell>{m.specialization || m.expert?.specialite || "---"}</TableCell>
                          <TableCell>{m.confidentialityAgreementSigned ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Shield className="h-4 w-4 text-gray-300" />}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="destructive" onClick={() => { setRecuseDialogOpen(true); setRecusedMemberIds([]); setRecuseReason(""); }} disabled={processing} className="flex-1">
                    <XCircle className="mr-2 h-4 w-4" />Recuser des membres (PRO 22)
                  </Button>
                  <Button onClick={handleAccept} disabled={processing || (!dateAccepted && !oecProposedDate)} className="flex-1">
                    {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</> : <><CheckCircle className="mr-2 h-4 w-4" />Accepter l'equipe{!dateAccepted ? " (date alternative)" : ""}</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog open={recuseDialogOpen} onOpenChange={setRecuseDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Recusation de membres (PRO 22)</DialogTitle><DialogDescription>Selectionnez les membres a recuser et indiquez votre justification</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Membres a recuser :</Label>
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <input type="checkbox" checked={recusedMemberIds.includes(m.id)} onChange={() => toggleRecuseMember(m.id)} className="h-4 w-4" />
                      <div className="flex-1"><p className="font-medium">{m.expert?.fullName}</p><p className="text-xs text-muted-foreground">{roleLabels[m.role] || m.role}</p></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2"><Label>Raison de la recusation *</Label><Textarea value={recuseReason} onChange={(e) => setRecuseReason(e.target.value)} placeholder="Justifiez votre recusation (conflit d'interets, manque d'impartialite, etc.)..." rows={4} /></div>
                <Alert><AlertDescription>Conformement a la procedure PRO 22, le RA devra proposer de nouveaux membres pour remplacer les membres recuses.</AlertDescription></Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRecuseDialogOpen(false)} disabled={processing}>Annuler</Button>
                <Button variant="destructive" onClick={handleRecuse} disabled={processing || recusedMemberIds.length === 0 || !recuseReason.trim()}>
                  {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</> : "Confirmer la recusation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
