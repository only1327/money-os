import { motion } from 'framer-motion';
import { LayoutDashboard, List, Plus, Target, Settings } from 'lucide-react';

export type TabId = 'dashboard' | 'transactions' | 'budgets' | 'settings';

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  onAdd: () => void;
}

const tabs: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'HOME' },
  { id: 'transactions', icon: List, label: 'HISTORY' },
  { id: 'budgets', icon: Target, label: 'BUDGET' },
  { id: 'settings', icon: Settings, label: 'SETTINGS' },
];

export default function BottomNav({ active, onChange, onAdd }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="bg-card border-t-3 border-primary safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1">
          {tabs.map((tab, i) => {
            if (i === 2) {
              return (
                <div key="fab-group" className="flex items-center gap-2">
                  {/* FAB */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={onAdd}
                    className="w-12 h-12 -mt-6 bg-primary text-primary-foreground flex items-center justify-center border-3 border-primary-foreground shadow-[4px_4px_0px] shadow-primary-foreground"
                  >
                    <Plus className="w-6 h-6" strokeWidth={3} />
                  </motion.button>
                  <NavBtn tab={tab} active={active} onChange={onChange} />
                </div>
              );
            }
            return <NavBtn key={tab.id} tab={tab} active={active} onChange={onChange} />;
          })}
        </div>
      </div>
    </div>
  );
}

function NavBtn({ tab, active, onChange }: { tab: typeof tabs[0]; active: TabId; onChange: (t: TabId) => void }) {
  const isActive = active === tab.id;
  return (
    <button onClick={() => onChange(tab.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 relative">
      <tab.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={isActive ? 3 : 2} />
      <span className={`text-[8px] font-bold tracking-widest transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
        {tab.label}
      </span>
      {isActive && (
        <motion.div layoutId="nav-dot" className="absolute -top-0.5 w-1.5 h-1.5 bg-primary" />
      )}
    </button>
  );
}
