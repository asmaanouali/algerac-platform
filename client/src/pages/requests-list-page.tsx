import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useRequests } from "@/hooks/use-requests";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Filter, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function RequestsListPage() {
  const { user } = useAuth();
  const { data: requests, isLoading } = useRequests();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">
              {user.role === 'oec' ? 'Mes Demandes' : 'Gestion des Demandes'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Liste complète de vos dossiers d'accréditation.
            </p>
          </div>
          {user.role === 'oec' && (
            <Link href="/requests/new">
              <Button className="shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Demande
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Rechercher par référence, domaine..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" /> Filtres
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Référence</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Domaine</TableHead>
                <TableHead>Date Soumission</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="animate-spin mr-2" /> Chargement...
                    </div>
                  </TableCell>
                </TableRow>
              ) : requests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune demande trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                requests?.map((req) => (
                  <TableRow key={req.id} className="hover:bg-slate-50/50 cursor-pointer">
                    <TableCell className="font-medium">{req.referenceNumber}</TableCell>
                    <TableCell className="capitalize">{req.type}</TableCell>
                    <TableCell>{req.domain}</TableCell>
                    <TableCell>
                      {req.submissionDate 
                        ? format(new Date(req.submissionDate), 'dd MMM yyyy', { locale: fr })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        req.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                        req.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${req.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{req.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        </main>
      </div>
    </div>
  );
}
