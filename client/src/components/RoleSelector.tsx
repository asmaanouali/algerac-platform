import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface RoleSelectorProps {
  roles: string[];
  userName: string;
  onSelectRole: (role: string) => void;
}

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
  EVALUATEUR: '🔎',
  FORMATEUR: '📖',
};

const roleColors: Record<string, string> = {
  ADMIN: 'from-purple-500 to-purple-700',
  RA: 'from-blue-500 to-blue-700',
  DT: 'from-slate-500 to-slate-700',
  OEC: 'from-green-500 to-green-700',
  EXPERT: 'from-amber-500 to-amber-700',
  CD: 'from-indigo-500 to-indigo-700',
  DAG: 'from-emerald-500 to-emerald-700',
  REE: 'from-cyan-500 to-cyan-700',
  ET: 'from-orange-500 to-orange-700',
  EQ: 'from-teal-500 to-teal-700',
  CAS_MEMBER: 'from-red-500 to-red-700',
  CAS_PRESIDENT: 'from-rose-500 to-rose-700',
  DG: 'from-violet-500 to-violet-700',
  GES_COMPETENCES: 'from-sky-500 to-sky-700',
  RQ: 'from-fuchsia-500 to-fuchsia-700',
};

export default function RoleSelector({ roles, userName, onSelectRole }: RoleSelectorProps) {
  const { t } = useTranslation();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSelect = (role: string) => {
    setSelectedRole(role);
    // Slight delay for animation
    setTimeout(() => onSelectRole(role), 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Top bar with language switcher */}
      <div className="flex justify-end p-4">
        <LanguageSwitcher variant="compact" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4"
            >
              <img src="/logoalgerac.png" alt="ALGERAC" className="w-10 h-10 object-contain" />
            </motion.div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('auth.selectRole.title')}</h1>
            <p className="text-slate-500 text-lg">{t('auth.selectRole.subtitle')}</p>
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-400">
              <Sparkles className="w-4 h-4" />
              <span>{userName}</span>
            </div>
          </div>

          {/* Role cards grid */}
          <div className={cn(
            'grid gap-4',
            roles.length <= 2 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 sm:grid-cols-2'
          )}>
            <AnimatePresence>
              {roles.map((role, index) => {
                const isSelected = selectedRole === role;
                const gradient = roleColors[role] || 'from-gray-500 to-gray-700';

                return (
                  <motion.button
                    key={role}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: isSelected ? 0.5 : 1,
                      y: 0,
                      scale: isSelected ? 0.95 : hoveredRole === role ? 1.02 : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => handleSelect(role)}
                    onMouseEnter={() => setHoveredRole(role)}
                    onMouseLeave={() => setHoveredRole(null)}
                    disabled={!!selectedRole}
                    className={cn(
                      'group relative overflow-hidden rounded-xl border-2 transition-all duration-200 text-left p-6',
                      'hover:shadow-lg hover:border-primary/30',
                      isSelected ? 'border-primary shadow-lg' : 'border-slate-200',
                      selectedRole && !isSelected && 'opacity-50'
                    )}
                  >
                    {/* Gradient accent bar */}
                    <div className={cn(
                      'absolute top-0 left-0 w-full h-1 bg-gradient-to-r',
                      gradient,
                      'transition-all duration-300',
                      hoveredRole === role ? 'h-1.5' : 'h-1'
                    )} />

                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                        'bg-gradient-to-br',
                        gradient,
                        'text-white shadow-sm'
                      )}>
                        {roleIcons[role] || '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {t(`roles.${role}`, role)}
                        </h3>
                        <p className="text-sm text-slate-500">{role}</p>
                      </div>
                      <ArrowRight className={cn(
                        'w-5 h-5 text-slate-300 transition-all duration-200',
                        hoveredRole === role && 'text-primary translate-x-1'
                      )} />
                    </div>

                    {/* Loading indicator for selected */}
                    {isSelected && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.4 }}
                        className="absolute bottom-0 left-0 w-full h-0.5 bg-primary origin-left"
                      />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-400">{t('common.copyright')}</p>
      </div>
    </div>
  );
}
