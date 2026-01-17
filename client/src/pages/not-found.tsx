import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-amber-600" />
      </div>
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">404 Page Not Found</h1>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      
      <Link href="/">
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          Retour à l'accueil
        </Button>
      </Link>
    </div>
  );
}
