import React, { useState } from 'react';
import { Sparkles, X, Palette } from 'lucide-react';
import { THEME_COLORS } from '../utils/canvasHelper';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, themeColor: string, description: string) => void;
  lineCount: number;
  starCount: number;
}

const NAME_SUGGESTIONS = [
  'フェニックス座',
  'オリオン座',
  '宵の明星座',
  '希望の光座',
  '天の川航海座',
  '蒼穹のドラゴン座',
  '永遠の誓い座',
  '夢紡ぎ座',
];

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lineCount,
  starCount,
}) => {
  const [constellationName, setConstellationName] = useState('');
  const [selectedColor, setSelectedColor] = useState(THEME_COLORS[0].color);
  const [story, setStory] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = constellationName.trim();
    if (!finalName) return;

    // もし末尾に「座」がなければ自動付与、すでにあればそのまま
    const formattedName = finalName.endsWith('座') ? finalName : `${finalName}座`;
    onConfirm(formattedName, selectedColor, story.trim());
    setConstellationName('');
    setStory('');
  };

  return (
    <div
      id="constellation-completion-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300"
    >
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-sky-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/90 text-slate-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full border border-slate-700 hover:bg-slate-800 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-300 border border-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-light tracking-widest uppercase text-sky-200 text-glow-sky">
              星座を命名して登録
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">
              結んだ {starCount} つの星と {lineCount} 本の線から新星座が誕生します
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 星座名入力 */}
          <div>
            <label
              htmlFor="constellation-name-input"
              className="block text-xs uppercase tracking-wider font-medium text-slate-300 mb-2"
            >
              星座の名前 <span className="text-sky-400 text-[10px]">（末尾に「座」がつきます）</span>
            </label>
            <div className="relative">
              <input
                id="constellation-name-input"
                type="text"
                autoFocus
                maxLength={20}
                value={constellationName}
                onChange={(e) => setConstellationName(e.target.value)}
                placeholder="例: フェニックス、オリオン、希望"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-sky-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 text-sm transition-all"
              />
              <span className="absolute right-3.5 top-3.5 text-xs text-slate-500 pointer-events-none">
                {constellationName.length}/20
              </span>
            </div>

            {/* サジェストチップ */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-xs text-slate-500 self-center mr-1 uppercase">候補:</span>
              {NAME_SUGGESTIONS.slice(0, 4).map((sugg) => (
                <button
                  type="button"
                  key={sugg}
                  onClick={() => setConstellationName(sugg.replace('座', ''))}
                  className="px-2.5 py-1 text-xs rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-sky-200 transition-colors"
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>

          {/* カラーテーマ選択 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium text-slate-300 mb-2.5">
              <Palette className="w-3.5 h-3.5 text-sky-400" />
              光彩のテーマカラー
            </label>
            <div className="grid grid-cols-5 gap-2">
              {THEME_COLORS.map((theme) => {
                const isSelected = selectedColor === theme.color;
                return (
                  <button
                    type="button"
                    key={theme.id}
                    onClick={() => setSelectedColor(theme.color)}
                    className={`relative p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-sky-400 bg-sky-500/15 shadow-[0_0_15px_rgba(56,189,248,0.25)] scale-105'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shadow-md"
                      style={{ backgroundColor: theme.color, boxShadow: `0 0 10px ${theme.color}` }}
                    />
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {theme.name.replace('ネオン', '').replace('ステラ', '').replace('コズミック', '').replace('オーロラ', '').replace('ネビュラ', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 由来・ストーリー (任意) */}
          <div>
            <label
              htmlFor="constellation-story-input"
              className="block text-xs uppercase tracking-wider font-medium text-slate-300 mb-1.5"
            >
              星座のエピソード・由来 <span className="text-slate-500 text-[10px]">（任意）</span>
            </label>
            <input
              id="constellation-story-input"
              type="text"
              maxLength={50}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="例: 仲間と見上げた冬の夜空の思い出"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sky-100 placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>

          {/* ボタン */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-slate-700 text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              戻って描き直す
            </button>
            <button
              type="submit"
              disabled={!constellationName.trim()}
              className="px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-medium bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              星空に登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
