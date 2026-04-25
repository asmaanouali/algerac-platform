import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";

export default function RQDashboard() {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 max-w-full overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 w-full">
          <h1 className="text-3xl font-bold">{t('nav.dashboard')}</h1>
        </main>
      </div>
    </div>
  );
}
