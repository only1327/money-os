import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PiggyBank, TrendingUp, TrendingDown, AlertTriangle, Flame,
  Plus, Trash2, Target, ArrowRight, Shield, Zap, ChevronDown, ChevronUp,
} from 'lucide-react';
import { type Transaction, getCurrencySymbol } from '@/lib/storage';
import {
  analyzeSavings, generateSavingsAlerts, getSavingsGoals, addSavingsGoal,
  deleteSavingsGoal, updateGoalSavings, distributeToGoals, saveSavingsGoals,
  getAutoSaveTotal, GOAL_ICONS,
  type SavingsGoal, type SavingsAlert,
} from '@/lib/savings';

interface SavingsViewProps {
  transactions: Transaction[];
}

export default function SavingsView({ transactions }: SavingsViewProps) {
  const cs = getCurrencySymbol();
  const [goals, setGoals] = useState<SavingsGoal[]>(getSavingsGoals());
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newIcon, setNewIcon] = useState('🎯');
  const [showDistribution, setShowDistribution] = useState(false);

  const analysis = useMemo(() => analyzeSavings(transactions), [transactions]);
  const alerts = useMemo(() => generateSavingsAlerts(analysis), [analysis]);
  const autoSaved = getAutoSaveTotal();
  const totalGoalsSaved = goals.reduce((s, g) => s + g.savedAmount, 0);

  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } };

  const handleAddGoal = () => {
    if (!newName || !newTarget || parseFloat(newTarget) <= 0) return;
    const goal = addSavingsGoal({
      name: newName,
      icon: newIcon,
      targetAmount: parseFloat(newTarget),
      priority: goals.length + 1,
    });
    setGoals([...goals, goal]);
    setNewName('');
    setNewTarget('');
    setNewIcon('🎯');
    setShowAddGoal(false);
  };

  const handleDeleteGoal = (id: string) => {
    deleteSavingsGoal(id);
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleAutoDistribute = () => {
    if (analysis.distribution.goals <= 0) return;
    const allocations = distributeToGoals(analysis.distribution.goals);
    allocations.forEach(a => updateGoalSavings(a.goalId, a.amount));
    setGoals(getSavingsGoals());
  };

  const riskColor = analysis.riskLevel === 'danger' ? 'text-destructive' :
    analysis.riskLevel === 'caution' ? 'text-warning' : 'text-income';
  const riskBorder = analysis.riskLevel === 'danger' ? 'border-destructive' :
    analysis.riskLevel === 'caution' ? 'border-accent' : 'border-primary';

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.05 }} className="space-y-4 pb-28">

      {/* ── Surplus / Deficit Hero Card ─────────────────────── */}
      <motion.div variants={item} className={`p-5 brutal-card stripe-bg`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Monthly Surplus</p>
          <span className={`badge-brutal ${riskColor}`}>
            {analysis.riskLevel === 'danger' ? '🚨 DEFICIT' : analysis.riskLevel === 'caution' ? '⚠️ CAUTION' : '✅ SAFE'}
          </span>
        </div>
        <p className={`text-4xl font-bold text-mono mt-2 ${analysis.isDeficit ? 'text-destructive' : 'text-gradient-primary'}`}>
          {analysis.isDeficit ? '-' : '+'}{cs}{Math.abs(analysis.surplus).toLocaleString('en-US', { minimumFractionDigits: 0 })}
        </p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 flex-1 bg-income/5 border-2 border-income/30 p-2.5">
            <TrendingUp className="w-4 h-4 text-income" strokeWidth={3} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Income</p>
              <p className="text-sm font-bold text-mono text-income">{cs}{analysis.totalIncome.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 bg-expense/5 border-2 border-expense/30 p-2.5">
            <TrendingDown className="w-4 h-4 text-expense" strokeWidth={3} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Spent</p>
              <p className="text-sm font-bold text-mono text-expense">{cs}{analysis.totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Smart Engine Stats ──────────────────────────────── */}
      <motion.div variants={item} className={`brutal-card-muted p-5`}>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" strokeWidth={3} /> Smart Engine
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="border-2 border-muted-foreground/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Burn Rate</p>
            <p className="text-lg font-bold text-mono">{cs}{Math.round(analysis.burnRate).toLocaleString()}<span className="text-xs text-muted-foreground">/day</span></p>
          </div>
          <div className="border-2 border-muted-foreground/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Projected</p>
            <p className="text-lg font-bold text-mono">{cs}{Math.round(analysis.projectedMonthEnd).toLocaleString()}</p>
          </div>
          <div className="border-2 border-muted-foreground/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Savings Rate</p>
            <p className={`text-lg font-bold text-mono ${analysis.savingsRate > 20 ? 'text-income' : analysis.savingsRate > 0 ? 'text-accent' : 'text-destructive'}`}>
              {Math.round(analysis.savingsRate)}%
            </p>
          </div>
          <div className="border-2 border-muted-foreground/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Yearly Save</p>
            <p className="text-lg font-bold text-mono text-income">{cs}{analysis.yearlyProjection.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Alerts ──────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <motion.div variants={item} className="space-y-2">
          {alerts.map((alert, i) => (
            <AlertCard key={i} alert={alert} />
          ))}
        </motion.div>
      )}

      {/* ── Surplus Distribution (20/60/20) ─────────────────── */}
      {!analysis.isDeficit && analysis.surplus > 0 && (
        <motion.div variants={item} className="brutal-card p-5">
          <button
            onClick={() => setShowDistribution(!showDistribution)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <PiggyBank className="w-3.5 h-3.5" strokeWidth={3} /> Surplus Distribution
            </h3>
            {showDistribution ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showDistribution && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3">
                  {/* Visual bar */}
                  <div className="h-6 flex overflow-hidden border-3 border-muted-foreground/30">
                    <div className="bg-primary/60 flex items-center justify-center" style={{ width: '20%' }}>
                      <span className="text-[8px] font-bold text-primary-foreground">20%</span>
                    </div>
                    <div className="bg-accent/60 flex items-center justify-center" style={{ width: '60%' }}>
                      <span className="text-[8px] font-bold text-accent-foreground">60%</span>
                    </div>
                    <div className="bg-chart-4/60 flex items-center justify-center" style={{ width: '20%' }}>
                      <span className="text-[8px] font-bold">20%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border-2 border-primary/30 p-2 bg-primary/5">
                      <Shield className="w-4 h-4 mx-auto text-primary mb-1" strokeWidth={3} />
                      <p className="text-[9px] font-bold uppercase text-muted-foreground">Buffer</p>
                      <p className="text-sm font-bold text-mono text-primary">{cs}{Math.round(analysis.distribution.buffer).toLocaleString()}</p>
                    </div>
                    <div className="border-2 border-accent/30 p-2 bg-accent/5">
                      <Target className="w-4 h-4 mx-auto text-accent mb-1" strokeWidth={3} />
                      <p className="text-[9px] font-bold uppercase text-muted-foreground">Goals</p>
                      <p className="text-sm font-bold text-mono text-accent">{cs}{Math.round(analysis.distribution.goals).toLocaleString()}</p>
                    </div>
                    <div className="border-2 border-chart-4/30 p-2 bg-chart-4/5">
                      <Flame className="w-4 h-4 mx-auto text-chart-4 mb-1" strokeWidth={3} />
                      <p className="text-[9px] font-bold uppercase text-muted-foreground">Flex</p>
                      <p className="text-sm font-bold text-mono text-chart-4">{cs}{Math.round(analysis.distribution.flex).toLocaleString()}</p>
                    </div>
                  </div>

                  {goals.length > 0 && analysis.distribution.goals > 0 && (
                    <button
                      onClick={handleAutoDistribute}
                      className="w-full py-2.5 brutal-btn-primary text-xs"
                    >
                      AUTO-DISTRIBUTE TO GOALS
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Savings Goals ───────────────────────────────────── */}
      <motion.div variants={item} className="brutal-card-accent p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Target className="w-3.5 h-3.5" strokeWidth={3} /> Savings Goals
          </h3>
          <span className="text-xs font-bold text-mono text-accent">
            {cs}{totalGoalsSaved.toLocaleString()} saved
          </span>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-6">
            <PiggyBank className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" strokeWidth={3} />
            <p className="text-sm font-bold text-muted-foreground">NO GOALS SET</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add a goal to start saving</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.sort((a, b) => a.priority - b.priority).map(goal => {
              const pct = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
              const isComplete = pct >= 100;
              return (
                <div key={goal.id} className={`p-3 border-2 ${isComplete ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <span className="text-lg">{goal.icon}</span>
                      {goal.name}
                      {isComplete && <span className="badge-brutal text-primary text-[8px]">COMPLETE!</span>}
                    </span>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 hover:bg-destructive/20 transition-colors">
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="h-4 bg-muted border-2 border-muted-foreground/20 relative overflow-hidden mb-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 0.4 }}
                      className={`h-full ${isComplete ? 'bg-primary' : 'bg-gradient-to-r from-primary to-accent'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-mono text-muted-foreground">
                    <span>{cs}{goal.savedAmount.toLocaleString()} / {cs}{goal.targetAmount.toLocaleString()}</span>
                    <span className="font-bold">{Math.round(pct)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Goal */}
        {!showAddGoal ? (
          <button
            onClick={() => setShowAddGoal(true)}
            className="w-full mt-3 p-3 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-accent hover:border-accent transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Add Goal
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-4 border-2 border-accent space-y-3"
          >
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_ICONS.map(gi => (
                  <button
                    key={gi.icon}
                    onClick={() => setNewIcon(gi.icon)}
                    className={`w-9 h-9 text-lg flex items-center justify-center border-2 transition-all ${
                      newIcon === gi.icon ? 'border-accent bg-accent/20 shadow-[2px_2px_0px] shadow-accent' : 'border-muted-foreground/20'
                    }`}
                  >
                    {gi.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Goal Name</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g., New Car"
                className="w-full brutal-input p-2.5 text-sm font-semibold bg-transparent outline-none placeholder:text-muted-foreground/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Target Amount</label>
              <div className="brutal-input p-2.5 flex items-center gap-2">
                <span className="text-lg font-bold text-muted-foreground">{cs}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={newTarget}
                  onChange={e => setNewTarget(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-lg font-bold text-mono outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddGoal}
                disabled={!newName || !newTarget}
                className="flex-1 py-2.5 brutal-btn-primary text-xs disabled:opacity-30 disabled:pointer-events-none"
              >
                ADD GOAL
              </button>
              <button
                onClick={() => { setShowAddGoal(false); setNewName(''); setNewTarget(''); }}
                className="px-4 py-2.5 bg-secondary text-secondary-foreground text-xs font-bold border-2 border-muted-foreground/30"
              >
                CANCEL
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── Future Projection ───────────────────────────────── */}
      {!analysis.isDeficit && analysis.surplus > 0 && (
        <motion.div variants={item} className="brutal-card-muted p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={3} /> Savings Growth
          </h3>
          <div className="space-y-2">
            {[1, 3, 6, 12].map(months => (
              <div key={months} className="flex items-center justify-between py-2 border-b border-muted-foreground/10 last:border-0">
                <span className="text-xs font-semibold text-muted-foreground">{months} {months === 1 ? 'month' : 'months'}</span>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-primary" />
                  <span className="text-sm font-bold text-mono text-income">
                    {cs}{Math.round(analysis.surplus * months).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function AlertCard({ alert }: { alert: SavingsAlert }) {
  const borderClass = alert.type === 'danger' ? 'brutal-card-danger' :
    alert.type === 'warning' ? 'brutal-card-accent' :
    alert.type === 'success' ? 'brutal-card' : 'brutal-card-muted';

  return (
    <div className={`${borderClass} p-3 flex items-start gap-3`}>
      <span className="text-lg shrink-0">{alert.icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider">{alert.title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
      </div>
    </div>
  );
}
