import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sound } from '../../utils/sound';
import './RhythmPlay.css';

type Difficulty = 'easy' | 'normal' | 'hard' | 'insane';
type RhythmStyle = 'four-four' | 'three-four' | 'odd-meter' | 'poly' | 'ethnic';

interface RhythmPreset {
  id: RhythmStyle;
  label: string;
  description: string;
  pattern: number[];
}

const RHYTHM_PRESETS: RhythmPreset[] = [
  {
    id: 'four-four',
    label: '4/4',
    description: 'おなじみの 4つぶん',
    pattern: [1, 0, 1, 0]
  },
  {
    id: 'three-four',
    label: '3/4',
    description: 'きらきら ワルツみたい',
    pattern: [1, 0, 0]
  },
  {
    id: 'odd-meter',
    label: '5/8',
    description: 'ちょっと へんてこな かたち',
    pattern: [1, 0, 1, 0, 1]
  },
  {
    id: 'poly',
    label: 'ポリリズム',
    description: '2つの うごきを いっしょに',
    pattern: [1, 0, 0, 1, 0, 0]
  },
  {
    id: 'ethnic',
    label: 'みんぞく',
    description: 'にんじんの たねみたいな きざみ',
    pattern: [1, 0, 1, 0, 0, 1]
  }
];

const DIFFICULTY_META: Record<Difficulty, { label: string; tempo: number; hint: string }> = {
  easy: { label: 'かんたん', tempo: 76, hint: 'ゆっくり いこう' },
  normal: { label: 'ふつう', tempo: 96, hint: 'ちょうど いい きもち' },
  hard: { label: 'むずかしい', tempo: 116, hint: 'ちょっと せまい りズム' },
  insane: { label: 'おに', tempo: 140, hint: 'たくさん たたこう' }
};

interface RhythmPlayProps {
  onBackToHome: () => void;
}

const RhythmPlay: React.FC<RhythmPlayProps> = ({ onBackToHome }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [style, setStyle] = useState<RhythmStyle>('four-four');
  const [tempo, setTempo] = useState<number>(DIFFICULTY_META.easy.tempo);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('スタートして りズムを たたこう');
  const [showSummary, setShowSummary] = useState(false);
  const [clapBurst, setClapBurst] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);

  const beatStartRef = useRef<number | null>(null);
  const sequenceLengthRef = useRef(0);

  const selectedPreset = useMemo(
    () => RHYTHM_PRESETS.find((item) => item.id === style) ?? RHYTHM_PRESETS[0],
    [style]
  );

  useEffect(() => {
    if (!isPlaying) return undefined;

    sequenceLengthRef.current = selectedPreset.pattern.length * 2;
    let step = 0;
    const intervalMs = Math.round(60000 / tempo);
    const timer = window.setInterval(() => {
      if (step >= sequenceLengthRef.current) {
        window.clearInterval(timer);
        setIsPlaying(false);
        setShowSummary(true);
        setCompletedRounds((prev) => prev + 1);
        return;
      }

      const measure = Math.floor(step / selectedPreset.pattern.length);
      const beat = step % selectedPreset.pattern.length;
      const isStrong = selectedPreset.pattern[beat] === 1;

      setCurrentMeasure(measure);
      setCurrentBeat(beat);
      beatStartRef.current = performance.now();
      setFeedback(measure === 0 ? 'おてほんの 1小節' : 'みんなで まねする');

      if (isStrong) {
        sound.playPop();
      } else {
        sound.playPop();
      }

      step += 1;
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, selectedPreset, tempo]);

  const handleStart = () => {
    setIsPlaying(true);
    setShowSummary(false);
    setScore(0);
    setCurrentMeasure(0);
    setCurrentBeat(0);
    setFeedback('はじめるよ！ まずは おてほん');
    beatStartRef.current = null;
  };

  const handleClap = () => {
    if (!isPlaying || beatStartRef.current === null) {
      setFeedback('まだ りズムが はじまってないよ');
      return;
    }

    const elapsed = performance.now() - beatStartRef.current;
    if (elapsed < 350) {
      setScore((prev) => prev + 1);
      setFeedback('ぴったり！');
      setClapBurst(true);
      window.setTimeout(() => setClapBurst(false), 220);
    } else {
      setFeedback('ちょっと ずれたよ');
    }
  };

  const handleDifficultyChange = (next: Difficulty) => {
    setDifficulty(next);
    setTempo(DIFFICULTY_META[next].tempo);
  };

  return (
    <div className="rhythm-play-page">
      <section className="rhythm-card intro-card">
        <p className="eyebrow">リズムあそび</p>
        <h2>リズムに あわせて てを たたこう</h2>
        <p className="intro-text">
          1小節は おてほん、1小節は みんなで まねするよ。<br />
          かんたん・ふつう・むずかしい・おにから えらべるよ。
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

        <div className="control-block">
          <h3>りズムの かたち</h3>
          <div className="chip-row">
            {RHYTHM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={`chip-button ${style === preset.id ? 'active' : ''}`}
                onClick={() => setStyle(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="hint-text">{selectedPreset.description}</p>
        </div>

        <div className="control-block tempo-block">
          <div className="tempo-label-row">
            <h3>テンポ</h3>
            <span>{tempo} BPM</span>
          </div>
          <input
            type="range"
            min="70"
            max="150"
            value={tempo}
            onChange={(event) => setTempo(Number(event.target.value))}
          />
        </div>

        <div className="control-actions">
          <button className="primary-button" onClick={handleStart}>
            {isPlaying ? 'さいしょから もういちど' : 'スタート'}
          </button>
          <button className="secondary-button" onClick={onBackToHome}>
            もどる
          </button>
        </div>
      </section>

      <section className="rhythm-card play-card">
        <div className={`clap-zone ${clapBurst ? 'burst' : ''}`} onClick={handleClap}>
          <p className="phase-label">
            {currentMeasure === 0 ? 'おてほんの 1小節' : 'みんなで まねする'}
          </p>
          <div className="clap-button">
            <span role="img" aria-hidden="true">👏</span>
          </div>
          <p className="clap-hint">ここを たっぷり たたこう！</p>
        </div>

        <div className="status-panel">
          <div className="status-box">
            <span className="status-label">いまの りズム</span>
            <strong>{selectedPreset.label}</strong>
          </div>
          <div className="status-box">
            <span className="status-label">スコア</span>
            <strong>{score}</strong>
          </div>
          <div className="status-box wide">
            <span className="status-label">おしらせ</span>
            <strong>{feedback}</strong>
          </div>
        </div>

        <div className="beat-row" aria-label="beat indicators">
          {selectedPreset.pattern.map((beat, index) => (
            <span
              key={`${selectedPreset.id}-${index}`}
              className={`beat-pill ${currentBeat === index ? 'active' : ''} ${beat === 1 ? 'strong' : ''}`}
            >
              {beat === 1 ? '♪' : '・'}
            </span>
          ))}
        </div>

        {showSummary && (
          <div className="summary-box">
            <h3>おわり！</h3>
            <p>{score}かい ぴったり たたけたよ</p>
            <p>{completedRounds}回 ちょうせんしたよ</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default RhythmPlay;
