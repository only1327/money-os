import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PiggyBank, BarChart3, Menu, Plus, Receipt, Target, Crosshair, X } from 'lucide-react';

export type TabId = 'dashboard' | 'gamification' | 'analytics' | 'settings';

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  onAdd: () => void;
  onBudget: () => void;
  onAddGoal?: () => void;
}

const tabs: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'HOME' },
  { id: 'gamification', icon: PiggyBank, label: 'SAVE' },
  { id: 'analytics', icon: BarChart3, label: 'CHARTS' },
  { id: 'settings', icon: Menu, label: 'MORE' },
];

export default function BottomNav({ active, onChange, onAdd, onBudget, onAddGoal }: BottomNavProps) {
  const [fabOpen, setFabOpen] = useState(false);

  const fabActions = [
    { label: 'Expense', icon: Receipt, color: 'bg-expense', action: onAdd },
    { label: 'Income', icon: Receipt, color: 'bg-income', action: onAdd },
    { label: 'Budget', icon: Target, color: 'bg-accent', action: onBudget },
    ...(onAddGoal ? [{ label: 'Goal', icon: Crosshair, color: 'bg-chart-4' as string, action: onAddGoal }] : []),
  ];

  return (
    <>
      {/* FAB Overlay */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Actions */}
      <AnimatePresence>
        {fabOpen && fabActions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.15, delay: i * 0.04 }}
            onClick={() => { setFabOpen(false); action.action(); }}
            className="fixed z-50 flex items-center gap-2.5"
            style={{ bottom: `${120 + i * 52}px`, right: '16px' }}
          >
            <span className="px-3 py-1.5 bg-card text-[10px] font-bold uppercase tracking-wider border border-border rounded-sm shadow-lg">
              {action.label}
            </span>
            <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center shadow-lg`}>
              <action.icon className="w-4 h-4 text-background" strokeWidth={2.5} />
            </div>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: fabOpen ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        onClick={() => setFabOpen(prev => !prev)}
        className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-50 w-14 h-14 bg-primary rounded-full flex items-center justify-center glow-fab"
      >
        <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
      </motion.button>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
          <div className="flex items-center justify-around max-w-lg mx-auto px-1 py-1.5">
            {tabs.map((tab, i) => (
              <NavBtn key={tab.id} tab={tab} active={active} onChange={onChange} isLeft={i < 2} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function NavBtn({ tab, active, onChange, isLeft }: { tab: typeof tabs[0]; active: TabId; onChange: (t: TabId) => void; isLeft: boolean }) {
  const isActive = active === tab.id;
  return (
    <button
      onClick={() => onChange(tab.id)}
      className={`flex flex-col items-center gap-0.5 px-4 py-1.5 relative ${isLeft ? 'mr-4' : 'ml-4'}`}
    >
      <tab.icon
        className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
        strokeWidth={isActive ? 2.5 : 1.5}
      />
      <span className={`text-[8px] font-bold tracking-[0.15em] transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
        {tab.label}
      </span>
      {isActive && (
        <motion.div layoutId="nav-indicator" className="absolute -top-1.5 w-5 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}
