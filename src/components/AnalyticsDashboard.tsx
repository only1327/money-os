import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Transaction, CATEGORY_ICONS, CHART_COLORS, getCurrencySymbol } from '@/lib/storage';
import { generateInsights } from '@/lib/gamification';
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

  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } };

  const chartStyle = {
    background: 'hsl(220, 20%, 7%)',
    border: '2px solid hsl(145, 85%, 45%)',
    boxShadow: '3px 3px 0px hsl(145, 85%, 45%)',
    fontFamily: 'Space Mono, monospace',
    fontSize: '11px',
    color: 'hsl(60, 10%, 92%)',
  };

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.05 }} className="space-y-4 pb-28">
      {/* Time Filter */}
      <motion.div variants={item} className="flex gap-1.5">
        {(['7d', '30d', '3m', '1y', 'all'] as TimeFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setTimeFilter(f)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border-2 ${
              timeFilter === f
                ? 'bg-primary text-primary-foreground border-primary-foreground shadow-[2px_2px_0px] shadow-primary-foreground'
                : 'bg-secondary text-secondary-foreground border-muted-foreground/20'
            }`}
          >
            {f}
          </button>
        ))}
      </motion.div>

      {/* Summary */}
      <motion.div variants={item} className="brutal-card p-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="border-2 border-income/30 p-2 bg-income/5 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Income</p>
            <p className="text-sm font-bold text-mono text-income">{cs}{stats.income.toLocaleString()}</p>
          </div>
          <div className="border-2 border-expense/30 p-2 bg-expense/5 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Expenses</p>
            <p className="text-sm font-bold text-mono text-expense">{cs}{stats.expenses.toLocaleString()}</p>
          </div>
          <div className={`border-2 p-2 text-center ${stats.net >= 0 ? 'border-income/30 bg-income/5' : 'border-expense/30 bg-expense/5'}`}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Net</p>
            <p className={`text-sm font-bold text-mono ${stats.net >= 0 ? 'text-income' : 'text-expense'}`}>
              {stats.net >= 0 ? '+' : '-'}{cs}{Math.abs(stats.net).toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div variants={item} className="brutal-card-accent p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" strokeWidth={3} /> AI Coach Insights
          </h3>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`p-3 border-2 ${
                  insight.type === 'warning' ? 'border-destructive/50 bg-destructive/5'
                  : insight.type === 'celebration' ? 'border-income/50 bg-income/5'
                  : insight.type === 'projection' ? 'border-accent/50 bg-accent/5'
                  : 'border-primary/50 bg-primary/5'
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-2">
                  {insight.icon} {insight.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{insight.message}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Income vs Expenses Trend */}
      {trendData.length > 0 && (
        <motion.div variants={item} className="brutal-card p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" strokeWidth={3} /> Income vs Expenses
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 15%)" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 9 }} />
                <Tooltip contentStyle={chartStyle} formatter={(value: number) => [`${cs}${value.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="income" stroke="hsl(145, 85%, 45%)" fill="hsl(145, 85%, 45%)" fillOpacity={0.2} strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="hsl(0, 75%, 50%)" fill="hsl(0, 75%, 50%)" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Spending Pie */}
      {pieData.length > 0 && (
        <motion.div variants={item} className="brutal-card-accent p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Spending Breakdown
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value" stroke="hsl(220, 25%, 3%)" strokeWidth={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${cs}${value.toLocaleString()}`, '']} contentStyle={chartStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 shrink-0 border border-foreground/20" style={{ background: d.color }} />
                  <span className="truncate font-medium">{CATEGORY_ICONS[d.name]} {d.name}</span>
                  <span className="ml-auto text-mono text-muted-foreground">{cs}{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Bar Chart */}
      {categoryBarData.length > 0 && (
        <motion.div variants={item} className="brutal-card p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Top Categories
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 15%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 9 }} />
                <Tooltip contentStyle={chartStyle} formatter={(value: number) => [`${cs}${value.toLocaleString()}`, '']} />
                <Bar dataKey="value" fill="hsl(145, 85%, 45%)" stroke="hsl(220, 25%, 3%)" strokeWidth={2}>
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
