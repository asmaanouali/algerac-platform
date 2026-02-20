import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2, Users, UserPlus, Send, CheckCircle, Shield, AlertTriangle, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Expert {
  id: number;
  fullName: string;
  email: string;
  specialite: string;
  experience: string;
  activeDossiers: number;
  unavailableDates: string[];
}

interface TeamMember {
  id: number;
  expert: { id: number; fullName: string; email: string };
  role: string;
  specialization: string;
  confidentialityAgreementSigned: boolean;
  impartialityAgreementSigned: boolean;
  conflictOfInterestDeclared: boolean;
  available: boolean;
  recusedByOEC: boolean;
}

const teamRoles = [
  { value: "REE", label: "Responsable Équipe Évaluation" },
  { value: "ET", label: "Évaluateur Technique" },
  { value: "EXP", label: "Expert" },
  { value: "EQ", label: "Évaluateur Qualité" },
  { value: "SUP", label: "Superviseur" },
  { value: "OBS", label: "Observateur" },
  { value: "EF", label: "Évaluateur en Formation" },
];

export default function TeamCompositionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [specialization, setSpecialization] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reqRes, expRes] = await Promise.all([
        fetch("/api/requests/assigned-to-me", { credentials: "include" }),
        fetch("/api/workflow/available-experts", { credentials: "include" }),
      ]);
      if (reqRes.ok) {
        const allReqs = await reqRes.json();
        setRequests(allReqs.filter((r: any) =>
          ["QUOTATION_VALIDATED", "TEAM_DESIGNATION", "TEAM_RECUSED"].includes(r.status)
        ));
      }
      if (expRes.ok) setExperts(await expRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const res = await fetch(`/api/workflow/teams/by-request/${req.id}`, { credentials: "include" });
      if (res.ok) {
        const teams = await res.json();
        if (teams.length > 0) {
          setTeam(teams[0]);
          const memRes = await fetch(`/api/workflow/teams/${teams[0].id}/members`, { credentials: "include" });
          if (memRes.ok) setMembers(await memRes.json());
        } else {
          setTeam(null);
          setMembers([]);
        }
      }
    } catch (e) { console.error(e); }
  };

  const createTeam = async () => {
    try {
      const res = await apiRequest("POST", "/api/workflow/teams/create", { requestId: selectedRequest.id });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Équipe d'évaluation créée" });
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const addMember = async () => {
    if (!selectedExpert || !selectedRole) return;
    try {
      const res = await apiRequest("POST", `/api/workflow/teams/${team.id}/add-member`, {
        expertId: parseInt(selectedExpert),
        role: selectedRole,
        specialization,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Membre ajouté à l'équipe" });
        setShowAddMember(false);
        setSelectedExpert("");
        setSelectedRole("");
        setSpecialization("");
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const sendToOEC = async () => {
    try {
      const res = await apiRequest("POST", `/api/workflow/teams/${team.id}/send-to-oec`, {
        compositionSheet: "Fiche composition équipe FOR 26",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Fiche de composition envoyée à l'OEC (délai: 3 jours)" });
        loadData();
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const removeMember = async (memberId: number) => {
    if (!confirm("Voulez-vous vraiment retirer ce membre de l'équipe ?")) return;
    try {
      const res = await apiRequest("DELETE", `/api/workflow/teams/members/${memberId}`);
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Membre retiré de l'équipe" });
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Constitution de l'Équipe d'Évaluation</h1>
            <p className="text-muted-foreground mt-1">Désignez les membres de l'équipe d'évaluation (Étape 4)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dossiers éligibles */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Dossiers en attente</CardTitle>
                  <CardDescription>Sélectionnez un dossier pour constituer l'équipe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en attente de constitution d'équipe</p>
                  ) : (
                    requests.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => selectRequest(r)}
                        className={`p-3 rounded-lg border border-gray-200 cursor-pointer transition-all hover:shadow-sm ${
                          selectedRequest?.id === r.id ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-gray-50 hover:border-primary/30"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{r.referenceNumber || `Demande #${r.id}`}</p>
                            <p className="text-xs text-muted-foreground">{r.domain}</p>
                            <p className="text-xs text-muted-foreground">{r.oec?.organizationName || r.oec?.fullName}</p>
                          </div>
                          <Badge variant={r.status === "TEAM_RECUSED" ? "destructive" : "secondary"} className="text-xs">
                            {r.status === "TEAM_RECUSED" ? "Récusée" : r.status === "TEAM_DESIGNATION" ? "En cours" : "À traiter"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Composition de l'équipe */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Composition de l'Équipe</CardTitle>
                      <CardDescription>
                        {selectedRequest
                          ? `Dossier: ${selectedRequest.referenceNumber || selectedRequest.id}`
                          : "Sélectionnez un dossier"}
                      </CardDescription>
                    </div>
                    {selectedRequest && !team && (
                      <Button onClick={createTeam}><Users className="w-4 h-4 mr-2" />Créer l'Équipe</Button>
                    )}
                    {team && team.status === "DRAFT" && members.length > 0 && (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowAddMember(true)}>
                          <UserPlus className="w-4 h-4 mr-2" />Ajouter
                        </Button>
                        <Button 
                          onClick={sendToOEC}
                          disabled={!members.every(m => m.confidentialityAgreementSigned && m.impartialityAgreementSigned)}
                        >
                          <Send className="w-4 h-4 mr-2" />Envoyer à l'OEC
                        </Button>
                      </div>
                    )}
                    {team && team.status === "DRAFT" && members.length === 0 && (
                      <Button onClick={() => setShowAddMember(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />Ajouter un Membre
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">
                      Sélectionnez un dossier dans la liste à gauche
                    </p>
                  ) : !team ? (
                    <p className="text-center text-muted-foreground py-8">
                      Créez une équipe d'évaluation pour ce dossier
                    </p>
                  ) : members.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun membre dans l'équipe. Ajoutez des évaluateurs.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Membre</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Engagements</TableHead>
                          <TableHead>Statut</TableHead>
                          {team.status === "DRAFT" && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{m.expert?.fullName}</p>
                                <p className="text-xs text-muted-foreground">{m.expert?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {teamRoles.find((r) => r.value === m.role)?.label || m.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {m.confidentialityAgreementSigned ? (
                                  <div className="flex items-center gap-1" title="Engagement de confidentialité signé">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1" title="Engagement de confidentialité non signé">
                                    <Shield className="w-4 h-4 text-gray-300" />
                                  </div>
                                )}
                                {m.impartialityAgreementSigned ? (
                                  <div className="flex items-center gap-1" title="Engagement d'impartialité signé">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1" title="Engagement d'impartialité non signé">
                                    <Shield className="w-4 h-4 text-gray-300" />
                                  </div>
                                )}
                                {m.conflictOfInterestDeclared && (
                                  <AlertTriangle className="w-4 h-4 text-amber-500" title="Conflit d'intérêt déclaré" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {m.recusedByOEC ? (
                                <Badge variant="destructive">Récusé</Badge>
                              ) : m.confidentialityAgreementSigned && m.impartialityAgreementSigned ? (
                                <Badge className="bg-green-100 text-green-800">Confirmé</Badge>
                              ) : (
                                <Badge variant="secondary">En attente signature</Badge>
                              )}
                            </TableCell>
                            {team.status === "DRAFT" && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMember(m.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {team && (
                    <div className="mt-4 space-y-2">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">
                          Rappel : L'équipe doit comprendre au minimum 1 REE et 1 ET.
                          Rôles optionnels : Expert, Évaluateur Qualité, Superviseur, Observateur, Évaluateur en Formation.
                        </p>
                      </div>
                      {members.some(m => !m.confidentialityAgreementSigned || !m.impartialityAgreementSigned) && (
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <p className="text-sm font-medium text-amber-800">
                            ⚠️ Tous les membres doivent signer leurs engagements de confidentialité et d'impartialité avant l'envoi à l'OEC.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Liste des évaluateurs disponibles */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg">Évaluateurs Disponibles</CardTitle>
                  <CardDescription>Vue d'ensemble des évaluateurs et leur charge de travail</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Évaluateur</TableHead>
                        <TableHead>Spécialité</TableHead>
                        <TableHead>Expérience</TableHead>
                        <TableHead>Dossiers actifs</TableHead>
                        <TableHead>Indisponibilités</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {experts.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{exp.fullName}</p>
                              <p className="text-xs text-muted-foreground">{exp.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{exp.specialite || "—"}</TableCell>
                          <TableCell>{exp.experience || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={exp.activeDossiers > 3 ? "destructive" : "secondary"}>
                              {exp.activeDossiers} dossier(s)
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {exp.unavailableDates?.length > 0 ? (
                              <span className="text-xs text-amber-600">{exp.unavailableDates.length} jour(s)</span>
                            ) : (
                              <span className="text-xs text-green-600">Disponible</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dialog Ajouter Membre */}
          <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Membre à l'Équipe</DialogTitle>
                <DialogDescription>Sélectionnez un évaluateur et attribuez-lui un rôle</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Évaluateur</label>
                  <Select value={selectedExpert} onValueChange={setSelectedExpert}>
                    <SelectTrigger><SelectValue placeholder="Choisir un évaluateur" /></SelectTrigger>
                    <SelectContent>
                      {experts.map((exp) => (
                        <SelectItem key={exp.id} value={String(exp.id)}>
                          {exp.fullName} — {exp.specialite || "Généraliste"} ({exp.activeDossiers} dossiers)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Rôle dans l'équipe</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                    <SelectContent>
                      {teamRoles.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Spécialisation (optionnel)</label>
                  <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Ex: ISO 17025, Métrologie..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddMember(false)}>Annuler</Button>
                <Button onClick={addMember} disabled={!selectedExpert || !selectedRole}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
