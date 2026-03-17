import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, User, Building2, Mail, Phone, MapPin, Save } from "lucide-react";

export default function OECProfilePage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    nomOrganisme: "",
    adresse: "",
    siteWeb: "",
    registreCommerce: "",
    specialite: "",
  });

  useEffect(() => {
    if (user && !authLoading) {
      setProfile({
        fullName: user.fullName || "",
        nom: (user as any).nom || "",
        prenom: (user as any).prenom || "",
        email: user.email || "",
        telephone: (user as any).telephone || "",
        nomOrganisme: (user as any).nomOrganisme || "",
        adresse: (user as any).adresse || "",
        siteWeb: (user as any).siteWeb || "",
        registreCommerce: (user as any).registreCommerce || "",
        specialite: (user as any).specialite || "",
      });
    }
  }, [user, authLoading]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        toast({ title: "Profil mis à jour avec succès" });
      } else {
        toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Profil OEC</h1>
            <p className="text-muted-foreground mt-1">Gérez les informations de votre organisme.</p>
          </div>

          <div className="grid gap-6 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>Vos coordonnées et informations de contact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" value={profile.nom} onChange={(e) => setProfile({ ...profile, nom: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input id="prenom" value={profile.prenom} onChange={(e) => setProfile({ ...profile, prenom: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </Label>
                  <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Téléphone
                  </Label>
                  <Input id="telephone" value={profile.telephone} onChange={(e) => setProfile({ ...profile, telephone: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Informations de l'organisme
                </CardTitle>
                <CardDescription>Détails de votre organisme d'évaluation de la conformité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomOrganisme">Nom de l'organisme</Label>
                  <Input id="nomOrganisme" value={profile.nomOrganisme} onChange={(e) => setProfile({ ...profile, nomOrganisme: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adresse">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Adresse
                  </Label>
                  <Input id="adresse" value={profile.adresse} onChange={(e) => setProfile({ ...profile, adresse: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteWeb">Site Web</Label>
                    <Input id="siteWeb" value={profile.siteWeb} onChange={(e) => setProfile({ ...profile, siteWeb: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registreCommerce">Registre de Commerce</Label>
                    <Input id="registreCommerce" value={profile.registreCommerce} onChange={(e) => setProfile({ ...profile, registreCommerce: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialite">Spécialité / Domaine</Label>
                  <Input id="specialite" value={profile.specialite} onChange={(e) => setProfile({ ...profile, specialite: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
