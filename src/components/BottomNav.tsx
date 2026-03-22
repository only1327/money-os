import { motion } from 'framer-motion';
import { LayoutDashboard, List, Plus, Settings } from 'lucide-react';

export type TabId = 'dashboard' | 'transactions' | 'settings';

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  onAdd: () => void;
}

const tabs = [
  { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Home' },
  { id: 'transactions' as const, icon: List, label: 'History' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
];

export default function BottomNav({ active, onChange, onAdd }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="glass-panel-strong border-t-2 border-border/20 safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto px-4 py-2">
          {tabs.map((tab, i) => (
            i === 1 ? (
              <div key="add-group" className="flex items-center gap-6">
                <NavButton tab={tabs[1]} active={active} onChange={onChange} />
                {/* FAB */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onAdd}
                  className="w-14 h-14 -mt-8 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center neo-brutal-sm glow-primary"
                >
                  <Plus className="w-6 h-6" strokeWidth={3} />
                </motion.button>
              </div>
            ) : (
              <NavButton key={tab.id} tab={tab} active={active} onChange={onChange} />
            )
          ))}
        </div>
      </div>
    </div>
  );
}

function NavButton({ tab, active, onChange }: { tab: typeof tabs[0]; active: TabId; onChange: (t: TabId) => void }) {
  const isActive = active === tab.id;
  return (
    <button onClick={() => onChange(tab.id)} className="flex flex-col items-center gap-1 px-4 py-1 relative">
      <tab.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
        {tab.label}
      </span>
      {isActive && (
        <motion.div layoutId="nav-indicator" className="absolute -top-1 w-6 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}
