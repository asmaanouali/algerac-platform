import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Database, Loader2, HardDrive, RefreshCw, DownloadCloud, ShieldAlert, Trash2, CheckCircle2, Download, AlertTriangle } from "lucide-react";

interface DbStatus {
  status?: string;
  sizeLabel?: string;
  tablesCount?: number;
  recordCountLabel?: string;
  dataUsedPercent?: number;
  dataUsedLabel?: string;
  logsUsedPercent?: number;
  logsUsedLabel?: string;
  avgLatencyMs?: number;
  lastMaintenanceAgo?: string;
  warning?: boolean;
}

interface BackupEntry {
  id: number;
  identifier: string;
  backupType?: string;
  sizeLabel?: string;
  status: string;
  performedAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  SUCCES: "bg-green-100 text-green-800",
  ATTENTION: "bg-orange-100 text-orange-800",
  ECHEC: "bg-red-100 text-red-800",
};

export default function DatabasePage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<DbStatus>({ status: "OPERATIONNEL" });
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    fetchBackups();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/database/status");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      if (data && Object.keys(data).length) setStatus((prev) => ({ ...prev, ...data }));
    } catch (err) {
      // keep defaults
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    setBackupsLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/database/backups");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setBackups(Array.isArray(data) ? data : []);
    } catch (err) {
      setBackups([]);
    } finally {
      setBackupsLoading(false);
    }
  };

  const runAction = async (action: string, label: string) => {
    setActionLoading(action);
    try {
      await apiRequest("POST", `/api/admin/database/actions/${action}`);
      toast({ title: "Action lancée", description: `${label} a été exécuté avec succès.` });
      fetchStatus();
      fetchBackups();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || `Impossible d'exécuter : ${label}` });
    } finally {
      setActionLoading(null);
    }
  };

  const dataUsedPercent = typeof status.dataUsedPercent === "number" ? status.dataUsedPercent : null;
  const logsUsedPercent = typeof status.logsUsedPercent === "number" ? status.logsUsedPercent : null;

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Base de Données
            </h1>
            <p className="text-muted-foreground">Surveillez l'état du stockage et gérez les sauvegardes de la base de données</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><HardDrive className="w-5 h-5" /> Utilisation du stockage</CardTitle>
                  <CardDescription>État : {status.status === "OPERATIONNEL" ? "Opérationnelle" : status.status}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {status.warning && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      L'espace de stockage approche de sa capacité maximale.
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Taille base de données</span>
                      <span className="font-medium">{status.dataUsedLabel ?? status.sizeLabel ?? "—"}{dataUsedPercent != null ? ` (${dataUsedPercent}%)` : ""}</span>
                    </div>
                    {dataUsedPercent != null && <Progress value={Math.min(100, dataUsedPercent)} className="h-3" />}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Journaux système</span>
                      <span className="font-medium">{status.logsUsedLabel ?? "—"}{logsUsedPercent != null ? ` (${logsUsedPercent}%)` : ""}</span>
                    </div>
                    {logsUsedPercent != null && <Progress value={Math.min(100, logsUsedPercent)} className="h-3" />}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3 pt-2">
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Enregistrements</p>
                      <p className="text-lg font-bold">{status.recordCountLabel ?? `${status.tablesCount ?? "—"} tables`}</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Tables</p>
                      <p className="text-lg font-bold">{status.tablesCount ?? "—"}</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Dernière maintenance</p>
                      <p className="text-lg font-bold">{status.lastMaintenanceAgo ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                  <CardDescription>Opérations de maintenance de la base de données</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4 gap-3"
                    disabled={!!actionLoading}
                    onClick={() => runAction("backup", "Sauvegarde")}
                  >
                    {actionLoading === "backup" ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <DownloadCloud className="w-5 h-5 text-primary" />}
                    <div className="text-left">
                      <p className="font-medium">Sauvegarder</p>
                      <p className="text-xs text-muted-foreground">Backup immédiat</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4 gap-3"
                    disabled={!!actionLoading}
                    onClick={() => runAction("check-integrity", "Vérification d'intégrité")}
                  >
                    {actionLoading === "check-integrity" ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <RefreshCw className="w-5 h-5 text-blue-600" />}
                    <div className="text-left">
                      <p className="font-medium">Vérifier l'intégrité</p>
                      <p className="text-xs text-muted-foreground">Contrôle des données</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4 gap-3"
                    disabled={!!actionLoading}
                    onClick={() => runAction("purge-cache", "Purge du cache")}
                  >
                    {actionLoading === "purge-cache" ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> : <ShieldAlert className="w-5 h-5 text-purple-600" />}
                    <div className="text-left">
                      <p className="font-medium">Purger le cache</p>
                      <p className="text-xs text-muted-foreground">Libérer la mémoire</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4 gap-3 border-red-200 hover:bg-red-50"
                    disabled={!!actionLoading}
                    onClick={() => runAction("archive-logs", "Archivage des journaux")}
                  >
                    {actionLoading === "archive-logs" ? <Loader2 className="w-5 h-5 animate-spin text-red-600" /> : <Trash2 className="w-5 h-5 text-red-600" />}
                    <div className="text-left">
                      <p className="font-medium">Archiver les journaux</p>
                      <p className="text-xs text-muted-foreground">Libérer de l'espace</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Historique des sauvegardes</CardTitle>
            </CardHeader>
            <CardContent>
              {backupsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : backups.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">Aucune sauvegarde disponible</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Identifiant</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Taille</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Heure</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium font-mono text-sm">{b.identifier}</TableCell>
                          <TableCell><Badge variant="outline">{b.backupType}</Badge></TableCell>
                          <TableCell>{b.sizeLabel ?? "—"}</TableCell>
                          <TableCell><Badge className={STATUS_BADGE[b.status] || "bg-gray-100 text-gray-800"}>{b.status}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(b.performedAt).toLocaleString("fr-FR")}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
