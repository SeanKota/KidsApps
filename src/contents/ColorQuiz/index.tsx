// src/contents/ColorQuiz/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/sound';
import './ColorQuiz.css';

interface ColorData {
  name: string;
  hex: string;
  roma: string;
}

const RAINBOW_COLORS: ColorData[] = [
  { name: 'あか', hex: '#E55B5B', roma: 'aka' },
  { name: 'おれんじ', hex: '#F4A261', roma: 'orenji' },
  { name: 'きいろ', hex: '#E9C46A', roma: 'kiiro' },
  { name: 'みどり', hex: '#52B788', roma: 'midori' },
  { name: 'あお', hex: '#4A90E2', roma: 'ao' },
  { name: 'こん', hex: '#5B6CFF', roma: 'kon' },
  { name: 'むらさき', hex: '#9B5DE5', roma: 'murasaki' }
];

const DISCUSSION_PROMPTS = [
  'みんなの いちばん すきな いろは なーんだ？ 🎨',
  'にじいろの おはなしを しよう！🎨',
  'ぴんくいろの おはなしを しよう！💖',
  'きいろを みると、どんな きぶんになる？ 😊',
  'どうぶつや おはなで、みどりの ものは なにがいるかな？ 🦁🌸',
  'そらや うみは なにいろに なるかな？ ☁️🏡',
  'きょうの おようふくには、どんな いろが あるかな？ 👕'
];

interface ColorQuizProps {
  onBackToHome: () => void;
}

function shuffleRainbowOrder() {
  const order = Array.from({ length: RAINBOW_COLORS.length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Helper functions -------------------------------------------------------
function hexToRgb(hex: string) {
  const cleaned = hex.replace('#', '');
  const bigint = parseInt(cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hueDistance(a: number, b: number) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

function startScanning(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  targetHex: string,
  onMatch: () => void,
  onNoMatch: () => void
) {
  const ctx = canvas.getContext('2d')!;
  const targetRgb = hexToRgb(targetHex);
  const { h: targetH, l: targetL } = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b);
  const sampleSize = 10;

  function loop() {
    if (video.videoWidth === 0) {
      requestAnimationFrame(loop);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(
      canvas.width / 2 - sampleSize / 2,
      canvas.height / 2 - sampleSize / 2,
      sampleSize,
      sampleSize
    );
    const data = imgData.data;
    let r = 0, g = 0, b = 0;
    const pixelCount = sampleSize * sampleSize;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    r = Math.round(r / pixelCount);
    g = Math.round(g / pixelCount);
    b = Math.round(b / pixelCount);
    const { h, s, l } = rgbToHsl(r, g, b);
    const hueDiff = hueDistance(h, targetH);
    if (hueDiff <= 25 && s >= 30 && Math.abs(l - targetL) <= 20) {
      onMatch();
    } else {
      onNoMatch();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

// Component --------------------------------------------------------------
const ColorQuiz: React.FC<ColorQuizProps> = ({ onBackToHome }) => {
  const [currentColorIndex, setCurrentColorIndex] = useState<number>(0);
  const [showText, setShowText] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [showDiscussion, setShowDiscussion] = useState<boolean>(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [rainbowOrder, setRainbowOrder] = useState<number[]>([]);
  const [collectedColors, setCollectedColors] = useState<ColorData[]>([]);

  // Hunt phase state
  const [huntActive, setHuntActive] = useState<boolean>(false);
  const [huntTimeLeft, setHuntTimeLeft] = useState<number>(30);
  const huntTimerRef = useRef<number | null>(null);

  // Scan phase state
  const [scanActive, setScanActive] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const timerRef = useRef<number | null>(null);
  const currentColor = RAINBOW_COLORS[currentColorIndex] ?? RAINBOW_COLORS[0];

  // Initialise rainbow order
  useEffect(() => {
    const initialOrder = shuffleRainbowOrder();
    setRainbowOrder(initialOrder);
    setCurrentColorIndex(initialOrder[0]);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Reveal timer (10 seconds)
  useEffect(() => {
    setShowText(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setShowText(true), 10000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentColorIndex]);

  // When answer shown, play reveal sound (but do NOT auto-start hunt)
  useEffect(() => {
    if (showText) {
      sound.playReveal();
    }
  }, [showText]);

  // Hunt countdown timer
  useEffect(() => {
    if (huntActive) {
      setHuntTimeLeft(30);
      huntTimerRef.current = window.setInterval(() => {
        setHuntTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(huntTimerRef.current!);
            setHuntActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (huntTimerRef.current) clearInterval(huntTimerRef.current);
    };
  }, [huntActive]);

  // Discussion sound effect
  useEffect(() => {
    if (showDiscussion) sound.playDiscuss();
  }, [showDiscussion]);

  // Scan phase – start camera and scanning loop
  useEffect(() => {
    if (!scanActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
        video.play();
        setTimeout(() => {
          startScanning(
            video,
            canvas,
            currentColor.hex,
            () => {
              setScanSuccess(true);
              sound.playSuccess();
              setTimeout(() => {
                const tracks = (video.srcObject as MediaStream).getTracks();
                tracks.forEach(t => t.stop());
                setScanActive(false);
                setScanSuccess(false);
                handleNext(true);
              }, 1500);
            },
            () => {}
          );
        }, 500);
      })
      .catch(err => {
        console.warn('Camera access error:', err);
        setScanActive(false);
      });
    return () => {
      if (video && video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, [scanActive, currentColor.hex]);

  const handleNext = (collected = false) => {
    sound.playPop();
    const nextCount = questionCount + 1;
    setQuestionCount(nextCount);

    if (collected) {
      const color = RAINBOW_COLORS[currentColorIndex];
      setCollectedColors(prev => (
        prev.some(item => item.name === color.name) ? prev : [...prev, color]
      ));
    }

    if (nextCount >= RAINBOW_COLORS.length) {
      const randomPrompt = DISCUSSION_PROMPTS[Math.floor(Math.random() * DISCUSSION_PROMPTS.length)];
      setCurrentPrompt(randomPrompt);
      setShowDiscussion(true);
    } else {
      setCurrentColorIndex(rainbowOrder[nextCount]);
    }

    setHuntActive(false);
    setScanActive(false);
    setScanSuccess(false);
  };

  const handleCloseDiscussion = () => {
    sound.playPop();
    onBackToHome();
  };

  const handleHuntSkip = () => {
    sound.playPop();
    setHuntActive(false);
    handleNext();
  };

  const handleFoundClick = () => {
    setHuntActive(false);
    setScanActive(true);
  };

  // User clicks "探しにいく！" on the answer reveal screen
  const handleStartHunt = () => {
    sound.playPop();
    setHuntActive(true);
  };

  const handlePlayAreaClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!showText) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShowText(true);
    }
  };

  // ── Discussion screen ────────────────────────────────────────────────────
  if (showDiscussion) {
    return (
      <div className="color-quiz-container fade-in">
        <div className="discussion-screen">
          <div className="discussion-header">
            <span className="discussion-emoji">🗣️</span>
            <h2 className="discussion-title">おはなしタイム</h2>
          </div>
          <div className="discussion-card">
            <p className="discussion-prompt">{currentPrompt}</p>
            <div className="discussion-rainbow" role="list" aria-label="集めた虹の色">
              {collectedColors.length > 0 ? (
                collectedColors.map(color => (
                  <div key={color.name} className="discussion-photo-card" role="listitem">
                    <div className="discussion-photo-frame" style={{ backgroundColor: color.hex }} />
                    <span className="discussion-photo-label">{color.name}</span>
                  </div>
                ))
              ) : (
                <div className="discussion-photo-card empty">
                  <div className="discussion-photo-frame empty-frame" />
                  <span className="discussion-photo-label">まだ みつけてないよ</span>
                </div>
              )}
            </div>
            <p className="discussion-result-text">にじが かんせいしたよ！ いろを ひとつずつ みつけて つなげよう。</p>
          </div>
          <div className="discussion-controls">
            <button className="discussion-button" onClick={handleCloseDiscussion}>おわる（ほーむへ）🏠</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Hunt screen ──────────────────────────────────────────────────────────
  if (huntActive) {
    return (
      <div className="color-quiz-container fade-in">
        <div className="hunt-screen">
          <div className="hunt-color-preview" style={{ backgroundColor: currentColor.hex }} />
          <h2 className="hunt-message">おへやの なかで<br />「{currentColor.name}いろ」を<br />さがしてきてね！</h2>
          <div className="hunt-timer">⏱️ {huntTimeLeft}びょう</div>
          <div className="hunt-controls">
            <button className="hunt-button" onClick={handleFoundClick}>みつけた！ カメラでみせる 📷</button>
            <button className="hunt-button secondary" onClick={handleHuntSkip}>パスする ➔</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Scan (camera) screen ─────────────────────────────────────────────────
  if (scanActive) {
    return (
      <div className="color-quiz-container fade-in">
        <div className="scan-screen">
          {/* Camera feed fills the background */}
          <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
          {/* Hidden canvas for pixel sampling */}
          <canvas ref={canvasRef} className="hidden-canvas" width={320} height={240} />

          {/* Cross-hair guide overlay */}
          <div className="scan-overlay">
            <div className="scan-crosshair">
              <span className="scan-crosshair-h" />
              <span className="scan-crosshair-v" />
            </div>
            <p className="scan-guide-text">ここに色を見せてね 👆</p>
          </div>

          {/* Reference color circle at the bottom */}
          <div className="scan-reference">
            <div className="scan-ref-circle" style={{ backgroundColor: currentColor.hex }} />
            <p className="scan-ref-label">お手本：{currentColor.name}いろ</p>
          </div>

          {/* Success overlay */}
          {scanSuccess && (
            <div className="scan-success">
              <div className="checkmark">✔️ みつけた！</div>
            </div>
          )}

          {/* Manual skip button */}
          {!scanSuccess && (
            <button
              className="scan-skip-button"
              onClick={() => {
                sound.playPop();
                if (videoRef.current && videoRef.current.srcObject) {
                  const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                  tracks.forEach(t => t.stop());
                }
                setScanActive(false);
                handleNext();
              }}
            >
              パスする（つぎへ）➔
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Default quiz view ────────────────────────────────────────────────────
  return (
    <div className="color-quiz-container fade-in">
      <div className="quiz-play-area" onClick={handlePlayAreaClick}>
        <div className="blob-container">
          <div className="wobbly-blob" style={{ backgroundColor: currentColor.hex } as React.CSSProperties} />
          <div className="blob-aura" style={{ backgroundColor: currentColor.hex } as React.CSSProperties} />
        </div>

        {/* Color name / question mark */}
        <div className={`color-name-text ${showText ? 'show' : ''}`}>
          {showText ? currentColor.name : '？？？'}
        </div>

        {/* Answer reveal: shown AFTER "答えをみる" */}
        {showText && (
          <p className="answer-reveal">正解は {currentColor.name}色。</p>
        )}
      </div>

      <div className="quiz-controls">
        {showText ? (
          /* After answer reveal: show "探しにいく！" button */
          <button className="next-button hunt-start-button" onClick={handleStartHunt}>
            <span className="next-button-text">おへやで さがしにいく！</span>
            <span className="next-button-icon">🔍</span>
          </button>
        ) : (
          <button className="next-button" onClick={() => setShowText(true)}>
            <span className="next-button-text">こたえをみる</span>
            <span className="next-button-icon">💡</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ColorQuiz;
