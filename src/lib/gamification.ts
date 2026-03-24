import { getTransactions, getBudgets, type Transaction } from './storage';
import { isThisMonth, isToday, differenceInCalendarDays, startOfDay, subDays } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  achievements: string[];
  completedMissions: string[];
  gameMode: 'aggressive' | 'balanced' | 'chill';
}

export interface Level {
  level: number;
  title: string;
  icon: string;
  xpRequired: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  xpReward: number;
  icon: string;
  check: (txs: Transaction[]) => boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (txs: Transaction[], state: GamificationState) => boolean;
}

export interface AIInsight {
  type: 'warning' | 'tip' | 'celebration' | 'projection';
  icon: string;
  title: string;
  message: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const GAMIFICATION_KEY = 'moneyos_gamification';

export const LEVELS: Level[] = [
  { level: 1, title: 'Beginner', icon: '🌱', xpRequired: 0 },
  { level: 2, title: 'Saver', icon: '💪', xpRequired: 100 },
  { level: 3, title: 'Controller', icon: '🎯', xpRequired: 300 },
  { level: 4, title: 'Wealth Builder', icon: '🏗️', xpRequired: 600 },
  { level: 5, title: 'Money Master', icon: '👑', xpRequired: 1000 },
  { level: 6, title: 'Elite Investor', icon: '💎', xpRequired: 1500 },
];

export const XP_ACTIONS = {
  LOG_EXPENSE: 5,
  LOG_INCOME: 5,
  SAVE_MONEY: 10,
  COMPLETE_MISSION: 20,
  UNDER_BUDGET: 30,
  STREAK_7: 50,
  STREAK_30: 200,
} as const;

const defaultState: GamificationState = {
  xp: 0,
  level: 1,
  streak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  achievements: [],
  completedMissions: [],
  gameMode: 'balanced',
};

// ── Storage ────────────────────────────────────────────────────────────

export function getGamificationState(): GamificationState {
  try {
    const raw = localStorage.getItem(GAMIFICATION_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
  } catch { return { ...defaultState }; }
}

export function saveGamificationState(state: GamificationState) {
  localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(state));
}

// ── Level Calculation ──────────────────────────────────────────────────

export function getLevelForXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(currentLevel: number): Level | null {
  return LEVELS.find(l => l.level === currentLevel + 1) || null;
}

export function getXPProgress(xp: number): { current: number; next: number; pct: number } {
  const level = getLevelForXP(xp);
  const next = getNextLevel(level.level);
  if (!next) return { current: xp, next: xp, pct: 100 };
  const progress = xp - level.xpRequired;
  const needed = next.xpRequired - level.xpRequired;
  return { current: progress, next: needed, pct: Math.min((progress / needed) * 100, 100) };
}

// ── Streak ─────────────────────────────────────────────────────────────

export function updateStreak(): { state: GamificationState; streakBroken: boolean; bonusXP: number } {
  const state = getGamificationState();
  const today = startOfDay(new Date()).toISOString();
  let bonusXP = 0;
  let streakBroken = false;

  if (state.lastActiveDate) {
    const lastActive = startOfDay(new Date(state.lastActiveDate));
    const diff = differenceInCalendarDays(new Date(), lastActive);
    
    if (diff === 0) {
      return { state, streakBroken: false, bonusXP: 0 };
    } else if (diff === 1) {
      state.streak += 1;
      if (state.streak === 7) bonusXP = XP_ACTIONS.STREAK_7;
      if (state.streak === 30) bonusXP = XP_ACTIONS.STREAK_30;
    } else {
      streakBroken = state.streak > 0;
      state.streak = 1;
    }
  } else {
    state.streak = 1;
  }

  state.lastActiveDate = today;
  if (state.streak > state.longestStreak) state.longestStreak = state.streak;
  if (bonusXP > 0) state.xp += bonusXP;
  state.level = getLevelForXP(state.xp).level;
  saveGamificationState(state);
  return { state, streakBroken, bonusXP };
}

// ── Award XP ───────────────────────────────────────────────────────────

export function awardXP(amount: number, reason?: string): { state: GamificationState; leveledUp: boolean; newLevel?: Level } {
  const state = getGamificationState();
  const oldLevel = state.level;
  state.xp += amount;
  const newLevelObj = getLevelForXP(state.xp);
  state.level = newLevelObj.level;
  saveGamificationState(state);
  const leveledUp = newLevelObj.level > oldLevel;
  return { state, leveledUp, newLevel: leveledUp ? newLevelObj : undefined };
}

// ── Missions ───────────────────────────────────────────────────────────

export function getDailyMissions(): Mission[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: `save100_${today}`,
      title: 'Save $100 Today',
      description: 'Keep your expenses under $100',
      type: 'daily',
      xpReward: 20,
      icon: '💰',
      check: (txs) => {
        const todayExpenses = txs.filter(t => t.type === 'expense' && t.date === today);
        return todayExpenses.reduce((s, t) => s + t.amount, 0) < 100;
      },
    },
    {
      id: `no_food_delivery_${today}`,
      title: 'No Food Delivery',
      description: 'Avoid food delivery expenses today',
      type: 'daily',
      xpReward: 15,
      icon: '🚫',
      check: (txs) => {
        const todayFood = txs.filter(t => t.type === 'expense' && t.date === today && t.category === 'Food');
        return todayFood.length === 0;
      },
    },
    {
      id: `log_all_${today}`,
      title: 'Track Everything',
      description: 'Log at least 3 transactions today',
      type: 'daily',
      xpReward: 10,
      icon: '📝',
      check: (txs) => {
        return txs.filter(t => t.date === today).length >= 3;
      },
    },
  ];
}

export function getWeeklyMissions(): Mission[] {
  const weekId = `w${Math.floor(Date.now() / (7 * 86400000))}`;
  return [
    {
      id: `reduce_food_${weekId}`,
      title: 'Cut Food Spending 20%',
      description: 'Reduce food category by 20% vs last week',
      type: 'weekly',
      xpReward: 40,
      icon: '🥗',
      check: () => false, // Simplified check
    },
    {
      id: `under_budget_${weekId}`,
      title: 'Stay Under Budget',
      description: 'Keep all categories under their budget limits',
      type: 'weekly',
      xpReward: 50,
      icon: '🎯',
      check: (txs) => {
        const budgets = getBudgets();
        if (budgets.length === 0) return false;
        const monthExpenses = txs.filter(t => t.type === 'expense' && isThisMonth(new Date(t.date)));
        return budgets.every(b => {
          const spent = monthExpenses.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
          return spent <= b.limit;
        });
      },
    },
  ];
}

// ── Achievements ───────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_1000',
    title: 'First $1,000 Saved',
    description: 'Your total income exceeded $1,000',
    icon: '🏆',
    check: (txs) => txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) >= 1000,
  },
  {
    id: 'streak_7',
    title: '7-Day Streak',
    description: 'Used the app 7 days in a row',
    icon: '🔥',
    check: (_, state) => state.longestStreak >= 7,
  },
  {
    id: 'no_spend_day',
    title: 'No-Spend Day',
    description: 'Went a full day without spending',
    icon: '🧘',
    check: (txs) => {
      const yesterday = subDays(new Date(), 1).toISOString().split('T')[0];
      return txs.filter(t => t.type === 'expense' && t.date === yesterday).length === 0;
    },
  },
  {
    id: 'budget_master',
    title: 'Budget Master',
    description: 'Set budgets for 5+ categories',
    icon: '🎯',
    check: () => getBudgets().length >= 5,
  },
  {
    id: 'level_3',
    title: 'Controller Status',
    description: 'Reached Level 3',
    icon: '⭐',
    check: (_, state) => state.level >= 3,
  },
  {
    id: 'level_5',
    title: 'Money Master',
    description: 'Reached Level 5',
    icon: '👑',
    check: (_, state) => state.level >= 5,
  },
  {
    id: 'first_50_txs',
    title: 'Habitual Tracker',
    description: 'Logged 50 transactions',
    icon: '📊',
    check: (txs) => txs.length >= 50,
  },
  {
    id: 'streak_30',
    title: '30-Day Warrior',
    description: 'Used the app 30 days straight',
    icon: '⚡',
    check: (_, state) => state.longestStreak >= 30,
  },
];

export function checkNewAchievements(): Achievement[] {
  const state = getGamificationState();
  const txs = getTransactions();
  const newAchievements: Achievement[] = [];

  ACHIEVEMENTS.forEach(a => {
    if (!state.achievements.includes(a.id) && a.check(txs, state)) {
      newAchievements.push(a);
      state.achievements.push(a.id);
      state.xp += 25; // bonus XP for achievements
    }
  });

  if (newAchievements.length > 0) {
    state.level = getLevelForXP(state.xp).level;
    saveGamificationState(state);
  }

  return newAchievements;
}

// ── AI Coach (Local Logic — Optimized) ─────────────────────────────────

function getCategoryTrend(transactions: Transaction[], category: string): 'up' | 'down' | 'stable' {
  const now = new Date();
  const thisMonth = transactions.filter(t => t.type === 'expense' && t.category === category && isThisMonth(new Date(t.date)));
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && t.category === category && d >= lastMonthStart && d <= lastMonthEnd;
  });
  const thisTotal = thisMonth.reduce((s, t) => s + t.amount, 0);
  const lastTotal = lastMonth.reduce((s, t) => s + t.amount, 0);
  if (lastTotal === 0) return 'stable';
  const change = (thisTotal - lastTotal) / lastTotal;
  return change > 0.15 ? 'up' : change < -0.15 ? 'down' : 'stable';
}

function getDayOfWeekPattern(transactions: Transaction[]): { highDay: string; lowDay: string } | null {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay: Record<number, number[]> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const d = new Date(t.date).getDay();
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(t.amount);
  });
  const avgByDay = Object.entries(byDay).map(([d, amounts]) => ({
    day: parseInt(d),
    avg: amounts.reduce((s, a) => s + a, 0) / amounts.length,
  }));
  if (avgByDay.length < 3) return null;
  avgByDay.sort((a, b) => b.avg - a.avg);
  return { highDay: days[avgByDay[0].day], lowDay: days[avgByDay[avgByDay.length - 1].day] };
}

export function generateInsights(transactions: Transaction[]): AIInsight[] {
  const insights: AIInsight[] = [];
  const monthTxs = transactions.filter(t => isThisMonth(new Date(t.date)));
  const expenses = monthTxs.filter(t => t.type === 'expense');
  const income = monthTxs.filter(t => t.type === 'income');

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);

  // Category analysis with trend
  const byCategory: Record<string, number> = {};
  expenses.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });
  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0];

  if (topCategory && topCategory[1] > totalExpense * 0.35) {
    const trend = getCategoryTrend(transactions, topCategory[0]);
    const trendMsg = trend === 'up' ? ' and trending UP ↑' : trend === 'down' ? ' (trending down ↓ — nice!)' : '';
    insights.push({
      type: trend === 'down' ? 'celebration' : 'warning',
      icon: trend === 'down' ? '📉' : '🔍',
      title: trend === 'down' ? `${topCategory[0]} Improving!` : 'Money Leak Detected',
      message: `${topCategory[0]} = ${Math.round((topCategory[1] / totalExpense) * 100)}% of spending${trendMsg}. ${trend !== 'down' ? `Try cutting ${Math.round(topCategory[1] * 0.1)}/day.` : 'Keep it up!'}`,
    });
  }

  // Spending pattern by day of week
  const dayPattern = getDayOfWeekPattern(transactions);
  if (dayPattern) {
    insights.push({
      type: 'tip',
      icon: '📅',
      title: 'Spending Pattern',
      message: `You spend most on ${dayPattern.highDay}s and least on ${dayPattern.lowDay}s. Plan big purchases for ${dayPattern.lowDay}s to stay disciplined.`,
    });
  }

  // Savings rate with comparison
  if (totalIncome > 0) {
    const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
    if (savingsRate > 30) {
      insights.push({
        type: 'celebration',
        icon: '🏆',
        title: 'Elite Savings!',
        message: `${Math.round(savingsRate)}% savings rate — better than 90% of people! Projected: ${Math.round((totalIncome - totalExpense) * 12).toLocaleString()}/year.`,
      });
    } else if (savingsRate > 15) {
      insights.push({
        type: 'celebration',
        icon: '🎉',
        title: 'Solid Savings',
        message: `${Math.round(savingsRate)}% savings rate. Push to 30% to unlock elite status!`,
      });
    } else if (savingsRate > 0) {
      insights.push({
        type: 'tip',
        icon: '💡',
        title: 'Savings Opportunity',
        message: `${Math.round(savingsRate)}% savings. Cut your top category by 20% to reach ${Math.round(savingsRate + (topCategory ? (topCategory[1] * 0.2 / totalIncome) * 100 : 5))}%.`,
      });
    } else {
      insights.push({
        type: 'warning',
        icon: '🚨',
        title: 'Overspending Alert',
        message: `You're spending more than you earn! Reduce by ${Math.round(totalExpense - totalIncome).toLocaleString()} to break even.`,
      });
    }
  }

  // Daily spending projection
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  if (dayOfMonth > 3 && totalExpense > 0) {
    const dailyAvg = totalExpense / dayOfMonth;
    const projected = dailyAvg * daysInMonth;
    const budgets = getBudgets();
    const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
    if (totalBudget > 0 && projected > totalBudget) {
      insights.push({
        type: 'warning',
        icon: '📊',
        title: 'Over-Budget Trajectory',
        message: `At ${Math.round(dailyAvg)}/day, you'll hit ${Math.round(projected).toLocaleString()} — that's ${Math.round(((projected - totalBudget) / totalBudget) * 100)}% over budget. Cut ${Math.round((projected - totalBudget) / (daysInMonth - dayOfMonth))}/day to stay on track.`,
      });
    } else {
      insights.push({
        type: 'projection',
        icon: '📈',
        title: 'Monthly Projection',
        message: `At ${Math.round(dailyAvg)}/day → ~${Math.round(projected).toLocaleString()} this month.${totalBudget > 0 ? ` Budget: ${totalBudget.toLocaleString()} (${Math.round((projected / totalBudget) * 100)}%)` : ''}`,
      });
    }
  }

  // Budget warnings
  const budgets = getBudgets();
  const overBudget = budgets.filter(b => {
    const spent = expenses.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
    return spent > b.limit * 0.8;
  });
  if (overBudget.length > 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Budget Warning',
      message: `${overBudget.map(b => b.category).join(', ')} near/over limit. ${overBudget.length > 1 ? 'Focus on the biggest offender first.' : 'Pause spending here.'}`,
    });
  }

  // Streak encouragement
  const state = getGamificationState();
  if (state.streak > 0) {
    const nextMilestone = state.streak < 7 ? 7 : state.streak < 30 ? 30 : 100;
    insights.push({
      type: 'tip',
      icon: '🔥',
      title: `${state.streak}-Day Streak`,
      message: `${nextMilestone - state.streak} day${nextMilestone - state.streak === 1 ? '' : 's'} to ${nextMilestone}-day milestone → +${nextMilestone === 7 ? 50 : nextMilestone === 30 ? 200 : 500} XP!`,
    });
  }

  // Micro win
  const todayExpenses = expenses.filter(t => isToday(new Date(t.date)));
  const todayTotal = todayExpenses.reduce((s, t) => s + t.amount, 0);
  if (todayTotal > 0 && todayTotal < 50) {
    insights.push({
      type: 'celebration',
      icon: '✨',
      title: 'Micro Win!',
      message: `Only ${todayTotal} spent today — great discipline! That's ${Math.round((50 - todayTotal) * 365).toLocaleString()} saved/year vs a 50/day habit.`,
    });
  }

  // Category diversity insight
  if (sortedCategories.length >= 3) {
    const top3Pct = sortedCategories.slice(0, 3).reduce((s, [, v]) => s + v, 0) / totalExpense * 100;
    if (top3Pct > 85) {
      insights.push({
        type: 'tip',
        icon: '🎯',
        title: 'Concentrated Spending',
        message: `${Math.round(top3Pct)}% of spending in just 3 categories (${sortedCategories.slice(0, 3).map(([c]) => c).join(', ')}). Small cuts here = big savings.`,
      });
    }
  }

  return insights.slice(0, 5);
}

// ── Game Mode Configs ──────────────────────────────────────────────────

export const GAME_MODES = {
  aggressive: { label: 'Aggressive Saver', icon: '🔥', desc: 'Strict budgets, high rewards', xpMultiplier: 1.5 },
  balanced: { label: 'Balanced', icon: '⚖️', desc: 'Moderate targets', xpMultiplier: 1.0 },
  chill: { label: 'Chill Mode', icon: '🧘', desc: 'Light tracking, minimal pressure', xpMultiplier: 0.8 },
} as const;
