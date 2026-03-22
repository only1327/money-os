import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Trash2, Lock, Info, Database } from 'lucide-react';

interface SettingsViewProps {
  onLock: () => void;
  onClearData: () => void;
}

export default function SettingsView({ onLock, onClearData }: SettingsViewProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="space-y-4 pb-28">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="brutal-card p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" strokeWidth={3} /> Security
        </h3>
        <button
          onClick={onLock}
          className="w-full flex items-center gap-3 p-3 border-2 border-muted-foreground/20 hover:border-primary transition-colors"
        >
          <Lock className="w-5 h-5 text-primary" strokeWidth={3} />
          <div className="text-left">
            <p className="text-sm font-bold">LOCK APP</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lock immediately</p>
          </div>
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="brutal-card-danger p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Database className="w-4 h-4" strokeWidth={3} /> Data
        </h3>
        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center gap-3 p-3 border-2 border-destructive/30 hover:border-destructive transition-colors"
          >
            <Trash2 className="w-5 h-5 text-destructive" strokeWidth={3} />
            <div className="text-left">
              <p className="text-sm font-bold text-destructive">CLEAR ALL DATA</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Delete all transactions & budgets</p>
            </div>
          </button>
        ) : (
          <div className="p-4 bg-destructive/10 border-2 border-destructive">
            <p className="text-sm font-bold text-destructive mb-3">⚠ THIS CANNOT BE UNDONE</p>
            <div className="flex gap-2">
              <button
                onClick={() => { onClearData(); setShowClearConfirm(false); }}
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider border-2 border-destructive-foreground/30"
              >
                DELETE EVERYTHING
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider border-2 border-muted-foreground/20"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="brutal-card-muted p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" strokeWidth={3} /> About
        </h3>
        <div className="space-y-1 text-sm">
          <p className="font-bold">Money OS v1.0</p>
          <p className="text-muted-foreground text-xs">All data stored locally on your device.</p>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mt-2">No cloud • No tracking • Your data</p>
        </div>
      </motion.div>
    </div>
  );
}
