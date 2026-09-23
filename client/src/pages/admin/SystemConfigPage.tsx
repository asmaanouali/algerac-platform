import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Loader2, Save, Globe, Puzzle, Mail, Building2 } from "lucide-react";

interface GeneralSettings {
  app_name?: string;
  appName?: string;
  organization?: string;
  support_email?: string;
  supportEmail?: string;
  timezone?: string;
  maintenance_mode?: boolean;
  maintenanceMode?: boolean;
  debug_mode?: boolean;
  debugMode?: boolean;
  [key: string]: any;
}

interface ModuleSettings {
  [key: string]: boolean;
}

interface EmailSettings {
  smtp_host?: string;
  smtp_port?: string;
  smtp_user?: string;
  from_email?: string;
  notifications_enabled?: boolean;
  [key: string]: any;
}

const MODULE_LIST = [
  { key: "MODULE_ACCREDITATION", label: "Module Accréditation", description: "Gestion du cycle de vie des demandes d'accréditation" },
  { key: "MODULE_EVALUATION", label: "Module Évaluation", description: "Évaluations documentaires et sur site des organismes" },
  { key: "MODULE_FINANCIER", label: "Module Financier", description: "Devis, facturation et suivi des paiements" },
  { key: "MODULE_QUALITE", label: "Module Qualité", description: "Suivi de la conformité et des référentiels qualité" },
  { key: "MODULE_SURVEILLANCE", label: "Module Surveillance", description: "Suivi périodique des organismes accrédités" },
];

function boolOf(value: any) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
}

export default function SystemConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [general, setGeneral] = useState<GeneralSettings>({
    app_name: "SGA - Système de Gestion d'Accréditation",
    organization: "Agence Nationale d'Accréditation",
    support_email: "support@ana.gov",
    timezone: "Europe/Paris (UTC+01:00)",
    maintenance_mode: false,
    debug_mode: false,
  });
  const [modules, setModules] = useState<ModuleSettings>(
    MODULE_LIST.reduce((acc, m) => ({ ...acc, [m.key]: true }), {} as ModuleSettings)
  );
  const [emails, setEmails] = useState<EmailSettings>({
    smtp_host: "smtp.gmail.com",
    smtp_port: "587",
    smtp_user: "",
    from_email: "no-reply@algerac.dz",
    notifications_enabled: true,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [genRes, modRes, mailRes] = await Promise.allSettled([
        apiRequest("GET", "/api/admin/system/settings?category=GENERAL"),
        apiRequest("GET", "/api/admin/system/modules"),
        apiRequest("GET", "/api/admin/system/emails"),
      ]);
      if (genRes.status === "fulfilled") {
        const json = await genRes.value.json();
        const data = json?.data !== undefined ? json.data : json;
        if (data && Object.keys(data).length) setGeneral((prev) => ({ ...prev, ...data }));
      }
      if (modRes.status === "fulfilled") {
        const json = await modRes.value.json();
        const data = json?.data !== undefined ? json.data : json;
        if (data && Object.keys(data).length) {
          const normalized: ModuleSettings = {};
          for (const key of Object.keys(data)) normalized[key] = boolOf(data[key]);
          setModules((prev) => ({ ...prev, ...normalized }));
        }
      }
      if (mailRes.status === "fulfilled") {
        const json = await mailRes.value.json();
        const data = json?.data !== undefined ? json.data : json;
        if (data && Object.keys(data).length) setEmails((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      // keep defaults
    } finally {
      setLoading(false);
    }
  };

  const appName = general.appName ?? general.app_name ?? "";
  const supportEmail = general.supportEmail ?? general.support_email ?? "";
  const maintenanceMode = general.maintenanceMode ?? boolOf(general.maintenance_mode);
  const debugMode = general.debugMode ?? boolOf(general.debug_mode);

  const saveGeneral = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/admin/system/settings?category=GENERAL", {
        app_name: appName,
        organization: general.organization,
        support_email: supportEmail,
        timezone: general.timezone,
        maintenance_mode: maintenanceMode,
        debug_mode: debugMode,
      });
      toast({ title: "Paramètres enregistrés", description: "Les paramètres généraux ont été mis à jour." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible d'enregistrer" });
    } finally {
      setSaving(false);
    }
  };

  const saveModules = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/admin/system/modules", modules);
      toast({ title: "Modules mis à jour", description: "La configuration des modules a été enregistrée." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible d'enregistrer" });
    } finally {
      setSaving(false);
    }
  };

  const saveEmails = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/admin/system/emails", emails);
      toast({ title: "Configuration email enregistrée", description: "Les paramètres SMTP ont été mis à jour." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible d'enregistrer" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
          <Navbar />
          <main className="flex-1 flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              Configuration Système
            </h1>
            <p className="text-muted-foreground">Gérez les paramètres généraux, les modules et la configuration des emails</p>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              <TabsTrigger value="general" className="gap-2"><Globe className="w-4 h-4" /> Général</TabsTrigger>
              <TabsTrigger value="modules" className="gap-2"><Puzzle className="w-4 h-4" /> Modules</TabsTrigger>
              <TabsTrigger value="emails" className="gap-2"><Mail className="w-4 h-4" /> Emails</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Informations de la plateforme</CardTitle>
                  <CardDescription>Paramètres généraux visibles par les utilisateurs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom de l'application</Label>
                      <Input value={appName} onChange={(e) => setGeneral({ ...general, app_name: e.target.value, appName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom de l'organisme</Label>
                      <Input value={general.organization || ""} onChange={(e) => setGeneral({ ...general, organization: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email de support</Label>
                      <Input value={supportEmail} onChange={(e) => setGeneral({ ...general, support_email: e.target.value, supportEmail: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Fuseau horaire</Label>
                      <Input value={general.timezone || ""} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 border-amber-200">
                    <div>
                      <p className="font-medium text-amber-800">Mode maintenance</p>
                      <p className="text-sm text-amber-600">Désactive l'accès à la plateforme pour les utilisateurs non-admin</p>
                    </div>
                    <Switch
                      checked={!!maintenanceMode}
                      onCheckedChange={(v) => setGeneral({ ...general, maintenance_mode: v, maintenanceMode: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Mode debug</p>
                      <p className="text-sm text-muted-foreground">Active les journaux détaillés pour le diagnostic technique</p>
                    </div>
                    <Switch
                      checked={!!debugMode}
                      onCheckedChange={(v) => setGeneral({ ...general, debug_mode: v, debugMode: v })}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-primary hover:bg-primary/90" onClick={saveGeneral} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Modules actifs</CardTitle>
                  <CardDescription>Activez ou désactivez les modules fonctionnels de la plateforme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MODULE_LIST.map((mod) => (
                    <div key={mod.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{mod.label}</p>
                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                      </div>
                      <Switch
                        checked={!!modules[mod.key]}
                        onCheckedChange={(v) => setModules({ ...modules, [mod.key]: v })}
                      />
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button className="bg-primary hover:bg-primary/90" onClick={saveModules} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emails" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration SMTP</CardTitle>
                  <CardDescription>Paramètres d'envoi des emails automatiques (notifications, identifiants...)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Serveur SMTP</Label>
                      <Input value={emails.smtp_host || ""} onChange={(e) => setEmails({ ...emails, smtp_host: e.target.value })} placeholder="smtp.example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input value={emails.smtp_port || ""} onChange={(e) => setEmails({ ...emails, smtp_port: e.target.value })} placeholder="587" />
                    </div>
                    <div className="space-y-2">
                      <Label>Utilisateur SMTP</Label>
                      <Input value={emails.smtp_user || ""} onChange={(e) => setEmails({ ...emails, smtp_user: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email d'expédition</Label>
                      <Input value={emails.from_email || ""} onChange={(e) => setEmails({ ...emails, from_email: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Notifications par email activées</p>
                      <p className="text-sm text-muted-foreground">Envoyer automatiquement les notifications système par email</p>
                    </div>
                    <Switch checked={boolOf(emails.notifications_enabled)} onCheckedChange={(v) => setEmails({ ...emails, notifications_enabled: v })} />
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-primary hover:bg-primary/90" onClick={saveEmails} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
