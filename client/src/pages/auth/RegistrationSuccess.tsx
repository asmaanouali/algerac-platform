import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";

export default function RegistrationSuccess() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg text-white font-bold">A</div>
          <h1 className="text-xl font-bold text-primary">ALGERAC</h1>
        </div>

        <div className="space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold">Demande envoyée !</h2>
          <p className="text-slate-600">
            Votre demande a été envoyée avec succès à ALGERAC.<br />
            Vous recevrez vos identifiants de connexion par email après validation de votre dossier par nos services.
          </p>
        </div>

        <Button className="w-full h-11" asChild>
          <Link href="/">Retour à la connexion</Link>
        </Button>
        
        <p className="text-xs text-muted-foreground pt-8">© 2026 ALGERAC. Tous droits réservés.</p>
      </div>
    </div>
  );
}
