import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import LockScreen from '@/components/LockScreen';
import Dashboard from '@/components/Dashboard';
import TransactionList from '@/components/TransactionList';
import AddTransaction from '@/components/AddTransaction';
import BottomNav, { type TabId } from '@/components/BottomNav';
import SettingsView from '@/components/SettingsView';
import { getTransactions, saveTransactions, type Transaction } from '@/lib/storage';

export default function Index() {
  const [locked, setLocked] = useState(false);
  const [tab, setTab] = useState<TabId>('dashboard');
  const [showAdd, setShowAdd] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  const handleUnlock = useCallback(() => setLocked(false), []);

  const handleAdd = useCallback((tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleClearData = useCallback(() => {
    saveTransactions([]);
    setTransactions([]);
  }, []);

  const handleLock = useCallback(() => setLocked(true), []);

  if (locked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 glass-panel-strong border-b border-border/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Money OS</h1>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-[10px] font-semibold text-primary">SECURE</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <AnimatePresence mode="wait">
          {tab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard transactions={transactions} />
            </motion.div>
          )}
          {tab === 'transactions' && (
            <motion.div key="txs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TransactionList transactions={transactions} onDelete={handleDelete} />
            </motion.div>
          )}
          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsView onLock={handleLock} onClearData={handleClearData} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav active={tab} onChange={setTab} onAdd={() => setShowAdd(true)} />
      <AddTransaction open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </div>
  );
}
