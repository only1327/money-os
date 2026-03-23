import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Trophy, Target, Zap, Swords } from 'lucide-react';
import {
  getGamificationState, getLevelForXP, getXPProgress, getNextLevel,
  getDailyMissions, getWeeklyMissions, ACHIEVEMENTS, LEVELS, GAME_MODES,
  type GamificationState, type Mission,
} from '@/lib/gamification';
import { getTransactions } from '@/lib/storage';

interface GamificationHubProps {
  state: GamificationState;
  onModeChange: (mode: GamificationState['gameMode']) => void;
}

export default function GamificationHub({ state, onModeChange }: GamificationHubProps) {
  const txs = useMemo(() => getTransactions(), []);
  const level = getLevelForXP(state.xp);
  const progress = getXPProgress(state.xp);
  const nextLevel = getNextLevel(level.level);
  const dailyMissions = useMemo(() => getDailyMissions(), []);
  const weeklyMissions = useMemo(() => getWeeklyMissions(), []);

  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } };

  return (
    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.05 }} className="space-y-4 pb-28">
      {/* Level & XP Card */}
      <motion.div variants={item} className="brutal-card p-5 stripe-bg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-primary/20 border-3 border-primary flex items-center justify-center text-3xl shadow-[4px_4px_0px] shadow-primary">
              {level.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Level {level.level}</p>
              <p className="text-lg font-bold">{level.title}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-mono text-gradient-primary">{state.xp}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total XP</p>
          </div>
        </div>

        {/* XP Bar */}
        {nextLevel && (
          <div>
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
              <span>LEVEL {level.level}</span>
              <span>{progress.current}/{progress.next} XP</span>
              <span>LEVEL {nextLevel.level}</span>
            </div>
            <div className="h-5 bg-muted border-3 border-muted-foreground/30 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-accent"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-mono drop-shadow-lg">{Math.round(progress.pct)}%</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Streak */}
      <motion.div variants={item} className={`p-5 ${state.streak >= 7 ? 'brutal-card-accent' : 'brutal-card-muted'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className={`w-8 h-8 ${state.streak > 0 ? 'text-accent' : 'text-muted-foreground'}`} strokeWidth={3} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Streak</p>
              <p className="text-3xl font-bold text-mono">{state.streak} <span className="text-sm text-muted-foreground">days</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Best</p>
            <p className="text-lg font-bold text-mono text-muted-foreground">{state.longestStreak}</p>
          </div>
        </div>
        {state.streak > 0 && state.streak < 7 && (
          <p className="text-xs text-muted-foreground mt-2 font-semibold">🎯 {7 - state.streak} more days for +50 bonus XP!</p>
        )}
      </motion.div>

      {/* Daily Missions */}
      <motion.div variants={item} className="brutal-card p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" strokeWidth={3} /> Daily Missions
        </h3>
        <div className="space-y-2">
          {dailyMissions.map(m => {
            const completed = state.completedMissions.includes(m.id) || m.check(txs);
            return (
              <MissionCard key={m.id} mission={m} completed={completed} />
            );
          })}
        </div>
      </motion.div>

      {/* Weekly Missions */}
      <motion.div variants={item} className="brutal-card-accent p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Swords className="w-4 h-4" strokeWidth={3} /> Weekly Missions
        </h3>
        <div className="space-y-2">
          {weeklyMissions.map(m => {
            const completed = state.completedMissions.includes(m.id) || m.check(txs);
            return <MissionCard key={m.id} mission={m} completed={completed} />;
          })}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={item} className="brutal-card-muted p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4" strokeWidth={3} /> Achievements
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map(a => {
            const unlocked = state.achievements.includes(a.id);
            return (
              <div
                key={a.id}
                className={`p-3 border-2 transition-all ${
                  unlocked
                    ? 'border-primary bg-primary/10 shadow-[3px_3px_0px] shadow-primary'
                    : 'border-muted-foreground/20 opacity-50'
                }`}
              >
                <span className="text-2xl">{a.icon}</span>
                <p className="text-[11px] font-bold mt-1">{a.title}</p>
                <p className="text-[9px] text-muted-foreground">{a.description}</p>
                {unlocked && <span className="badge-brutal text-primary mt-1 inline-block text-[8px]">UNLOCKED</span>}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Game Modes */}
      <motion.div variants={item} className="brutal-card p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" strokeWidth={3} /> Game Mode
        </h3>
        <div className="space-y-2">
          {(Object.entries(GAME_MODES) as [GamificationState['gameMode'], typeof GAME_MODES[keyof typeof GAME_MODES]][]).map(([key, mode]) => (
            <button
              key={key}
              onClick={() => onModeChange(key)}
              className={`w-full p-3 text-left flex items-center gap-3 border-2 transition-all ${
                state.gameMode === key
                  ? 'border-primary bg-primary/10 shadow-[3px_3px_0px] shadow-primary'
                  : 'border-muted-foreground/20 hover:border-primary/50'
              }`}
            >
              <span className="text-xl">{mode.icon}</span>
              <div>
                <p className="text-sm font-bold">{mode.label}</p>
                <p className="text-[10px] text-muted-foreground">{mode.desc} • {mode.xpMultiplier}x XP</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Level Roadmap */}
      <motion.div variants={item} className="brutal-card-muted p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" strokeWidth={3} /> Level Roadmap
        </h3>
        <div className="space-y-2">
          {LEVELS.map(l => (
            <div
              key={l.level}
              className={`flex items-center gap-3 p-2 border-2 ${
                state.level >= l.level
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-muted-foreground/10 opacity-40'
              }`}
            >
              <span className="text-xl w-8 text-center">{l.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-bold">Lv.{l.level} {l.title}</p>
                <p className="text-[10px] text-mono text-muted-foreground">{l.xpRequired} XP</p>
              </div>
              {state.level >= l.level && <span className="text-primary text-xs font-bold">✓</span>}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MissionCard({ mission, completed }: { mission: Mission; completed: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 border-2 ${
      completed
        ? 'border-primary bg-primary/10 line-through opacity-60'
        : 'border-muted-foreground/20'
    }`}>
      <span className="text-lg">{mission.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{mission.title}</p>
        <p className="text-[10px] text-muted-foreground">{mission.description}</p>
      </div>
      <span className={`badge-brutal ${completed ? 'text-primary' : 'text-accent'}`}>
        {completed ? 'DONE' : `+${mission.xpReward} XP`}
      </span>
    </div>
  );
}
