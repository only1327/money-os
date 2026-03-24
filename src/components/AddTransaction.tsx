import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CATEGORIES, CATEGORY_ICONS, addTransaction, getCurrencySymbol, type Transaction } from '@/lib/storage';

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
    setAmount(''); setCategory(''); setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-40 flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-background/80" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative w-full max-w-lg bg-card border-t-3 border-x-3 border-primary shadow-[0_-6px_0px_hsl(145,85%,45%)] p-5 safe-bottom"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest">Add Transaction</h2>
              <button onClick={onClose} className="p-2 border-2 border-muted-foreground/20 hover:border-primary transition-colors">
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setType(t); setCategory(''); }}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-2 ${
                    type === t
                      ? t === 'income'
                        ? 'bg-income/15 text-income border-income shadow-[3px_3px_0px] shadow-income'
                        : 'bg-expense/15 text-expense border-expense shadow-[3px_3px_0px] shadow-expense'
                      : 'bg-secondary text-secondary-foreground border-muted-foreground/20'
                  }`}
                >
                  {t === 'income' ? <ArrowUpRight className="w-4 h-4" strokeWidth={3} /> : <ArrowDownRight className="w-4 h-4" strokeWidth={3} />}
                  {t}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Amount</label>
              <div className="brutal-input p-3 flex items-center gap-2">
                <span className="text-lg font-bold text-muted-foreground">{getCurrencySymbol()}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-bold text-mono outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 transition-all border-2 ${
                      category === cat
                        ? 'bg-primary text-primary-foreground border-primary-foreground shadow-[2px_2px_0px] shadow-primary-foreground'
                        : 'bg-secondary text-secondary-foreground border-muted-foreground/20'
                    }`}
                  >
                    {CATEGORY_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Note</label>
              <input
                type="text"
                placeholder="What was this for?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={100}
                className="w-full brutal-input p-3 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
              />
            </div>

            {/* Date */}
            <div className="mb-5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full brutal-input p-3 bg-transparent text-sm outline-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!amount || !category}
              className="w-full py-4 brutal-btn-primary text-sm disabled:opacity-30 disabled:pointer-events-none"
            >
              ADD {type.toUpperCase()}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
