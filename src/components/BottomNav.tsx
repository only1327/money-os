import { motion } from 'framer-motion';
import { LayoutDashboard, List, Plus, Gamepad2, BarChart3, Settings } from 'lucide-react';

export type TabId = 'dashboard' | 'transactions' | 'gamification' | 'analytics' | 'budgets' | 'settings';

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  onAdd: () => void;
}

const tabs: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'HOME' },
  { id: 'gamification', icon: Gamepad2, label: 'GAME' },
  { id: 'analytics', icon: BarChart3, label: 'CHARTS' },
  { id: 'transactions', icon: List, label: 'HISTORY' },
  { id: 'settings', icon: Settings, label: 'MORE' },
];

export default function BottomNav({ active, onChange, onAdd }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="bg-card border-t-3 border-primary safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto px-1 py-1 relative">
          {tabs.map((tab) => (
            <NavBtn key={tab.id} tab={tab} active={active} onChange={onChange} />
          ))}
        </div>
      </div>
      {/* FAB floating right */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onAdd}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-primary text-primary-foreground flex items-center justify-center border-3 border-foreground shadow-[4px_4px_0px] shadow-foreground"
      >
        <Plus className="w-7 h-7" strokeWidth={3} />
      </motion.button>
    </div>
  );
}

function NavBtn({ tab, active, onChange }: { tab: typeof tabs[0]; active: TabId; onChange: (t: TabId) => void }) {
  const isActive = active === tab.id;
  return (
    <button onClick={() => onChange(tab.id)} className="flex flex-col items-center gap-0.5 px-2 py-1.5 relative">
      <tab.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={isActive ? 3 : 2} />
      <span className={`text-[7px] font-bold tracking-widest transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
        {tab.label}
      </span>
      {isActive && (
        <motion.div layoutId="nav-dot" className="absolute -top-0.5 w-1.5 h-1.5 bg-primary" />
      )}
    </button>
  );
}
