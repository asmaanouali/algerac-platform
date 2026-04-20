import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, Search, Filter, Calendar, Briefcase, Mail, Phone,
  Globe, Star, BookOpen, Clock, ChevronDown, X, Eye, Loader2
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  EXPERT: "Expert",
  REE: "Resp. Équipe Évaluation",
  ET: "Évaluateur Technique",
  EQ: "Évaluateur Qualité",
  EVALUATEUR: "Évaluateur",
  FORMATEUR: "Formateur",
};

const ROLE_COLORS: Record<string, string> = {
  EXPERT: "bg-purple-100 text-purple-800",
  REE: "bg-blue-100 text-blue-800",
  ET: "bg-cyan-100 text-cyan-800",
  EQ: "bg-teal-100 text-teal-800",
  EVALUATEUR: "bg-green-100 text-green-800",
  FORMATEUR: "bg-orange-100 text-orange-800",
};

const STATUS_COLORS: Record<string, string> = {
  ACCREDITED: "bg-green-100 text-green-800",
  ACCREDITATION_GRANTED: "bg-emerald-100 text-emerald-800",
  CAS_DECISION_GRANT: "bg-emerald-100 text-emerald-800",
  EVALUATION_IN_PROGRESS: "bg-blue-100 text-blue-800",
  REPORT_SUBMITTED: "bg-amber-100 text-amber-800",
  CLOSED: "bg-gray-100 text-gray-600",
  ACCREDITATION_REFUSED: "bg-red-100 text-red-800",
};

export default function ExpertDirectoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterDomain, setFilterDomain] = useState("ALL");
  const [filterAvailability, setFilterAvailability] = useState("ALL");

  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflow/experts-directory", { credentials: "include" });
      if (res.ok) setExperts(await res.json());
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de charger la liste des experts", variant: "destructive" });
    }
    setLoading(false);
  };

  // Unique domains list
  const allDomains = useMemo(() => {
    const domains = new Set<string>();
    experts.forEach((e) => {
      if (e.domaineExpertise) domains.add(e.domaineExpertise);
    });
    return Array.from(domains).sort();
  }, [experts]);

  const filtered = useMemo(() => {
    return experts.filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (e.fullName || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.specialite || "").toLowerCase().includes(q) ||
        (e.domaineExpertise || "").toLowerCase().includes(q) ||
        (e.registrationId || "").toLowerCase().includes(q);

      const matchesRole = filterRole === "ALL" || e.role === filterRole;
      const matchesDomain = filterDomain === "ALL" || e.domaineExpertise === filterDomain;

      let matchesAvail = true;
      if (filterAvailability === "AVAILABLE") matchesAvail = e.activeMissions === 0;
      else if (filterAvailability === "BUSY") matchesAvail = e.activeMissions > 0;

      return matchesSearch && matchesRole && matchesDomain && matchesAvail;
    });
  }, [experts, searchQuery, filterRole, filterDomain, filterAvailability]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterRole("ALL");
    setFilterDomain("ALL");
    setFilterAvailability("ALL");
  };

  const hasFilters =
    searchQuery || filterRole !== "ALL" || filterDomain !== "ALL" || filterAvailability !== "ALL";

  const openDetail = (expert: any) => {
    setSelected(expert);
    setShowDetail(true);
  };

  if (!user) return null;

  const totalActive = experts.filter((e) => e.activeMissions > 0).length;
  const totalAvailable = experts.filter((e) => e.activeMissions === 0).length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Répertoire des Experts</h1>
                <p className="text-muted-foreground mt-1">
                  Tous les experts, évaluateurs et leurs plannings
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={loadExperts} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualiser"}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{experts.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary/50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En mission</p>
                  <p className="text-2xl font-bold text-blue-600">{totalActive}</p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-400/50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{totalAvailable}</p>
                </div>
                <Clock className="w-8 h-8 text-green-400/50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Résultats filtrés</p>
                  <p className="text-2xl font-bold text-amber-600">{filtered.length}</p>
                </div>
                <Filter className="w-8 h-8 text-amber-400/50" />
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, email, spécialité, domaine..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les rôles</SelectItem>
                    {Object.entries(ROLE_LABELS).map(([val, lbl]) => (
                      <SelectItem key={val} value={val}>{lbl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterDomain} onValueChange={setFilterDomain}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Domaine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les domaines</SelectItem>
                    {allDomains.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Disponibilité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous</SelectItem>
                    <SelectItem value="AVAILABLE">Disponibles</SelectItem>
                    <SelectItem value="BUSY">En mission</SelectItem>
                  </SelectContent>
                </Select>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                    <X className="w-4 h-4 mr-1" />Effacer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun expert ne correspond aux filtres
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom / ID</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Domaine & Spécialité</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Missions</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e) => (
                      <TableRow key={e.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{e.fullName}</p>
                            {e.registrationId && (
                              <p className="text-xs text-muted-foreground">{e.registrationId}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${ROLE_COLORS[e.role] || "bg-gray-100 text-gray-700"}`}>
                            {ROLE_LABELS[e.role] || e.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {e.domaineExpertise && (
                              <p className="font-medium text-xs">{e.domaineExpertise}</p>
                            )}
                            {e.specialite && (
                              <p className="text-xs text-muted-foreground">{e.specialite}</p>
                            )}
                            {!e.domaineExpertise && !e.specialite && (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[140px]">{e.email}</span>
                            </div>
                            {e.phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{e.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <p className="text-base font-bold">{e.totalMissions}</p>
                            <p className="text-xs text-muted-foreground">
                              {e.activeMissions > 0 ? (
                                <span className="text-blue-600">{e.activeMissions} actives</span>
                              ) : (
                                <span className="text-green-600">libre</span>
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {e.activeMissions > 0 ? (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">En mission</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 text-xs">Disponible</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => openDetail(e)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Detail Dialog */}
      {selected && (
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {selected.fullName}
                <Badge className={`ml-2 text-xs ${ROLE_COLORS[selected.role] || ""}`}>
                  {ROLE_LABELS[selected.role] || selected.role}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="info">
              <TabsList className="mb-4">
                <TabsTrigger value="info">
                  <BookOpen className="w-4 h-4 mr-1" />Informations
                </TabsTrigger>
                <TabsTrigger value="planning">
                  <Calendar className="w-4 h-4 mr-1" />Planning ({selected.missions?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Info tab */}
              <TabsContent value="info">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoRow label="ID" value={selected.registrationId} />
                    <InfoRow label="Email" value={selected.email} icon={<Mail className="w-3.5 h-3.5" />} />
                    <InfoRow label="Téléphone" value={selected.phone} icon={<Phone className="w-3.5 h-3.5" />} />
                    <InfoRow label="Langues" value={selected.langues} icon={<Globe className="w-3.5 h-3.5" />} />
                  </div>

                  {(selected.domaineExpertise || selected.sousDomaineExpertise || selected.specialite) && (
                    <div className="p-3 bg-purple-50 rounded-lg space-y-1">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Domaine d'expertise</p>
                      {selected.domaineExpertise && <p className="text-sm font-medium">{selected.domaineExpertise}</p>}
                      {selected.sousDomaineExpertise && <p className="text-sm text-muted-foreground">{selected.sousDomaineExpertise}</p>}
                      {selected.specialite && <p className="text-sm">{selected.specialite}</p>}
                    </div>
                  )}

                  {selected.experience && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Expérience</p>
                      <p className="text-sm">{selected.experience}</p>
                    </div>
                  )}

                  {selected.diplomes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Diplômes</p>
                      <p className="text-sm">{selected.diplomes}</p>
                    </div>
                  )}

                  {selected.disponibilite && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Disponibilité déclarée</p>
                      <p className="text-sm">{selected.disponibilite}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{selected.totalMissions}</p>
                      <p className="text-xs text-muted-foreground">Total missions</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${selected.activeMissions > 0 ? "text-blue-600" : "text-green-600"}`}>
                        {selected.activeMissions}
                      </p>
                      <p className="text-xs text-muted-foreground">Missions actives</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Planning tab */}
              <TabsContent value="planning">
                {!selected.missions || selected.missions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>Aucune mission assignée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selected.missions.map((m: any, i: number) => {
                      const isActive =
                        m.requestStatus &&
                        !["CLOSED", "CAS_DECISION_REFUSAL", "WITHDRAWN", "ACCREDITATION_REFUSED"].includes(m.requestStatus);
                      return (
                        <div
                          key={i}
                          className={`p-4 rounded-lg border ${isActive ? "border-blue-200 bg-blue-50/40" : "border-gray-200 bg-gray-50/40"}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">{m.orgName || `Demande #${m.requestId}`}</p>
                              {m.requestRef && (
                                <p className="text-xs text-muted-foreground">{m.requestRef}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {m.teamRole && (
                                <Badge className={`text-xs ${ROLE_COLORS[m.teamRole] || "bg-gray-100 text-gray-700"}`}>
                                  {ROLE_LABELS[m.teamRole] || m.teamRole}
                                </Badge>
                              )}
                              {isActive ? (
                                <Badge className="text-xs bg-blue-100 text-blue-800">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Terminée</Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {m.proposedEvaluationDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Évaluation : {new Date(m.proposedEvaluationDate).toLocaleDateString("fr-FR")}</span>
                              </div>
                            )}
                            {m.evaluationStartDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Début : {new Date(m.evaluationStartDate).toLocaleDateString("fr-FR")}</span>
                              </div>
                            )}
                            {m.requestStatus && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                <span>{m.requestStatus.replace(/_/g, " ")}</span>
                              </div>
                            )}
                            {m.mandatementSentAt && (
                              <div className="flex items-center gap-1 text-green-700">
                                <Star className="w-3 h-3" />
                                <span>Mandaté le {new Date(m.mandatementSentAt).toLocaleDateString("fr-FR")}</span>
                              </div>
                            )}
                          </div>

                          {m.specialization && (
                            <p className="text-xs mt-2 text-muted-foreground italic">Spécialisation : {m.specialization}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="text-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1 font-medium">
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}
