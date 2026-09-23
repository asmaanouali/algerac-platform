import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Search, Loader2, Folder, FolderOpen, Archive, Download, Upload, Pencil, Trash2, File, FileSpreadsheet } from "lucide-react";

interface Template {
  id: number;
  code?: string;
  name: string;
  version?: string;
  fileType?: string;
  lastModified?: string;
  isRealtime?: boolean;
}

interface ExplorerItem {
  id: number;
  name: string;
  type: "folder" | "file";
  size?: string;
  updatedAt?: string;
  mimeType?: string;
}

interface ArchiveEntry {
  id: number;
  name: string;
  archivedAt: string;
  size?: string;
  reason?: string;
}

function fileIcon(mimeType?: string) {
  if (mimeType?.includes("xlsx") || mimeType?.includes("sheet")) return FileSpreadsheet;
  return File;
}

export default function DocumentsArchivesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [files, setFiles] = useState<ExplorerItem[]>([]);
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState({ templates: true, files: true, archives: true });
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTemplates();
    fetchFiles();
    fetchArchives();
  }, []);

  const fetchTemplates = async () => {
    setLoading((p) => ({ ...p, templates: true }));
    try {
      const res = await apiRequest("GET", "/api/admin/documents/templates");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setTemplates([]);
    } finally {
      setLoading((p) => ({ ...p, templates: false }));
    }
  };

  const fetchFiles = async () => {
    setLoading((p) => ({ ...p, files: true }));
    try {
      const res = await apiRequest("GET", "/api/admin/documents/explorer");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setFiles([]);
    } finally {
      setLoading((p) => ({ ...p, files: false }));
    }
  };

  const fetchArchives = async () => {
    setLoading((p) => ({ ...p, archives: true }));
    try {
      const res = await apiRequest("GET", "/api/admin/documents/archives");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setArchives(Array.isArray(data) ? data : []);
    } catch (err) {
      setArchives([]);
    } finally {
      setLoading((p) => ({ ...p, archives: false }));
    }
  };

  const handleDownload = (t: Template) => {
    window.open(`/api/admin/documents/templates/${t.id}/download`, "_blank");
  };

  const filteredTemplates = templates.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFiles = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredArchives = archives.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Documents & Archives
              </h1>
              <p className="text-muted-foreground">Gérez les modèles de documents, explorez les fichiers et consultez les archives</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Upload className="w-4 h-4 mr-2" />
              Téléverser
            </Button>
          </div>

          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              <TabsTrigger value="templates" className="gap-2"><FileText className="w-4 h-4" /> Templates</TabsTrigger>
              <TabsTrigger value="explorer" className="gap-2"><FolderOpen className="w-4 h-4" /> Explorateur</TabsTrigger>
              <TabsTrigger value="archives" className="gap-2"><Archive className="w-4 h-4" /> Archives</TabsTrigger>
            </TabsList>

            <div className="relative w-full md:w-72 mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Rechercher un document..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Modèles de documents ({filteredTemplates.length})</CardTitle></CardHeader>
                <CardContent>
                  {loading.templates ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : filteredTemplates.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">Aucun modèle de document</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Dernière Modif</TableHead>
                            <TableHead className="text-right">Download</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTemplates.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell><Badge variant="outline" className="font-mono">{t.code || "—"}</Badge></TableCell>
                              <TableCell className="font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> {t.name}</TableCell>
                              <TableCell>{t.version || "v1.0"}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{t.fileType || "—"}</Badge>
                                <Badge className={t.isRealtime ? "bg-blue-100 text-blue-800 ml-1" : "bg-slate-100 text-slate-600 ml-1"}>
                                  {t.isRealtime ? "Temps réel" : "Auto"}
                                </Badge>
                              </TableCell>
                              <TableCell>{t.lastModified ? new Date(t.lastModified).toLocaleDateString("fr-FR") : "—"}</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => handleDownload(t)}><Download className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="explorer" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Explorateur de fichiers ({filteredFiles.length})</CardTitle></CardHeader>
                <CardContent>
                  {loading.files ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : filteredFiles.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">Aucun fichier</p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {filteredFiles.map((f) => {
                        const Icon = f.type === "folder" ? Folder : fileIcon(f.mimeType);
                        return (
                          <div key={f.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                            <Icon className={f.type === "folder" ? "w-8 h-8 text-amber-500" : "w-8 h-8 text-slate-400"} />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{f.name}</p>
                              <p className="text-xs text-muted-foreground">{f.size || (f.type === "folder" ? "Dossier" : "Fichier")}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="archives" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Archives ({filteredArchives.length})</CardTitle></CardHeader>
                <CardContent>
                  {loading.archives ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : filteredArchives.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">Aucune archive</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Taille</TableHead>
                            <TableHead>Archivé le</TableHead>
                            <TableHead>Motif</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredArchives.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium flex items-center gap-2"><Archive className="w-4 h-4 text-slate-400" /> {a.name}</TableCell>
                              <TableCell>{a.size || "—"}</TableCell>
                              <TableCell>{new Date(a.archivedAt).toLocaleDateString("fr-FR")}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{a.reason || "—"}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm"><Download className="w-4 h-4 mr-1" /> Restaurer</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
