import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Brain, MessageCircle, ChevronRight } from 'lucide-react';
import { Transaction, CATEGORY_ICONS, CHART_COLORS, getCurrencySymbol } from '@/lib/storage';
import { generateInsights, type AIInsight } from '@/lib/gamification';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import { format, subDays, subMonths, isAfter } from 'date-fns';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
}

type TimeFilter = '7d' | '30d' | '3m' | '1y' | 'all';

const QUICK_PROMPTS = [
  'How can I save more?',
  'Where am I overspending?',
  'Am I on track this month?',
  'What should I cut first?',
];

export default function AnalyticsDashboard({ transactions }: AnalyticsDashboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');
  const cs = getCurrencySymbol();

  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = timeFilter === '7d' ? subDays(now, 7)
      : timeFilter === '30d' ? subDays(now, 30)
      : timeFilter === '3m' ? subMonths(now, 3)
      : timeFilter === '1y' ? subMonths(now, 12)
      : new Date(0);
    return transactions.filter(t => isAfter(new Date(t.date), cutoff));
  }, [transactions, timeFilter]);

  const stats = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [filtered]);

  const pieData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense').forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [filtered]);

  const trendData = useMemo(() => {
    const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90;
    const data: { date: string; income: number; expenses: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const label = days <= 7 ? format(d, 'EEE') : format(d, 'MMM d');
      const dayTxs = filtered.filter(t => t.date === dateStr);
      data.push({
        date: label,
        income: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expenses: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    if (data.length > 15) {
      const grouped: typeof data = [];
      const chunk = Math.ceil(data.length / 12);
      for (let i = 0; i < data.length; i += chunk) {
        const slice = data.slice(i, i + chunk);
        grouped.push({
          date: slice[0].date,
          income: slice.reduce((s, d) => s + d.income, 0),
          expenses: slice.reduce((s, d) => s + d.expenses, 0),
        });
      }
      return grouped;
    }
    return data;
  }, [filtered, timeFilter]);

  const categoryBarData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense').forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const insights = useMemo(() => generateInsights(transactions), [transactions]);

  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

  const chartStyle = {
    background: 'hsl(220, 25%, 5%)',
    border: '1px solid hsl(145, 85%, 45%, 0.2)',
    fontFamily: 'Space Mono, monospace',
    fontSize: '10px',
    color: 'hsl(60, 10%, 92%)',
    borderRadius: '2px',
  };

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.04 }} className="space-y-3 pb-28">
      {/* Time Filter */}
      <motion.div variants={item} className="flex gap-1">
        {(['7d', '30d', '3m', '1y', 'all'] as TimeFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setTimeFilter(f)}
            className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all ${
              timeFilter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </motion.div>

      {/* Summary */}
      <motion.div variants={item} className="cyber-card-glow p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-income/5 border border-income/15 p-2.5 rounded-sm text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Income</p>
            <p className="text-sm font-bold text-mono text-income">{cs}{stats.income.toLocaleString()}</p>
          </div>
          <div className="bg-expense/5 border border-expense/15 p-2.5 rounded-sm text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Expenses</p>
            <p className="text-sm font-bold text-mono text-expense">{cs}{stats.expenses.toLocaleString()}</p>
          </div>
          <div className={`border p-2.5 rounded-sm text-center ${stats.net >= 0 ? 'bg-income/5 border-income/15' : 'bg-expense/5 border-expense/15'}`}>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Net</p>
            <p className={`text-sm font-bold text-mono ${stats.net >= 0 ? 'text-income' : 'text-expense'}`}>
              {stats.net >= 0 ? '+' : '-'}{cs}{Math.abs(stats.net).toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── AI Coach ──────────────────────────────────────── */}
      <motion.div variants={item} className="cyber-card p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-primary" strokeWidth={2} /> AI Coach
        </h3>

        {insights.length > 0 ? (
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-4 text-center">Add more transactions to unlock insights</p>
        )}

        {/* Quick Prompts */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> Ask AI
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                className="text-[10px] px-2.5 py-1.5 bg-secondary text-secondary-foreground rounded-sm border border-border hover:border-primary/30 hover:text-primary transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Trend */}
      {trendData.length > 0 && (
        <motion.div variants={item} className="cyber-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Income vs Expenses
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 10%)" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(220, 10%, 35%)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'hsl(220, 10%, 35%)', fontSize: 9 }} />
                <Tooltip contentStyle={chartStyle} formatter={(value: number) => [`${cs}${value.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="income" stroke="hsl(145, 85%, 45%)" fill="hsl(145, 85%, 45%)" fillOpacity={0.1} strokeWidth={1.5} />
                <Area type="monotone" dataKey="expenses" stroke="hsl(0, 75%, 50%)" fill="hsl(0, 75%, 50%)" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Pie */}
      {pieData.length > 0 && (
        <motion.div variants={item} className="cyber-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Spending Breakdown
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={2} dataKey="value" stroke="hsl(220, 30%, 2%)" strokeWidth={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${cs}${value.toLocaleString()}`, '']} contentStyle={chartStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {pieData.map(d => (
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

      {/* Category Bars */}
      {categoryBarData.length > 0 && (
        <motion.div variants={item} className="cyber-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Top Categories
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 10%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(220, 10%, 35%)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'hsl(220, 10%, 35%)', fontSize: 9 }} />
                <Tooltip contentStyle={chartStyle} formatter={(value: number) => [`${cs}${value.toLocaleString()}`, '']} />
                <Bar dataKey="value" fill="hsl(145, 85%, 45%)" stroke="hsl(220, 30%, 2%)" strokeWidth={1} radius={[2, 2, 0, 0]}>
                  {categoryBarData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const borderColor = insight.type === 'warning' ? 'border-destructive/20 bg-destructive/5'
    : insight.type === 'celebration' ? 'border-income/20 bg-income/5'
    : insight.type === 'projection' ? 'border-accent/20 bg-accent/5'
    : 'border-primary/20 bg-primary/5';

  return (
    <div className={`p-3 border rounded-sm ${borderColor}`}>
      <p className="text-[11px] font-semibold flex items-center gap-1.5">
        {insight.icon} {insight.title}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{insight.message}</p>
    </div>
  );
}
