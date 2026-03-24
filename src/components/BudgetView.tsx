import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { CATEGORIES, CATEGORY_ICONS, getBudgets, setBudget, removeBudget, getCurrencySymbol, type Budget, type Transaction } from '@/lib/storage';
import { isThisMonth } from 'date-fns';

interface BudgetViewProps {
  transactions: Transaction[];
}

export default function BudgetView({ transactions }: BudgetViewProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const cs = getCurrencySymbol();
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  useEffect(() => {
    setBudgets(getBudgets());
  }, []);

  const monthExpenses = transactions.filter(t => t.type === 'expense' && isThisMonth(new Date(t.date)));

  const budgetData = budgets.map(b => {
    const spent = monthExpenses.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    const remaining = b.limit - spent;
    return { ...b, spent, pct, remaining };
  }).sort((a, b) => b.pct - a.pct);

  const existingCategories = budgets.map(b => b.category);
  const availableCategories = CATEGORIES.expense.filter(c => !existingCategories.includes(c));

  const handleAdd = () => {
    if (!newCategory || !newLimit || parseFloat(newLimit) <= 0) return;
    setBudget(newCategory, parseFloat(newLimit));
    setBudgets(getBudgets());
    setNewCategory('');
    setNewLimit('');
    setShowAdd(false);
  };

  const handleRemove = (category: string) => {
    removeBudget(category);
    setBudgets(getBudgets());
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="space-y-4 pb-28">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="brutal-card p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-primary" strokeWidth={3} />
          <h2 className="text-sm font-bold uppercase tracking-widest">Monthly Budgets</h2>
        </div>
        {budgets.length > 0 ? (
          <div className="flex gap-4">
            <div className="flex-1 border-2 border-primary/30 p-3 bg-primary/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Budget</p>
              <p className="text-lg font-bold text-mono text-primary">{cs}{totalBudget.toLocaleString()}</p>
            </div>
            <div className="flex-1 border-2 border-expense/30 p-3 bg-expense/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Spent</p>
              <p className="text-lg font-bold text-mono text-expense">{cs}{totalSpent.toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No budgets set. Add one below!</p>
        )}
      </motion.div>

      {/* Budget List */}
      {budgetData.map((b, i) => (
        <motion.div
          key={b.category}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className={`p-4 ${b.pct > 100 ? 'brutal-card-danger' : 'brutal-card-muted'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold flex items-center gap-2">
              <span className="text-base">{CATEGORY_ICONS[b.category]}</span>
              {b.category}
              {b.pct > 80 && b.pct <= 100 && (
                <span className="badge-brutal text-warning">⚠ WARNING</span>
              )}
              {b.pct > 100 && (
                <span className="badge-brutal text-destructive">🚨 OVER</span>
              )}
            </span>
            <button
              onClick={() => handleRemove(b.category)}
              className="p-1 hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="h-4 bg-muted border-2 border-muted-foreground/20 relative overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(b.pct, 100)}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full ${
                b.pct > 100 ? 'bg-destructive' : b.pct > 80 ? 'bg-warning' : 'bg-primary'
              }`}
            />
          </div>
          <div className="flex justify-between text-xs text-mono text-muted-foreground">
            <span>{cs}{b.spent.toLocaleString()} spent</span>
            <span className={b.remaining < 0 ? 'text-destructive font-bold' : ''}>
              {b.remaining < 0 ? `-${cs}${Math.abs(b.remaining).toLocaleString()} over` : `${cs}${b.remaining.toLocaleString()} left`}
            </span>
          </div>
        </motion.div>
      ))}

      {/* Add Budget */}
      {!showAdd ? (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAdd(true)}
          disabled={availableCategories.length === 0}
          className="w-full p-4 brutal-card-muted flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-30"
        >
          <Plus className="w-4 h-4" strokeWidth={3} /> Add Budget
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="brutal-card p-5 space-y-4"
        >
          <h3 className="text-sm font-bold uppercase tracking-widest">New Budget</h3>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition-all border-2 ${
                    newCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary-foreground shadow-[3px_3px_0px] shadow-primary-foreground'
                      : 'bg-secondary text-secondary-foreground border-muted-foreground/20'
                  }`}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Monthly Limit</label>
            <div className="brutal-input p-3 flex items-center gap-2">
              <span className="text-lg font-bold text-muted-foreground">{cs}</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={newLimit}
                onChange={e => setNewLimit(e.target.value)}
                className="flex-1 bg-transparent text-xl font-bold text-mono outline-none placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newCategory || !newLimit}
              className="flex-1 py-3 brutal-btn-primary text-sm disabled:opacity-30 disabled:pointer-events-none"
            >
              SET BUDGET
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewCategory(''); setNewLimit(''); }}
              className="px-4 py-3 bg-secondary text-secondary-foreground text-sm font-bold border-2 border-muted-foreground/30"
            >
              CANCEL
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
