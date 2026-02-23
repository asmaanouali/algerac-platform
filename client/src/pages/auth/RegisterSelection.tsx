import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Building2, UserRound, ArrowLeft  } from "lucide-react";

export default function RegisterSelection() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img 
              src="/logoalgerac.png" 
              alt="ALGERAC Logo" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-bold" style={{ color: '#00A63E' }}>ALGERAC</h1>
          </div>
          <h2 className="text-3xl font-bold">Créer un compte</h2>
          <p className="text-slate-600">Sélectionnez votre type de profil pour commencer</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/auth/register/oec">
            <Card className="hover:border-primary cursor-pointer transition-colors group">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
                  <Building2 className="w-8 h-8 text-slate-600 group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Déposer ma demande d'accréditation</h3>
                  <p className="text-sm text-muted-foreground text-balance">Organismes souhaitant déposer une demande d'accréditation.</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/auth/register/expert">
            <Card className="hover:border-primary cursor-pointer transition-colors group">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
                  <UserRound className="w-8 h-8 text-slate-600 group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Déposer ma candidature</h3>
                  <p className="text-sm text-muted-foreground text-balance">Professionnels souhaitant collaborer avec ALGERAC ( Formateur, Évaluateur, Expert ).</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="pt-4">
            <Button 
              variant="ghost" 
              asChild 
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la connexion</span>
              </Link>
            </Button>
          </div>
      </div>
    </div>
  );
}
