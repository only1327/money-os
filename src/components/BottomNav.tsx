import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PiggyBank, BarChart3, Menu, Plus, Receipt, Target, X } from 'lucide-react';

export type TabId = 'dashboard' | 'gamification' | 'analytics' | 'settings';

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  onAdd: () => void;
  onBudget: () => void;
}

const tabs: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'HOME' },
  { id: 'gamification', icon: PiggyBank, label: 'SAVE' },
  { id: 'analytics', icon: BarChart3, label: 'CHARTS' },
  { id: 'settings', icon: Menu, label: 'MORE' },
];

export default function BottomNav({ active, onChange, onAdd, onBudget }: BottomNavProps) {
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <>
      {/* FAB Menu Overlay */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-background/60"
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Action Items */}
      <AnimatePresence>
        {fabOpen && (
          <>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              onClick={() => { setFabOpen(false); onAdd(); }}
              className="fixed bottom-36 right-4 z-50 flex items-center gap-2"
            >
              <span className="px-3 py-1.5 bg-card text-xs font-bold uppercase tracking-wider border-2 border-foreground shadow-[2px_2px_0px] shadow-foreground">
                Transaction
              </span>
              <div className="w-11 h-11 bg-income text-primary-foreground flex items-center justify-center border-2 border-foreground shadow-[2px_2px_0px] shadow-foreground">
                <Receipt className="w-5 h-5" strokeWidth={3} />
              </div>
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.15, delay: 0.1 }}
              onClick={() => { setFabOpen(false); onBudget(); }}
              className="fixed bottom-[7.5rem] right-4 z-50 flex items-center gap-2"
              style={{ bottom: '11.5rem' }}
            >
              <span className="px-3 py-1.5 bg-card text-xs font-bold uppercase tracking-wider border-2 border-foreground shadow-[2px_2px_0px] shadow-foreground">
                Budget
              </span>
              <div className="w-11 h-11 bg-accent text-accent-foreground flex items-center justify-center border-2 border-foreground shadow-[2px_2px_0px] shadow-foreground">
                <Target className="w-5 h-5" strokeWidth={3} />
              </div>
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        animate={{ rotate: fabOpen ? 45 : 0 }}
        transition={{ duration: 0.15 }}
        onClick={() => setFabOpen(prev => !prev)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-primary text-primary-foreground flex items-center justify-center border-3 border-foreground shadow-[4px_4px_0px] shadow-foreground"
      >
        <Plus className="w-7 h-7" strokeWidth={3} />
      </motion.button>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-card border-t-3 border-primary safe-bottom">
          <div className="flex items-center justify-around max-w-lg mx-auto px-1 py-1">
            {tabs.map((tab) => (
              <NavBtn key={tab.id} tab={tab} active={active} onChange={onChange} />
            ))}
          </div>
        </div>
      </div>
    </>
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
