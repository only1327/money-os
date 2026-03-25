import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Flame, TrendingUp } from 'lucide-react';
import LockScreen from '@/components/LockScreen';
import Dashboard from '@/components/Dashboard';
import TransactionList from '@/components/TransactionList';
import AddTransaction from '@/components/AddTransaction';
import BudgetView from '@/components/BudgetView';
import BottomNav, { type TabId } from '@/components/BottomNav';
import SettingsView from '@/components/SettingsView';
import SavingsView from '@/components/SavingsView';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import CSVImport from '@/components/CSVImport';
import { getTransactions, saveTransactions, saveBudgets, getCurrencySymbol, type Transaction } from '@/lib/storage';
import {
  getGamificationState, saveGamificationState, updateStreak, awardXP,
  checkNewAchievements, XP_ACTIONS, getLevelForXP, getXPProgress,
  type GamificationState,
} from '@/lib/gamification';
import { useToast } from '@/hooks/use-toast';

export default function Index() {
  const [locked, setLocked] = useState(false);
  const [tab, setTab] = useState<TabId>('dashboard');
  const [showAdd, setShowAdd] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gamification, setGamification] = useState<GamificationState>(getGamificationState());
  const { toast } = useToast();

  useEffect(() => {
    setTransactions(getTransactions());
    const { streakBroken, bonusXP, state } = updateStreak();
    setGamification(state);
    if (streakBroken) {
      toast({ title: '💔 Streak Broken', description: 'Start fresh today!' });
    }
    if (bonusXP > 0) {
      toast({ title: `🔥 Streak Bonus! +${bonusXP} XP`, description: `${state.streak}-day streak!` });
    }
    const newAchievements = checkNewAchievements();
    if (newAchievements.length > 0) {
      setGamification(getGamificationState());
      newAchievements.forEach(a => {
        toast({ title: `${a.icon} Achievement!`, description: a.title });
      });
    }
  }, []);

  const handleUnlock = useCallback(() => setLocked(false), []);

  const handleAdd = useCallback((tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    const xpAmount = tx.type === 'income' ? XP_ACTIONS.LOG_INCOME : XP_ACTIONS.LOG_EXPENSE;
    const { state, leveledUp, newLevel } = awardXP(xpAmount);
    setGamification(state);
    toast({ title: `+${xpAmount} XP`, description: `${tx.type === 'income' ? 'Income' : 'Expense'} logged` });
    if (leveledUp && newLevel) {
      setTimeout(() => {
        toast({ title: `${newLevel.icon} Level Up!`, description: `You're now a ${newLevel.title}!` });
      }, 500);
    }
    setTimeout(() => {
      const newAch = checkNewAchievements();
      if (newAch.length > 0) {
        setGamification(getGamificationState());
        newAch.forEach(a => toast({ title: `${a.icon} Achievement!`, description: a.title }));
      }
    }, 1000);
  }, [toast]);

  const handleCSVImport = useCallback((txs: Transaction[]) => {
    setTransactions(prev => [...txs, ...prev]);
    const totalXP = txs.length * XP_ACTIONS.LOG_EXPENSE;
    const { state, leveledUp, newLevel } = awardXP(totalXP);
    setGamification(state);
    toast({ title: `📥 Imported ${txs.length} transactions`, description: `+${totalXP} XP` });
    if (leveledUp && newLevel) {
      toast({ title: `${newLevel.icon} Level Up!`, description: `You're now a ${newLevel.title}!` });
    }
  }, [toast]);

  const handleDelete = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleClearData = useCallback(() => {
    saveTransactions([]);
    saveBudgets([]);
    setTransactions([]);
  }, []);

  const handleLock = useCallback(() => setLocked(true), []);

  const handleModeChange = useCallback((mode: GamificationState['gameMode']) => {
    const state = getGamificationState();
    state.gameMode = mode;
    saveGamificationState(state);
    setGamification({ ...state });
    toast({ title: '⚙️ Mode Changed', description: `Switched to ${mode}` });
  }, [toast]);

  if (locked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  const level = getLevelForXP(gamification.xp);
  const xpProgress = getXPProgress(gamification.xp);

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary/15 border border-primary/30 rounded-sm flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
            </div>
            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Money OS</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Level indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-sm border border-border">
              <TrendingUp className="w-3 h-3 text-accent" strokeWidth={2.5} />
              <span className="text-[9px] font-bold text-accent tracking-wider">LV.{level.level}</span>
            </div>
            {/* Streak */}
            {gamification.streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-sm border border-border">
                <Zap className="w-3 h-3 text-primary" strokeWidth={2.5} />
                <span className="text-[9px] font-bold text-primary text-mono">{gamification.streak}</span>
                <Flame className="w-3 h-3 text-accent" strokeWidth={2.5} />
              </div>
            )}
          </div>
        </div>
        {/* XP Progress bar */}
        <div className="h-[2px] bg-secondary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress.pct}%` }}
            className="h-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 pt-3">
        <AnimatePresence mode="wait">
          {tab === 'dashboard' && !showHistory && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <Dashboard transactions={transactions} />
            </motion.div>
          )}
          {tab === 'gamification' && !showHistory && (
            <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <SavingsView transactions={transactions} />
            </motion.div>
          )}
          {tab === 'analytics' && !showHistory && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <AnalyticsDashboard transactions={transactions} />
            </motion.div>
          )}
          {tab === 'settings' && !showHistory && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <SettingsView
                onLock={handleLock}
                onClearData={handleClearData}
                onShowHistory={() => setShowHistory(true)}
                onShowCSV={() => setShowCSV(true)}
              />
            </motion.div>
          )}
          {showHistory && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              <div className="mb-3">
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/30 px-3 py-1.5 rounded-sm hover:bg-primary/10 transition-colors"
                >
                  ← Back
                </button>
              </div>
              <TransactionList transactions={transactions} onDelete={handleDelete} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav
        active={tab}
        onChange={(t) => { setShowHistory(false); setTab(t); }}
        onAdd={() => setShowAdd(true)}
        onBudget={() => setShowBudget(true)}
      />
      <AddTransaction open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      <CSVImport open={showCSV} onClose={() => setShowCSV(false)} onImport={handleCSVImport} />

      {/* Budget Modal */}
      <AnimatePresence>
        {showBudget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-40 flex items-end justify-center"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowBudget(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="relative w-full max-w-lg bg-card border-t border-primary/30 p-5 safe-bottom max-h-[80vh] overflow-y-auto rounded-t-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em]">Set Budgets</h2>
                <button onClick={() => setShowBudget(false)} className="p-1.5 rounded-sm hover:bg-secondary transition-colors">
                  <span className="text-xs text-muted-foreground">✕</span>
                </button>
              </div>
              <BudgetView transactions={transactions} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
