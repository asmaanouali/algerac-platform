import { useTranslation } from "react-i18next";

export default function AuthLogo() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <img src="/logoalgerac.png" alt="ALGERAC" className="h-12 w-auto shrink-0" />
      <div className="text-left rtl:text-right">
        <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
          ALGERAC
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-tight">
          {t("auth.tagline")}
        </p>
      </div>
    </div>
  );
}
