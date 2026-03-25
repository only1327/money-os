import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Trash2, Lock, Info, Database, List, DollarSign, Upload } from 'lucide-react';
import { getSettings, saveSettings } from '@/lib/storage';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', label: 'Korean Won' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
];

interface SettingsViewProps {
  onLock: () => void;
  onClearData: () => void;
  onShowHistory: () => void;
  onShowCSV: () => void;
}

export default function SettingsView({ onLock, onClearData, onShowHistory, onShowCSV }: SettingsViewProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const settings = getSettings();
  const [currency, setCurrency] = useState(settings.currency);

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    saveSettings({ currency: code });
  };

  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.04 }} className="space-y-3 pb-28">
      {/* Quick Links */}
      <motion.div variants={item} className="cyber-card p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Quick Access</h3>
        <div className="space-y-1.5">
          <button onClick={onShowHistory}
            className="w-full flex items-center gap-3 p-3 rounded-sm border border-border hover:border-primary/30 transition-colors">
            <List className="w-4 h-4 text-primary" strokeWidth={2} />
            <div className="text-left">
              <p className="text-xs font-medium">Transaction History</p>
              <p className="text-[10px] text-muted-foreground">View & manage all transactions</p>
            </div>
          </button>
          <button onClick={onShowCSV}
            className="w-full flex items-center gap-3 p-3 rounded-sm border border-border hover:border-primary/30 transition-colors">
            <Upload className="w-4 h-4 text-primary" strokeWidth={2} />
            <div className="text-left">
              <p className="text-xs font-medium">Import CSV</p>
              <p className="text-[10px] text-muted-foreground">Import bank statements</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Currency */}
      <motion.div variants={item} className="cyber-card p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
          <DollarSign className="w-3 h-3" /> Currency
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => handleCurrencyChange(c.code)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-sm transition-all ${
                currency === c.code
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
              }`}
            >
              {c.symbol} {c.code}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div variants={item} className="cyber-card p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
          <Shield className="w-3 h-3" /> Security
        </h3>
        <button onClick={onLock}
          className="w-full flex items-center gap-3 p-3 rounded-sm border border-border hover:border-primary/30 transition-colors">
          <Lock className="w-4 h-4 text-primary" strokeWidth={2} />
          <div className="text-left">
            <p className="text-xs font-medium">Lock App</p>
            <p className="text-[10px] text-muted-foreground">Lock immediately</p>
          </div>
        </button>
      </motion.div>

      {/* Data */}
      <motion.div variants={item} className="cyber-card-danger p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
          <Database className="w-3 h-3" /> Data
        </h3>
        {!showClearConfirm ? (
          <button onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center gap-3 p-3 rounded-sm border border-destructive/20 hover:border-destructive/40 transition-colors">
            <Trash2 className="w-4 h-4 text-destructive" strokeWidth={2} />
            <div className="text-left">
              <p className="text-xs font-medium text-destructive">Clear All Data</p>
              <p className="text-[10px] text-muted-foreground">Delete all transactions & budgets</p>
            </div>
          </button>
        ) : (
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-sm">
            <p className="text-xs font-semibold text-destructive mb-3">⚠ This cannot be undone</p>
            <div className="flex gap-2">
              <button onClick={() => { onClearData(); setShowClearConfirm(false); }}
                className="flex-1 py-2 bg-destructive text-destructive-foreground text-[10px] font-bold uppercase rounded-sm">
                Delete Everything
              </button>
              <button onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-sm border border-border">
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* About */}
      <motion.div variants={item} className="cyber-card-muted p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2 flex items-center gap-1.5">
          <Info className="w-3 h-3" /> About
        </h3>
        <p className="text-xs font-medium">Money OS v2.0</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">All data stored locally on your device.</p>
        <p className="text-[9px] text-muted-foreground/50 mt-1">No cloud • No tracking • Your data</p>
      </motion.div>
    </motion.div>
  );
}
