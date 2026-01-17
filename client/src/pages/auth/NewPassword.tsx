import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Lock } from "lucide-react";

export default function NewPassword() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
           <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg text-white font-bold">A</div>
            <h1 className="text-xl font-bold text-primary">ALGERAC</h1>
          </div>
          <h2 className="text-2xl font-bold">Nouveau mot de passe</h2>
          <p className="text-slate-600 text-sm">Créez un mot de passe sécurisé</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input type="password" placeholder="••••••••" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input type="password" placeholder="••••••••" className="pl-10" />
              </div>
            </div>
            <Button className="w-full h-11" asChild>
              <Link href="/">Changer le mot de passe</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
