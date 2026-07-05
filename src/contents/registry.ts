import React from 'react';
import ColorQuiz from './ColorQuiz';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji representing the content
  component: React.ComponentType<{ onBackToHome: () => void }>;
}

export const contentsRegistry: ContentItem[] = [
  {
    id: 'color-quiz',
    title: 'にじをあつめて',
    description: 'いろんな いろを みつけて、にじを あつめよう！',
    icon: '🎨',
    component: ColorQuiz
  }
  // 今後新しいコンテンツを追加する場合は、ここにオブジェクトを追加するだけで自動的にホーム画面に並びます。
  // 例:
  // {
  //   id: 'animal-sounds',
  //   title: 'どうぶつのこえ',
  //   description: 'どんな なきごえかな？ タップしてきいてみよう',
  //   icon: '🦁',
  //   component: AnimalSounds
  // }
];
