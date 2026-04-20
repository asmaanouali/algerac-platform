import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Calendar, MapPin, Plus, Send, PlayCircle,
  CheckCircle2, FileText, Clock, Eye, RefreshCw
} from "lucide-react";

interface Commission {
  id: number;
  referenceNumber: string;
  meetingDate: string;
  meetingTime?: string;
  meetingLocation?: string;
  status: string;
  agendaJson?: string;
  minutesText?: string;
  decisionsJson?: string;
  participantsJson?: string;
  president?: { id: number; fullName: string };
  rapporteur?: { id: number; fullName: string };
  convocationSent: boolean;
  convocationSentAt?: string;
  pvSigned: boolean;
  pvSignedAt?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planifiée",
  CONVENED: "Convoquée",
  IN_SESSION: "En séance",
  COMPLETED: "Terminée",
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-800",
  CONVENED: "bg-yellow-100 text-yellow-800",
  IN_SESSION: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function CommissionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // PV Dialog
  const [pvOpen, setPvOpen] = useState(false);
  const [minutesText, setMinutesText] = useState("");
  const [decisionsJson, setDecisionsJson] = useState("");
  const [participantsJson, setParticipantsJson] = useState("");

  // Create form
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("10:00");
  const [formLocation, setFormLocation] = useState("Siège ALGERAC");
  const [formAgenda, setFormAgenda] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    document.title = "Commission de Qualification - ALGERAC";
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/qualifications/commissions", { credentials: "include" });
      if (res.ok) setCommissions(await res.json());
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formDate) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/qualifications/commissions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingDate: formDate,
          meetingTime: formTime,
          meetingLocation: formLocation,
          agendaJson: formAgenda,
          notes: formNotes,
        }),
      });
      if (res.ok) {
        toast({ title: "Succès", description: "Commission planifiée" });
        setCreateOpen(false);
        setFormDate(""); setFormAgenda(""); setFormNotes("");
        fetchCommissions();
      } else {
        const err = await res.json();
        toast({ title: "Erreur", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const sendConvocation = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/qualifications/commissions/${id}/convocation`, {
        method: "POST", credentials: "include"
      });
      if (res.ok) {
        toast({ title: "Succès", description: "Convocation FOR 105 envoyée" });
        fetchCommissions();
        setDetailOpen(false);
      }
    } catch {
      toast({ title: "Erreur", description: "Erreur", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const startSession = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/qualifications/commissions/${id}/start-session`, {
        method: "POST", credentials: "include"
      });
      if (res.ok) {
        toast({ title: "Succès", description: "Séance démarrée" });
        fetchCommissions();
        setDetailOpen(false);
      }
    } catch {
      toast({ title: "Erreur", description: "Erreur", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const completeCommission = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/qualifications/commissions/${id}/complete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutesText, decisionsJson, participantsJson }),
      });
      if (res.ok) {
        toast({ title: "Succès", description: "Commission terminée, PV FOR 106 enregistré" });
        setPvOpen(false);
        setDetailOpen(false);
        fetchCommissions();
      }
    } catch {
      toast({ title: "Erreur", description: "Erreur", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total: commissions.length,
    planned: commissions.filter(c => c.status === "PLANNED").length,
    convened: commissions.filter(c => c.status === "CONVENED").length,
    inSession: commissions.filter(c => c.status === "IN_SESSION").length,
    completed: commissions.filter(c => c.status === "COMPLETED").length,
  }), [commissions]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Commission de Qualification</h1>
              <p className="text-gray-500 mt-1">Planification et suivi des sessions de la Commission (FOR 105 / FOR 106)</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchCommissions}>
                <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nouvelle Commission
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-gray-500">Total</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{stats.planned}</div><div className="text-xs text-gray-500">Planifiées</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-yellow-600">{stats.convened}</div><div className="text-xs text-gray-500">Convoquées</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{stats.inSession}</div><div className="text-xs text-gray-500">En séance</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{stats.completed}</div><div className="text-xs text-gray-500">Terminées</div></CardContent></Card>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Heure</TableHead>
                    <TableHead>Lieu</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Convocation</TableHead>
                    <TableHead>PV</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">Chargement...</TableCell></TableRow>
                  ) : commissions.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">Aucune commission planifiée</TableCell></TableRow>
                  ) : commissions.map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-gray-50"
                      onClick={() => { setSelectedCommission(c); setDetailOpen(true); }}>
                      <TableCell className="font-mono font-medium">{c.referenceNumber}</TableCell>
                      <TableCell>{new Date(c.meetingDate).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{c.meetingTime || "-"}</TableCell>
                      <TableCell>{c.meetingLocation || "-"}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[c.status] || "bg-gray-100"}>
                          {STATUS_LABELS[c.status] || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {c.convocationSent ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        {c.pvSigned ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Planifier une Commission de Qualification</DialogTitle>
            <DialogDescription>FOR 105 - Convocation de la Commission</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Date de la réunion *</Label>
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>
            <div>
              <Label>Heure</Label>
              <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} />
            </div>
            <div>
              <Label>Lieu</Label>
              <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} />
            </div>
            <div>
              <Label>Ordre du jour</Label>
              <Textarea value={formAgenda} onChange={e => setFormAgenda(e.target.value)}
                placeholder="Points à l'ordre du jour..." rows={3} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)}
                placeholder="Notes additionnelles..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={actionLoading || !formDate}>Planifier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedCommission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Commission {selectedCommission.referenceNumber}
                </DialogTitle>
                <DialogDescription>
                  {new Date(selectedCommission.meetingDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  {selectedCommission.meetingTime && ` à ${selectedCommission.meetingTime}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Lieu</Label>
                    <p className="font-medium">{selectedCommission.meetingLocation || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Statut</Label>
                    <Badge className={STATUS_COLORS[selectedCommission.status]}>{STATUS_LABELS[selectedCommission.status]}</Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Président</Label>
                    <p className="font-medium">{selectedCommission.president?.fullName || "Non assigné"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Rapporteur</Label>
                    <p className="font-medium">{selectedCommission.rapporteur?.fullName || "Non assigné"}</p>
                  </div>
                </div>

                {selectedCommission.agendaJson && (
                  <div>
                    <Label className="text-xs text-gray-500">Ordre du jour</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedCommission.agendaJson}</p>
                  </div>
                )}

                {selectedCommission.minutesText && (
                  <div>
                    <Label className="text-xs text-gray-500">Procès-verbal (FOR 106)</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedCommission.minutesText}</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-4 border-t">
                  {selectedCommission.status === "PLANNED" && (
                    <Button onClick={() => sendConvocation(selectedCommission.id)} disabled={actionLoading}>
                      <Send className="h-4 w-4 mr-2" /> Envoyer convocation (FOR 105)
                    </Button>
                  )}
                  {selectedCommission.status === "CONVENED" && (
                    <Button onClick={() => startSession(selectedCommission.id)} disabled={actionLoading}>
                      <PlayCircle className="h-4 w-4 mr-2" /> Ouvrir la séance
                    </Button>
                  )}
                  {selectedCommission.status === "IN_SESSION" && (
                    <Button onClick={() => setPvOpen(true)}>
                      <FileText className="h-4 w-4 mr-2" /> Clôturer et rédiger PV (FOR 106)
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* PV Dialog */}
      <Dialog open={pvOpen} onOpenChange={setPvOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Procès-Verbal (FOR 106)</DialogTitle>
            <DialogDescription>Rédiger le PV de la commission</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Participants</Label>
              <Textarea value={participantsJson} onChange={e => setParticipantsJson(e.target.value)}
                placeholder="Liste des participants..." rows={3} />
            </div>
            <div>
              <Label>Compte-rendu des discussions</Label>
              <Textarea value={minutesText} onChange={e => setMinutesText(e.target.value)}
                placeholder="Résumé des discussions et débats..." rows={5} />
            </div>
            <div>
              <Label>Décisions prises</Label>
              <Textarea value={decisionsJson} onChange={e => setDecisionsJson(e.target.value)}
                placeholder="Liste des décisions..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPvOpen(false)}>Annuler</Button>
            <Button onClick={() => selectedCommission && completeCommission(selectedCommission.id)}
              disabled={actionLoading || !minutesText}>
              Signer et clôturer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
