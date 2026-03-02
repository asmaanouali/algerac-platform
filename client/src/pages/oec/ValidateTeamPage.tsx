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
import { Loader2, CheckCircle, XCircle, Users, AlertTriangle, Shield, Calendar, CalendarDays, Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";

interface ProofFile {
  name: string;
  size: number;
  base64: string;
  mimeType: string;
}

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
  const [proofFiles, setProofFiles] = useState<ProofFile[]>([]);

  // Separate date and team acceptance
  const [dateDecision, setDateDecision] = useState<"accept"|"refuse"|null>(null);
  const [teamDecision, setTeamDecision] = useState<"accept"|"recuse"|null>(null);
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

  const handleSubmitDecision = async () => {
    if (!dateDecision || !teamDecision) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez prendre une decision sur la date ET sur l'equipe" });
      return;
    }
    if (dateDecision === "refuse" && !oecProposedDate) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez proposer une date alternative" });
      return;
    }
    if (teamDecision === "recuse") {
      // Open recuse dialog for member selection
      setRecuseDialogOpen(true);
      return;
    }
    
    // Date refused + team accepted → RA changes date
    // Date accepted + team accepted → fully validated
    setProcessing(true);
    try {
      if (team) {
        await apiRequest("POST", `/api/workflow/teams/${team.id}/oec-response`, {
          validated: true,
          dateAccepted: dateDecision === "accept",
          oecProposedDate: dateDecision === "refuse" ? oecProposedDate : null,
          dateRefusalReason: dateDecision === "refuse" ? dateRefusalReason : null,
        });
      } else {
        await apiRequest("POST", `/api/requests/${requestId}/team-validation`, {
          accepted: true,
        });
      }
      
      if (dateDecision === "accept") {
        toast({ title: "Equipe et date validees", description: "L'equipe et la date d'evaluation ont ete acceptees." });
      } else {
        toast({ title: "Equipe acceptee, nouvelle date proposee", description: "L'equipe a ete acceptee. Le RA proposera une nouvelle date." });
      }
      setTimeout(() => setLocation("/oec/mes-demandes"), 2000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setProcessing(false); }
  };

  const toggleRecuseMember = (memberId: number) => {
    setRecusedMemberIds(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) return; // 10MB max
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setProofFiles(prev => [...prev, { name: file.name, size: file.size, base64, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeProofFile = (index: number) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
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
          proofDocuments: proofFiles.map(f => ({ name: f.name, base64: f.base64, mimeType: f.mimeType })),
          dateAccepted: dateDecision === "accept",
          oecProposedDate: dateDecision === "refuse" ? oecProposedDate : null,
          dateRefusalReason: dateDecision === "refuse" ? dateRefusalReason : null,
        });
      } else {
        await apiRequest("POST", `/api/requests/${requestId}/team-validation`, {
          accepted: false,
          recusedMemberIds,
          recuseReason,
          proofDocuments: proofFiles.map(f => ({ name: f.name, base64: f.base64, mimeType: f.mimeType })),
        });
      }
      toast({ title: "Recusation enregistree", description: "Le CD examinera votre demande de recusation (PRO 22)" });
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
                    <Label className="font-medium">Votre decision sur la date :</Label>
                    <div className="flex gap-3">
                      <Button variant={dateDecision === "accept" ? "default" : "outline"} size="sm" onClick={() => setDateDecision("accept")}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Accepter la date
                      </Button>
                      <Button variant={dateDecision === "refuse" ? "destructive" : "outline"} size="sm" onClick={() => setDateDecision("refuse")}>
                        <XCircle className="w-4 h-4 mr-1" /> Refuser la date
                      </Button>
                    </div>
                    {dateDecision === "refuse" && (
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
                  <>
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

                    <div className="mt-4 space-y-3">
                      <Label className="font-medium">Votre decision sur les membres de l'equipe :</Label>
                      <div className="flex gap-3">
                        <Button variant={teamDecision === "accept" ? "default" : "outline"} size="sm" onClick={() => setTeamDecision("accept")}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Accepter l'equipe
                        </Button>
                        <Button variant={teamDecision === "recuse" ? "destructive" : "outline"} size="sm" onClick={() => setTeamDecision("recuse")}>
                          <XCircle className="w-4 h-4 mr-1" /> Recuser un ou des membres (PRO 22)
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Submit combined decision */}
            <Card className="border-primary">
              <CardContent className="pt-6">
                {(!dateDecision || !teamDecision) && (
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Veuillez prendre une decision sur la date d'evaluation ET sur les membres de l'equipe pour continuer.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`p-3 rounded-lg border ${dateDecision === "accept" ? "bg-green-50 border-green-300" : dateDecision === "refuse" ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"}`}>
                    <p className="text-sm font-medium">{dateDecision === "accept" ? "Date acceptee" : dateDecision === "refuse" ? "Date refusee" : "Date : en attente"}</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${teamDecision === "accept" ? "bg-green-50 border-green-300" : teamDecision === "recuse" ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-200"}`}>
                    <p className="text-sm font-medium">{teamDecision === "accept" ? "Equipe acceptee" : teamDecision === "recuse" ? "Recusation de membres" : "Equipe : en attente"}</p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleSubmitDecision} 
                  disabled={processing || !dateDecision || !teamDecision || (dateDecision === "refuse" && !oecProposedDate)}
                >
                  {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</> : <><CheckCircle className="mr-2 h-4 w-4" />Soumettre ma decision</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Dialog open={recuseDialogOpen} onOpenChange={setRecuseDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Recusation de membres (PRO 22)</DialogTitle><DialogDescription>Selectionnez les membres a recuser et indiquez votre justification. Le CD examinera votre demande.</DialogDescription></DialogHeader>
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
                
                {/* Proof documents upload */}
                <div className="space-y-2">
                  <Label>Documents de preuve (recommandé)</Label>
                  <p className="text-xs text-muted-foreground">Joignez tout document justifiant votre récusation (contrats, emails, preuves de conflit d'intérêts...)</p>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">Cliquez pour ajouter des fichiers</p>
                    <p className="text-xs text-muted-foreground">PDF, Word, Images — 10 MB max</p>
                    <input type="file" multiple onChange={handleProofUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                  </div>
                  {proofFiles.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {proofFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeProofFile(i)}><X className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Alert><AlertDescription>Conformement a la procedure PRO 22, le CD examinera votre demande de recusation. S'il la juge valide, le RA proposera de nouveaux membres. Sinon, l'equipe sera maintenue.</AlertDescription></Alert>
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
