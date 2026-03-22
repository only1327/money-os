import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Transaction, CATEGORY_ICONS } from '@/lib/storage';
import { format, isThisMonth } from 'date-fns';

interface DashboardProps {
  transactions: Transaction[];
}

export default function Dashboard({ transactions }: DashboardProps) {
  const stats = useMemo(() => {
    const monthTxs = transactions.filter(t => isThisMonth(new Date(t.date)));
    const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = transactions.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
    return { income, expenses, balance };
  }, [transactions]);

  const recentTxs = transactions.slice(0, 5);

  const categoryBreakdown = useMemo(() => {
    const monthExpenses = transactions.filter(t => t.type === 'expense' && isThisMonth(new Date(t.date)));
    const byCategory: Record<string, number> = {};
    monthExpenses.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amount]) => ({ category: cat, amount, pct: total ? (amount / total) * 100 : 0 }));
  }, [transactions]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 pb-24">
      {/* Balance Card */}
      <motion.div variants={item} className="glass-panel-strong rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-muted-foreground text-sm font-medium">Total Balance</p>
        <p className="text-4xl font-bold font-mono mt-1 text-gradient-primary">
          ${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-income/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-income" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-sm font-semibold font-mono text-income">+${stats.income.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-expense/10 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-expense" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-sm font-semibold font-mono text-expense">-${stats.expenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <motion.div variants={item} className="glass-panel rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">This Month's Spending</h3>
          <div className="space-y-3">
            {categoryBreakdown.map(({ category, amount, pct }) => (
              <div key={category} className="flex items-center gap-3">
                <span className="text-lg">{CATEGORY_ICONS[category] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate">{category}</span>
                    <span className="font-mono text-muted-foreground">${amount.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div variants={item} className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Transactions</h3>
        {recentTxs.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTxs.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg">
                  {CATEGORY_ICONS[tx.category] || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description || tx.category}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'MMM d')}</p>
                </div>
                <span className={`text-sm font-semibold font-mono ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
