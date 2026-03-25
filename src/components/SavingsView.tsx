import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PiggyBank, TrendingUp, TrendingDown, AlertTriangle,
  Plus, Trash2, Target, ArrowRight, Shield, Zap, Flame,
  ChevronDown, ChevronUp, Trophy, Star,
} from 'lucide-react';
import { type Transaction, getCurrencySymbol } from '@/lib/storage';
import {
  analyzeSavings, generateSavingsAlerts, getSavingsGoals, addSavingsGoal,
  deleteSavingsGoal, updateGoalSavings, distributeToGoals,
  getAutoSaveTotal, GOAL_ICONS,
  type SavingsGoal, type SavingsAlert,
} from '@/lib/savings';
import {
  getGamificationState, getLevelForXP, getXPProgress, getNextLevel,
  getDailyMissions, getWeeklyMissions, ACHIEVEMENTS, LEVELS, GAME_MODES,
  type GamificationState, type Mission,
} from '@/lib/gamification';
import { getTransactions } from '@/lib/storage';

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
  const [showGamification, setShowGamification] = useState(false);

  const analysis = useMemo(() => analyzeSavings(transactions), [transactions]);
  const alerts = useMemo(() => generateSavingsAlerts(analysis), [analysis]);
  const totalGoalsSaved = goals.reduce((s, g) => s + g.savedAmount, 0);

  // Gamification
  const gamState = useMemo(() => getGamificationState(), []);
  const level = getLevelForXP(gamState.xp);
  const progress = getXPProgress(gamState.xp);
  const nextLevel = getNextLevel(level.level);
  const txs = useMemo(() => getTransactions(), []);
  const dailyMissions = useMemo(() => getDailyMissions(), []);

  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

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

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.04 }} className="space-y-3 pb-28">

      {/* ── Surplus Hero ──────────────────────────────────── */}
      <motion.div variants={item} className="cyber-card-glow p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Monthly Surplus</p>
          <span className={`badge-cyber ${riskColor}`}>
            {analysis.riskLevel === 'danger' ? '🚨 DEFICIT' : analysis.riskLevel === 'caution' ? '⚠️ CAUTION' : '✅ SAFE'}
          </span>
        </div>
        <p className={`text-4xl font-bold text-mono mt-1 ${analysis.isDeficit ? 'text-destructive' : 'text-primary glow-text'}`}>
          {analysis.isDeficit ? '-' : '+'}{cs}{Math.abs(analysis.surplus).toLocaleString('en-US', { minimumFractionDigits: 0 })}
        </p>
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-2 flex-1 bg-income/5 border border-income/20 p-2.5 rounded-sm">
            <TrendingUp className="w-4 h-4 text-income" strokeWidth={2} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Income</p>
              <p className="text-sm font-bold text-mono text-income">{cs}{analysis.totalIncome.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 bg-expense/5 border border-expense/20 p-2.5 rounded-sm">
            <TrendingDown className="w-4 h-4 text-expense" strokeWidth={2} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Spent</p>
              <p className="text-sm font-bold text-mono text-expense">{cs}{analysis.totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Smart Engine ──────────────────────────────────── */}
      <motion.div variants={item} className="cyber-card p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-primary" /> Smart Engine
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Burn Rate', value: `${cs}${Math.round(analysis.burnRate).toLocaleString()}`, sub: '/day' },
            { label: 'Projected', value: `${cs}${Math.round(analysis.projectedMonthEnd).toLocaleString()}`, sub: '' },
            { label: 'Save Rate', value: `${Math.round(analysis.savingsRate)}%`, sub: '', color: analysis.savingsRate > 20 ? 'text-income' : analysis.savingsRate > 0 ? 'text-accent' : 'text-destructive' },
            { label: 'Yearly', value: `${cs}${analysis.yearlyProjection.toLocaleString()}`, sub: '', color: 'text-income' },
          ].map(s => (
            <div key={s.label} className="bg-secondary/50 border border-border rounded-sm p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className={`text-base font-bold text-mono ${s.color || ''}`}>{s.value}<span className="text-[10px] text-muted-foreground">{s.sub}</span></p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Alerts ────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <motion.div variants={item} className="space-y-2">
          {alerts.slice(0, 3).map((alert, i) => (
            <div key={i} className={`cyber-card p-3 border-l-2 ${
              alert.type === 'danger' ? 'border-l-destructive' :
              alert.type === 'warning' ? 'border-l-warning' :
              alert.type === 'success' ? 'border-l-income' : 'border-l-primary'
            }`}>
              <p className="text-[11px] font-semibold">{alert.icon} {alert.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{alert.message}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Surplus Distribution ──────────────────────────── */}
      {!analysis.isDeficit && analysis.surplus > 0 && (
        <motion.div variants={item} className="cyber-card p-4">
          <button onClick={() => setShowDistribution(!showDistribution)} className="w-full flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1.5">
              <PiggyBank className="w-3 h-3" /> 20/60/20 Distribution
            </h3>
            {showDistribution ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showDistribution && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 space-y-3">
                  <div className="h-4 flex overflow-hidden rounded-full border border-border">
                    <div className="bg-primary/40" style={{ width: '20%' }} />
                    <div className="bg-accent/40" style={{ width: '60%' }} />
                    <div className="bg-chart-4/40" style={{ width: '20%' }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-primary/5 border border-primary/15 p-2 rounded-sm">
                      <Shield className="w-3.5 h-3.5 mx-auto text-primary mb-1" />
                      <p className="text-[8px] font-bold uppercase text-muted-foreground">Buffer</p>
                      <p className="text-xs font-bold text-mono text-primary">{cs}{Math.round(analysis.distribution.buffer).toLocaleString()}</p>
                    </div>
                    <div className="bg-accent/5 border border-accent/15 p-2 rounded-sm">
                      <Target className="w-3.5 h-3.5 mx-auto text-accent mb-1" />
                      <p className="text-[8px] font-bold uppercase text-muted-foreground">Goals</p>
                      <p className="text-xs font-bold text-mono text-accent">{cs}{Math.round(analysis.distribution.goals).toLocaleString()}</p>
                    </div>
                    <div className="bg-chart-4/5 border border-chart-4/15 p-2 rounded-sm">
                      <Flame className="w-3.5 h-3.5 mx-auto text-chart-4 mb-1" />
                      <p className="text-[8px] font-bold uppercase text-muted-foreground">Flex</p>
                      <p className="text-xs font-bold text-mono text-chart-4">{cs}{Math.round(analysis.distribution.flex).toLocaleString()}</p>
                    </div>
                  </div>
                  {goals.length > 0 && analysis.distribution.goals > 0 && (
                    <button onClick={handleAutoDistribute} className="w-full py-2.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-sm">
                      Auto-Distribute to Goals
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Goals ─────────────────────────────────────────── */}
      <motion.div variants={item} className="cyber-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Savings Goals
          </h3>
          <span className="text-[10px] font-bold text-mono text-accent">{cs}{totalGoalsSaved.toLocaleString()}</span>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-6">
            <PiggyBank className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-xs font-medium text-muted-foreground/50">No goals yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {goals.sort((a, b) => a.priority - b.priority).map(goal => {
              const pct = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
              const isComplete = pct >= 100;
              return (
                <div key={goal.id} className={`p-3 rounded-sm border ${isComplete ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium flex items-center gap-1.5">
                      <span className="text-sm">{goal.icon}</span>
                      {goal.name}
                      {isComplete && <span className="badge-cyber text-primary text-[7px]">DONE</span>}
                    </span>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 hover:bg-destructive/10 rounded-sm transition-colors">
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 0.4 }}
                      className={`h-full rounded-full ${isComplete ? 'bg-primary' : 'bg-gradient-to-r from-primary to-accent'}`}
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

        {!showAddGoal ? (
          <button
            onClick={() => setShowAddGoal(true)}
            className="w-full mt-3 p-3 border border-dashed border-muted-foreground/20 rounded-sm flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Goal
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-4 border border-accent/30 rounded-sm space-y-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Icon</label>
              <div className="flex flex-wrap gap-1">
                {GOAL_ICONS.map(gi => (
                  <button
                    key={gi.icon}
                    onClick={() => setNewIcon(gi.icon)}
                    className={`w-8 h-8 text-sm flex items-center justify-center rounded-sm transition-all ${
                      newIcon === gi.icon ? 'bg-accent/20 border border-accent' : 'border border-border hover:border-accent/30'
                    }`}
                  >
                    {gi.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., New Car"
                className="w-full cyber-input p-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground/20 rounded-sm" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Target</label>
              <div className="cyber-input p-2.5 flex items-center gap-2 rounded-sm">
                <span className="text-base font-bold text-muted-foreground">{cs}</span>
                <input type="number" inputMode="decimal" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="0"
                  className="flex-1 bg-transparent text-base font-bold text-mono outline-none placeholder:text-muted-foreground/20" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddGoal} disabled={!newName || !newTarget}
                className="flex-1 py-2.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-sm disabled:opacity-30">
                Add Goal
              </button>
              <button onClick={() => { setShowAddGoal(false); setNewName(''); setNewTarget(''); }}
                className="px-4 py-2.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-sm border border-border">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── Growth Projection ─────────────────────────────── */}
      {!analysis.isDeficit && analysis.surplus > 0 && (
        <motion.div variants={item} className="cyber-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Growth Projection
          </h3>
          <div className="space-y-1.5">
            {[1, 3, 6, 12].map(months => (
              <div key={months} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-[11px] text-muted-foreground">{months} {months === 1 ? 'month' : 'months'}</span>
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-primary" />
                  <span className="text-xs font-bold text-mono text-income">{cs}{Math.round(analysis.surplus * months).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Gamification (collapsible) ────────────────────── */}
      <motion.div variants={item} className="cyber-card p-4">
        <button onClick={() => setShowGamification(!showGamification)} className="w-full flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-accent" /> Level {level.level} • {level.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-mono text-accent">{gamState.xp} XP</span>
            {showGamification ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </button>

        {/* XP Bar (always visible) */}
        {nextLevel && (
          <div className="mt-2">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full" />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
              <span>{progress.current}/{progress.next} XP</span>
              <span>→ Lv.{nextLevel.level}</span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showGamification && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 space-y-3">
                {/* Streak */}
                <div className="flex items-center justify-between bg-secondary/50 border border-border rounded-sm p-3">
                  <div className="flex items-center gap-2">
                    <Flame className={`w-5 h-5 ${gamState.streak > 0 ? 'text-accent' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-[9px] font-bold uppercase text-muted-foreground">Streak</p>
                      <p className="text-lg font-bold text-mono">{gamState.streak} <span className="text-xs text-muted-foreground">days</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground">Best</p>
                    <p className="text-sm font-bold text-mono text-muted-foreground">{gamState.longestStreak}</p>
                  </div>
                </div>

                {/* Daily Missions */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Daily Missions</p>
                  <div className="space-y-1.5">
                    {dailyMissions.map(m => {
                      const completed = gamState.completedMissions.includes(m.id) || m.check(txs);
                      return (
                        <div key={m.id} className={`flex items-center gap-2.5 p-2.5 rounded-sm border ${completed ? 'border-primary/20 bg-primary/5 opacity-60' : 'border-border'}`}>
                          <span className="text-sm">{m.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate">{m.title}</p>
                          </div>
                          <span className={`text-[9px] font-bold ${completed ? 'text-primary' : 'text-accent'}`}>
                            {completed ? '✓' : `+${m.xpReward}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Achievements */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Achievements</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ACHIEVEMENTS.slice(0, 8).map(a => {
                      const unlocked = gamState.achievements.includes(a.id);
                      return (
                        <div key={a.id} className={`p-2 rounded-sm border text-center ${unlocked ? 'border-primary/20 bg-primary/5' : 'border-border opacity-30'}`}>
                          <span className="text-lg">{a.icon}</span>
                          <p className="text-[8px] font-medium mt-0.5 truncate">{a.title}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
