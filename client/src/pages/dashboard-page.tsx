import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { useAdminStats, useRaStats } from "@/hooks/use-stats";
import { useRequests } from "@/hooks/use-requests";
import { StatCard } from "@/components/stat-card";
import { 
  Users, 
  Activity, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  TrendingUp,
  Briefcase,
  UserCheck,
  FileCheck,
  Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { data: adminStats } = useAdminStats();
  const { data: raStats } = useRaStats();
  const { data: requests, isLoading: requestsLoading } = useRequests();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Non connecté. Veuillez vous connecter.</p>
      </div>
    );
  }

  const mockChartData = [
    { name: 'Jan', value: 40 },
    { name: 'Fév', value: 30 },
    { name: 'Mar', value: 20 },
    { name: 'Avr', value: 27 },
    { name: 'Mai', value: 18 },
    { name: 'Juin', value: 23 },
    { name: 'Juil', value: 34 },
  ];

  const renderOecDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Demandes en cours"
          value={requests?.filter(r => r.status !== 'active').length || 0}
          icon={FileText}
          description="En attente de traitement"
        />
        <StatCard
          title="Certificats Actifs"
          value="2"
          icon={ShieldCheck}
          trend="Valide jusqu'au 2026"
        />
        <StatCard
          title="Prochaine échéance"
          value="15 Jours"
          icon={Clock}
          description="Audit de surveillance"
          className="border-l-amber-500"
        />
        <StatCard
          title="Actions Requises"
          value="3"
          icon={AlertTriangle}
          description="Écarts à corriger"
          className="border-l-red-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>État d'avancement des demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requestsLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
              ) : requests?.slice(0, 5).map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{req.referenceNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">{req.domain} - {req.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={req.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {req.status}
                    </Badge>
                    <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${req.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {!requests?.length && (
                <p className="text-center text-muted-foreground py-4">Aucune demande récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative border-l border-slate-200 ml-3 space-y-6">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="relative pl-6">
                  <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-primary ring-4 ring-white" />
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium">Document validé par RA</span>
                    <span className="text-xs text-muted-foreground">Il y a {i + 2} heures</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRaDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Dossiers en cours"
          value={raStats?.activeDossiers || 0}
          icon={Files}
          description="+12% ce mois-ci"
        />
        <StatCard
          title="En attente validation"
          value={raStats?.pendingValidation || 0}
          icon={Clock}
          description="Nécessite votre attention"
          className="border-l-amber-500"
        />
        <StatCard
          title="Alertes Critiques"
          value={raStats?.criticalAlerts || 0}
          icon={AlertTriangle}
          className="border-l-red-500"
        />
        <StatCard
          title="Clôturés ce mois"
          value={raStats?.closedThisMonth || 0}
          icon={CheckCircle2}
          trend="+5 vs mois dernier"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Suivi des Dossiers Prioritaires</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {requestsLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
              ) : requests?.slice(0, 5).map(req => (
                <div key={req.id} className="group flex items-center justify-between p-4 bg-white hover:bg-slate-50 border rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {req.referenceNumber.substring(2,4)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{req.referenceNumber}</h4>
                      <p className="text-xs text-muted-foreground">{format(new Date(req.createdAt!), 'dd MMM yyyy', { locale: fr })}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs font-medium text-slate-500 uppercase block mb-1">Status</span>
                      <Badge variant="outline" className="capitalize border-primary/20 text-primary bg-primary/5">
                        {req.status}
                      </Badge>
                    </div>
                    
                    <div className="w-32 hidden md:block">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{req.progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${req.progress}%` }} />
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">Détails</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>Activité Mensuelle</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0055A4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Utilisateurs Actifs"
          value={adminStats?.activeUsers || 0}
          icon={Users}
        />
        <StatCard
          title="Santé Système"
          value={`${adminStats?.systemHealth || 100}%`}
          icon={Activity}
          trend="Stable"
        />
        <StatCard
          title="Total Documents"
          value={adminStats?.totalDocuments || 0}
          icon={Database}
        />
        <StatCard
          title="Alertes Sécurité"
          value={adminStats?.securityAlerts || 0}
          icon={ShieldCheck}
          className="border-l-red-500"
        />
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Overview du Système</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
          {/* Placeholder for complex admin chart */}
          <div className="text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Graphiques détaillés des performances système</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDtDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Nouvelles Candidatures"
          value={8}
          icon={Users}
          description="En attente de validation"
        />
        <StatCard
          title="Experts Actifs"
          value={45}
          icon={UserCheck}
          description="Certifiés et disponibles"
        />
        <StatCard
          title="En Évaluation"
          value={12}
          icon={Clock}
          description="Dossiers en cours"
        />
        <StatCard
          title="Validations du Mois"
          value={15}
          icon={FileCheck}
          description="+5 vs mois dernier"
        />
      </div>

      {/* Aperçu des Activités Récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Activités Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">Nouvelle candidature Expert</p>
                <p className="text-sm text-muted-foreground">Mohamed Benali - ISO 9001</p>
              </div>
              <Button variant="outline" size="sm">Voir</Button>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">Dossier validé</p>
                <p className="text-sm text-muted-foreground">Sarah Amrani - Évaluateur ISO 14001</p>
              </div>
              <span className="text-xs text-green-600 font-medium">✓ Approuvé</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">Candidature Formateur</p>
                <p className="text-sm text-muted-foreground">Karim Ziani - Formation ISO 45001</p>
              </div>
              <Button variant="outline" size="sm">Évaluer</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Renouvellement Expert</p>
                <p className="text-sm text-muted-foreground">Fatima Larbi - ISO 27001</p>
              </div>
              <span className="text-xs text-orange-600 font-medium">⏳ En attente</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Voir les Candidatures</h3>
            <p className="text-sm text-muted-foreground">Gérer les nouvelles demandes</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <UserCheck className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Experts Certifiés</h3>
            <p className="text-sm text-muted-foreground">Liste des experts actifs</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <FileCheck className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Rapports</h3>
            <p className="text-sm text-muted-foreground">Statistiques et analyses</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenue, {user.fullName} | Espace {user.role.toUpperCase()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Rapports
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Briefcase className="w-4 h-4 mr-2" />
              Actions Rapides
            </Button>
          </div>
        </div>

        {user.role === 'oec' && renderOecDashboard()}
        {user.role === 'ra' && renderRaDashboard()}
        {user.role === 'dt' && renderDtDashboard()}
        {user.role === 'admin' && renderAdminDashboard()}
        {!['oec', 'ra', 'dt', 'admin'].includes(user.role) && (
          <div className="text-center py-12">
            <p className="text-lg font-medium">Rôle non reconnu: {user.role}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Votre compte a le rôle "{user.role}" qui n'a pas encore de dashboard configuré.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
