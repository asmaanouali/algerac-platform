import { Sidebar } from "@/components/layout-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Users, FileCheck, Clock, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DTNavbar } from "@/components/dt-navbar";

export default function DTDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <DTNavbar />
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Tableau de Bord Technique</h1>
            <p className="text-muted-foreground mt-1">
              Vue d'ensemble des activités d'accréditation et de la performance.
            </p>
          </div>

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4 md:p-6 text-center">
                  <Users className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2 text-sm md:text-base">Voir les Candidatures</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Gérer les nouvelles demandes</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4 md:p-6 text-center">
                  <UserCheck className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2 text-sm md:text-base">Experts Certifiés</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Liste des experts actifs</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4 md:p-6 text-center">
                  <FileCheck className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2 text-sm md:text-base">Rapports</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Statistiques et analyses</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
