import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function OTPVerification() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
           <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg text-white font-bold">A</div>
            <h1 className="text-xl font-bold text-primary">ALGERAC</h1>
          </div>
          <h2 className="text-2xl font-bold">Vérification</h2>
          <p className="text-slate-600 text-sm">Code envoyé à nom@exemple.dz</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Input key={i} className="w-12 h-12 text-center text-xl font-bold p-0" maxLength={1} />
              ))}
            </div>
            <Button className="w-full h-11" asChild>
              <Link href="/auth/new-password">Vérifier le code</Link>
            </Button>
            <div className="text-center">
              <Button variant="link" className="text-xs text-primary font-bold">Renvoyer le code ou changer d'email</Button>
            </div>
            <Button variant="ghost" className="w-full gap-2" asChild>
              <Link href="/auth/forgot-password"><ArrowLeft className="w-4 h-4" /> Retour</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
