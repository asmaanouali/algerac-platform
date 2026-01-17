import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
           <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg text-white font-bold">A</div>
            <h1 className="text-xl font-bold text-primary">ALGERAC</h1>
          </div>
          <h2 className="text-2xl font-bold">Réinitialisation</h2>
          <p className="text-slate-600 text-sm">Entrez votre email pour recevoir le lien</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input placeholder="nom@exemple.com" className="pl-10" />
              </div>
            </div>
            <Button className="w-full h-11" asChild>
              <Link href="/auth/verify-otp">Envoyer le lien</Link>
            </Button>
            <Button variant="ghost" className="w-full gap-2" asChild>
              <Link href="/"><ArrowLeft className="w-4 h-4" /> Retour à la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
