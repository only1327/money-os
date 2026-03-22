import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Delete, Lock } from 'lucide-react';
import { hashPin, getSettings, saveSettings } from '@/lib/storage';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isSetup, setIsSetup] = useState(() => !getSettings().pinHash);
  const [confirmPin, setConfirmPin] = useState<string | null>(null);

  const processPin = async (enteredPin: string) => {
    const settings = getSettings();
    if (isSetup) {
      if (confirmPin === null) {
        setConfirmPin(enteredPin);
        setPin('');
        return;
      }
      if (confirmPin === enteredPin) {
        const hashed = await hashPin(enteredPin);
        saveSettings({ pinHash: hashed });
        onUnlock();
      } else {
        setError(true);
        setConfirmPin(null);
        setPin('');
      }
      return;
    }
    const hashed = await hashPin(enteredPin);
    if (hashed === settings.pinHash) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);
    if (newPin.length === 4) {
      setTimeout(() => processPin(newPin), 150);
    }
  }, [pin, isSetup, confirmPin]);

  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(false); };

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background stripe-bg">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15 }} className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-primary flex items-center justify-center border-3 border-primary-foreground shadow-[4px_4px_0px] shadow-primary-foreground">
          <Shield className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Money OS</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
            {isSetup ? confirmPin ? 'Confirm PIN' : 'Create 4-digit PIN' : 'Enter PIN'}
          </p>
        </div>

        <div className="flex gap-3">
          {dots.map((filled, i) => (
            <motion.div
              key={i}
              animate={error ? { x: [0, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.3 }}
              className={`w-4 h-4 border-2 transition-all duration-100 ${
                filled
                  ? error ? 'bg-destructive border-destructive' : 'bg-primary border-primary'
                  : 'border-muted-foreground/40'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-destructive text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-3 h-3" strokeWidth={3} />
            {isSetup ? "PINs don't match" : 'Wrong PIN'}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((key) => (
            <motion.button
              key={key || 'empty'}
              whileTap={{ scale: 0.92 }}
              disabled={!key}
              onClick={() => key === 'del' ? handleDelete() : key && handleDigit(key)}
              className={`flex items-center justify-center text-lg font-bold transition-all ${
                !key ? 'invisible' : 'bg-card border-2 border-muted-foreground/20 hover:border-primary active:bg-primary active:text-primary-foreground'
              }`}
              style={{ width: 64, height: 64 }}
            >
              {key === 'del' ? <Delete className="w-5 h-5 text-muted-foreground" strokeWidth={3} /> : key}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
