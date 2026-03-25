import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Upload } from 'lucide-react';
import LockScreen from '@/components/LockScreen';
import Dashboard from '@/components/Dashboard';
import TransactionList from '@/components/TransactionList';
import AddTransaction from '@/components/AddTransaction';
import BudgetView from '@/components/BudgetView';
import BottomNav, { type TabId } from '@/components/BottomNav';
import SettingsView from '@/components/SettingsView';
import GamificationHub from '@/components/GamificationHub';
import SavingsView from '@/components/SavingsView';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import CSVImport from '@/components/CSVImport';
import { getTransactions, saveTransactions, saveBudgets, getCurrencySymbol, type Transaction } from '@/lib/storage';
import {
  getGamificationState, saveGamificationState, updateStreak, awardXP,
  checkNewAchievements, XP_ACTIONS, getLevelForXP, type GamificationState,
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
      toast({ title: '💔 Streak Broken', description: 'Your streak has been reset. Start fresh today!' });
    }
    if (bonusXP > 0) {
      toast({ title: `🔥 Streak Bonus! +${bonusXP} XP`, description: `${state.streak}-day streak milestone!` });
    }
    const newAchievements = checkNewAchievements();
    if (newAchievements.length > 0) {
      setGamification(getGamificationState());
      newAchievements.forEach(a => {
        toast({ title: `${a.icon} Achievement Unlocked!`, description: a.title });
      });
    }
  }, []);

  const handleUnlock = useCallback(() => setLocked(false), []);

  const handleAdd = useCallback((tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    const xpAmount = tx.type === 'income' ? XP_ACTIONS.LOG_INCOME : XP_ACTIONS.LOG_EXPENSE;
    const { state, leveledUp, newLevel } = awardXP(xpAmount);
    setGamification(state);
    toast({ title: `+${xpAmount} XP`, description: `${tx.type === 'income' ? 'Income' : 'Expense'} logged!` });
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
    toast({ title: `📥 Imported ${txs.length} transactions`, description: `+${totalXP} XP earned!` });
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
    toast({ title: '⚙️ Mode Changed', description: `Switched to ${mode} mode` });
  }, [toast]);

  if (locked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  const level = getLevelForXP(gamification.xp);

  return (
    <div className="min-h-screen bg-background stripe-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b-3 border-primary">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
            </div>
            <h1 className="text-lg font-bold uppercase tracking-wider">Money OS</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 border-2 border-accent bg-accent/10">
              <span className="text-sm">{level.icon}</span>
              <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Lv.{level.level}</span>
            </div>
            {gamification.streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 border-2 border-primary bg-primary/10">
                <Zap className="w-3 h-3 text-primary" strokeWidth={3} />
                <span className="text-[9px] font-bold text-primary text-mono">{gamification.streak}🔥</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-4">
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
              <div className="mb-4">
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs font-bold uppercase tracking-wider text-primary border-2 border-primary px-3 py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
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
            <div className="absolute inset-0 bg-background/80" onClick={() => setShowBudget(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="relative w-full max-w-lg bg-card border-t-3 border-x-3 border-primary p-5 safe-bottom max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest">Set Budgets</h2>
                <button onClick={() => setShowBudget(false)} className="p-2 border-2 border-muted-foreground/20 hover:border-primary transition-colors">
                  <span className="text-xs font-bold">✕</span>
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
