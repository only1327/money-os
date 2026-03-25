import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Wallet, Target, Brain, TrendingUp } from 'lucide-react';
import { Transaction, CATEGORY_ICONS, CHART_COLORS, getBudgets, getCurrencySymbol } from '@/lib/storage';
import { isThisMonth, format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { analyzeSavings } from '@/lib/savings';
import { generateInsights } from '@/lib/gamification';
import { getSavingsGoals } from '@/lib/savings';

interface DashboardProps {
  transactions: Transaction[];
}

export default function Dashboard({ transactions }: DashboardProps) {
  const cs = getCurrencySymbol();

  const stats = useMemo(() => {
    const monthTxs = transactions.filter(t => isThisMonth(new Date(t.date)));
    const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const moneyLeft = income - expenses;
    return { income, expenses, moneyLeft };
  }, [transactions]);

  const analysis = useMemo(() => analyzeSavings(transactions), [transactions]);
  const insights = useMemo(() => generateInsights(transactions), [transactions]);
  const topInsight = insights[0] || null;

  const goals = useMemo(() => getSavingsGoals().slice(0, 2), []);

  const pieData = useMemo(() => {
    const monthExpenses = transactions.filter(t => t.type === 'expense' && isThisMonth(new Date(t.date)));
    const byCategory: Record<string, number> = {};
    monthExpenses.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [transactions]);

  const budgetStatus = useMemo(() => {
    const budgets = getBudgets();
    const monthExpenses = transactions.filter(t => t.type === 'expense' && isThisMonth(new Date(t.date)));
    return budgets.map(b => {
      const spent = monthExpenses.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
      const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      return { ...b, spent, pct };
    }).sort((a, b) => b.pct - a.pct).slice(0, 3);
  }, [transactions]);

  const recentTxs = transactions.slice(0, 4);

  const safeToSpend = useMemo(() => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const remaining = daysInMonth - new Date().getDate();
    return remaining > 0 ? Math.max(0, Math.round(stats.moneyLeft / remaining)) : 0;
  }, [stats.moneyLeft]);

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.04 }}
      className="space-y-3 pb-28"
    >
      {/* ── Money Left Hero Card ──────────────────────────── */}
      <motion.div variants={item} className="cyber-card-glow p-5 animate-glow-pulse">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Money Left</p>
          <span className="flex items-center gap-1.5 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-bold tracking-widest">LIVE</span>
          </span>
        </div>
        <p className={`text-4xl font-bold text-mono glow-text mt-1 ${stats.moneyLeft >= 0 ? 'text-primary' : 'text-destructive'}`}>
          {stats.moneyLeft < 0 ? '-' : ''}{cs}{Math.abs(stats.moneyLeft).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-2 flex-1 bg-income/5 border border-income/20 p-2.5 rounded-sm">
            <ArrowUpRight className="w-4 h-4 text-income" strokeWidth={2.5} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Income</p>
              <p className="text-sm font-bold text-mono text-income">+{cs}{stats.income.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 bg-expense/5 border border-expense/20 p-2.5 rounded-sm">
            <ArrowDownRight className="w-4 h-4 text-expense" strokeWidth={2.5} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Expenses</p>
              <p className="text-sm font-bold text-mono text-expense">-{cs}{stats.expenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Smart Insight Card ────────────────────────────── */}
      <motion.div variants={item} className="cyber-card p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            {topInsight ? (
              <>
                <p className="text-xs font-semibold text-foreground">{topInsight.icon} {topInsight.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{topInsight.message}</p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-foreground">💡 Safe to spend {cs}{safeToSpend.toLocaleString()} today</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Based on remaining days and current balance</p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Goals Progress (compact) ──────────────────────── */}
      {goals.length > 0 && (
        <motion.div variants={item} className="cyber-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Goals
          </h3>
          <div className="space-y-2.5">
            {goals.map(g => {
              const pct = g.targetAmount > 0 ? Math.min((g.savedAmount / g.targetAmount) * 100, 100) : 0;
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium flex items-center gap-1.5">
                      <span className="text-sm">{g.icon}</span> {g.name}
                    </span>
                    <span className="text-mono text-muted-foreground text-[10px]">{Math.round(pct)}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Spending Breakdown ────────────────────────────── */}
      {pieData.length > 0 && (
        <motion.div variants={item} className="cyber-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Spending Breakdown
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={52}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="hsl(220, 30%, 2%)"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${cs}${value.toLocaleString()}`, '']}
                    contentStyle={{
                      background: 'hsl(220, 25%, 5%)',
                      border: '1px solid hsl(145, 85%, 45%, 0.3)',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '11px',
                      color: 'hsl(60, 10%, 92%)',
                      borderRadius: '2px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[11px]">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="truncate font-medium text-foreground/80">{CATEGORY_ICONS[d.name]} {d.name}</span>
                  <span className="ml-auto text-mono text-muted-foreground">{cs}{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Budget Tracker (compact) ──────────────────────── */}
      {budgetStatus.length > 0 && (
        <motion.div variants={item} className="cyber-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Budgets
          </h3>
          <div className="space-y-2.5">
            {budgetStatus.map(b => (
              <div key={b.category}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-medium flex items-center gap-1">
                    {CATEGORY_ICONS[b.category]} {b.category}
                  </span>
                  <span className="text-mono text-muted-foreground text-[10px]">
                    {cs}{b.spent.toLocaleString()} / {cs}{b.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(b.pct, 100)}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full ${
                      b.pct > 100 ? 'bg-destructive' : b.pct > 80 ? 'bg-warning' : 'bg-primary'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Recent Transactions ───────────────────────────── */}
      <motion.div variants={item} className="cyber-card p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Recent
        </h3>
        {recentTxs.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-10 h-10 mx-auto text-muted-foreground/15 mb-2" strokeWidth={2} />
            <p className="text-sm font-semibold text-muted-foreground/60">Start your journey 🚀</p>
            <p className="text-[11px] text-muted-foreground/40 mt-0.5">Tap + to log your first move</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {recentTxs.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-2 rounded-sm hover:bg-secondary/50 transition-colors">
                <div className="w-8 h-8 bg-secondary rounded-sm flex items-center justify-center text-sm shrink-0">
                  {CATEGORY_ICONS[tx.category] || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate">{tx.description || tx.category}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(tx.date), 'MMM d')}</p>
                </div>
                <span className={`text-[12px] font-bold text-mono ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {tx.type === 'income' ? '+' : '-'}{cs}{tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
