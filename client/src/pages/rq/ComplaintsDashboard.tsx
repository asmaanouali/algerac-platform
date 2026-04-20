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
  MessageSquareWarning, BarChart3, Download, UserPlus, ArrowRight,
  ShieldCheck, Timer, Ban
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

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
  assignedToUser?: { id: number; fullName: string; role: string };
  investigationDeadline?: string;
  status: string;
  decision?: string;
  decisionDate?: string;
  rqNotes?: string;
  correctiveActions?: string;
  createdAt: string;
  updatedAt?: string;
}

interface StaffMember {
  id: number;
  fullName: string;
  role: string;
  email: string;
}

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const categoryLabels: Record<string, string> = {
  quality: "Qualit\u00e9",
  delay: "D\u00e9lais",
  competence: "Comp\u00e9tence",
  impartiality: "Impartialit\u00e9",
  confidentiality: "Confidentialit\u00e9",
  other: "Autre",
};

const statusConfig: Record<string, { color: string; label: string }> = {
  RECEIVED: { color: "bg-blue-500", label: "Re\u00e7ue" },
  UNDER_REVIEW: { color: "bg-yellow-500", label: "En examen" },
  ASSIGNED: { color: "bg-indigo-500", label: "Assign\u00e9e" },
  INVESTIGATION: { color: "bg-orange-500", label: "Investigation" },
  FOUNDED: { color: "bg-red-500", label: "Fond\u00e9e" },
  UNFOUNDED: { color: "bg-gray-500", label: "Non fond\u00e9e" },
  CORRECTIVE_ACTIONS: { color: "bg-amber-500", label: "Actions correctives" },
  RESOLVED: { color: "bg-green-500", label: "R\u00e9solue" },
  CLOSED: { color: "bg-slate-500", label: "Cl\u00f4tur\u00e9e" },
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
  const [assignDialog, setAssignDialog] = useState(false);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [decisionForm, setDecisionForm] = useState({ decision: "", notes: "", correctiveActions: "" });
  const [assignableStaff, setAssignableStaff] = useState<StaffMember[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [closeFinalResponse, setCloseFinalResponse] = useState("");

  useEffect(() => {
    if (user && !authLoading) {
      loadComplaints();
      loadStaff();
    }
  }, [user, authLoading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/complaints/all");
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data && Array.isArray(json.data) ? json.data : []);
      setComplaints(list);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les plaintes." });
      setComplaints([]);
    } finally { setLoading(false); }
  };

  const loadStaff = async () => {
    try {
      const res = await apiRequest("GET", "/api/complaints/assignable-staff");
      const json = await res.json();
      const staff = Array.isArray(json) ? json : (json.data && Array.isArray(json.data) ? json.data : []);
      setAssignableStaff(staff);
    } catch {
      setAssignableStaff([]);
    }
  };

  const handleStatusUpdate = async (complaintId: number, newStatus: string) => {
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/complaints/${complaintId}/status`, { status: newStatus });
      toast({ title: "Statut mis \u00e0 jour", description: `Plainte: ${statusConfig[newStatus]?.label || newStatus}` });
      setDetailsOpen(false);
      loadComplaints();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre \u00e0 jour." });
    } finally { setProcessing(false); }
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
      toast({ title: founded ? "Plainte fond\u00e9e" : "Plainte non fond\u00e9e", description: "D\u00e9cision enregistr\u00e9e." });
      setDecisionDialog(false);
      setDetailsOpen(false);
      loadComplaints();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer la d\u00e9cision." });
    } finally { setProcessing(false); }
  };

  const handleAssign = async () => {
    if (!selectedComplaint || !selectedInvestigator) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/complaints/${selectedComplaint.id}/assign`, { investigatorId: parseInt(selectedInvestigator) });
      toast({ title: "Plainte assign\u00e9e", description: "Investigateur notifi\u00e9. Deadline: 3 mois." });
      setAssignDialog(false);
      setDetailsOpen(false);
      loadComplaints();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'assigner." });
    } finally { setProcessing(false); }
  };

  const handleResolve = async () => {
    if (!selectedComplaint) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/complaints/${selectedComplaint.id}/resolve`, { notes: resolveNotes });
      toast({ title: "Plainte r\u00e9solue", description: "Actions correctives valid\u00e9es." });
      setResolveDialog(false);
      setDetailsOpen(false);
      loadComplaints();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de r\u00e9soudre." });
    } finally { setProcessing(false); }
  };

  const handleClose = async () => {
    if (!selectedComplaint) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/complaints/${selectedComplaint.id}/close`, { finalResponse: closeFinalResponse });
      toast({ title: "Plainte cl\u00f4tur\u00e9e", description: "Email de cl\u00f4ture envoy\u00e9." });
      setCloseDialog(false);
      setDetailsOpen(false);
      loadComplaints();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de cl\u00f4turer." });
    } finally { setProcessing(false); }
  };

  const exportFOR50 = () => {
    const headers = ["Code", "Plaignant", "Email", "Organisation", "Organisme", "Cat\u00e9gorie", "Objet", "Description", "Statut", "D\u00e9cision", "Date d\u00e9cision", "Date d\u00e9p\u00f4t"];
    const rows = complaints.map(c => [
      c.trackingCode, c.complainantName, c.complainantEmail,
      c.complainantOrganization || "", c.targetOrganization || "",
      categoryLabels[c.category] || c.category, c.subject,
      c.description?.replace(/\n/g, " ").substring(0, 200),
      statusConfig[c.status]?.label || c.status, c.decision || "",
      c.decisionDate ? new Date(c.decisionDate).toLocaleDateString("fr-FR") : "",
      new Date(c.createdAt).toLocaleDateString("fr-FR"),
    ]);
    const BOM = "\uFEFF";
    const csv = BOM + [headers.join(";"), ...rows.map(r => r.map(v => `"${v}"`).join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FOR50_Plaintes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export FOR 50", description: "CSV t\u00e9l\u00e9charg\u00e9." });
  };

  const exportFOR021 = () => {
    const founded = complaints.filter(c => ["FOUNDED", "CORRECTIVE_ACTIONS", "RESOLVED", "CLOSED"].includes(c.status));
    const headers = ["Code", "Plaignant", "Cat\u00e9gorie", "Objet", "D\u00e9cision", "Actions correctives", "Statut", "Date d\u00e9cision", "Date d\u00e9p\u00f4t"];
    const rows = founded.map(c => [
      c.trackingCode, c.complainantName, categoryLabels[c.category] || c.category,
      c.subject, c.decision || "", c.correctiveActions || "",
      statusConfig[c.status]?.label || c.status,
      c.decisionDate ? new Date(c.decisionDate).toLocaleDateString("fr-FR") : "",
      new Date(c.createdAt).toLocaleDateString("fr-FR"),
    ]);
    const BOM = "\uFEFF";
    const csv = BOM + [headers.join(";"), ...rows.map(r => r.map(v => `"${v.replace(/\n/g, " ")}"`).join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FOR02-1_NC_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export FOR 02-1", description: "NC t\u00e9l\u00e9charg\u00e9." });
  };

  const filteredComplaints = complaints.filter(c => {
    const matchSearch = c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.trackingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.complainantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchCategory = filterCategory === "all" || c.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const getStatusBadge = (status: string) => {
    const conf = statusConfig[status] || { color: "bg-gray-400", label: status };
    return <Badge className={conf.color}>{conf.label}</Badge>;
  };

  const isDeadlineApproaching = (deadline?: string) => {
    if (!deadline) return false;
    const d = new Date(deadline);
    const now = new Date();
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    return d <= twoWeeks && d > now;
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const statusData = Object.entries(
    complaints.reduce((acc, c) => { acc[statusConfig[c.status]?.label || c.status] = (acc[statusConfig[c.status]?.label || c.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const categoryData = Object.entries(
    complaints.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: categoryLabels[name] || name, value }));

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ["RECEIVED", "UNDER_REVIEW", "ASSIGNED", "INVESTIGATION"].includes(c.status)).length,
    founded: complaints.filter(c => ["FOUNDED", "CORRECTIVE_ACTIONS"].includes(c.status)).length,
    unfounded: complaints.filter(c => c.status === "UNFOUNDED").length,
    resolved: complaints.filter(c => ["RESOLVED", "CLOSED"].includes(c.status)).length,
    overdue: complaints.filter(c => isOverdue(c.investigationDeadline) && !["RESOLVED", "CLOSED", "UNFOUNDED"].includes(c.status)).length,
  };

  const getActions = (c: Complaint) => {
    const actions: { label: string; icon: React.ReactNode; action: () => void }[] = [];
    if (c.status === "RECEIVED") {
      actions.push({ label: "Passer en examen", icon: <ArrowRight className="w-4 h-4 mr-1" />, action: () => handleStatusUpdate(c.id, "UNDER_REVIEW") });
    }
    if (c.status === "UNDER_REVIEW" || c.status === "ASSIGNED") {
      actions.push({ label: "Lancer investigation", icon: <Search className="w-4 h-4 mr-1" />, action: () => handleStatusUpdate(c.id, "INVESTIGATION") });
    }
    if (["RECEIVED", "UNDER_REVIEW"].includes(c.status)) {
      actions.push({ label: "Assigner", icon: <UserPlus className="w-4 h-4 mr-1" />, action: () => { setSelectedComplaint(c); setSelectedInvestigator(""); setAssignDialog(true); } });
    }
    if (["RECEIVED", "UNDER_REVIEW", "ASSIGNED", "INVESTIGATION"].includes(c.status)) {
      actions.push({ label: "D\u00e9cider", icon: <ShieldCheck className="w-4 h-4 mr-1" />, action: () => { setSelectedComplaint(c); setDecisionForm({ decision: "", notes: "", correctiveActions: "" }); setDecisionDialog(true); } });
    }
    if (["FOUNDED", "CORRECTIVE_ACTIONS"].includes(c.status)) {
      actions.push({ label: "R\u00e9soudre", icon: <CheckCircle className="w-4 h-4 mr-1" />, action: () => { setSelectedComplaint(c); setResolveNotes(""); setResolveDialog(true); } });
    }
    if (["RESOLVED", "UNFOUNDED"].includes(c.status)) {
      actions.push({ label: "Cl\u00f4turer", icon: <Ban className="w-4 h-4 mr-1" />, action: () => { setSelectedComplaint(c); setCloseFinalResponse(""); setCloseDialog(true); } });
    }
    return actions;
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

            {stats.overdue > 0 && (
              <Alert className="border-red-300 bg-red-50">
                <Timer className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Alerte d\u00e9lais PRO 21 :</strong> {stats.overdue} plainte(s) ont d\u00e9pass\u00e9 le d\u00e9lai de 3 mois.
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value="complaints" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-5">
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></div><MessageSquareWarning className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">En cours</p><p className="text-2xl font-bold">{stats.pending}</p></div><Clock className="h-8 w-8 text-yellow-500" /></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Fond\u00e9es</p><p className="text-2xl font-bold">{stats.founded}</p></div><AlertTriangle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">R\u00e9solues</p><p className="text-2xl font-bold">{stats.resolved}</p></div><CheckCircle className="h-8 w-8 text-green-500" /></div></CardContent></Card>
                <Card className={stats.overdue > 0 ? "border-red-300" : ""}><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">En retard</p><p className={`text-2xl font-bold ${stats.overdue > 0 ? "text-red-600" : ""}`}>{stats.overdue}</p></div><Timer className={`h-8 w-8 ${stats.overdue > 0 ? "text-red-500" : "text-gray-400"}`} /></div></CardContent></Card>
              </div>

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
                          {Object.entries(statusConfig).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cat\u00e9gorie</Label>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          {Object.entries(categoryLabels).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Plaintes ({filteredComplaints.length})</CardTitle></CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                  ) : filteredComplaints.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Aucune plainte trouv\u00e9e</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Plaignant</TableHead>
                            <TableHead>Objet</TableHead>
                            <TableHead>Cat\u00e9gorie</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Deadline</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredComplaints.map((c) => (
                            <TableRow key={c.id} className={isOverdue(c.investigationDeadline) && !["RESOLVED", "CLOSED", "UNFOUNDED"].includes(c.status) ? "bg-red-50/50" : ""}>
                              <TableCell className="font-mono text-sm">{c.trackingCode}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{c.complainantName}</p>
                                  <p className="text-xs text-muted-foreground">{c.complainantEmail}</p>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">{c.subject}</TableCell>
                              <TableCell><Badge variant="outline">{categoryLabels[c.category] || c.category}</Badge></TableCell>
                              <TableCell>
                                {c.isPublic
                                  ? <Badge variant="outline" className="border-green-300 text-green-700">Public</Badge>
                                  : <Badge variant="outline" className="border-blue-300 text-blue-700">{c.submittedByRole || "Interne"}</Badge>
                                }
                              </TableCell>
                              <TableCell className="text-sm">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                              <TableCell>{getStatusBadge(c.status)}</TableCell>
                              <TableCell>
                                {c.investigationDeadline ? (
                                  <span className={`text-xs ${isOverdue(c.investigationDeadline) ? "text-red-600 font-bold" : isDeadlineApproaching(c.investigationDeadline) ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                                    {new Date(c.investigationDeadline).toLocaleDateString("fr-FR")}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">{"\u2014"}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end flex-wrap">
                                  <Button variant="ghost" size="sm" onClick={() => { setSelectedComplaint(c); setDetailsOpen(true); }}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {getActions(c).length > 0 && (
                                    <Select onValueChange={(val) => {
                                      const action = getActions(c).find((_, i) => i.toString() === val);
                                      action?.action();
                                    }}>
                                      <SelectTrigger className="h-8 w-[110px] text-xs">
                                        <SelectValue placeholder="Actions" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getActions(c).map((action, i) => (
                                          <SelectItem key={i} value={i.toString()}>
                                            {action.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
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

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>R\u00e9partition par statut</CardTitle></CardHeader>
                  <CardContent>
                    {statusData.length === 0 ? (
                      <p className="text-center py-12 text-muted-foreground">Aucune donn\u00e9e</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                            {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>R\u00e9partition par cat\u00e9gorie</CardTitle></CardHeader>
                  <CardContent>
                    {categoryData.length === 0 ? (
                      <p className="text-center py-12 text-muted-foreground">Aucune donn\u00e9e</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Indicateurs cl\u00e9s — Bilan annuel PRO 21</CardTitle>
                    <CardDescription>Rapport conforme ISO 17011 : FOR 50 / FOR 02-1</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                        <p className="text-sm text-muted-foreground mt-1">Plaintes totales</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-3xl font-bold text-red-700">{stats.total > 0 ? ((stats.founded / stats.total) * 100).toFixed(0) : 0}%</p>
                        <p className="text-sm text-muted-foreground mt-1">Taux fond\u00e9es</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
                        <p className="text-sm text-muted-foreground mt-1">En cours</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-700">{stats.resolved}</p>
                        <p className="text-sm text-muted-foreground mt-1">R\u00e9solues/Cl\u00f4tur\u00e9es</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-3xl font-bold text-purple-700">
                          {complaints.filter(c => c.isPublic).length} / {complaints.filter(c => !c.isPublic).length}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Publiques / Internes</p>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button variant="outline" onClick={exportFOR50}>
                        <Download className="w-4 h-4 mr-2" />Exporter FOR 50
                      </Button>
                      <Button variant="outline" onClick={exportFOR021}>
                        <Download className="w-4 h-4 mr-2" />Exporter FOR 02-1
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Plainte {selectedComplaint?.trackingCode}
              {selectedComplaint && getStatusBadge(selectedComplaint.status)}
            </DialogTitle>
            <DialogDescription>{selectedComplaint?.subject}</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              {isOverdue(selectedComplaint.investigationDeadline) && !["RESOLVED", "CLOSED", "UNFOUNDED"].includes(selectedComplaint.status) && (
                <Alert className="border-red-300 bg-red-50">
                  <Timer className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Deadline d\u00e9pass\u00e9e !</strong> D\u00e9lai PRO 21 d\u00e9pass\u00e9 depuis le {new Date(selectedComplaint.investigationDeadline!).toLocaleDateString("fr-FR")}.
                  </AlertDescription>
                </Alert>
              )}
              {isDeadlineApproaching(selectedComplaint.investigationDeadline) && (
                <Alert className="border-amber-300 bg-amber-50">
                  <Timer className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Deadline approchante : {new Date(selectedComplaint.investigationDeadline!).toLocaleDateString("fr-FR")}
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Plaignant</Label><p className="font-medium">{selectedComplaint.complainantName}</p></div>
                <div><Label className="text-muted-foreground">Email</Label><p>{selectedComplaint.complainantEmail}</p></div>
                {selectedComplaint.complainantPhone && <div><Label className="text-muted-foreground">T\u00e9l\u00e9phone</Label><p>{selectedComplaint.complainantPhone}</p></div>}
                {selectedComplaint.complainantOrganization && <div><Label className="text-muted-foreground">Organisation</Label><p>{selectedComplaint.complainantOrganization}</p></div>}
                {selectedComplaint.targetOrganization && <div><Label className="text-muted-foreground">Organisme vis\u00e9</Label><p>{selectedComplaint.targetOrganization}</p></div>}
                <div><Label className="text-muted-foreground">Cat\u00e9gorie</Label><p><Badge variant="outline">{categoryLabels[selectedComplaint.category] || selectedComplaint.category}</Badge></p></div>
                <div><Label className="text-muted-foreground">Source</Label><p>{selectedComplaint.isPublic ? "Formulaire public" : `Interne (${selectedComplaint.submittedByRole || "\u2014"})`}</p></div>
                <div><Label className="text-muted-foreground">Date de d\u00e9p\u00f4t</Label><p>{new Date(selectedComplaint.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p></div>
                {selectedComplaint.assignedToUser && (
                  <div><Label className="text-muted-foreground">Investigateur</Label><p className="font-medium">{selectedComplaint.assignedToUser.fullName} ({selectedComplaint.assignedToUser.role})</p></div>
                )}
                {selectedComplaint.investigationDeadline && (
                  <div><Label className="text-muted-foreground">Deadline PRO 21</Label><p>{new Date(selectedComplaint.investigationDeadline).toLocaleDateString("fr-FR")}</p></div>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded border">{selectedComplaint.description}</p>
              </div>
              {selectedComplaint.expectedResolution && (
                <div>
                  <Label className="text-muted-foreground">R\u00e9solution attendue</Label>
                  <p className="mt-1 text-sm bg-slate-50 p-3 rounded border">{selectedComplaint.expectedResolution}</p>
                </div>
              )}
              {selectedComplaint.decision && (
                <Alert className={["FOUNDED", "CORRECTIVE_ACTIONS"].includes(selectedComplaint.status) ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}>
                  <AlertDescription>
                    <strong>D\u00e9cision {selectedComplaint.decisionDate ? `(${new Date(selectedComplaint.decisionDate).toLocaleDateString("fr-FR")})` : ""} :</strong> {selectedComplaint.decision}
                  </AlertDescription>
                </Alert>
              )}
              {selectedComplaint.correctiveActions && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertDescription><strong>Actions correctives :</strong> {selectedComplaint.correctiveActions}</AlertDescription>
                </Alert>
              )}
              {selectedComplaint.rqNotes && (
                <div>
                  <Label className="text-muted-foreground">Notes internes RQ</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap bg-yellow-50 p-3 rounded border border-yellow-200">{selectedComplaint.rqNotes}</p>
                </div>
              )}
              {getActions(selectedComplaint).length > 0 && (
                <div className="pt-4 border-t flex flex-wrap gap-2">
                  {getActions(selectedComplaint).map((action, i) => (
                    <Button key={i} variant="outline" size="sm" onClick={action.action} disabled={processing}>
                      {action.icon}{action.label}
                    </Button>
                  ))}
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
            <DialogTitle>D\u00e9cision sur la plainte</DialogTitle>
            <DialogDescription>{selectedComplaint?.trackingCode} — {selectedComplaint?.subject}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Analyse et conclusion <span className="text-red-500">*</span></Label>
              <Textarea value={decisionForm.decision} onChange={(e) => setDecisionForm(p => ({ ...p, decision: e.target.value }))} placeholder="R\u00e9sum\u00e9 de l'analyse..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Notes RQ (interne)</Label>
              <Textarea value={decisionForm.notes} onChange={(e) => setDecisionForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes internes..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Actions correctives (si fond\u00e9e)</Label>
              <Textarea value={decisionForm.correctiveActions} onChange={(e) => setDecisionForm(p => ({ ...p, correctiveActions: e.target.value }))} placeholder="Mesures correctives..." rows={3} />
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-sm text-blue-800">
                Un email sera envoy\u00e9 au plaignant avec la d\u00e9cision (PRO 21).
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDecisionDialog(false)} disabled={processing}>Annuler</Button>
            <Button variant="outline" className="border-gray-300" onClick={() => handleDecision(false)} disabled={processing || !decisionForm.decision.trim()}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}Non fond\u00e9e
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleDecision(true)} disabled={processing || !decisionForm.decision.trim()}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}Fond\u00e9e
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un investigateur</DialogTitle>
            <DialogDescription>
              {selectedComplaint?.trackingCode} — PRO 21 : la personne ne doit pas \u00eatre impliqu\u00e9e dans l'activit\u00e9 objet de la plainte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Investigateur <span className="text-red-500">*</span></Label>
              <Select value={selectedInvestigator} onValueChange={setSelectedInvestigator}>
                <SelectTrigger><SelectValue placeholder="S\u00e9lectionner un agent..." /></SelectTrigger>
                <SelectContent>
                  {assignableStaff.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.fullName} — {s.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-sm text-amber-800">
                D\u00e9lai de <strong>3 mois</strong> automatique (PRO 21). L'investigateur sera notifi\u00e9.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)} disabled={processing}>Annuler</Button>
            <Button onClick={handleAssign} disabled={processing || !selectedInvestigator}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>R\u00e9soudre la plainte</DialogTitle>
            <DialogDescription>{selectedComplaint?.trackingCode} — Valider les actions correctives</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes de r\u00e9solution</Label>
              <Textarea value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} placeholder="D\u00e9tails sur les actions correctives..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(false)} disabled={processing}>Annuler</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleResolve} disabled={processing}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}Marquer r\u00e9solue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cl\u00f4turer la plainte</DialogTitle>
            <DialogDescription>
              {selectedComplaint?.trackingCode} — PRO 21 : ALGERAC fournit une r\u00e9ponse au plaignant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>R\u00e9ponse finale au plaignant</Label>
              <Textarea value={closeFinalResponse} onChange={(e) => setCloseFinalResponse(e.target.value)} placeholder="R\u00e9ponse officielle..." rows={4} />
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-sm text-blue-800">
                Un email de cl\u00f4ture sera envoy\u00e9 au plaignant.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(false)} disabled={processing}>Annuler</Button>
            <Button onClick={handleClose} disabled={processing}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}Cl\u00f4turer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
