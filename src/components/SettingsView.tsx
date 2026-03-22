import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Trash2, Lock, Info, Database } from 'lucide-react';
import { getSettings, saveSettings, hashPin } from '@/lib/storage';

interface SettingsViewProps {
  onLock: () => void;
  onClearData: () => void;
}

export default function SettingsView({ onLock, onClearData }: SettingsViewProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="space-y-4 pb-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Security
        </h3>
        <button
          onClick={onLock}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
        >
          <Lock className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="text-sm font-medium">Lock App</p>
            <p className="text-xs text-muted-foreground">Lock immediately</p>
          </div>
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
          <Database className="w-4 h-4" /> Data
        </h3>
        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-destructive" />
            <div className="text-left">
              <p className="text-sm font-medium text-destructive">Clear All Data</p>
              <p className="text-xs text-muted-foreground">Delete all transactions</p>
            </div>
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium text-destructive mb-3">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { onClearData(); setShowClearConfirm(false); }}
                className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold"
              >
                Delete Everything
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" /> About
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Money OS v1.0</p>
          <p>All data stored locally on your device.</p>
          <p className="text-xs">No cloud. No tracking. Your money, your data.</p>
        </div>
      </motion.div>
    </div>
  );
}
