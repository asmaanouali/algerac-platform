import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { CalendarDays, RefreshCw, FileText } from "lucide-react";

interface Plan {
  id: number;
  planYear: number;
  evaluator: { id: number; fullName: string };
  supervisedRole?: string;
  plannedDate?: string;
  completedDate?: string;
  status: string;
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-800",
  ASSIGNED: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  MISSED: "bg-red-100 text-red-800",
  RESCHEDULED: "bg-slate-100 text-slate-800",
};

export default function SupMyPlanPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Mes supervisions | ALGERAC";
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch("/api/competency/supervision-plans/my", { credentials: "include" });
    if (res.ok) setPlans(await res.json());
    setLoading(false);
  };

  const filterByStatus = (statuses: string[]) => plans.filter((p) => statuses.includes(p.status));
  const upcoming = filterByStatus(["PLANNED", "ASSIGNED"]);
  const completed = filterByStatus(["COMPLETED"]);
  const missed = filterByStatus(["MISSED", "RESCHEDULED"]);

  const renderTable = (list: Plan[]) =>
    list.length === 0 ? (
      <p className="text-center py-8 text-slate-500">Aucune entrée</p>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Évaluateur</TableHead>
            <TableHead>Rôle évalué</TableHead>
            <TableHead>Date prévue</TableHead>
            <TableHead>Date réalisation</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.evaluator.fullName}</TableCell>
              <TableCell><Badge variant="outline">{p.supervisedRole || "—"}</Badge></TableCell>
              <TableCell>{p.plannedDate || "—"}</TableCell>
              <TableCell>{p.completedDate || "—"}</TableCell>
              <TableCell><Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge></TableCell>
              <TableCell className="text-right">
                {p.status !== "COMPLETED" && (
                  <Link href={`/sup/supervision/${p.id}`}>
                    <Button size="sm" variant="outline"><FileText className="h-3 w-3 mr-1" />Remplir fiche</Button>
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-blue-600" /> Mes supervisions assignées
              </h1>
              <p className="text-sm text-slate-500 mt-1">Plan triennal — vos missions de supervision</p>
            </div>
            <Button variant="outline" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-2" />{t("common.refresh")}</Button>
          </div>

          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">À venir ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="completed">Terminées ({completed.length})</TabsTrigger>
              <TabsTrigger value="missed">Manquées ({missed.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming"><Card><CardContent className="pt-6">{loading ? <p>Chargement…</p> : renderTable(upcoming)}</CardContent></Card></TabsContent>
            <TabsContent value="completed"><Card><CardContent className="pt-6">{renderTable(completed)}</CardContent></Card></TabsContent>
            <TabsContent value="missed"><Card><CardContent className="pt-6">{renderTable(missed)}</CardContent></Card></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
