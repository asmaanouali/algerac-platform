import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, Upload, FileText, Download, Trash2, Search } from "lucide-react";

interface DocumentItem {
  id: number;
  name: string;
  type: string;
  status: string;
  uploadDate: string;
  size?: string;
  requestId?: number;
  referenceNumber?: string;
}

export default function OECDocumentsPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user && !authLoading) {
      loadDocuments();
    }
  }, [user, authLoading]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/user/${user?.id}`, { credentials: "include" });
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", String(user?.id));
    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        toast({ title: "Document téléversé avec succès" });
        loadDocuments();
      } else {
        toast({ title: "Erreur lors du téléversement", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    }
  };

  const handleDelete = async (docId: number) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Document supprimé" });
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const filtered = documents.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>;
      case "REJECTED": return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      case "PENDING": return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Mes Documents</h1>
              <p className="text-muted-foreground mt-1">Gérez tous vos documents liés aux demandes d'accréditation.</p>
            </div>
            <div>
              <input type="file" id="file-upload" className="hidden" onChange={handleUpload} />
              <Button onClick={() => document.getElementById("file-upload")?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Téléverser
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents ({filtered.length})</CardTitle>
                  <CardDescription>Liste de tous vos documents soumis</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>Aucun document trouvé.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{statusBadge(doc.status)}</TableCell>
                        <TableCell>{new Date(doc.uploadDate).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/api/documents/${doc.id}/download`} download>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
