import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";


export default function AdminDashboard() {

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
          
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord</h1>
            <p className="text-muted-foreground mt-1">Vue d'ensemble de l'état du système et des activités récentes.</p>
            </div>
          </main>
        </div>
      </div>
  );
}
