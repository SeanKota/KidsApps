import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sound } from '../../utils/sound';
import './RhythmPlay.css';

type Difficulty = 'easy' | 'normal' | 'hard' | 'insane';
type SessionPhase = 'idle' | 'countdown' | 'demo' | 'copy' | 'finished';

interface RhythmPreset {
  pattern: number[];
  tempo: number;
  label: string;
}

const DIFFICULTY_META: Record<Difficulty, { label: string; hint: string; tempo: number }> = {
  easy: { label: 'かんたん', hint: 'ゆっくり いこう', tempo: 72 },
  normal: { label: 'ふつう', hint: 'ちょうど いい きもち', tempo: 88 },
  hard: { label: 'むずかしい', hint: 'ちょっと せまい りズム', tempo: 104 },
  insane: { label: 'おに', hint: 'たくさん たたこう', tempo: 124 }
};

function buildSessionPlan(difficulty: Difficulty): RhythmPreset[] {
  if (difficulty === 'easy') {
    return [
      { pattern: [1, 0, 1, 0], tempo: 72, label: '4/4' },
      { pattern: [1, 0, 1, 0], tempo: 72, label: '4/4' }
    ];
  }

  return [
    { pattern: [1, 0, 1, 0], tempo: DIFFICULTY_META[difficulty].tempo, label: '4/4' },
    { pattern: [1, 0, 0, 1, 0, 0], tempo: DIFFICULTY_META[difficulty].tempo + 4, label: 'ポリ' },
    { pattern: [1, 0, 0, 0, 1, 0], tempo: DIFFICULTY_META[difficulty].tempo + 6, label: '3/4' },
    { pattern: [1, 0, 1, 0, 0, 1], tempo: DIFFICULTY_META[difficulty].tempo + 8, label: 'みんぞく' }
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
  const [currentPreset, setCurrentPreset] = useState<RhythmPreset>(buildSessionPlan('easy')[0]);
  const [activeBeat, setActiveBeat] = useState(-1);
  const [tapCount, setTapCount] = useState(0);
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
    const stepMs = Math.max(360, Math.round(60000 / preset.tempo / 2));

    const tick = () => {
      if (beatIndex >= preset.pattern.length) {
        clearTimer();
        onComplete();
        return;
      }

      setActiveBeat(beatIndex);
      sound.playPop();
      beatIndex += 1;
    };

    tick();
    timerRef.current = window.setInterval(tick, stepMs);
  };

  const runCountdown = (instruction: string, onComplete: () => void) => {
    clearTimer();
    setPhase('countdown');
    setMessage(instruction);
    let count = 3;

    const showNext = () => {
      if (count === 0) {
        setCountdownValue('スタート');
        timerRef.current = window.setTimeout(() => {
          onComplete();
        }, 700);
        return;
      }

      setCountdownValue(count);
      count -= 1;
      timerRef.current = window.setTimeout(showNext, 700);
    };

    showNext();
  };

  const startSession = () => {
    clearTimer();
    setPhase('countdown');
    setTapCount(0);
    setActiveBeat(-1);
    setMessage('おてほん');
    setCurrentPreset(sessionPlan[0]);

    const startDemo = (index: number) => {
      const preset = sessionPlan[index];
      setCurrentPreset(preset);
      setMessage('おてほん');
      setCountdownValue('スタート');
      setPhase('demo');
      playPattern(preset, () => {
        const nextIndex = index + 1;
        if (nextIndex >= sessionPlan.length) {
          setPhase('finished');
          setMessage('うまくできたかな？');
          setCountdownValue('スタート');
          return;
        }

        runCountdown('まねしてみてね', () => {
          setPhase('copy');
          setMessage('まねしてみてね');
          setCountdownValue('スタート');
          playPattern(preset, () => {
            startDemo(nextIndex);
          });
        });
      });
    };

    runCountdown('おてほん', () => {
      setPhase('demo');
      startDemo(0);
    });
  };

  const handleClap = () => {
    if (phase !== 'copy') {
      setMessage('まだ まねしてみてねの じかんじゃないよ');
      return;
    }

    sound.playClap();
    setTapCount((prev) => prev + 1);
    setMessage('チャ！');
    window.setTimeout(() => {
      setMessage('まねしてみてね');
    }, 250);
  };

  const handleDifficultyChange = (next: Difficulty) => {
    setDifficulty(next);
    setMessage(`${DIFFICULTY_META[next].label}で いこう`);
    setPhase('idle');
    clearTimer();
    setCountdownValue(3);
    setActiveBeat(-1);
  };

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
            {phase === 'idle' ? 'スタート' : 'もういちど'}
          </button>
          <button className="secondary-button" onClick={onBackToHome}>
            もどる
          </button>
        </div>
      </section>

      <section className="rhythm-card play-card">
        <div className={`clap-zone ${phase === 'copy' ? 'active' : ''}`} onClick={handleClap}>
          <p className="phase-label">{message}</p>
          <div className="clap-button">
            <span role="img" aria-hidden="true">👏</span>
          </div>
          <p className="clap-hint">
            {phase === 'copy' ? 'ここを たたいて まねしてみよう' : 'スタートすると ここから はじまるよ'}
          </p>
        </div>

        <div className="status-panel">
          <div className="status-box">
            <span className="status-label">いまの むずかしさ</span>
            <strong>{DIFFICULTY_META[difficulty].label}</strong>
          </div>
          <div className="status-box">
            <span className="status-label">たたいたかず</span>
            <strong>{tapCount}</strong>
          </div>
          <div className="status-box wide">
            <span className="status-label">おしらせ</span>
            <strong>{typeof countdownValue === 'number' ? `${countdownValue}・` : countdownValue}</strong>
          </div>
        </div>

        <div className="beat-row" aria-label="beat indicators">
          {currentPreset.pattern.map((beat, index) => (
            <span
              key={`${currentPreset.label}-${index}`}
              className={`beat-pill ${activeBeat === index ? 'active' : ''} ${beat === 1 ? 'strong' : ''}`}
            >
              {beat === 1 ? '♪' : '・'}
            </span>
          ))}
        </div>

        {phase === 'finished' && (
          <div className="summary-box">
            <h3>おわり！</h3>
            <p>うまくできたかな？</p>
            <p>むずかしさを えらびなおしてね</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default RhythmPlay;
