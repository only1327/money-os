import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      setTimeout(() => processPin(newPin), 200);
    }
  }, [pin, isSetup, confirmPin]);

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

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError(false);
  };

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
        className="flex flex-col items-center gap-8"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center glow-primary animate-pulse-glow">
            <Shield className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Money OS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSetup
              ? confirmPin ? 'Confirm your PIN' : 'Create a 4-digit PIN'
              : 'Enter PIN to unlock'}
          </p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4">
          {dots.map((filled, i) => (
            <motion.div
              key={i}
              animate={error ? { x: [0, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                filled
                  ? error
                    ? 'bg-destructive border-destructive'
                    : 'bg-primary border-primary glow-primary'
                  : 'border-muted-foreground'
              }`}
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-destructive text-sm flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              {isSetup ? "PINs don't match. Try again." : 'Wrong PIN'}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((key) => (
            <motion.button
              key={key || 'empty'}
              whileTap={{ scale: 0.9 }}
              disabled={!key}
              onClick={() => key === 'del' ? handleDelete() : key && handleDigit(key)}
              className={`w-18 h-18 rounded-2xl text-xl font-semibold flex items-center justify-center transition-colors
                ${!key ? 'invisible' : 'glass-panel hover:bg-secondary active:bg-muted'}
              `}
              style={{ width: 72, height: 72 }}
            >
              {key === 'del' ? <Delete className="w-5 h-5 text-muted-foreground" /> : key}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
