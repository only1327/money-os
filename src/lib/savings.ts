import { isThisMonth } from 'date-fns';
import { type Transaction, type Budget, getBudgets, getCurrencySymbol } from './storage';

// ── Types ──────────────────────────────────────────────────────────────

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  savedAmount: number;
  priority: number; // 1 = highest
  createdAt: string;
}

export interface SurplusDistribution {
  buffer: number;    // 20%
  goals: number;     // 60%
  flex: number;      // 20%
}

export interface SavingsAnalysis {
  totalIncome: number;
  totalSpent: number;
  totalBudget: number;
  surplus: number;
  isDeficit: boolean;
  burnRate: number;          // per day
  daysUntilBroke: number | null;
  projectedMonthEnd: number;
  distribution: SurplusDistribution;
  riskLevel: 'safe' | 'caution' | 'danger';
  savingsRate: number;       // percentage
  yearlyProjection: number;
}

export interface SavingsAlert {
  type: 'danger' | 'warning' | 'success' | 'info';
  icon: string;
  title: string;
  message: string;
}

// ── Storage ────────────────────────────────────────────────────────────

const GOALS_KEY = 'moneyos_savings_goals';
const AUTO_SAVE_KEY = 'moneyos_auto_savings';

export function getSavingsGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveSavingsGoals(goals: SavingsGoal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export function addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'savedAmount'>): SavingsGoal {
  const newGoal: SavingsGoal = {
    ...goal,
    id: crypto.randomUUID(),
    savedAmount: 0,
    createdAt: new Date().toISOString(),
  };
  const goals = getSavingsGoals();
  goals.push(newGoal);
  saveSavingsGoals(goals);
  return newGoal;
}

export function updateGoalSavings(goalId: string, amount: number) {
  const goals = getSavingsGoals();
  const goal = goals.find(g => g.id === goalId);
  if (goal) {
    goal.savedAmount = Math.max(0, goal.savedAmount + amount);
    saveSavingsGoals(goals);
  }
}

export function deleteSavingsGoal(goalId: string) {
  saveSavingsGoals(getSavingsGoals().filter(g => g.id !== goalId));
}

export function getAutoSaveTotal(): number {
  try {
    return parseFloat(localStorage.getItem(AUTO_SAVE_KEY) || '0');
  } catch { return 0; }
}

export function addAutoSave(amount: number) {
  const current = getAutoSaveTotal();
  localStorage.setItem(AUTO_SAVE_KEY, String(current + amount));
}

// ── GOAL ICONS ─────────────────────────────────────────────────────────

export const GOAL_ICONS = [
  { icon: '🏠', label: 'House' },
  { icon: '🚗', label: 'Car' },
  { icon: '✈️', label: 'Travel' },
  { icon: '📱', label: 'Gadget' },
  { icon: '🎓', label: 'Education' },
  { icon: '💍', label: 'Wedding' },
  { icon: '🏥', label: 'Health' },
  { icon: '🎯', label: 'General' },
  { icon: '🛡️', label: 'Emergency' },
  { icon: '📈', label: 'Investment' },
];

// ── Smart Savings Engine ───────────────────────────────────────────────

export function analyzeSavings(transactions: Transaction[]): SavingsAnalysis {
  const monthTxs = transactions.filter(t => isThisMonth(new Date(t.date)));
  const expenses = monthTxs.filter(t => t.type === 'expense');
  const income = monthTxs.filter(t => t.type === 'income');

  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
  const budgets = getBudgets();
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const surplus = totalIncome - totalSpent;
  const isDeficit = surplus < 0;

  // Burn rate
  const dayOfMonth = new Date().getDate();
  const burnRate = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - dayOfMonth;

  // Days until income runs out at current rate
  const remaining = totalIncome - totalSpent;
  const daysUntilBroke = burnRate > 0 && remaining > 0 ? Math.floor(remaining / burnRate) : null;

  // Projected month-end spending
  const projectedMonthEnd = burnRate * daysInMonth;

  // Surplus distribution (20/60/20)
  const positiveSurplus = Math.max(0, surplus);
  const distribution: SurplusDistribution = {
    buffer: positiveSurplus * 0.2,
    goals: positiveSurplus * 0.6,
    flex: positiveSurplus * 0.2,
  };

  // Risk assessment
  let riskLevel: 'safe' | 'caution' | 'danger' = 'safe';
  if (isDeficit) {
    riskLevel = 'danger';
  } else if (totalBudget > 0 && projectedMonthEnd > totalBudget) {
    riskLevel = 'caution';
  } else if (totalIncome > 0 && surplus / totalIncome < 0.1) {
    riskLevel = 'caution';
  }

  const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;
  const yearlyProjection = Math.max(0, surplus) * 12;

  return {
    totalIncome, totalSpent, totalBudget, surplus, isDeficit,
    burnRate, daysUntilBroke, projectedMonthEnd, distribution,
    riskLevel, savingsRate, yearlyProjection,
  };
}

// ── Alerts Generator ───────────────────────────────────────────────────

export function generateSavingsAlerts(analysis: SavingsAnalysis): SavingsAlert[] {
  const alerts: SavingsAlert[] = [];
  const cs = getCurrencySymbol();

  if (analysis.isDeficit) {
    alerts.push({
      type: 'danger',
      icon: '🚨',
      title: 'DEFICIT ALERT',
      message: `You're spending ${cs}${Math.abs(analysis.surplus).toLocaleString()} more than you earn! Saving is paused until you reduce expenses.`,
    });
  }

  if (analysis.riskLevel === 'caution' && !analysis.isDeficit) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      title: 'OVER-BUDGET TRAJECTORY',
      message: `At ${cs}${Math.round(analysis.burnRate).toLocaleString()}/day burn rate, you'll hit ${cs}${Math.round(analysis.projectedMonthEnd).toLocaleString()} this month.`,
    });
  }

  if (analysis.daysUntilBroke !== null && analysis.daysUntilBroke < 10 && !analysis.isDeficit) {
    alerts.push({
      type: 'warning',
      icon: '⏳',
      title: 'FUNDS RUNNING LOW',
      message: `At current pace, funds last ~${analysis.daysUntilBroke} more days.`,
    });
  }

  if (analysis.savingsRate > 30) {
    alerts.push({
      type: 'success',
      icon: '🏆',
      title: 'ELITE SAVINGS',
      message: `${Math.round(analysis.savingsRate)}% savings rate! Yearly projection: ${cs}${analysis.yearlyProjection.toLocaleString()}.`,
    });
  } else if (analysis.savingsRate > 15) {
    alerts.push({
      type: 'info',
      icon: '💪',
      title: 'SOLID PROGRESS',
      message: `${Math.round(analysis.savingsRate)}% savings rate. Push to 30% for elite status!`,
    });
  }

  if (!analysis.isDeficit && analysis.surplus > 0) {
    alerts.push({
      type: 'info',
      icon: '💰',
      title: 'SURPLUS AVAILABLE',
      message: `${cs}${Math.round(analysis.surplus).toLocaleString()} surplus → Buffer: ${cs}${Math.round(analysis.distribution.buffer).toLocaleString()} | Goals: ${cs}${Math.round(analysis.distribution.goals).toLocaleString()} | Flex: ${cs}${Math.round(analysis.distribution.flex).toLocaleString()}`,
    });
  }

  return alerts;
}

// ── Auto-distribute surplus to goals ───────────────────────────────────

export function distributeToGoals(goalsAmount: number): { goalId: string; amount: number }[] {
  const goals = getSavingsGoals()
    .filter(g => g.savedAmount < g.targetAmount)
    .sort((a, b) => a.priority - b.priority);

  if (goals.length === 0 || goalsAmount <= 0) return [];

  const allocations: { goalId: string; amount: number }[] = [];
  let remaining = goalsAmount;

  for (const goal of goals) {
    if (remaining <= 0) break;
    const needed = goal.targetAmount - goal.savedAmount;
    const alloc = Math.min(remaining, needed);
    allocations.push({ goalId: goal.id, amount: alloc });
    remaining -= alloc;
  }

  return allocations;
}
