import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CATEGORIES, CATEGORY_ICONS, addTransaction, type Transaction } from '@/lib/storage';

interface AddTransactionProps {
  open: boolean;
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
}

export default function AddTransaction({ open, onClose, onAdd }: AddTransactionProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const categories = CATEGORIES[type];

  const handleSubmit = () => {
    if (!amount || !category) return;
    const tx = addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      description: description.trim(),
      date,
    });
    onAdd(tx);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative w-full max-w-lg glass-panel-strong rounded-t-3xl p-6 safe-bottom"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Add Transaction</h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex gap-2 mb-5">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setType(t); setCategory(''); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    type === t
                      ? t === 'income'
                        ? 'bg-income/15 text-income neo-brutal-sm'
                        : 'bg-expense/15 text-expense neo-brutal-sm'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {t === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount</label>
              <div className="glass-panel rounded-xl p-3 flex items-center gap-2">
                <span className="text-lg font-bold text-muted-foreground">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-bold font-mono outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                      category === cat ? 'bg-primary text-primary-foreground neo-brutal-sm' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <span>{CATEGORY_ICONS[cat]}</span> {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Note (optional)</label>
              <input
                type="text"
                placeholder="What was this for?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={100}
                className="w-full glass-panel rounded-xl p-3 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
              />
            </div>

            {/* Date */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full glass-panel rounded-xl p-3 bg-transparent text-sm outline-none"
              />
            </div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!amount || !category}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm neo-brutal-sm disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              Add {type === 'income' ? 'Income' : 'Expense'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
