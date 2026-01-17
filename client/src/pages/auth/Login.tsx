import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-lg text-white font-bold text-xl">A</div>
            <div>
              <h1 className="text-2xl font-bold text-primary tracking-tight">ALGERAC</h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Organisme Algérien d'Accréditation</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold leading-tight">Garant de la compétence technique et de la confiance.</h2>
          <p className="text-slate-600 text-lg">Accédez à notre portail sécurisé pour gérer vos demandes d'accréditation.</p>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Normes Internationales</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Transparence Totale</span>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Bienvenue</CardTitle>
            <CardDescription className="text-center">Connectez-vous à votre espace accréditation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email ou Identifiant</label>
              <Input placeholder="nom@exemple.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Mot de passe</label>
              </div>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Se souvenir de moi</label>
              </div>
              <Link href="/auth/forgot-password">
                <a className="text-sm text-primary font-medium hover:underline">Mot de passe oublié ?</a>
              </Link>
            </div>
            <Button className="w-full h-11 text-base font-semibold mt-4" asChild>
              <Link href="/oec">Se connecter</Link>
            </Button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Nouveau sur ALGERAC ?</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-11" asChild>
                <Link href="/auth/register">
                  <span>S'inscrire comme OEC</span>
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-11" asChild>
                <Link href="/auth/register">
                  <span>Devenir évaluateur, expert ou formateur</span>
                </Link>
              </Button>
            </div>
            
            <p className="text-center text-xs text-muted-foreground pt-4">© 2026 ALGERAC. Tous droits réservés.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
