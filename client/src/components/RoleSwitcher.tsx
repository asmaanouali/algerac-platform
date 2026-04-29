import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface RoleSwitcherProps {
  currentRole: string;
  availableRoles: string[];
  onSwitchRole: (role: string) => void;
  className?: string;
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  RA: 'bg-blue-100 text-blue-700',
  DT: 'bg-slate-100 text-slate-700',
  OEC: 'bg-green-100 text-green-700',
  EXPERT: 'bg-amber-100 text-amber-700',
  CD: 'bg-indigo-100 text-indigo-700',
  DAG: 'bg-emerald-100 text-emerald-700',
  REE: 'bg-cyan-100 text-cyan-700',
  ET: 'bg-orange-100 text-orange-700',
  EQ: 'bg-teal-100 text-teal-700',
  CAS_MEMBER: 'bg-red-100 text-red-700',
  CAS_PRESIDENT: 'bg-rose-100 text-rose-700',
  DG: 'bg-violet-100 text-violet-700',
  GES_COMPETENCES: 'bg-sky-100 text-sky-700',
  RQ: 'bg-fuchsia-100 text-fuchsia-700',
  SUP: 'bg-stone-100 text-stone-700',
  CONSOLIDATION: 'bg-pink-100 text-pink-700',
};

const roleIcons: Record<string, string> = {
  ADMIN: '🛡️',
  RA: '📋',
  DT: '🔧',
  OEC: '🏢',
  EXPERT: '🎓',
  CD: '📊',
  DAG: '💰',
  REE: '👨‍🔬',
  ET: '🔍',
  EQ: '✅',
  CAS_MEMBER: '⚖️',
  CAS_PRESIDENT: '👑',
  DG: '🏛️',
  GES_COMPETENCES: '📚',
  RQ: '📝',
  SUP: '👁️',
  CONSOLIDATION: '🧾',
};

export function RoleSwitcher({ currentRole, availableRoles, onSwitchRole, className }: RoleSwitcherProps) {
  const { t } = useTranslation();

  if (availableRoles.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-1.5 h-8 text-xs font-medium border-dashed',
            roleColors[currentRole] || 'bg-gray-100 text-gray-700',
            className
          )}
        >
          <span>{roleIcons[currentRole]}</span>
          <span>{t(`roles.${currentRole}`, currentRole)}</span>
          <RefreshCw className="w-3 h-3 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('nav.switchRole')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => role !== currentRole && onSwitchRole(role)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              role === currentRole && 'bg-primary/10 font-medium'
            )}
          >
            <span>{roleIcons[role]}</span>
            <span className="flex-1">{t(`roles.${role}`, role)}</span>
            {role === currentRole && (
              <span className="text-xs text-primary">●</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
