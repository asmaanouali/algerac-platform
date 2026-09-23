import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { FileSearch, Search, Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface LogEntry {
  id: number;
  level: string;
  module: string;
  message: string;
  username?: string;
  timestamp: string;
}

const LEVEL_BADGE: Record<string, string> = {
  ERROR: "bg-red-100 text-red-800",
  WARNING: "bg-orange-100 text-orange-800",
  INFO: "bg-blue-100 text-blue-800",
  SUCCESS: "bg-green-100 text-green-800",
};

const LEVELS = ["ALL", "ERROR", "WARNING", "INFO", "SUCCESS"];
const PAGE_SIZE = 15;

export default function LogsAuditPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("ALL");
  const [module, setModule] = useState("ALL");
  const [period, setPeriod] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [modules, setModules] = useState<string[]>([]);

  const PERIODS = [
    { value: "TODAY", label: "Aujourd'hui" },
    { value: "WEEK", label: "Cette semaine" },
    { value: "MONTH", label: "Ce mois" },
    { value: "ALL", label: "Toute la période" },
  ];

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, module, search, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (level !== "ALL") params.set("level", level);
      if (module !== "ALL") params.set("module", module);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("size", String(PAGE_SIZE));

      const res = await apiRequest("GET", `/api/admin/logs?${params.toString()}`);
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      const list: LogEntry[] = Array.isArray(data) ? data : data?.content || [];
      setLogs(list);
      setTotal(data?.totalElements ?? list.length);
      const uniqueModules = Array.from(new Set(list.map((l) => l.module).filter(Boolean))) as string[];
      if (uniqueModules.length) setModules((prev) => Array.from(new Set([...prev, ...uniqueModules])));
    } catch (err) {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open("/api/admin/logs/export", "_blank");
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileSearch className="w-6 h-6 text-primary" />
                Logs & Audit
              </h1>
              <p className="text-muted-foreground">Consultez et filtrez les journaux système de la plateforme</p>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Rechercher un message..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
                </div>
                <Select value={level} onValueChange={(v) => { setLevel(v); setPage(0); }}>
                  <SelectTrigger><SelectValue placeholder="Niveau" /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l} value={l}>{l === "ALL" ? "Tous les niveaux" : l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={module} onValueChange={(v) => { setModule(v); setPage(0); }}>
                  <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les modules</SelectItem>
                    {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={period} onValueChange={(v) => { setPeriod(v); setPage(0); }}>
                  <SelectTrigger><SelectValue placeholder="Période" /></SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Journal ({total})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : logs.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">Aucun log trouvé pour ces critères</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Niveau</TableHead>
                          <TableHead>Module</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell><Badge className={LEVEL_BADGE[log.level] || "bg-gray-100 text-gray-800"}>{log.level}</Badge></TableCell>
                            <TableCell><Badge variant="outline">{log.module}</Badge></TableCell>
                            <TableCell className="max-w-md truncate">{log.message}</TableCell>
                            <TableCell>{log.username || "Système"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString("fr-FR")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">Page {page + 1} sur {totalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
