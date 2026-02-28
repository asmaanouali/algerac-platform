import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supportedLanguages, languageNames, languageFlags, type SupportedLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full' | 'compact';
  className?: string;
}

export function LanguageSwitcher({ variant = 'icon', className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language?.split('-')[0] || 'fr') as SupportedLanguage;

  const changeLang = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'icon' ? 'icon' : 'sm'}
          className={cn(
            'relative',
            variant === 'icon' && 'h-9 w-9',
            className
          )}
        >
          {variant === 'icon' ? (
            <Globe className="h-4 w-4" />
          ) : variant === 'compact' ? (
            <span className="text-sm font-medium">{languageFlags[currentLang]} {currentLang.toUpperCase()}</span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm">
              <Globe className="h-4 w-4" />
              {languageNames[currentLang]}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {supportedLanguages.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => changeLang(lng)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              currentLang === lng && 'bg-primary/10 text-primary font-medium'
            )}
          >
            <span className="text-base">{languageFlags[lng]}</span>
            <span>{languageNames[lng]}</span>
            {currentLang === lng && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
