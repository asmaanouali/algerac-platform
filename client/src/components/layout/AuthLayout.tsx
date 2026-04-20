import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface AuthLayoutProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  hideFlagBar?: boolean;
}

export default function AuthLayout({ children, topBar, hideFlagBar }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-[#0055A4]/8 dark:bg-[#0055A4]/25 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#006233]/6 dark:bg-[#006233]/20 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#0055A4]/4 dark:bg-[#0055A4]/10 blur-[80px]" />
      </div>

      {/* Dot grid - light mode */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none dark:hidden"
        style={{ backgroundImage: "radial-gradient(circle, #1e293b 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />
      {/* Dot grid - dark mode */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none hidden dark:block"
        style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      {/* Algerian flag accent bar */}
      {!hideFlagBar && (
        <div className="absolute top-0 left-0 right-0 h-1 flex z-20">
          <div className="flex-1 bg-[#006233]" />
          <div className="flex-1 bg-slate-200 dark:bg-white/20" />
          <div className="flex-1 bg-[#006233]" />
        </div>
      )}

      {/* Top bar: theme toggle left, lang + topBar slot right */}
      <div className="absolute top-1 left-0 right-0 z-20 flex items-center justify-between px-6 py-3">
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all"
          aria-label="Changer de thème"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          {topBar}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-16 px-4">
        {children}
      </div>
    </div>
  );
}
