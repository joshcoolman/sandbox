'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { StatDisplay } from './StatDisplay';
import { StackedBarChart } from './StackedBarChart';
import { Heatmap } from './Heatmap';
import { DonutChart } from './DonutChart';
import { SegmentedBar } from './SegmentedBar';
import { MetricTile } from './MetricTile';
import { AnimatedCard } from './AnimatedCard';
import { useCountUp } from './useCountUp';
import s from '../page.module.css';

const exercises = [
  { name: 'Back Squat', detail: '315 x 3', pr: true },
  { name: 'Deadlift', detail: '365 x 5', pr: false },
  { name: 'Bench Press', detail: '225 x 5', pr: false },
  { name: 'Power Clean', detail: '185 x 3', pr: true },
  { name: 'Pull-ups', detail: '25 unbroken', pr: false },
  { name: 'Box Jumps', detail: '30" x 20', pr: false },
];

const weekBars = [
  { day: 'Mon', strength: 75, cardio: 40 },
  { day: 'Tue', strength: 50, cardio: 80 },
  { day: 'Wed', strength: 0, cardio: 30 },
  { day: 'Thu', strength: 85, cardio: 55 },
  { day: 'Fri', strength: 60, cardio: 90 },
  { day: 'Sat', strength: 70, cardio: 45 },
  { day: 'Sun', strength: 0, cardio: 20 },
];

// Static seed for SSR — gets replaced client-side immediately
const INITIAL_HEATMAP = [
  0,1,3,2,0,4,3,1,0,2,
  2,4,3,0,1,3,4,2,3,0,
  0,3,4,2,4,0,1,3,2,4,
  1,0,2,3,4,3,0,2,4,3,
  3,2,0,4,3,1,2,4,3,0,
  0,2,4,3,2,4,1,0,3,4,
  2,3,4,0,3,4,3,2,4,3,
];

function randomHeatmap() {
  return Array.from({ length: 70 }, () => Math.floor(Math.random() * 5));
}

const heatmapColors = ['#33332e', '#6b4a20', '#a06020', '#cc7020', '#e87000'];

function CounterSpan({ value, className, delay = 0 }: { value: number; className: string; delay?: number }) {
  const count = useCountUp(value, 700, delay);
  return <span className={className}>{count}</span>;
}

export function CrossfitBentoContent() {
  const [activeTab, setActiveTab] = useState<'consumed' | 'burned'>('consumed');
  const [heatmapData, setHeatmapData] = useState(INITIAL_HEATMAP);

  // Randomize on first client mount (after hydration)
  useEffect(() => { setHeatmapData(randomHeatmap()); }, []);

  return (
    <div className={s.page}>
      <div className={s.grid}>

        {/* Row 0, Col 0 — Goal Progress */}
        <AnimatedCard className={`${s.card} ${s.cardGoal}`} delay={0}>
          <ProgressRing percentage={78} />
          <div className={s.goalFooter}>
            <hr className={s.goalRule} />
            <div className={s.goalMeta}>
              <div className={s.goalLabel}>Monthly Goal</div>
              <div className={s.goalDate}>Feb 2026</div>
            </div>
          </div>
        </AnimatedCard>

        {/* Row 0, Col 1 — Calories */}
        <AnimatedCard className={s.calStack} delay={0.12}>
          <button
            className={`${s.calCard} ${activeTab === 'consumed' ? s.calCardActive : s.calCardInactive}`}
            onClick={(e) => { e.stopPropagation(); setActiveTab('consumed'); }}
          >
            <StatDisplay label="Consumed" unit="kcal" value="2,340" />
          </button>
          <button
            className={`${s.calCard} ${activeTab === 'burned' ? s.calCardActive : s.calCardInactive}`}
            onClick={(e) => { e.stopPropagation(); setActiveTab('burned'); }}
          >
            <StatDisplay label="Burned" unit="kcal" value="1,870" />
          </button>
          <div className={`${s.calCard} ${s.calCardActive}`} style={{ borderBottom: 'none' }}>
            <StatDisplay label="Surplus" unit="kcal" value="+470" valueColor="#6b8f6b" />
          </div>
        </AnimatedCard>

        {/* Row 0, Col 2 — Weekly Activity */}
        <AnimatedCard className={`${s.card} ${s.cardActivity}`} delay={0.24}>
          <div className={s.activityTitle}>Weekly<br />Training Load</div>
          <StackedBarChart
            bars={weekBars.map((b) => ({
              label: b.day,
              segments: [
                { height: `${b.strength}%`, color: '#3a3f2e' },
                { height: `${b.cardio}%`, color: '#2a2820' },
              ],
            }))}
            footer={{ label: 'This Week:', value: '12,480 cal' }}
          />
        </AnimatedCard>

        {/* Row 1, Col 0 — Activity Heatmap */}
        <AnimatedCard className={`${s.card} ${s.cardStreak}`} delay={0.12}>
          <div className={s.streakHeader}>
            <div className={s.streakHeaderLeft}>
              <Flame size={22} strokeWidth={2} color="#e87000" />
              <CounterSpan value={14} className={s.streakNumber} delay={200} />
            </div>
            <span className={s.streakCount}>Day<br />Streak</span>
          </div>
          <Heatmap
            data={heatmapData}
            cols={10}
            colorStops={heatmapColors}
            onShuffle={() => setHeatmapData(randomHeatmap())}
            renderCell={(level, i) =>
              level === 4 && i % 3 === 0
                ? <Flame size={8} strokeWidth={2} color="rgba(0,0,0,0.3)" />
                : null
            }
          />
          <div className={s.streakMonths}>
            <span className={s.streakMonth}>Jan</span>
            <span className={s.streakMonth}>Feb</span>
          </div>
        </AnimatedCard>

        {/* Row 1, Col 1 — Workout Stats */}
        <AnimatedCard className={s.statsStack} delay={0.24}>
          <div className={s.cardWorkout}>
            <div className={s.wTitle}>Today&apos;s WOD</div>
            <motion.div
              className={s.wAmount}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              Fran<span className={s.wUnit}> 3:42</span>
            </motion.div>
          </div>
          <div className={s.statCard}>
            <div>
              <div className={s.statLabel}>Workouts</div>
              <div className={s.statSub}>This month</div>
            </div>
            <CounterSpan value={18} className={s.statNum} delay={200} />
          </div>
          <div className={s.statCard}>
            <div>
              <div className={s.statLabel}>PRs Hit</div>
              <div className={s.statSub}>Last 30 days</div>
            </div>
            <CounterSpan value={5} className={s.statNum} delay={300} />
          </div>
        </AnimatedCard>

        {/* Row 1, Col 2 — Donut Macro Split */}
        <AnimatedCard delay={0.36}>
          <DonutChart
            segments={[
              { pct: 0.35, color: '#e87000' },
              { pct: 0.40, color: '#6b7355' },
              { pct: 0.25, color: '#8b5e3c' },
            ]}
          >
            <span className={s.donutLabel}>2,340</span>
            <span className={s.donutSub}>kcal</span>
          </DonutChart>
        </AnimatedCard>

        {/* Row 2, Col 0 — Workout Log */}
        <AnimatedCard className={`${s.card} ${s.cardLog}`} delay={0.24}>
          <div className={s.logTitle}>Today&apos;s<br />Lifts</div>
          <div className={s.exerciseList}>
            {exercises.map((e, i) => (
              <motion.div
                key={e.name}
                className={s.exerciseRow}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 200,
                  delay: i * 0.06,
                }}
              >
                <div className={s.exerciseName}>
                  {e.pr && (
                    <motion.span
                      className={s.prBadge}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        damping: 10,
                        stiffness: 300,
                        delay: i * 0.06 + 0.15,
                      }}
                    >
                      PR
                    </motion.span>
                  )}
                  {e.name}
                </div>
                <span className={s.exerciseDetail}>{e.detail}</span>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>

        {/* Row 2, Col 1 — Heart Rate Zone */}
        <AnimatedCard className={s.hrStack} delay={0.36}>
          <div className={s.cardHr}>
            <div className={s.hrUpper}>
              <div className={s.hrTitle}>Avg Heart Rate</div>
              <div className={s.hrSub}>During WOD</div>
            </div>
            <div className={s.hrLower}>
              <div className={s.hrRow}>
                <span className={s.hrUnit}>bpm</span>
                <CounterSpan value={164} className={s.hrNum} delay={200} />
              </div>
              <SegmentedBar
                segments={[
                  { flex: 1, color: '#5a8a5a' },
                  { flex: 1.5, color: '#b8b840' },
                  { flex: 2, color: '#d08030' },
                  { flex: 1.2, color: '#c84040' },
                ]}
                labels={['Easy', 'Moderate', 'Hard', 'Max']}
                className={s.zoneBarsWrap}
              />
            </div>
          </div>
          <div className={s.metricGrid}>
            <MetricTile value="8.2" label="Sleep" />
            <MetricTile value="72" label="HRV" />
            <MetricTile value="186" label="lbs" />
            <MetricTile value="14%" label="Body Fat" />
          </div>
        </AnimatedCard>

        {/* Row 2, Col 2 — Sleep */}
        <AnimatedCard className={s.sleepStack} delay={0.48}>
          <div className={s.cardSleep}>
            <div className={s.sleepTitle}>Last Night</div>
            <div className={s.sleepRow}>
              <span className={s.sleepUnitLabel}>hrs</span>
              <CounterSpan value={8} className={s.sleepHours} delay={200} />
            </div>
            <SegmentedBar
              segments={[
                { flex: 1.5, color: '#2d4a6b' },
                { flex: 3, color: '#3a6b8b' },
                { flex: 1, color: '#2d4a6b' },
                { flex: 2, color: '#5a8bab' },
                { flex: 0.5, color: '#2d4a6b' },
                { flex: 1.5, color: '#3a6b8b' },
              ]}
              legend={[
                { color: '#2d4a6b', label: 'Deep' },
                { color: '#3a6b8b', label: 'Light' },
                { color: '#5a8bab', label: 'REM' },
              ]}
              className={s.sleepBarWrap}
            />
          </div>
          <div className={s.metricGridDark}>
            <MetricTile value="92" label="Score" variant="dark" />
            <MetricTile value="11:15" label="Bedtime" variant="dark" />
            <MetricTile value="7:28" label="Wake" variant="dark" />
            <MetricTile value="2" label="Wakes" variant="dark" />
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}
