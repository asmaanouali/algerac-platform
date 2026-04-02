import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    role: "",
    password: "password123" // Mot de passe par défaut
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prenom || !formData.email || !formData.role) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès"
        });
        setFormData({
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          role: "",
          password: "password123"
        });
        onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Erreur lors de la création de l'utilisateur",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur</DialogTitle>
          <DialogDescription>
            Créer un compte pour un personnel interne ALGERAC
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                placeholder="Prénom"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@algerac.dz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="+213 XXX XXX XXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
                <SelectItem value="DT">Direction Technique</SelectItem>
                <SelectItem value="RA">Responsable Accréditation</SelectItem>
                <SelectItem value="CD">Chef de Département</SelectItem>
                <SelectItem value="DAG">Directeur Administratif Général</SelectItem>
                <SelectItem value="DG">Directrice Générale</SelectItem>
                <SelectItem value="REE">Responsable d'Équipe d'Évaluation</SelectItem>
                <SelectItem value="ET">Évaluateur Technique</SelectItem>
                <SelectItem value="EQ">Évaluateur Qualité</SelectItem>
                <SelectItem value="CAS_MEMBER">Membre du CAS</SelectItem>
                <SelectItem value="CAS_PRESIDENT">Président du CAS</SelectItem>
                <SelectItem value="GES_COMPETENCES">Gestionnaire Compétences</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
            <strong>Note :</strong> Le mot de passe par défaut est "password123". L'utilisateur devra le changer lors de sa première connexion.
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création en cours..." : "Créer le compte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
