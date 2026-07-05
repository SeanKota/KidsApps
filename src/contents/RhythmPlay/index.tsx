import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sound } from '../../utils/sound';
import './RhythmPlay.css';

type Difficulty = 'easy' | 'normal' | 'hard' | 'insane';
type SessionPhase = 'idle' | 'countdown' | 'playing' | 'finished';
type SessionStepKind = 'demo' | 'copy';

interface RhythmPreset {
  pattern: number[];
  tempo: number;
  label: string;
  meterLabel: string;
  beatCount: number;
}

interface SessionStep {
  kind: SessionStepKind;
  preset: RhythmPreset;
}

const DIFFICULTY_META: Record<Difficulty, { label: string; hint: string; tempo: number }> = {
  easy: { label: 'かんたん', hint: 'ゆっくり いこう', tempo: 72 },
  normal: { label: 'ふつう', hint: 'ちょうど いい きもち', tempo: 88 },
  hard: { label: 'むずかしい', hint: 'ちょっと せまい りズム', tempo: 104 },
  insane: { label: 'おに', hint: 'たくさん たたこう', tempo: 124 }
};

function buildSessionPlan(difficulty: Difficulty): SessionStep[] {
  if (difficulty === 'easy') {
    const preset: RhythmPreset = { pattern: [1, 0, 1, 0], tempo: 72, label: '4/4', meterLabel: '4/4', beatCount: 4 };
    return [
      { kind: 'demo', preset },
      { kind: 'copy', preset },
      { kind: 'demo', preset },
      { kind: 'copy', preset }
    ];
  }

  return [
    { kind: 'demo', preset: { pattern: [1, 0, 1, 0], tempo: DIFFICULTY_META[difficulty].tempo, label: '4/4', meterLabel: '4/4', beatCount: 4 } },
    { kind: 'copy', preset: { pattern: [1, 0, 1, 0], tempo: DIFFICULTY_META[difficulty].tempo, label: '4/4', meterLabel: '4/4', beatCount: 4 } },
    { kind: 'demo', preset: { pattern: [1, 0, 0, 1, 0, 0], tempo: DIFFICULTY_META[difficulty].tempo + 4, label: 'ポリ', meterLabel: '6/8', beatCount: 6 } },
    { kind: 'copy', preset: { pattern: [1, 0, 0, 1, 0, 0], tempo: DIFFICULTY_META[difficulty].tempo + 4, label: 'ポリ', meterLabel: '6/8', beatCount: 6 } },
    { kind: 'demo', preset: { pattern: [1, 0, 0, 0, 1, 0], tempo: DIFFICULTY_META[difficulty].tempo + 6, label: '3/4', meterLabel: '3/4', beatCount: 3 } },
    { kind: 'copy', preset: { pattern: [1, 0, 0, 0, 1, 0], tempo: DIFFICULTY_META[difficulty].tempo + 6, label: '3/4', meterLabel: '3/4', beatCount: 3 } },
    { kind: 'demo', preset: { pattern: [1, 0, 1, 0, 0, 1], tempo: DIFFICULTY_META[difficulty].tempo + 8, label: 'みんぞく', meterLabel: '6/8', beatCount: 6 } },
    { kind: 'copy', preset: { pattern: [1, 0, 1, 0, 0, 1], tempo: DIFFICULTY_META[difficulty].tempo + 8, label: 'みんぞく', meterLabel: '6/8', beatCount: 6 } }
  ];
}

interface RhythmPlayProps {
  onBackToHome: () => void;
}

const RhythmPlay: React.FC<RhythmPlayProps> = ({ onBackToHome }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [countdownValue, setCountdownValue] = useState<number | 'スタート'>(3);
  const [message, setMessage] = useState('むずかしさを えらんでね');
  const [currentPreset, setCurrentPreset] = useState<RhythmPreset>(buildSessionPlan('easy')[0].preset);
  const [activeBeat, setActiveBeat] = useState(-1);
  const timerRef = useRef<number | null>(null);

  const sessionPlan = useMemo(() => buildSessionPlan(difficulty), [difficulty]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const playPattern = (preset: RhythmPreset, onComplete: () => void) => {
    clearTimer();
    setActiveBeat(-1);
    let beatIndex = 0;
    const stepMs = Math.max(400, Math.round(60000 / preset.tempo));

    const tick = () => {
      if (beatIndex >= preset.pattern.length) {
        clearTimer();
        onComplete();
        return;
      }

      setActiveBeat(beatIndex);
      if (preset.pattern[beatIndex] === 1) {
        sound.playClap();
      } else {
        sound.playPop();
      }
      beatIndex += 1;
    };

    tick();
    timerRef.current = window.setInterval(tick, stepMs);
  };

  const runCountdown = (instruction: string, tempo: number, onComplete: () => void) => {
    clearTimer();
    setPhase('countdown');
    setMessage(instruction);
    let count = 3;
    const intervalMs = Math.max(400, Math.round(60000 / tempo));

    const showNext = () => {
      if (count === 0) {
        setCountdownValue('スタート');
        timerRef.current = window.setTimeout(() => {
          onComplete();
        }, intervalMs);
        return;
      }

      setCountdownValue(count);
      count -= 1;
      timerRef.current = window.setTimeout(showNext, intervalMs);
    };

    showNext();
  };

  const startSession = () => {
    clearTimer();
    setActiveBeat(-1);
    setPhase('countdown');
    setMessage('おてほん');
    setCountdownValue(3);

    const runNextStep = (index: number) => {
      if (index >= sessionPlan.length) {
        setPhase('finished');
        setMessage('うまくできたかな？');
        setCountdownValue('スタート');
        return;
      }

      const step = sessionPlan[index];
      const instruction = step.kind === 'demo' ? 'おてほん' : 'まねしてみてね';
      setCurrentPreset(step.preset);

      runCountdown(instruction, step.preset.tempo, () => {
        setPhase('playing');
        setMessage(instruction);
        playPattern(step.preset, () => {
          runNextStep(index + 1);
        });
      });
    };

    runNextStep(0);
  };

  const handleDifficultyChange = (next: Difficulty) => {
    setDifficulty(next);
    setMessage(`${DIFFICULTY_META[next].label}で いこう`);
    setPhase('idle');
    clearTimer();
    setCountdownValue(3);
    setActiveBeat(-1);
  };

  const resetToSelection = () => {
    setPhase('idle');
    setMessage('むずかしさを えらんでね');
    setCountdownValue(3);
    setActiveBeat(-1);
    clearTimer();
  };

  if (phase !== 'idle') {
    return (
      <div className="rhythm-stage-screen">
        <div className="stage-panel">
          <p className="stage-eyebrow">{DIFFICULTY_META[difficulty].label}</p>
          <h2 className="stage-title">{message}</h2>
          <p className="stage-subtitle">
            {phase === 'countdown'
              ? 'お手本を みて きいて まねしてみよう'
              : 'おてほんや まねしてみてねを きいて みてみよう'}
          </p>

          <div className="countdown-circle">
            {typeof countdownValue === 'number' ? countdownValue : countdownValue}
          </div>

          <div className="meter-badge">
            <span>{currentPreset.meterLabel}</span>
            <span>{currentPreset.beatCount}拍子</span>
          </div>

          <div className="beat-row stage-beats" aria-label="beat indicators">
            {currentPreset.pattern.map((beat, index) => (
              <div className="beat-column" key={`${currentPreset.label}-${index}`}>
                <span className="beat-number">{index + 1}</span>
                <span
                  className={`beat-pill ${activeBeat === index ? 'active' : ''} ${beat === 1 ? 'strong' : ''}`}
                >
                  {beat === 1 ? '✋' : '・'}
                </span>
              </div>
            ))}
          </div>

          {phase === 'finished' && (
            <div className="finish-box">
              <h3>うまくできたかな？</h3>
              <button className="primary-button" onClick={resetToSelection}>
                むずかしさを えらびなおす
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rhythm-play-page">
      <section className="rhythm-card intro-card">
        <p className="eyebrow">リズムあそび</p>
        <h2>リズムに あわせて てを たたこう</h2>
        <p className="intro-text">
          かんたんでは 2つの りズムを くり返すよ。<br />
          ふつう いじょうは 4パターンで ちょうせんするよ。
        </p>
      </section>

      <section className="rhythm-card controls-card">
        <div className="control-block">
          <h3>むずかしさ</h3>
          <div className="chip-row">
            {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((item) => (
              <button
                key={item}
                className={`chip-button ${difficulty === item ? 'active' : ''}`}
                onClick={() => handleDifficultyChange(item)}
              >
                {DIFFICULTY_META[item].label}
              </button>
            ))}
          </div>
          <p className="hint-text">{DIFFICULTY_META[difficulty].hint}</p>
        </div>

        <div className="control-block auto-note">
          <p>リズム・強弱・テンポは すべて じどうで えらばれるよ。</p>
        </div>

        <div className="control-actions">
          <button className="primary-button" onClick={startSession}>
            スタート
          </button>
          <button className="secondary-button" onClick={onBackToHome}>
            もどる
          </button>
        </div>
      </section>
    </div>
  );
};

export default RhythmPlay;
