import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Wallet, Target } from 'lucide-react';
import { Transaction, CATEGORY_ICONS, CHART_COLORS, getBudgets } from '@/lib/storage';
import { isThisMonth, format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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

  const pieData = useMemo(() => {
    const monthExpenses = transactions.filter(t => t.type === 'expense' && isThisMonth(new Date(t.date)));
    const byCategory: Record<string, number> = {};
    monthExpenses.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [transactions]);

  const budgetStatus = useMemo(() => {
    const budgets = getBudgets();
    const monthExpenses = transactions.filter(t => t.type === 'expense' && isThisMonth(new Date(t.date)));
    return budgets.map(b => {
      const spent = monthExpenses.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
      const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      return { ...b, spent, pct };
    }).sort((a, b) => b.pct - a.pct);
  }, [transactions]);

  const recentTxs = transactions.slice(0, 5);

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.15 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.05 }}
      className="space-y-4 pb-28"
    >
      {/* Balance Card */}
      <motion.div variants={item} className="brutal-card p-5 stripe-bg">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Balance</p>
          <span className="badge-brutal text-primary">LIVE</span>
        </div>
        <p className="text-4xl font-bold text-mono text-gradient-primary mt-2">
          ${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 flex-1 bg-income/5 border-2 border-income/30 p-2.5">
            <ArrowUpRight className="w-5 h-5 text-income" strokeWidth={3} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Income</p>
              <p className="text-sm font-bold text-mono text-income">+${stats.income.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 bg-expense/5 border-2 border-expense/30 p-2.5">
            <ArrowDownRight className="w-5 h-5 text-expense" strokeWidth={3} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expenses</p>
              <p className="text-sm font-bold text-mono text-expense">-${stats.expenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <motion.div variants={item} className="brutal-card-accent p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Spending Breakdown
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="hsl(220, 25%, 3%)"
                    strokeWidth={3}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{
                      background: 'hsl(220, 20%, 7%)',
                      border: '2px solid hsl(145, 85%, 45%)',
                      boxShadow: '3px 3px 0px hsl(145, 85%, 45%)',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '12px',
                      color: 'hsl(60, 10%, 92%)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 shrink-0 border border-foreground/20" style={{ background: d.color }} />
                  <span className="truncate font-medium">{CATEGORY_ICONS[d.name]} {d.name}</span>
                  <span className="ml-auto text-mono text-muted-foreground">${d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Budget Tracker */}
      {budgetStatus.length > 0 && (
        <motion.div variants={item} className="brutal-card-muted p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> Budget Tracker
          </h3>
          <div className="space-y-3">
            {budgetStatus.map(b => (
              <div key={b.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    {CATEGORY_ICONS[b.category]} {b.category}
                  </span>
                  <span className="text-mono text-muted-foreground">
                    ${b.spent.toLocaleString()} / ${b.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-muted border-2 border-muted-foreground/20 relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(b.pct, 100)}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full ${
                      b.pct > 100 ? 'bg-destructive' : b.pct > 80 ? 'bg-warning' : 'bg-primary'
                    }`}
                  />
                  {b.pct > 100 && (
                    <span className="absolute right-1 top-0 text-[8px] font-bold text-destructive-foreground leading-3">
                      OVER!
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div variants={item} className="brutal-card-muted p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Recent Transactions
        </h3>
        {recentTxs.length === 0 ? (
          <div className="text-center py-10">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground/20 mb-2" strokeWidth={3} />
            <p className="text-sm font-bold text-muted-foreground">NO TRANSACTIONS YET</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap + to add your first one</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentTxs.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-2 border-2 border-transparent hover:border-primary/30 transition-colors">
                <div className="w-9 h-9 bg-secondary border-2 border-muted-foreground/20 flex items-center justify-center text-base shrink-0">
                  {CATEGORY_ICONS[tx.category] || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{tx.description || tx.category}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">{format(new Date(tx.date), 'MMM d')}</p>
                </div>
                <span className={`text-sm font-bold text-mono ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
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
