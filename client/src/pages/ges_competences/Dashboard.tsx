import { Sidebar } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Users, FileCheck, Clock, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Link } from "wouter";

export default function GesCompetencesDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord Gestionnaire de Compétences</h1>
            <p className="text-muted-foreground mt-1">
              Gestion des inscriptions d&apos;experts, évaluateurs et formateurs.
            </p>
          </div>

          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Nouvelles Candidatures"
                value={0}
                icon={Users}
                description="En attente de validation"
              />
              <StatCard
                title="Experts Approuvés"
                value={0}
                icon={UserCheck}
                description="Certifiés et disponibles"
              />
              <StatCard
                title="En Évaluation"
                value={0}
                icon={Clock}
                description="Dossiers en cours"
              />
              <StatCard
                title="Validations du Mois"
                value={0}
                icon={FileCheck}
                description="Total ce mois"
              />
            </div>

            {/* Aperçu des Activités Récentes */}
            <Card>
              <CardHeader>
                <CardTitle>Activités Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Les activités récentes seront affichées ici</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions Rapides */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/ges-competences/candidatures">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 md:p-6 text-center">
                    <Users className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2 text-sm md:text-base">Voir les Candidatures</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">Gérer les nouvelles demandes</p>
                  </CardContent>
                </Card>
              </Link>
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
