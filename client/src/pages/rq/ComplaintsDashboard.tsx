import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, Search, Eye, CheckCircle, XCircle, Clock, AlertTriangle,
  FileText, MessageSquareWarning, BarChart3, Download, Send as SendIcon, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface Complaint {
  id: number;
  trackingCode: string;
  complainantName: string;
  complainantEmail: string;
  complainantPhone?: string;
  complainantOrganization?: string;
  targetOrganization?: string;
  category: string;
  subject: string;
  description: string;
  expectedResolution?: string;
  isPublic: boolean;
  submittedByUserId?: number;
  submittedByRole?: string;
  status: "RECEIVED" | "UNDER_REVIEW" | "INVESTIGATION" | "FOUNDED" | "UNFOUNDED" | "RESOLVED" | "CLOSED";
  decision?: string;
  decisionDate?: string;
  rqNotes?: string;
  correctiveActions?: string;
  createdAt: string;
  updatedAt?: string;
}

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899"];

const categoryLabels: Record<string, string> = {
  quality: "Qualité",
  delay: "Délais",
  competence: "Compétence",
  impartiality: "Impartialité",
  confidentiality: "Confidentialité",
  other: "Autre",
};

export default function RQComplaintsDashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [decisionDialog, setDecisionDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [decisionForm, setDecisionForm] = useState({ decision: "", notes: "", correctiveActions: "" });

  useEffect(() => {
    if (user && !authLoading) loadComplaints();
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/complaints/all");
      const json = await res.json();
      // Backend returns ApiResponse { success, message, data: [...] }
      const list = Array.isArray(json) ? json : (json.data && Array.isArray(json.data) ? json.data : []);
      setComplaints(list);
    } catch {
      // Mock data for development
      setComplaints([
        {
          id: 1, trackingCode: "PLT-2026-001", complainantName: "Ahmed Bensalem", complainantEmail: "ahmed@example.dz",
          complainantOrganization: "Société ABC", targetOrganization: "ENACT", category: "quality",
          subject: "Non-conformité dans le processus d'évaluation", description: "L'évaluation réalisée ne respecte pas les normes ISO 17025...",
          isPublic: true, status: "RECEIVED", createdAt: "2026-02-15"
        },
        {
          id: 2, trackingCode: "PLT-2026-002", complainantName: "Fatima Khelifi", complainantEmail: "fatima@example.dz",
          category: "delay", subject: "Retard de traitement de la demande d'accréditation",
          description: "Ma demande d'accréditation a été soumise il y a 6 mois sans réponse...",
          isPublic: false, submittedByRole: "OEC", status: "UNDER_REVIEW", createdAt: "2026-01-20"
        },
        {
          id: 3, trackingCode: "PLT-2026-003", complainantName: "Karim Meziane", complainantEmail: "karim@lab.dz",
          targetOrganization: "LGCE", category: "impartiality",
          subject: "Conflit d'intérêts d'un évaluateur",
          description: "L'évaluateur assigné a des liens commerciaux avec l'organisme évalué...",
          isPublic: true, status: "FOUNDED", decision: "Plainte fondée - mesures correctives appliquées",
          decisionDate: "2026-02-10", createdAt: "2026-01-05"
        },
        {
          id: 4, trackingCode: "PLT-2026-004", complainantName: "Sara Belhadj", complainantEmail: "sara@test.dz",
          category: "competence", subject: "Manque de compétence technique de l'équipe",
          description: "L'équipe d'évaluation ne possédait pas les compétences requises...",
          isPublic: false, submittedByRole: "OEC", status: "UNFOUNDED",
          decision: "Plainte non fondée", decisionDate: "2026-02-18", createdAt: "2025-12-15"
        },
      ]);
    } finally { setLoading(false); }
  };

  const handleDecision = async (founded: boolean) => {
    if (!selectedComplaint) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/complaints/${selectedComplaint.id}/decision`, {
        status: founded ? "FOUNDED" : "UNFOUNDED",
        decision: decisionForm.decision,
        rqNotes: decisionForm.notes,
        correctiveActions: founded ? decisionForm.correctiveActions : null,
      });
      toast({ title: founded ? "Plainte fondée" : "Plainte non fondée", description: "La décision a été enregistrée." });
      setDecisionDialog(false);
      setDetailsOpen(false);
      loadComplaints();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer la décision." });
    } finally { setProcessing(false); }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchSearch = c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.complainantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchCategory = filterCategory === "all" || c.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      RECEIVED: { color: "bg-blue-500", label: "Reçue" },
      UNDER_REVIEW: { color: "bg-yellow-500", label: "En examen" },
      INVESTIGATION: { color: "bg-orange-500", label: "Investigation" },
      FOUNDED: { color: "bg-red-500", label: "Fondée" },
      UNFOUNDED: { color: "bg-gray-500", label: "Non fondée" },
      RESOLVED: { color: "bg-green-500", label: "Résolue" },
      CLOSED: { color: "bg-slate-500", label: "Clôturée" },
    };
    const m = map[status] || { color: "bg-gray-400", label: status };
    return <Badge className={m.color}>{m.label}</Badge>;
  };

  // Stats for charts
  const statusData = Object.entries(
    complaints.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const categoryData = Object.entries(
    complaints.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: categoryLabels[name] || name, value }));

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ["RECEIVED", "UNDER_REVIEW", "INVESTIGATION"].includes(c.status)).length,
    founded: complaints.filter(c => c.status === "FOUNDED").length,
    unfounded: complaints.filter(c => c.status === "UNFOUNDED").length,
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <Tabs defaultValue="complaints" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{t('complaints.rq.title')}</h1>
                <p className="text-muted-foreground mt-1">{t('complaints.rq.subtitle')}</p>
              </div>
              <TabsList>
                <TabsTrigger value="complaints"><MessageSquareWarning className="w-4 h-4 mr-2" />Plaintes</TabsTrigger>
                <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-2" />Tableau de bord</TabsTrigger>
              </TabsList>
            </div>

            {/* Complaints Tab */}
            <TabsContent value="complaints" className="space-y-6">
              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></div><MessageSquareWarning className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">En cours</p><p className="text-2xl font-bold">{stats.pending}</p></div><Clock className="h-8 w-8 text-yellow-500" /></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Fondées</p><p className="text-2xl font-bold">{stats.founded}</p></div><AlertTriangle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Non fondées</p><p className="text-2xl font-bold">{stats.unfounded}</p></div><XCircle className="h-8 w-8 text-gray-500" /></div></CardContent></Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Rechercher</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Code, objet, plaignant..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="RECEIVED">Reçue</SelectItem>
                          <SelectItem value="UNDER_REVIEW">En examen</SelectItem>
                          <SelectItem value="INVESTIGATION">Investigation</SelectItem>
                          <SelectItem value="FOUNDED">Fondée</SelectItem>
                          <SelectItem value="UNFOUNDED">Non fondée</SelectItem>
                          <SelectItem value="RESOLVED">Résolue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          <SelectItem value="quality">Qualité</SelectItem>
                          <SelectItem value="delay">Délais</SelectItem>
                          <SelectItem value="competence">Compétence</SelectItem>
                          <SelectItem value="impartiality">Impartialité</SelectItem>
                          <SelectItem value="confidentiality">Confidentialité</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Complaints Table */}
              <Card>
                <CardHeader><CardTitle>Plaintes ({filteredComplaints.length})</CardTitle></CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                  ) : filteredComplaints.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Aucune plainte trouvée</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Plaignant</TableHead>
                            <TableHead>Objet</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredComplaints.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-mono text-sm">{c.trackingCode}</TableCell>
                              <TableCell><div><p className="font-medium">{c.complainantName}</p><p className="text-xs text-muted-foreground">{c.complainantEmail}</p></div></TableCell>
                              <TableCell className="max-w-[200px] truncate">{c.subject}</TableCell>
                              <TableCell><Badge variant="outline">{categoryLabels[c.category] || c.category}</Badge></TableCell>
                              <TableCell>{c.isPublic ? <Badge variant="outline" className="border-green-300 text-green-700">Public</Badge> : <Badge variant="outline" className="border-blue-300 text-blue-700">{c.submittedByRole || "Interne"}</Badge>}</TableCell>
                              <TableCell>{new Date(c.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                              <TableCell>{getStatusBadge(c.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => { setSelectedComplaint(c); setDetailsOpen(true); }}>
                                    <Eye className="w-4 h-4 mr-1" />Voir
                                  </Button>
                                  {["RECEIVED", "UNDER_REVIEW", "INVESTIGATION"].includes(c.status) && (
                                    <Button size="sm" variant="outline" onClick={() => { setSelectedComplaint(c); setDecisionForm({ decision: "", notes: "", correctiveActions: "" }); setDecisionDialog(true); }}>
                                      Décider
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Répartition par statut</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Répartition par catégorie</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Indicateurs clés - FOR 02-1</CardTitle>
                    <CardDescription>Rapport annuel des plaintes (conforme ISO 17011)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                        <p className="text-sm text-muted-foreground mt-1">Plaintes totales</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-700">{stats.total > 0 ? ((stats.founded / stats.total) * 100).toFixed(0) : 0}%</p>
                        <p className="text-sm text-muted-foreground mt-1">Taux de plaintes fondées</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
                        <p className="text-sm text-muted-foreground mt-1">En cours de traitement</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-3xl font-bold text-purple-700">
                          {complaints.filter(c => c.isPublic).length} / {complaints.filter(c => !c.isPublic).length}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Publiques / Internes</p>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button variant="outline"><Download className="w-4 h-4 mr-2" />Exporter FOR 50</Button>
                      <Button variant="outline"><Download className="w-4 h-4 mr-2" />Exporter FOR 02-1</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Complaint Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plainte {selectedComplaint?.trackingCode}</DialogTitle>
            <DialogDescription>{selectedComplaint?.subject}</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Plaignant</Label><p className="font-medium">{selectedComplaint.complainantName}</p></div>
                <div><Label className="text-muted-foreground">Email</Label><p>{selectedComplaint.complainantEmail}</p></div>
                {selectedComplaint.complainantOrganization && <div><Label className="text-muted-foreground">Organisation</Label><p>{selectedComplaint.complainantOrganization}</p></div>}
                {selectedComplaint.targetOrganization && <div><Label className="text-muted-foreground">Organisme visé</Label><p>{selectedComplaint.targetOrganization}</p></div>}
                <div><Label className="text-muted-foreground">Catégorie</Label><p><Badge variant="outline">{categoryLabels[selectedComplaint.category] || selectedComplaint.category}</Badge></p></div>
                <div><Label className="text-muted-foreground">Statut</Label><p>{getStatusBadge(selectedComplaint.status)}</p></div>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded">{selectedComplaint.description}</p>
              </div>
              {selectedComplaint.expectedResolution && (
                <div>
                  <Label className="text-muted-foreground">Résolution attendue</Label>
                  <p className="mt-1 text-sm">{selectedComplaint.expectedResolution}</p>
                </div>
              )}
              {selectedComplaint.decision && (
                <Alert className={selectedComplaint.status === "FOUNDED" ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}>
                  <AlertDescription>
                    <strong>Décision ({selectedComplaint.decisionDate}) :</strong> {selectedComplaint.decision}
                  </AlertDescription>
                </Alert>
              )}
              {["RECEIVED", "UNDER_REVIEW", "INVESTIGATION"].includes(selectedComplaint.status) && (
                <div className="pt-4 border-t">
                  <Button className="w-full" onClick={() => { setDecisionForm({ decision: "", notes: "", correctiveActions: "" }); setDecisionDialog(true); }}>
                    Prendre une décision
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog open={decisionDialog} onOpenChange={setDecisionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Décision sur la plainte</DialogTitle>
            <DialogDescription>{selectedComplaint?.trackingCode} - {selectedComplaint?.subject}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Analyse et conclusion <span className="text-red-500">*</span></Label>
              <Textarea value={decisionForm.decision} onChange={(e) => setDecisionForm(p => ({ ...p, decision: e.target.value }))} placeholder="Résumé de l'analyse réalisée et conclusion..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Notes RQ ( visible uniquement pour vous )</Label>
              <Textarea value={decisionForm.notes} onChange={(e) => setDecisionForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes internes du responsable qualité..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Actions correctives (si fondée)</Label>
              <Textarea value={decisionForm.correctiveActions} onChange={(e) => setDecisionForm(p => ({ ...p, correctiveActions: e.target.value }))} placeholder="Mesures correctives à mettre en place..." rows={3} />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDecisionDialog(false)} disabled={processing}>Annuler</Button>
            <Button variant="outline" className="border-gray-300" onClick={() => handleDecision(false)} disabled={processing || !decisionForm.decision.trim()}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}Non fondée
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleDecision(true)} disabled={processing || !decisionForm.decision.trim()}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}Fondée
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
