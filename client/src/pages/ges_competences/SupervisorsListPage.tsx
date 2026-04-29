import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Award, Search, ShieldCheck, UserCheck, Plus, RefreshCw } from "lucide-react";

interface Supervisor {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  roles?: string;
}
interface Qualification {
  id: number;
  evaluator: { id: number; fullName: string; email: string };
  qualifiedRole: string;
  status: string;
  missionsCompletedCurrentCycle?: number;
}

export default function SupervisorsListPage() {
  const { toast } = useToast();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [eligible, setEligible] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [qualifyOpen, setQualifyOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [employmentType, setEmploymentType] = useState("EXTERNAL");

  useEffect(() => {
    document.title = "Liste des Superviseurs (LIS 09) | ALGERAC";
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, qRes] = await Promise.all([
        fetch("/api/competency/supervisors", { credentials: "include" }),
        fetch("/api/qualifications/active", { credentials: "include" }),
      ]);
      if (sRes.ok) setSupervisors(await sRes.json());
      if (qRes.ok) {
        const qs: Qualification[] = await qRes.json();
        setEligible(
          qs.filter(
            (q) =>
              (q.qualifiedRole === "REE" || q.qualifiedRole === "ET") &&
              (q.missionsCompletedCurrentCycle ?? 0) >= 3
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const qualifySupervisor = async () => {
    if (!selectedUser) return;
    const res = await fetch("/api/competency/supervisors/qualify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: selectedUser, employmentType }),
    });
    if (res.ok) {
      toast({ title: "Superviseur qualifié", description: "L'utilisateur a obtenu le rôle SUP." });
      setQualifyOpen(false);
      setSelectedUser(null);
      fetchAll();
    } else {
      const err = await res.json();
      toast({ title: "Erreur", description: err.error || "Critères non remplis", variant: "destructive" });
    }
  };

  const filtered = supervisors.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-600" /> Liste des Superviseurs (LIS 09)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Gestion des superviseurs ALGERAC — PRO 06 §5.2
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAll}>
                <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
              </Button>
              <Button onClick={() => setQualifyOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Qualifier un superviseur
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Superviseurs actifs ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  className="pl-10"
                  placeholder="Rechercher par nom ou email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {loading ? (
                <p className="text-sm text-slate-500">Chargement…</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">Aucun superviseur</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Rôle principal</TableHead>
                      <TableHead>Tous rôles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.fullName}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.phone || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{s.role}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(s.roles || s.role).split(",").map((r) => (
                              <Badge key={r} className="bg-emerald-100 text-emerald-800">{r.trim()}</Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" /> Évaluateurs éligibles (REE/ET avec ≥3 missions)</CardTitle>
            </CardHeader>
            <CardContent>
              {eligible.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">Aucun candidat éligible actuellement.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Missions cycle</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligible.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.evaluator.fullName}</TableCell>
                        <TableCell><Badge>{q.qualifiedRole}</Badge></TableCell>
                        <TableCell>{q.missionsCompletedCurrentCycle ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => { setSelectedUser(q.evaluator.id); setQualifyOpen(true); }}>
                            <Award className="h-3 w-3 mr-1" /> Qualifier SUP
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={qualifyOpen} onOpenChange={setQualifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qualifier comme superviseur (SUP)</DialogTitle>
            <DialogDescription>PRO 06 §5.2 — REE/ET ayant réalisé ≥ 3 évaluations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Utilisateur</Label>
              <Select value={selectedUser?.toString() || ""} onValueChange={(v) => setSelectedUser(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un évaluateur éligible" /></SelectTrigger>
                <SelectContent>
                  {eligible.map((q) => (
                    <SelectItem key={q.evaluator.id} value={q.evaluator.id.toString()}>
                      {q.evaluator.fullName} — {q.qualifiedRole}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type d'emploi</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXTERNAL">Externe (cycle 3 ans)</SelectItem>
                  <SelectItem value="PERMANENT">Permanent (cycle 6 ans)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQualifyOpen(false)}>Annuler</Button>
            <Button onClick={qualifySupervisor} disabled={!selectedUser}>Qualifier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
