import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, Loader2, Save, KeyRound, Lock, ScanEye, Search } from "lucide-react";

interface SecuritySettings {
  passwordMinLength?: number;
  passwordRequireSpecial?: boolean;
  requireSpecialChars?: boolean;
  passwordRequireUppercase?: boolean;
  passwordRequireNumber?: boolean;
  forceExpiration?: boolean;
  passwordHistory?: boolean;
  passwordExpiryDays?: number;
  require2fa?: boolean;
  twoFactorEnabled?: boolean;
  blockAfterFailures?: boolean;
  maxLoginAttempts?: number;
  ipRestriction?: boolean;
  ipWhitelistEnabled?: boolean;
  sessionTimeout?: boolean;
  sessionTimeoutMinutes?: number;
  lockoutDurationMinutes?: number;
  [key: string]: any;
}

interface AuditLogEntry {
  id: number;
  heure?: string;
  timestamp?: string;
  action?: string;
  utilisateur?: string;
  user?: string;
  details?: string;
  severite?: string;
  status?: string;
  level?: string;
  ipAddress?: string;
}

const SEVERITY_BADGE: Record<string, string> = {
  ERROR: "bg-red-100 text-red-800",
  HIGH: "bg-red-100 text-red-800",
  WARNING: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-orange-100 text-orange-800",
  INFO: "bg-blue-100 text-blue-800",
  LOW: "bg-blue-100 text-blue-800",
  SUCCESS: "bg-green-100 text-green-800",
};

export default function SecurityPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SecuritySettings>({
    passwordMinLength: 12,
    passwordRequireSpecial: true,
    passwordRequireUppercase: true,
    passwordRequireNumber: true,
    forceExpiration: true,
    passwordHistory: true,
    passwordExpiryDays: 90,
    require2fa: true,
    twoFactorEnabled: true,
    blockAfterFailures: true,
    maxLoginAttempts: 5,
    ipRestriction: false,
    sessionTimeout: true,
    sessionTimeoutMinutes: 30,
    lockoutDurationMinutes: 15,
  });
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/security/settings");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      if (data && Object.keys(data).length) setSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      // keep defaults
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/security/audit-logs");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/admin/security/settings", settings);
      toast({ title: "Paramètres enregistrés", description: "La politique de sécurité a été mise à jour." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible d'enregistrer" });
    } finally {
      setSaving(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const action = l.action || "";
    const user = l.utilisateur || l.user || "";
    const q = search.toLowerCase();
    return action.toLowerCase().includes(q) || user.toLowerCase().includes(q);
  });

  const requireSpecial = settings.passwordRequireSpecial ?? settings.requireSpecialChars ?? false;
  const twoFactor = settings.require2fa ?? settings.twoFactorEnabled ?? false;
  const ipRestriction = settings.ipRestriction ?? settings.ipWhitelistEnabled ?? false;

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Sécurité & Conformité
            </h1>
            <p className="text-muted-foreground">Configurez la politique de mots de passe, la protection des comptes et consultez le journal d'audit</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> Politique de mots de passe</CardTitle>
                  <CardDescription>Exigences de complexité pour les mots de passe utilisateurs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Longueur minimale</Label>
                      <span className="text-sm font-semibold text-primary">{settings.passwordMinLength ?? 12}</span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={24}
                      value={settings.passwordMinLength ?? 12}
                      onChange={(e) => setSettings({ ...settings, passwordMinLength: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Caractère spécial requis</Label>
                    <Switch checked={!!requireSpecial} onCheckedChange={(v) => setSettings({ ...settings, passwordRequireSpecial: v, requireSpecialChars: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Majuscule requise</Label>
                    <Switch checked={!!settings.passwordRequireUppercase} onCheckedChange={(v) => setSettings({ ...settings, passwordRequireUppercase: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Chiffre requis</Label>
                    <Switch checked={!!settings.passwordRequireNumber} onCheckedChange={(v) => setSettings({ ...settings, passwordRequireNumber: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Expiration forcée</Label>
                    <Switch checked={!!settings.forceExpiration} onCheckedChange={(v) => setSettings({ ...settings, forceExpiration: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Historique des mots de passe</Label>
                    <Switch checked={!!settings.passwordHistory} onCheckedChange={(v) => setSettings({ ...settings, passwordHistory: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration (jours)</Label>
                    <Input
                      type="number"
                      value={settings.passwordExpiryDays ?? 90}
                      onChange={(e) => setSettings({ ...settings, passwordExpiryDays: Number(e.target.value) })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Protection des comptes</CardTitle>
                  <CardDescription>Mesures de protection contre les accès non autorisés</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Authentification à deux facteurs (2FA)</Label>
                    <Switch checked={!!twoFactor} onCheckedChange={(v) => setSettings({ ...settings, require2fa: v, twoFactorEnabled: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Blocage après échecs répétés</Label>
                    <Switch checked={!!settings.blockAfterFailures} onCheckedChange={(v) => setSettings({ ...settings, blockAfterFailures: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tentatives de connexion max</Label>
                    <Input
                      type="number"
                      value={settings.maxLoginAttempts ?? 5}
                      onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Durée de verrouillage (min)</Label>
                    <Input
                      type="number"
                      value={settings.lockoutDurationMinutes ?? 15}
                      onChange={(e) => setSettings({ ...settings, lockoutDurationMinutes: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Restriction par adresse IP</Label>
                    <Switch checked={!!ipRestriction} onCheckedChange={(v) => setSettings({ ...settings, ipRestriction: v, ipWhitelistEnabled: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Expiration de session</Label>
                    <Switch checked={!!settings.sessionTimeout} onCheckedChange={(v) => setSettings({ ...settings, sessionTimeout: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Délai d'expiration de session (min)</Label>
                    <Input
                      type="number"
                      value={settings.sessionTimeoutMinutes ?? 30}
                      onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!loading && (
            <div className="flex justify-end">
              <Button className="bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer les paramètres
              </Button>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2"><ScanEye className="w-5 h-5" /> Journal d'audit de sécurité</CardTitle>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Rechercher une action ou un utilisateur..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : filteredLogs.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">Aucune entrée dans le journal d'audit</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Heure</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Détails</TableHead>
                        <TableHead>Sévérité</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => {
                        const severity = log.level || log.severite || log.status || "INFO";
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {(log.heure || log.timestamp) ? new Date(log.heure || log.timestamp!).toLocaleString("fr-FR") : "—"}
                            </TableCell>
                            <TableCell className="font-medium">{log.action}</TableCell>
                            <TableCell>{log.utilisateur || log.user || "Système"}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{log.details}</TableCell>
                            <TableCell><Badge className={SEVERITY_BADGE[severity] || "bg-gray-100 text-gray-800"}>{severity}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
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
