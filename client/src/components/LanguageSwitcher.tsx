import { useTranslation } from 'react-i18next';
import { type SupportedLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full' | 'compact';
  className?: string;
}

const langOrder: SupportedLanguage[] = ['fr', 'ar', 'en'];

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language?.split('-')[0] || 'fr') as SupportedLanguage;

  const changeLang = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className={cn('flex items-center rounded-full bg-muted p-1 gap-0.5', className)}>
      {langOrder.map((lng) => (
        <button
          key={lng}
          onClick={() => changeLang(lng)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer',
            currentLang === lng
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
